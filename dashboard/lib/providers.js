// Brain providers — the Store is the contract: any agent CLI that can read and
// write files can be a Brain (ADR 0004). Claude is first-class (stream-json,
// resumable sessions); others run in generic text mode: prompt in via stdin,
// stdout streamed back, stateless per message (continuity via the Store).
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('./config');

// Curated model choices per brain (first is always "Default" = no flag, uses
// the CLI's own default). Overridable per provider via config.json → models.
const DEFAULT = { id: '', label: 'Default' };
const MODELS = {
  claude: [DEFAULT, { id: 'opus', label: 'Opus' }, { id: 'sonnet', label: 'Sonnet' }, { id: 'haiku', label: 'Haiku' }],
  codex: [DEFAULT, { id: 'gpt-5.1', label: 'GPT-5.1' }, { id: 'gpt-5.1-codex', label: 'GPT-5.1 Codex' }, { id: 'gpt-5.1-codex-mini', label: 'Codex Mini' }],
  gemini: [DEFAULT, { id: 'gemini-2.5-flash', label: '2.5 Flash' }, { id: 'gemini-2.5-pro', label: '2.5 Pro' }],
};

const TOKEN_FILE = path.join(__dirname, '..', '.claude-token');
const GEMINI_KEY_FILE = path.join(__dirname, '..', '.gemini-key');

const PROVIDERS = {
  claude: {
    id: 'claude',
    label: 'Claude',
    bin: 'claude',
    mode: 'claude', // stream-json + --resume (handled in chat.js)
    install: 'npm install -g @anthropic-ai/claude-code',
    // "Connect your AI": setup-token opens a browser OAuth, then prints a
    // long-lived token — we capture it and write .claude-token automatically.
    login: { args: ['setup-token'], tokenPattern: /sk-ant-oat01-[A-Za-z0-9_-]+/ },
    credFiles: [TOKEN_FILE, path.join(os.homedir(), '.claude', '.credentials.json')],
  },
  codex: {
    id: 'codex',
    label: 'ChatGPT (Codex)',
    bin: 'codex',
    mode: 'text',
    // --full-auto: sandboxed workspace-write so it can update the Store.
    // '-' = read prompt from stdin (no shell-injection risk).
    args: ['exec', '--color', 'never', '--full-auto', '-'],
    lastMessageFlag: '--output-last-message', // clean final answer to a file
    install: 'npm install -g @openai/codex',
    login: { args: ['login'] }, // opens browser, stores auth itself
    credFiles: [path.join(os.homedir(), '.codex', 'auth.json')],
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    bin: 'gemini',
    // prompt via stdin; --yolo auto-approves file tools; --skip-trust is
    // required to run headless outside an interactively-trusted folder.
    mode: 'text',
    args: ['--yolo', '--skip-trust'],
    install: 'npm install -g @google/gemini-cli',
    // No non-interactive OAuth, but Gemini honours a GEMINI_API_KEY — a free
    // key from Google AI Studio — so users can connect in-app by pasting it.
    keyLogin: {
      envVar: 'GEMINI_API_KEY',
      file: GEMINI_KEY_FILE,
      url: 'https://aistudio.google.com/apikey',
      pattern: /^AIza[A-Za-z0-9_-]{20,}$/,
    },
    loginHint: 'Paste a free Google AI Studio API key, or run `gemini` once in a terminal to log in.',
    credFiles: [
      GEMINI_KEY_FILE,
      path.join(os.homedir(), '.gemini', 'oauth_creds.json'),
      path.join(os.homedir(), '.gemini', 'google_accounts.json'),
    ],
  },
};

// Availability is a slow check (spawns --version), so cache it.
const cache = new Map(); // id -> { ok, at }
const TTL = 60000;

function available(p) {
  const hit = cache.get(p.id);
  if (hit && Date.now() - hit.at < TTL) return hit.ok;
  let ok = false;
  try {
    ok = spawnSync(p.bin, ['--version'], { shell: true, windowsHide: true, timeout: 15000 }).status === 0;
  } catch {
    ok = false;
  }
  cache.set(p.id, { ok, at: Date.now() });
  return ok;
}

// Connected = some credential artifact exists on disk. For claude the token
// file must actually hold a token, not the placeholder comment.
function connected(p) {
  return (p.credFiles || []).some((f) => {
    try {
      const t = fs.readFileSync(f, 'utf8').trim();
      return t.length > 0 && !t.startsWith('#');
    } catch {
      return false;
    }
  });
}

function list() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    mode: p.mode,
    available: available(p),
    connected: connected(p),
    canLogin: !!p.login,
    canKey: !!p.keyLogin,
    keyUrl: p.keyLogin ? p.keyLogin.url : null,
    loginHint: p.loginHint || null,
    install: p.install,
    models: config.getModels(p.id) || MODELS[p.id] || [DEFAULT],
  }));
}

// Save an API key (e.g. Gemini's GEMINI_API_KEY) to the provider's key file.
function saveKey(id, key) {
  const p = PROVIDERS[id];
  if (!p || !p.keyLogin) throw new Error('This brain does not use an API key.');
  const k = (key || '').trim();
  if (!k) throw new Error('An API key is required.');
  if (p.keyLogin.pattern && !p.keyLogin.pattern.test(k)) {
    throw new Error('That does not look like a valid key.');
  }
  fs.writeFileSync(p.keyLogin.file, k + '\n');
  cache.delete(id);
  return { ok: true, connected: connected(p) };
}

function get(id) {
  return PROVIDERS[id] || PROVIDERS.claude;
}

// Run a not-yet-installed brain's install command (its global npm package),
// streaming output via `send`. Calls `done(ok)` once the process exits, after
// invalidating the availability cache so the next check is fresh.
function install(id, send, done) {
  const p = PROVIDERS[id];
  if (!p || !p.install) {
    send({ type: 'error', message: 'No install command known for this brain.' });
    return done(false);
  }
  const [cmd, ...args] = p.install.split(' ');
  let child;
  try {
    child = spawn(cmd, args, { shell: true, windowsHide: true });
  } catch (e) {
    send({ type: 'error', message: e.message });
    return done(false);
  }
  child.stdout.on('data', (d) => send({ type: 'text', value: d.toString() }));
  child.stderr.on('data', (d) => send({ type: 'text', value: d.toString() }));
  child.on('error', (e) => send({ type: 'error', message: e.message }));
  child.on('close', () => {
    cache.delete(id); // force a fresh --version check next time
    done(available(p));
  });
}

// "Connect your AI": run the provider's own login flow (opens the browser),
// streaming its output via `send`. For claude, capture the printed token and
// write it to .claude-token so the user never touches a terminal.
function login(id, send, done) {
  const p = PROVIDERS[id];
  if (!p) {
    send({ type: 'error', message: 'Unknown brain.' });
    return done(false);
  }
  if (!p.login) {
    send({ type: 'error', message: p.loginHint || 'This brain has no automated login.' });
    return done(false);
  }

  let child;
  try {
    child = spawn(p.bin, p.login.args, { shell: true, windowsHide: true });
  } catch (e) {
    send({ type: 'error', message: e.message });
    return done(false);
  }

  let out = '';
  const onData = (d) => {
    const s = d.toString();
    out += s;
    // Don't echo a captured token back to the browser.
    send({ type: 'text', value: p.login.tokenPattern ? s.replace(p.login.tokenPattern, '(token captured)') : s });
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('error', (e) => send({ type: 'error', message: e.message }));

  // Login flows wait on a browser round-trip — allow up to 5 minutes.
  const killer = setTimeout(() => {
    try { child.kill(); } catch { /* noop */ }
    send({ type: 'error', message: 'Login timed out after 5 minutes.' });
  }, 300000);

  child.on('close', () => {
    clearTimeout(killer);
    if (p.login.tokenPattern) {
      const m = out.match(p.login.tokenPattern);
      if (m) {
        try {
          fs.writeFileSync(TOKEN_FILE, m[0] + '\n');
          send({ type: 'text', value: '\nToken saved — Claude is connected.\n' });
        } catch (e) {
          send({ type: 'error', message: 'Could not save the token: ' + e.message });
        }
      }
    }
    done(connected(p));
  });
}

module.exports = { list, get, install, login, saveKey };
