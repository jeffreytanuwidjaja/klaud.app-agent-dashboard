// Dashboard config — currently just the registered Workspaces (folders elsewhere
// on disk, e.g. other projects' Obsidian vaults + graphify-out/) that the brain
// is allowed to read for cross-workspace context.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'config.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return { workspaces: [] };
  }
}
function save(c) {
  fs.writeFileSync(FILE, JSON.stringify(c, null, 2));
}

function getWorkspaces() {
  const c = load();
  return Array.isArray(c.workspaces) ? c.workspaces : [];
}

function addWorkspace(p, label) {
  if (!p || !p.trim()) throw new Error('Workspace path required');
  const clean = p.trim();
  const c = load();
  c.workspaces = c.workspaces || [];
  if (!c.workspaces.find((w) => w.path.toLowerCase() === clean.toLowerCase())) {
    c.workspaces.push({ path: clean, label: (label && label.trim()) || path.basename(clean) });
    save(c);
  }
  return c.workspaces;
}

function removeWorkspace(p) {
  const c = load();
  c.workspaces = (c.workspaces || []).filter((w) => w.path.toLowerCase() !== String(p).toLowerCase());
  save(c);
  return c.workspaces;
}

// All directories the brain may read: registered Workspaces plus any path a
// Project points at via its `workspace` field. Only existing dirs are returned.
function workspaceDirs(projectWorkspaces = []) {
  const set = new Map();
  for (const w of getWorkspaces()) if (w.path) set.set(w.path.toLowerCase(), w.path);
  for (const p of projectWorkspaces) if (p) set.set(String(p).toLowerCase(), String(p));
  return [...set.values()].filter((d) => {
    try {
      return fs.statSync(d).isDirectory();
    } catch {
      return false;
    }
  });
}

// Optional per-provider model list override, e.g. in config.json:
//   { "models": { "codex": [{ "id": "", "label": "Default" }, ...] } }
function getModels(providerId) {
  const c = load();
  return c.models && Array.isArray(c.models[providerId]) ? c.models[providerId] : null;
}

module.exports = { getWorkspaces, addWorkspace, removeWorkspace, workspaceDirs, getModels };
