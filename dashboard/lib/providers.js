// Brain providers — the Store is the contract: any agent CLI that can read and
// write files can be a Brain (ADR 0004). Claude is first-class (stream-json,
// resumable sessions); others run in generic text mode: prompt in via stdin,
// stdout streamed back, stateless per message (continuity via the Store).
const { spawnSync } = require('child_process');

const PROVIDERS = {
  claude: {
    id: 'claude',
    label: 'Claude',
    bin: 'claude',
    mode: 'claude', // stream-json + --resume (handled in chat.js)
    install: 'npm install -g @anthropic-ai/claude-code',
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
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    bin: 'gemini',
    mode: 'text',
    args: ['--yolo'], // prompt via stdin; --yolo auto-approves its file tools
    install: 'npm install -g @google/gemini-cli',
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

function list() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    mode: p.mode,
    available: available(p),
    install: p.install,
  }));
}

function get(id) {
  return PROVIDERS[id] || PROVIDERS.claude;
}

module.exports = { list, get };
