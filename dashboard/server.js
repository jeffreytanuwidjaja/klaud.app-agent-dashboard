// Agent OS Dashboard server: serves the single-page view over the Store and
// runs the reminder scheduler. Local-only, no auth (ADR 0001).
const express = require('express');
const path = require('path');
const fs = require('fs');
const store = require('./lib/store');
const scheduler = require('./lib/scheduler');
const chat = require('./lib/chat');
const config = require('./lib/config');
const history = require('./lib/history');

const app = express();
app.use(express.json({ limit: '25mb' })); // room for pasted images (base64)
app.use(express.static(path.join(__dirname, 'public')));

const wrap = (fn) => (req, res) => {
  try {
    res.json(fn(req));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

app.get('/api/store', wrap(() => store.snapshot()));
app.post('/api/tasks', wrap((req) => store.createTask(req.body)));
app.post('/api/ideas', wrap((req) => store.createIdea(req.body)));
app.post('/api/tasks/:id/status', wrap((req) => {
  store.writeStatus(req.params.id, req.body.status);
  return { ok: true };
}));

// Chat brain — streams NDJSON events from a headless Claude Code session.
app.post('/api/chat', (req, res) => {
  const message = ((req.body && req.body.message) || '').toString();
  const sessionId = req.body && req.body.sessionId ? String(req.body.sessionId) : null;
  const attachments = (req.body && req.body.attachments) || [];
  if (!message.trim() && !attachments.length) return res.status(400).json({ error: 'Empty message' });
  chat.runChat(message, sessionId, attachments, res);
});

// Spawn a Project from an Idea or Task (spawn + link, never transform).
app.post('/api/projects/spawn', wrap((req) => store.spawnProject(req.body || {})));

// Retire / restore an Idea (archived is a tag; ideas are never deleted).
app.post('/api/ideas/:id/archive', wrap((req) => {
  store.setIdeaArchived(req.params.id, !!(req.body && req.body.archived));
  return { ok: true };
}));

// Workspaces — folders the brain may read for cross-workspace context.
app.get('/api/workspaces', wrap(() => config.getWorkspaces()));
app.post('/api/workspaces', wrap((req) => config.addWorkspace(req.body.path, req.body.label)));
app.post('/api/workspaces/remove', wrap((req) => config.removeWorkspace(req.body.path)));

// Chat history.
app.get('/api/chats', wrap(() => history.list()));
app.get('/api/chats/:id', wrap((req) => history.get(req.params.id) || { error: 'not found' }));

// Image upload — saves a pasted image, returns its path for the brain to Read.
const ATTACH = path.join(__dirname, 'attachments');
app.post('/api/upload', wrap((req) => {
  const { name, dataUrl } = req.body || {};
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl || '');
  if (!m) throw new Error('Expected an image data URL');
  fs.mkdirSync(ATTACH, { recursive: true });
  const ext = (m[1].split('/')[1] || 'png').replace('+xml', '');
  const base = (name || 'paste').replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 40) || 'paste';
  const file = path.join(ATTACH, `${Date.now()}-${base}.${ext}`);
  fs.writeFileSync(file, Buffer.from(m[2], 'base64'));
  return { path: file };
}));

const PORT = process.env.PORT || 4317;
app.listen(PORT, () => {
  console.log(`Agent OS dashboard → http://localhost:${PORT}`);
  console.log(`Store: ${store.STORE}`);
  console.log(`Brain: ${chat.CLAUDE_BIN}`);
});
scheduler.start();
