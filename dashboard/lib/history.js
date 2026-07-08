// Chat history — persists each thread (keyed by the Claude session id) to
// dashboard/chats/<id>.json so past conversations are browsable.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'chats');

function ensure() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
  } catch {
    /* noop */
  }
}
const file = (id) => path.join(DIR, String(id).replace(/[^\w-]/g, '') + '.json');

function append(id, userText, botText, tools, meta = {}) {
  if (!id) return;
  ensure();
  let t;
  try {
    t = JSON.parse(fs.readFileSync(file(id), 'utf8'));
  } catch {
    t = { id, created: Date.now(), messages: [] };
  }
  t.messages.push({ role: 'user', text: userText, ts: Date.now() });
  t.messages.push({ role: 'bot', text: botText || '', tools: tools || [], provider: meta.provider || null, model: meta.model || '', ts: Date.now() });
  t.updated = Date.now();
  fs.writeFileSync(file(id), JSON.stringify(t, null, 2));
}

function list() {
  ensure();
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const t = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
        const first = (t.messages.find((m) => m.role === 'user') || {}).text || '(empty)';
        return { id: t.id, title: first.slice(0, 70), updated: t.updated || t.created, turns: Math.ceil(t.messages.length / 2) };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.updated - a.updated);
}

function get(id) {
  try {
    return JSON.parse(fs.readFileSync(file(id), 'utf8'));
  } catch {
    return null;
  }
}

module.exports = { append, list, get };
