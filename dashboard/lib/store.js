// Store access layer: read, shape, and write the markdown entities under store/.
// The Store is the source of truth; this module never caches — it reads fresh each call.
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..', '..');
const STORE = path.join(ROOT, 'store');
const FOLDERS = { idea: 'ideas', project: 'projects', task: 'tasks', session: 'sessions' };

// Parse frontmatter with the JSON schema so date-like strings (2026-07-02,
// 2026-07-03T09:00) stay strings and are never silently coerced to Date objects.
const engine = {
  parse: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) || {},
  stringify: (o) => yaml.dump(o),
};
const parse = (content) => matter(content, { engines: { yaml: engine } });

// "[[agent-os]]" -> "agent-os"; tolerates scalars, arrays, empties.
function stripLinks(v) {
  const one = (x) => (typeof x === 'string' ? x.replace(/^\[\[|\]\]$/g, '').trim() : x);
  if (Array.isArray(v)) return v.map(one).filter(Boolean);
  return v == null || v === '' ? [] : [one(v)].filter(Boolean);
}

function readFolder(type) {
  const dir = path.join(STORE, FOLDERS[type]);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .map((f) => {
      const file = path.join(dir, f);
      const { data, content } = parse(fs.readFileSync(file, 'utf8'));
      return { id: path.basename(f, '.md'), type, file, data: data || {}, body: content.trim() };
    });
}

function toDTO(e) {
  const d = e.data || {};
  return {
    id: e.id,
    type: e.type,
    file: e.file, // absolute path — local app, used for obsidian:// links
    title: d.title || e.id,
    status: d.status || null,
    created: d.created || null,
    started: d.started || null,
    remind_at: d.remind_at || null,
    workspace: d.workspace || null,
    tags: Array.isArray(d.tags) ? d.tags : d.tags ? [d.tags] : [],
    body: e.body,
    links: {
      spawned: stripLinks(d.spawned),
      related: stripLinks(d.related),
      from_ideas: stripLinks(d.from_ideas),
      project: stripLinks(d.project),
      touched: stripLinks(d.touched),
    },
  };
}

function snapshot() {
  const sessions = readFolder('session')
    .map(toDTO)
    .sort((a, b) => String(b.started || '').localeCompare(String(a.started || '')));
  return {
    ideas: readFolder('idea').map(toDTO),
    projects: readFolder('project').map(toDTO),
    tasks: readFolder('task').map(toDTO),
    sessions,
    store_path: STORE, // for "Open in Obsidian" (vault = the Store folder)
    generated_at: new Date().toISOString(),
  };
}

// --- writes -------------------------------------------------------------

function editFrontmatter(file, mutate) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('No frontmatter in ' + file);
  const data = yaml.load(m[1], { schema: yaml.JSON_SCHEMA }) || {};
  mutate(data);
  const fm = yaml.dump(data, { lineWidth: -1 }).trimEnd();
  fs.writeFileSync(file, `---\n${fm}\n---\n${m[2]}`);
}

function writeStatus(id, status) {
  const allowed = ['open', 'done', 'dismissed'];
  if (!allowed.includes(status)) throw new Error('Bad status: ' + status);
  const file = path.join(STORE, FOLDERS.task, id + '.md');
  editFrontmatter(file, (d) => {
    d.status = status;
  });
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function allIds() {
  return new Set(Object.keys(FOLDERS).flatMap((t) => readFolder(t).map((e) => e.id)));
}

function uniqueSlug(title) {
  const base = slugify(title) || 'untitled';
  const ids = allIds();
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function localDate() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function createTask({ title, remind_at = '', project = '' }) {
  if (!title || !title.trim()) throw new Error('Task needs a title');
  const id = uniqueSlug(title);
  const projLink = project ? `"[[${stripLinks(project)[0] || project}]]"` : '""';
  const body =
    `---\n` +
    `type: task\n` +
    `title: ${title.trim()}\n` +
    `created: ${localDate()}\n` +
    `status: open\n` +
    `remind_at: ${remind_at ? `"${remind_at}"` : '""'}\n` +
    `project: ${projLink}\n` +
    `tags: []\n` +
    `---\n`;
  fs.writeFileSync(path.join(STORE, FOLDERS.task, id + '.md'), body);
  return { id };
}

function createIdea({ title, body = '' }) {
  if (!title || !title.trim()) throw new Error('Idea needs a title');
  const id = uniqueSlug(title);
  const text =
    `---\n` +
    `type: idea\n` +
    `title: ${title.trim()}\n` +
    `created: ${localDate()}\n` +
    `tags: []\n` +
    `spawned: []\n` +
    `related: []\n` +
    `---\n` +
    (body.trim() ? body.trim() + '\n' : '');
  fs.writeFileSync(path.join(STORE, FOLDERS.idea, id + '.md'), text);
  return { id };
}

// Spawn a Project from an Idea or Task (spawn + link, never transform — the
// source stays in place; links are written on BOTH sides per the glossary).
function spawnProject({ title, ideaId, taskId, workspace }) {
  const find = (type, id) => readFolder(type).find((e) => e.id === id);
  const idea = ideaId ? find('idea', ideaId) : null;
  const task = taskId ? find('task', taskId) : null;
  if (ideaId && !idea) throw new Error('Idea not found: ' + ideaId);
  if (taskId && !task) throw new Error('Task not found: ' + taskId);

  const src = idea || task;
  const projTitle = (title && title.trim()) || (src ? src.data.title || src.id : '');
  if (!projTitle) throw new Error('Project needs a title');
  const id = uniqueSlug(projTitle);

  const fromIdeas = idea ? `"[[${idea.id}]]"` : '';
  const origin = idea
    ? `Spawned from the idea [[${idea.id}]].`
    : task
      ? `Spawned from the task [[${task.id}]].`
      : '';
  const seed = src && src.body ? `\n\n> ${src.body.split('\n').find((l) => l.trim()) || ''}` : '';
  const text =
    `---\n` +
    `type: project\n` +
    `title: ${projTitle}\n` +
    `created: ${localDate()}\n` +
    `status: active\n` +
    `workspace: ""\n` +
    `from_ideas: [${fromIdeas}]\n` +
    `related: []\n` +
    `---\n` +
    `${origin}${seed}\n`;
  fs.writeFileSync(path.join(STORE, FOLDERS.project, id + '.md'), text);

  // reciprocal links
  if (idea) {
    editFrontmatter(idea.file, (d) => {
      const list = Array.isArray(d.spawned) ? d.spawned : d.spawned ? [d.spawned] : [];
      const link = `[[${id}]]`;
      if (!list.some((s) => stripLinks(s)[0] === id)) list.push(link);
      d.spawned = list;
    });
  }
  if (task) {
    editFrontmatter(task.file, (d) => {
      d.project = `[[${id}]]`;
    });
  }
  if (workspace && workspace.trim()) {
    editFrontmatter(path.join(STORE, FOLDERS.project, id + '.md'), (d) => {
      d.workspace = workspace.trim();
    });
  }
  return { id, title: projTitle };
}

// Point an existing Project at a Workspace folder (or clear it with '').
function setProjectWorkspace(projectId, workspacePath) {
  const file = path.join(STORE, FOLDERS.project, projectId + '.md');
  editFrontmatter(file, (d) => {
    d.workspace = (workspacePath || '').trim();
  });
}

// Retire / restore an Idea (ideas are permanent — archived is just a tag).
function setIdeaArchived(id, archived) {
  const file = path.join(STORE, FOLDERS.idea, id + '.md');
  editFrontmatter(file, (d) => {
    const tags = new Set(Array.isArray(d.tags) ? d.tags : d.tags ? [d.tags] : []);
    if (archived) tags.add('archived');
    else tags.delete('archived');
    d.tags = [...tags];
  });
}

module.exports = { readFolder, snapshot, writeStatus, createTask, createIdea, spawnProject, setProjectWorkspace, setIdeaArchived, STORE };
