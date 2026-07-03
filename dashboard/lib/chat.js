// Chat brain: drives Claude Code headless as the Jarvis behind the Dashboard.
// Each thread is a fresh session that orients from the Store (CLAUDE.md + the
// agent-os skill load automatically because cwd is the repo root). Within a
// thread we --resume the session so follow-ups keep context; "New chat" on the
// client drops the id and starts fresh (ADR 0003).
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const store = require('./store');
const history = require('./history');

const ROOT = path.resolve(__dirname, '..', '..');

// Tools the headless brain may use — read/write the Store and run the skill,
// nothing else (ADR 0003: a narrow allowlist, since headless can't prompt).
const ALLOWED = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Skill', 'TodoWrite'];

function onPath(cmd) {
  try {
    return spawnSync(cmd, ['--version'], { shell: true, windowsHide: true, timeout: 10000 }).status === 0;
  } catch {
    return false;
  }
}

function resolveClaude() {
  if (process.env.CLAUDE_BIN && fs.existsSync(process.env.CLAUDE_BIN)) return process.env.CLAUDE_BIN;
  // Prefer a real `claude` on PATH (e.g. `npm i -g @anthropic-ai/claude-code`).
  if (onPath('claude')) return 'claude';
  // Fallback: a versioned CLI under %APPDATA%\Claude\claude-code\<version>\claude.exe
  const base = path.join(process.env.APPDATA || '', 'Claude', 'claude-code');
  try {
    const versions = fs
      .readdirSync(base)
      .filter((v) => /^\d/.test(v))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    for (const v of versions.reverse()) {
      const exe = path.join(base, v, 'claude.exe');
      if (fs.existsSync(exe)) return exe;
    }
  } catch {
    /* fall through */
  }
  return 'claude';
}

const CLAUDE_BIN = resolveClaude();

// Optional: a long-lived token from `claude setup-token`, saved to
// dashboard/.claude-token. Read per-spawn so updating it needs no restart.
function readToken() {
  try {
    const t = fs.readFileSync(path.join(__dirname, '..', '.claude-token'), 'utf8').trim();
    return t && !t.startsWith('#') ? t : null;
  } catch {
    return null;
  }
}

// Directories the brain may read this turn: registered Workspaces + any
// Project's `workspace` path. Gives Jarvis cross-workspace context.
function extraDirs() {
  let projectWs = [];
  try {
    projectWs = store.readFolder('project').map((p) => p.data && p.data.workspace).filter(Boolean);
  } catch {
    /* store optional */
  }
  return config.workspaceDirs(projectWs);
}

function handleLine(line, send, acc) {
  let ev;
  try {
    ev = JSON.parse(line);
  } catch {
    return;
  }
  if (ev.type === 'system' && ev.subtype === 'init') {
    if (ev.session_id) {
      acc.sessionId = ev.session_id;
      send({ type: 'session', id: ev.session_id });
    }
  } else if (ev.type === 'assistant' && ev.message && Array.isArray(ev.message.content)) {
    for (const b of ev.message.content) {
      if (b.type === 'text' && b.text) {
        acc.text += b.text;
        send({ type: 'text', value: b.text });
      } else if (b.type === 'tool_use') {
        acc.tools.add(b.name);
        send({ type: 'tool', name: b.name });
      }
    }
    if (ev.error === 'authentication_failed') send({ type: 'error', error: 'not_logged_in', message: 'Not logged in' });
  } else if (ev.type === 'result') {
    if (ev.is_error) {
      const notLoggedIn = /not logged in|please run \/login/i.test(ev.result || '');
      send({ type: 'error', error: notLoggedIn ? 'not_logged_in' : 'error', message: ev.result || 'Request failed' });
    } else {
      send({ type: 'done' });
    }
  }
}

function runChat(message, sessionId, attachments, res) {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();
  const send = (obj) => {
    try {
      res.write(JSON.stringify(obj) + '\n');
    } catch {
      /* client gone */
    }
  };

  // Fold image attachments into the prompt as file paths for the Read tool.
  let prompt = message;
  const files = (attachments || []).map((a) => a && a.path).filter(Boolean);
  if (files.length) {
    prompt +=
      '\n\n[The user attached ' +
      (files.length === 1 ? 'an image' : `${files.length} images`) +
      '. View with the Read tool:\n' +
      files.map((f) => '- ' + f).join('\n') +
      ']';
  }

  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits'];
  if (sessionId) args.push('--resume', sessionId);
  const dirs = extraDirs();
  if (dirs.length) args.push('--add-dir', ...dirs); // variadic; stops at next flag
  args.push('--allowedTools', ...ALLOWED); // variadic — keep last

  const token = readToken();
  const env = token ? { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token } : process.env;
  const acc = { text: '', tools: new Set(), sessionId: sessionId || null };

  let child;
  try {
    // shell:true so a PATH-resolved `claude` (claude.cmd on Windows) works,
    // not just a full .exe path.
    child = spawn(CLAUDE_BIN, args, { cwd: ROOT, windowsHide: true, shell: true, env });
  } catch (e) {
    send({ type: 'error', error: 'spawn_failed', message: e.message });
    return res.end();
  }

  try {
    child.stdin.write(prompt);
    child.stdin.end();
  } catch {
    /* handled by error event */
  }

  let buf = '';
  child.stdout.on('data', (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (line.trim()) handleLine(line, send, acc);
    }
  });
  child.stderr.on('data', (d) => console.error('[chat] stderr:', d.toString().slice(0, 300)));
  child.on('error', (e) => {
    send({ type: 'error', error: 'spawn_error', message: e.message });
    res.end();
  });
  child.on('close', () => {
    if (buf.trim()) handleLine(buf, send, acc);
    try {
      history.append(acc.sessionId, message, acc.text, [...acc.tools]);
    } catch {
      /* history best-effort */
    }
    send({ type: 'end' });
    res.end();
  });

  const killer = setTimeout(() => {
    try {
      child.kill();
    } catch {
      /* noop */
    }
  }, 180000);
  res.on('close', () => {
    clearTimeout(killer);
    try {
      child.kill();
    } catch {
      /* noop */
    }
  });
}

module.exports = { runChat, CLAUDE_BIN };
