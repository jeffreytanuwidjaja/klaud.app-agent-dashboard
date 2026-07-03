// Reminder scheduler: the always-on half of the Dashboard. Polls open Tasks
// for a due remind_at and fires a Windows toast exactly once per (task, time).
// Fired reminders are tracked in notified.json so the Store stays clean of
// dashboard mechanics (ADR 0002).
const fs = require('fs');
const path = require('path');
const notifier = require('node-notifier');
const store = require('./store');

const STATE = path.join(__dirname, '..', 'notified.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(s) {
  fs.writeFileSync(STATE, JSON.stringify(s, null, 2));
}

function check() {
  const now = Date.now();
  const state = loadState();
  let changed = false;

  for (const t of store.readFolder('task')) {
    const d = t.data || {};
    if (!d.remind_at || d.status !== 'open') continue;
    const when = new Date(d.remind_at).getTime(); // local time for "YYYY-MM-DDTHH:mm"
    if (Number.isNaN(when) || when > now) continue;

    const key = `${t.id}@${d.remind_at}`;
    if (state[key]) continue;

    notifier.notify({
      title: 'Agent OS — Reminder',
      message: d.title || t.id,
      sound: true,
      appID: 'Agent OS',
      wait: false,
    });
    state[key] = new Date().toISOString();
    changed = true;
    console.log(`[reminder] fired: ${d.title || t.id}`);
  }

  if (changed) saveState(state);
}

function start(intervalMs = 30000) {
  check();
  return setInterval(check, intervalMs);
}

module.exports = { start, check };
