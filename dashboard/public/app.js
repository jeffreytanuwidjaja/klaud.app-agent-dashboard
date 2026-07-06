// Agent OS Dashboard — sidebar app shell over the Store + Klaud chat.
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- icons --------------------------------------------------------------
const PATHS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.2 1 2h6c0-.8.3-1.4 1-2A6 6 0 0 0 12 3Z"/>',
  folder: '<path d="M3 7.5A2 2 0 0 1 5 5.5h3.5l2 2H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z"/>',
  gem: '<path d="M13.5 2.5 19 7l1.5 9.5L14 21.5l-6.5-2L4 12l3.5-7.5Z"/><path d="M13.5 2.5 11 12l3 9.5" opacity="0.55"/>',
};
const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[n]}</svg>`;

// ---- time ---------------------------------------------------------------
const fmtClock = () => new Date().toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' });
function relTime(iso) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return { text: iso, overdue: false };
  const diff = t - Date.now(), overdue = diff < 0, mins = Math.round(Math.abs(diff) / 60000);
  let text = mins < 1 ? 'now' : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d`;
  return { text: overdue ? `${text} overdue` : `in ${text}`, overdue };
}
const fmtDate = (ms) => new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ---- view routing -------------------------------------------------------
function showView(name) {
  const valid = ['overview', 'workspaces', 'history', 'archive'];
  if (!valid.includes(name)) name = 'overview';
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
  $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === name));
  if (name === 'workspaces') loadWorkspaces();
  if (name === 'history') loadHistory();
  if (name === 'archive') renderArchive();
}
$$('.nav-item').forEach((n) => n.addEventListener('click', () => { location.hash = n.dataset.view; }));
window.addEventListener('hashchange', () => showView(location.hash.slice(1)));

// ---- board rendering ----------------------------------------------------
function linkPills(links) {
  const out = [];
  const add = (arr, name) => (arr || []).forEach((s) => out.push(`<span class="pill link">${ic(name)}${esc(s)}</span>`));
  add(links.project, 'link'); add(links.from_ideas, 'bulb'); add(links.spawned, 'spark'); add(links.related, 'link');
  return out.join('');
}
const tagPills = (tags) => (tags || []).map((t) => `<span class="pill tag">#${esc(t)}</span>`).join('');
const firstLine = (body, skipH) => (body || '').split('\n').find((l) => l.trim() && (!skipH || !l.startsWith('#'))) || '';

const discussBtn = (type, id, title) =>
  `<button class="discuss" data-action="discuss" data-type="${type}" data-id="${esc(id)}" data-title="${esc(title)}" aria-label="Discuss '${esc(title)}' with Klaud">${ic('chat')}<span>Discuss</span></button>`;
const obsidianBtn = (file, title) =>
  file ? `<button class="obsi" data-action="obsidian" data-file="${esc(file)}" aria-label="Open '${esc(title)}' in Obsidian" title="Open in Obsidian">${ic('gem')}</button>` : '';

function taskCard(t, archived) {
  const c = el('div', 'card');
  let remind = '';
  if (t.remind_at) { const r = relTime(t.remind_at); remind = `<span class="pill remind ${r.overdue ? 'overdue' : ''}">${ic('clock')}${esc(r.text)}</span>`; }
  const statusPill = archived ? `<span class="pill status ${esc(t.status)}">${esc(t.status)}</span>` : '';
  const acts = archived
    ? `<button class="done" data-id="${esc(t.id)}" data-status="open" aria-label="Reopen '${esc(t.title)}'">${ic('check')}<span>Reopen</span></button>${discussBtn('task', t.id, t.title)}${obsidianBtn(t.file, t.title)}`
    : `<button class="done" data-id="${esc(t.id)}" data-status="done" aria-label="Mark '${esc(t.title)}' done">${ic('check')}<span>Done</span></button>` +
      `<button class="dismiss" data-id="${esc(t.id)}" data-status="dismissed" aria-label="Dismiss '${esc(t.title)}'">${ic('x')}<span>Dismiss</span></button>` +
      `<button class="spawn" data-action="spawn" data-source="task" data-id="${esc(t.id)}" data-title="${esc(t.title)}" aria-label="Turn '${esc(t.title)}' into a project">${ic('spark')}<span>Project</span></button>` +
      discussBtn('task', t.id, t.title) + obsidianBtn(t.file, t.title);
  c.innerHTML = `<div class="title">${esc(t.title)}</div><div class="meta">${statusPill}${remind}${linkPills(t.links)}${tagPills(t.tags)}</div><div class="actions">${acts}</div>`;
  return c;
}
function projectCard(p) {
  const c = el('div', 'card'); const line = firstLine(p.body, true);
  const wsPill = p.workspace ? `<span class="pill link" title="${esc(p.workspace)}">${ic('folder')}${esc(p.workspace.split(/[\\/]/).filter(Boolean).pop() || p.workspace)}</span>` : '';
  c.innerHTML = `<div class="title">${esc(p.title)}</div>` + (line ? `<div class="excerpt">${esc(line.slice(0, 150))}</div>` : '') +
    `<div class="meta"><span class="pill status ${esc(p.status)}">${esc(p.status || 'project')}</span>${wsPill}${linkPills({ from_ideas: p.links.from_ideas, related: p.links.related })}</div>` +
    `<div class="actions">${discussBtn('project', p.id, p.title)}${obsidianBtn(p.file, p.title)}</div>`;
  return c;
}
function ideaCard(i, archived) {
  const c = el('div', 'card'); const line = firstLine(i.body, false);
  const acts = archived
    ? `<button class="done" data-action="archive" data-id="${esc(i.id)}" data-archived="false" aria-label="Restore '${esc(i.title)}'">${ic('check')}<span>Restore</span></button>${discussBtn('idea', i.id, i.title)}${obsidianBtn(i.file, i.title)}`
    : `<button class="spawn" data-action="brainstorm" data-id="${esc(i.id)}" data-title="${esc(i.title)}" aria-label="Brainstorm around '${esc(i.title)}'">${ic('bulb')}<span>Brainstorm</span></button>` +
      `<button class="spawn" data-action="spawn" data-source="idea" data-id="${esc(i.id)}" data-title="${esc(i.title)}" aria-label="Spawn a project from '${esc(i.title)}'">${ic('spark')}<span>Project</span></button>` +
      discussBtn('idea', i.id, i.title) +
      obsidianBtn(i.file, i.title) +
      `<button class="dismiss" data-action="archive" data-id="${esc(i.id)}" data-archived="true" aria-label="Archive '${esc(i.title)}'">${ic('x')}<span>Archive</span></button>`;
  c.innerHTML = `<div class="title">${esc(i.title)}</div>` + (line ? `<div class="excerpt">${esc(line.slice(0, 150))}</div>` : '') +
    `<div class="meta">${linkPills({ spawned: i.links.spawned, related: i.links.related })}${tagPills(i.tags)}</div><div class="actions">${acts}</div>`;
  return c;
}
let firstPaint = true;
function fill(container, items, render, emptyMsg) {
  container.innerHTML = '';
  if (!items.length) return container.appendChild(el('div', 'empty', emptyMsg));
  items.forEach((it, idx) => { const card = render(it); if (firstPaint) { card.classList.add('enter'); card.style.animationDelay = `${Math.min(idx * 45, 360)}ms`; } container.appendChild(card); });
}

let lastData = null;
async function refresh() {
  let data;
  try { data = await (await fetch('/api/store')).json(); }
  catch { $('#status').classList.add('offline'); $('#status-text').textContent = 'offline'; return; }
  lastData = data;
  const openTasks = data.tasks.filter((t) => t.status === 'open').sort((a, b) => (!!b.remind_at - !!a.remind_at) || String(a.remind_at || '~').localeCompare(String(b.remind_at || '~')));
  const reminders = openTasks.filter((t) => t.remind_at).slice(0, 10);
  $('#reminders-section').hidden = reminders.length === 0;
  const strip = $('#reminder-strip'); strip.innerHTML = '';
  reminders.forEach((t) => { const r = relTime(t.remind_at); const chip = el('div', 'rem-chip' + (r.overdue ? ' overdue' : '')); chip.innerHTML = `<span class="rem-title">${esc(t.title)}</span><span class="rem-when">${esc(r.text)}</span>`; strip.appendChild(chip); });
  const activeProjects = data.projects.filter((p) => p.status !== 'done' && p.status !== 'abandoned');
  const liveIdeas = data.ideas.filter((i) => !(i.tags || []).includes('archived'));
  fill($('#col-tasks'), openTasks, (t) => taskCard(t, false), 'No open tasks. Clear mind.');
  fill($('#col-projects'), activeProjects, projectCard, 'No active projects.');
  fill($('#col-ideas'), liveIdeas, (i) => ideaCard(i, false), 'No ideas captured yet.');
  $('#count-tasks').textContent = openTasks.length; $('#count-projects').textContent = activeProjects.length; $('#count-ideas').textContent = liveIdeas.length;
  $('#status').classList.remove('offline'); $('#status-text').textContent = 'live';
  firstPaint = false;
  if ($('#view-archive').classList.contains('active')) renderArchive();
}

// archive view (task/idea history)
function renderArchive() {
  if (!lastData) { refresh(); return; }
  const doneTasks = lastData.tasks
    .filter((t) => t.status === 'done' || t.status === 'dismissed')
    .sort((a, b) => String(b.created || '').localeCompare(String(a.created || '')));
  const archIdeas = lastData.ideas.filter((i) => (i.tags || []).includes('archived'));
  fill($('#arch-tasks'), doneTasks, (t) => taskCard(t, true), 'Nothing finished yet.');
  fill($('#arch-ideas'), archIdeas, (i) => ideaCard(i, true), 'No archived ideas.');
  $('#count-arch-tasks').textContent = doneTasks.length;
  $('#count-arch-ideas').textContent = archIdeas.length;
}

// task status actions (Done / Dismiss / Reopen)
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.actions button[data-status]'); if (!btn) return;
  btn.disabled = true;
  try { await fetch(`/api/tasks/${encodeURIComponent(btn.dataset.id)}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: btn.dataset.status }) }); }
  finally { refresh(); }
});

// archive / restore ideas
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.actions button[data-action="archive"]'); if (!btn) return;
  btn.disabled = true;
  try { await fetch(`/api/ideas/${encodeURIComponent(btn.dataset.id)}/archive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: btn.dataset.archived === 'true' }) }); }
  finally { refresh(); }
});

// open in Obsidian (obsidian:// URI protocol; Obsidian must be installed)
function openObsidian(pathStr) {
  if (!pathStr) return;
  window.location.href = 'obsidian://open?path=' + encodeURIComponent(pathStr);
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="obsidian"]'); if (!btn) return;
  openObsidian(btn.dataset.file);
});
$('#open-obsidian').addEventListener('click', () => openObsidian(lastData && lastData.store_path));

// brainstorm around an Idea (fresh session, brainstorm mode, seeded with the file)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="brainstorm"]'); if (!btn) return;
  chatSession = null;
  setChatMode('brainstorm');
  $('#chat-sub').textContent = `brainstorming: ${btn.dataset.title}`;
  openChatMobile();
  sendChat(`Let's brainstorm around my idea "${btn.dataset.title}" (store/ideas/${btn.dataset.id}.md). Read it first, then push it further: variations, adjacent opportunities, what would make it 10x, and the sharpest question I should be asking. End by proposing which new sparks to capture as linked Ideas.`);
});

// discuss an entity with Klaud (fresh session, seeded with the file to read)
const STORE_DIRS = { idea: 'ideas', project: 'projects', task: 'tasks' };
function discussEntity(type, id, title) {
  chatSession = null;
  $('#chat-sub').textContent = `discussing: ${title}`;
  openChatMobile();
  sendChat(`Let's discuss the ${type} "${title}". Read store/${STORE_DIRS[type]}/${id}.md first (and anything it links to), then give me a short summary and your suggested next steps.`);
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="discuss"]'); if (!btn) return;
  discussEntity(btn.dataset.type, btn.dataset.id, btn.dataset.title);
});

// spawn a Project from an Idea/Task, then hand it to Klaud to plan
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action="spawn"]'); if (!btn) return;
  btn.disabled = true;
  try {
    const body = btn.dataset.source === 'idea' ? { ideaId: btn.dataset.id } : { taskId: btn.dataset.id };
    const res = await (await fetch('/api/projects/spawn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
    if (res.error) throw new Error(res.error);
    refresh();
    chatSession = null;
    $('#chat-sub').textContent = `planning: ${res.title}`;
    openChatMobile();
    sendChat(`I just spawned the project "${res.title}" (store/projects/${res.id}.md) from the ${btn.dataset.source} "${btn.dataset.title}". Read the project file and its linked ${btn.dataset.source}, then help me plan it: sharpen the goal, propose the first 2-3 tasks, and flag open questions.`);
  } catch (err) {
    alert('Could not spawn project: ' + err.message);
  } finally {
    btn.disabled = false;
  }
});

// quick add
let mode = 'task';
function setMode(next) {
  mode = next; const isTask = mode === 'task';
  $('#mode-task').classList.toggle('active', isTask); $('#mode-idea').classList.toggle('active', !isTask);
  $('#mode-task').setAttribute('aria-pressed', String(isTask)); $('#mode-idea').setAttribute('aria-pressed', String(!isTask));
  $('#qa-when').style.display = isTask ? '' : 'none'; $('#qa-input').placeholder = isTask ? 'Capture a task…' : 'Capture an idea…';
}
$('#mode-task').addEventListener('click', () => setMode('task'));
$('#mode-idea').addEventListener('click', () => setMode('idea'));
async function submitQuickAdd() {
  const input = $('#qa-input'), title = input.value.trim(); if (!title) return input.focus();
  const isTask = mode === 'task';
  await fetch(isTask ? '/api/tasks' : '/api/ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(isTask ? { title, remind_at: $('#qa-when').value } : { title }) });
  input.value = ''; $('#qa-when').value = ''; refresh(); input.focus();
}
$('#qa-submit').addEventListener('click', submitQuickAdd);
$('#qa-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitQuickAdd(); });

// ---- workspaces ---------------------------------------------------------
async function loadWorkspaces() {
  const list = $('#ws-list');
  let ws = [], projects = [];
  try { ws = await (await fetch('/api/workspaces')).json(); } catch { /* */ }
  try { projects = (lastData && lastData.projects) || (await (await fetch('/api/store')).json()).projects; } catch { /* */ }
  $('#nav-ws').textContent = ws.length;
  list.innerHTML = '';
  if (!ws.length) { list.appendChild(el('div', 'empty', 'No workspaces yet. Add your other project folders so Klaud can read across them.')); return; }
  const linkable = projects.filter((p) => p.status !== 'done' && p.status !== 'abandoned');
  ws.forEach((w) => {
    const linked = projects.filter((p) => p.workspace && p.workspace.toLowerCase() === w.path.toLowerCase());
    const linkedPills = linked.map((p) => `<span class="pill link">${ic('link')}${esc(p.title)}</span>`).join('');
    const opts = linkable.filter((p) => !linked.some((l) => l.id === p.id)).map((p) => `<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('');
    const item = el('div', 'ws-item');
    item.innerHTML = `<span class="ws-ic">${ic('folder')}</span>` +
      `<div class="ws-meta"><div class="ws-label">${esc(w.label)}</div><div class="ws-path">${esc(w.path)}</div>${linkedPills ? `<div class="ws-links">${linkedPills}</div>` : ''}</div>` +
      `<div class="ws-actions">` +
        `<button class="ws-btn" data-action="ws-promote" data-path="${esc(w.path)}" data-label="${esc(w.label)}">${ic('spark')}<span>Make project</span></button>` +
        (opts ? `<select class="ws-link" data-path="${esc(w.path)}" aria-label="Link to an existing project"><option value="">Link to project…</option>${opts}</select>` : '') +
        `<button class="ws-remove" data-path="${esc(w.path)}">Remove</button>` +
      `</div>`;
    list.appendChild(item);
  });
}
$('#ws-add').addEventListener('submit', async (e) => {
  e.preventDefault();
  const path = $('#ws-path').value.trim(); if (!path) return;
  await fetch('/api/workspaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, label: $('#ws-label').value.trim() }) });
  $('#ws-path').value = ''; $('#ws-label').value = ''; loadWorkspaces();
});
document.addEventListener('click', async (e) => {
  const rm = e.target.closest('.ws-remove'); if (!rm) return;
  await fetch('/api/workspaces/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: rm.dataset.path }) });
  loadWorkspaces();
});

// promote a Workspace folder into a Project, then hand it to Klaud to plan
document.addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-action="ws-promote"]'); if (!b) return;
  b.disabled = true;
  try {
    const res = await (await fetch('/api/projects/spawn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: b.dataset.label, workspace: b.dataset.path }) })).json();
    if (res.error) throw new Error(res.error);
    await refresh(); loadWorkspaces();
    chatSession = null; $('#chat-sub').textContent = `planning: ${res.title}`; openChatMobile();
    sendChat(`I just created the project "${res.title}" (store/projects/${res.id}.md) from my workspace folder ${b.dataset.path}. Read the project file, then explore that workspace (its README, structure, any graphify-out/ graph or Obsidian notes) and help me plan: summarize what this project is, propose the first 2-3 tasks, and flag open questions.`);
  } catch (err) { alert('Could not create project: ' + err.message); }
  finally { b.disabled = false; }
});

// link a Workspace to an existing Project
document.addEventListener('change', async (e) => {
  const sel = e.target.closest('select.ws-link'); if (!sel || !sel.value) return;
  await fetch('/api/projects/link-workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: sel.value, path: sel.dataset.path }) });
  await refresh(); loadWorkspaces();
});

// ---- history ------------------------------------------------------------
async function loadHistory() {
  const list = $('#hist-list');
  let chats = [];
  try { chats = await (await fetch('/api/chats')).json(); } catch { /* */ }
  list.innerHTML = '';
  if (!chats.length) { list.appendChild(el('div', 'empty', 'No conversations yet. Chat with Klaud and they’ll show up here.')); return; }
  chats.forEach((c) => {
    const item = el('button', 'hist-item');
    item.innerHTML = `<span class="hist-ic">${ic('chat')}</span><div class="hist-meta"><div class="hist-title">${esc(c.title)}</div><div class="hist-sub">${c.turns} turn${c.turns === 1 ? '' : 's'} · ${fmtDate(c.updated)}</div></div>`;
    item.addEventListener('click', () => openThread(c.id));
    list.appendChild(item);
  });
}
async function openThread(id) {
  let thread; try { thread = await (await fetch('/api/chats/' + encodeURIComponent(id))).json(); } catch { return; }
  if (!thread || !thread.messages) return;
  chatSession = id;
  const prefix = String(id).split('-')[0];
  chatProvider = ['codex', 'gemini'].includes(prefix) ? prefix : 'claude';
  if (providerSel.querySelector(`option[value="${chatProvider}"]`)) providerSel.value = chatProvider;
  $('#chat-sub').textContent = 'resumed conversation';
  chatLog.innerHTML = '';
  thread.messages.forEach((m) => {
    const b = addMsg(m.role === 'user' ? 'user' : 'bot');
    b.bubble.textContent = m.text || (m.role === 'bot' ? '(no reply)' : '');
    if (m.tools && m.tools.length) m.tools.forEach((t) => b.tools.insertAdjacentHTML('beforeend', toolChip(t)));
  });
  location.hash = 'overview'; // bring board back; chat dock shows the thread
  openChatMobile();
  scrollChat();
}

// ---- chat ---------------------------------------------------------------
const chatLog = $('#chat-log'), chatInput = $('#chat-input'), chatSend = $('#chat-send');
let chatSession = null, chatBusy = false;
let chatProvider = 'claude';
let chatMode = 'chat'; // 'chat' | 'brainstorm'

function setChatMode(mode) {
  chatMode = mode;
  const brainstorm = mode === 'brainstorm';
  $('#mode-chat').classList.toggle('active', !brainstorm);
  $('#mode-brainstorm').classList.toggle('active', brainstorm);
  $('#mode-chat').setAttribute('aria-pressed', String(!brainstorm));
  $('#mode-brainstorm').setAttribute('aria-pressed', String(brainstorm));
  chatInput.placeholder = brainstorm ? 'Toss in a spark — let’s riff…' : 'Message Klaud…';
  if (brainstorm) $('#chat-sub').textContent = 'brainstorm mode — sparks, not essays';
}
$('#mode-chat').addEventListener('click', () => setChatMode('chat'));
$('#mode-brainstorm').addEventListener('click', () => setChatMode('brainstorm'));

// brain selector
const providerSel = $('#chat-provider');
const INSTALL_PREFIX = '__install__:';
const CONNECT_PREFIX = '__connect__:';
let providersById = new Map();
async function loadProviders() {
  let list = [];
  try { list = await (await fetch('/api/providers')).json(); } catch { return; }
  providersById = new Map(list.map((p) => [p.id, p]));
  providerSel.innerHTML = '';
  list.forEach((p) => {
    const o = document.createElement('option');
    if (!p.available) { o.value = INSTALL_PREFIX + p.id; o.textContent = `${p.label} — install…`; }
    else if (!p.connected) { o.value = CONNECT_PREFIX + p.id; o.textContent = `${p.label} — connect…`; }
    else { o.value = p.id; o.textContent = p.label; }
    providerSel.appendChild(o);
  });
  const ready = (pred) => list.find((p) => p.available && p.connected && pred(p));
  chatProvider = (ready((p) => p.id === 'claude') || ready(() => true) || list.find((p) => p.available) || { id: 'claude' }).id;
  providerSel.value = providersById.get(chatProvider) && !providersById.get(chatProvider).connected ? CONNECT_PREFIX + chatProvider : chatProvider;
}
providerSel.addEventListener('change', async () => {
  const v = providerSel.value;
  if (v.startsWith(INSTALL_PREFIX)) {
    await installProvider(v.slice(INSTALL_PREFIX.length));
    return;
  }
  if (v.startsWith(CONNECT_PREFIX)) {
    await connectProvider(v.slice(CONNECT_PREFIX.length));
    return;
  }
  chatProvider = v;
  $('#chat-new').click(); // session semantics differ per brain — start fresh
  $('#chat-sub').textContent = `brain: ${providerSel.selectedOptions[0].textContent}`;
});

// "Connect your AI": run the brain's own browser-login flow, streaming its
// output into the chat log; the server captures/saves credentials.
async function connectProvider(id) {
  const p = providersById.get(id);
  if (!p) return loadProviders();
  if (!p.canLogin) {
    alert(p.loginHint || `${p.label} has no automated login yet.`);
    providerSel.value = chatProvider;
    return;
  }
  if (!confirm(`Connect ${p.label}?\n\nA browser window will open — log in with your ${p.label} subscription there, then come back here.`)) {
    providerSel.value = chatProvider;
    return;
  }
  openChatMobile();
  const bot = addMsg('bot');
  bot.wrap.classList.add('installing');
  bot.bubble.textContent = `Connecting ${p.label}…\nA browser window should open — finish logging in there.\n`;
  let log = bot.bubble.textContent;
  try {
    const resp = await fetch(`/api/providers/${encodeURIComponent(id)}/login`, { method: 'POST' });
    if (!resp.ok || !resp.body) throw new Error('server');
    const reader = resp.body.getReader(), dec = new TextDecoder(); let buf = '';
    let ok = false;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'text') { log += ev.value; bot.bubble.textContent = log; scrollChat(); }
        else if (ev.type === 'error') { log += `\n${ev.message}\n`; bot.bubble.textContent = log; }
        else if (ev.type === 'end') ok = !!ev.ok;
      }
    }
    log += ok ? `\n${p.label} connected — you're ready to chat.` : `\n${p.label} still isn't connected — check the log above.`;
    bot.bubble.textContent = log;
    if (ok) {
      await loadProviders();
      chatProvider = id;
      providerSel.value = id;
      $('#chat-sub').textContent = `brain: ${p.label}`;
    }
  } catch {
    log += '\nCould not reach the server to connect.';
    bot.bubble.textContent = log;
  } finally {
    bot.wrap.classList.remove('installing');
  }
}

// install a not-yet-installed brain (runs its npm install -g in place, streams
// progress into the chat log) then re-checks availability and switches to it.
async function installProvider(id) {
  const p = providersById.get(id);
  if (!p) return loadProviders();
  if (!confirm(`Install ${p.label}?\n\nThis runs:\n  ${p.install}\n\non your machine.`)) {
    providerSel.value = chatProvider; // revert the select back off the install option
    return;
  }
  openChatMobile();
  const bot = addMsg('bot');
  bot.wrap.classList.add('installing');
  bot.bubble.textContent = `Installing ${p.label}…\n$ ${p.install}\n`;
  let log = bot.bubble.textContent;
  try {
    const resp = await fetch(`/api/providers/${encodeURIComponent(id)}/install`, { method: 'POST' });
    if (!resp.ok || !resp.body) throw new Error('server');
    const reader = resp.body.getReader(), dec = new TextDecoder(); let buf = '';
    let ok = false;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'text') { log += ev.value; bot.bubble.textContent = log; scrollChat(); }
        else if (ev.type === 'error') { log += `\n${ev.message}\n`; bot.bubble.textContent = log; }
        else if (ev.type === 'end') ok = !!ev.ok;
      }
    }
    log += ok ? `\n${p.label} installed.` : `\n${p.label} still isn't available — check the log above.`;
    bot.bubble.textContent = log;
    if (ok) {
      await loadProviders(); // rebuild options now that it's installed
      chatProvider = id;
      providerSel.value = id;
      $('#chat-sub').textContent = `brain: ${providerSel.selectedOptions[0].textContent}`;
    }
  } catch {
    log += '\nCould not reach the server to install.';
    bot.bubble.textContent = log;
  } finally {
    bot.wrap.classList.remove('installing');
  }
}
let attachments = []; // {path, dataUrl}
const scrollChat = () => { chatLog.scrollTop = chatLog.scrollHeight; };

function addMsg(role) {
  const wrap = el('div', `msg ${role}`), bubble = el('div', 'bubble'), tools = el('div', 'tools');
  wrap.appendChild(bubble); if (role === 'bot') wrap.appendChild(tools);
  chatLog.appendChild(wrap); scrollChat();
  return { wrap, bubble, tools };
}
const toolChip = (name) => `<span class="tool-chip">${ic('spark')}${esc(name)}</span>`;

function renderAttachments() {
  const row = $('#attach-row'); row.hidden = attachments.length === 0; row.innerHTML = '';
  attachments.forEach((a, i) => {
    const t = el('div', 'attach-thumb' + (a.uploading ? ' loading' : ''));
    t.innerHTML = a.uploading ? '…' : `<img src="${a.dataUrl}" alt="attachment"/><button type="button" aria-label="Remove" data-i="${i}">×</button>`;
    row.appendChild(t);
  });
}
$('#attach-row').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  attachments.splice(+b.dataset.i, 1); renderAttachments();
});

// paste image
chatInput.addEventListener('paste', async (e) => {
  const items = [...(e.clipboardData?.items || [])].filter((it) => it.type.startsWith('image/'));
  if (!items.length) return;
  e.preventDefault();
  for (const it of items) {
    const file = it.getAsFile(); if (!file) continue;
    const dataUrl = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
    const entry = { dataUrl, uploading: true }; attachments.push(entry); renderAttachments();
    try {
      const res = await (await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name || 'paste', dataUrl }) })).json();
      entry.path = res.path; entry.uploading = false;
    } catch { entry.error = true; entry.uploading = false; }
    renderAttachments();
  }
});

async function sendChat(text) {
  const imgs = attachments.filter((a) => a.path);
  if (chatBusy || (!text.trim() && !imgs.length)) return;
  chatBusy = true; chatSend.disabled = true;
  const hello = $('#chat-hello'); if (hello) hello.remove();

  const u = addMsg('user');
  u.bubble.textContent = text || '(image)';
  if (imgs.length) { const wrap = el('div', 'msg-imgs'); imgs.forEach((a) => { const im = new Image(); im.src = a.dataUrl; wrap.appendChild(im); }); u.wrap.insertBefore(wrap, u.bubble); }
  const sentAttachments = imgs.map((a) => ({ path: a.path }));
  attachments = []; renderAttachments();

  const bot = addMsg('bot'); bot.bubble.innerHTML = '<span class="caret"></span>';
  let acc = ''; const seen = new Set();
  const finishErr = (msg) => { bot.wrap.classList.add('error'); bot.bubble.textContent = msg; };

  try {
    const resp = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, sessionId: chatSession, attachments: sentAttachments, provider: chatProvider, mode: chatMode }) });
    if (!resp.ok || !resp.body) throw new Error('server');
    const reader = resp.body.getReader(), dec = new TextDecoder(); let buf = '';
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'session') { chatSession = ev.id; $('#chat-sub').textContent = 'active conversation'; }
        else if (ev.type === 'text') { acc += ev.value; bot.bubble.innerHTML = `${esc(acc)}<span class="caret"></span>`; scrollChat(); }
        else if (ev.type === 'final') { acc = ev.value; bot.bubble.innerHTML = `${esc(acc)}<span class="caret"></span>`; scrollChat(); }
        else if (ev.type === 'tool') { if (!seen.has(ev.name)) { seen.add(ev.name); bot.tools.insertAdjacentHTML('beforeend', toolChip(ev.name)); } }
        else if (ev.type === 'error') {
          if (ev.error === 'not_logged_in') finishErr('The brain isn’t authenticated. Run  claude setup-token  and put the token in dashboard/.claude-token, then try again.');
          else finishErr(ev.message || 'Something went wrong.');
        }
      }
    }
  } catch { finishErr('Could not reach the brain. Is the server running?'); }
  finally {
    if (!bot.wrap.classList.contains('error')) bot.bubble.innerHTML = esc(acc) || '(no reply)';
    chatBusy = false; chatSend.disabled = false; chatInput.focus(); refresh();
  }
}
function autoGrow() { chatInput.style.height = 'auto'; chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px'; }
chatInput.addEventListener('input', autoGrow);
$('#composer').addEventListener('submit', (e) => { e.preventDefault(); const t = chatInput.value.trim(); if (!t && !attachments.some((a) => a.path)) return; chatInput.value = ''; autoGrow(); sendChat(t); });
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#composer').requestSubmit(); } });
$('#chat-new').addEventListener('click', () => {
  chatSession = null; attachments = []; renderAttachments(); $('#chat-sub').textContent = 'reads & writes your Store';
  chatLog.innerHTML = '<div class="chat-hello" id="chat-hello"><p>New chat. I still share the Store — previous notes and tasks are all here.</p></div>';
});
document.addEventListener('click', (e) => {
  const s = e.target.closest('.suggest'); if (!s) return;
  if (s.dataset.brainstorm) {
    setChatMode('brainstorm');
    chatInput.focus();
    return;
  }
  const t = s.textContent.trim();
  if (t.endsWith('…')) { chatInput.value = t.slice(0, -1); chatInput.focus(); autoGrow(); } else sendChat(t);
});
function openChatMobile() { if (window.innerWidth <= 1200) $('.chat').classList.add('open'); }

// ---- onboarding (first run) ----------------------------------------------
// Shown when nothing is connected yet and the user hasn't dismissed it.
// Existing users with a working brain never see it (flag set automatically).
const obEl = $('#onboarding');

function renderObProviders() {
  const box = $('#ob-providers');
  box.innerHTML = '';
  const list = [...providersById.values()];
  list.forEach((p) => {
    const row = el('div', 'ob-row');
    const status = p.available && p.connected
      ? '<span class="ob-status ok">connected</span>'
      : p.available
        ? '<span class="ob-status">installed, not connected</span>'
        : '<span class="ob-status">not installed</span>';
    let action = '';
    if (!p.available) action = `<button class="ob-btn" data-ob="install" data-id="${esc(p.id)}">Install</button>`;
    else if (!p.connected) {
      action = p.canLogin
        ? `<button class="ob-btn" data-ob="login" data-id="${esc(p.id)}">Connect</button>`
        : `<span class="ob-hint">${esc(p.loginHint || '')}</span>`;
    }
    row.innerHTML = `<span class="ob-name">${esc(p.label)}</span>${status}${action}`;
    box.appendChild(row);
  });
  const ready = list.some((p) => p.available && p.connected);
  $('#ob-done').disabled = !ready;
  $('#ob-done').textContent = ready ? 'Start using Klaud' : 'Connect a brain first';
}

async function obRun(action, id) {
  const log = $('#ob-log');
  log.hidden = false;
  log.textContent = action === 'install' ? 'Installing…\n' : 'Opening your browser to log in…\nFinish there, then come back.\n\n';
  try {
    const resp = await fetch(`/api/providers/${encodeURIComponent(id)}/${action}`, { method: 'POST' });
    if (!resp.ok || !resp.body) throw new Error('server');
    const reader = resp.body.getReader(), dec = new TextDecoder(); let buf = '';
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'text') log.textContent += ev.value;
        else if (ev.type === 'error') log.textContent += '\n' + ev.message + '\n';
        log.scrollTop = log.scrollHeight;
      }
    }
  } catch {
    log.textContent += '\nCould not reach the server.';
  }
  await loadProviders();
  renderObProviders();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.ob-btn'); if (!b) return;
  b.disabled = true;
  obRun(b.dataset.ob, b.dataset.id).finally(() => { b.disabled = false; });
});

function closeOnboarding() {
  localStorage.setItem('klaud-onboarded', '1');
  obEl.hidden = true;
}
$('#ob-skip').addEventListener('click', closeOnboarding);
$('#ob-done').addEventListener('click', closeOnboarding);

function maybeOnboard() {
  if (localStorage.getItem('klaud-onboarded')) return;
  const anyConnected = [...providersById.values()].some((p) => p.available && p.connected);
  if (anyConnected) { localStorage.setItem('klaud-onboarded', '1'); return; }
  renderObProviders();
  obEl.hidden = false;
}

// ---- boot ---------------------------------------------------------------
function tickClock() { $('#clock').textContent = fmtClock(); }
tickClock(); setInterval(tickClock, 1000);
setMode('task');
loadProviders().then(maybeOnboard);
showView(location.hash.slice(1) || 'overview');
refresh(); setInterval(refresh, 15000);
// keep the sidebar workspace count fresh on load
fetch('/api/workspaces').then((r) => r.json()).then((w) => { $('#nav-ws').textContent = w.length; }).catch(() => {});
// donation link (configurable via dashboard/config.json donation_url; empty hides it)
fetch('/api/meta').then((r) => r.json()).then((m) => {
  const d = $('#donate');
  if (m.donation_url) d.href = m.donation_url; else d.style.display = 'none';
}).catch(() => {});
