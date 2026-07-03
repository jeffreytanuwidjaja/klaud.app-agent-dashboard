# Klaud — Agent OS Dashboard

**A personal Jarvis: one dashboard for your ideas, projects, tasks, and reminders — with a real AI brain that remembers across every session. Bring your own model: Claude, ChatGPT, or Gemini.**

Klaud is a local-first command center built on [Claude Code](https://claude.com/claude-code), with pluggable support for OpenAI's Codex CLI and Google's Gemini CLI. Talk to it in one session, and every other session knows what happened — because all context lives in a shared, human-readable markdown **Store**, not inside any single conversation or any single model. Start a project with Claude, continue it with ChatGPT: the markdown remembers.

## Why

Chat assistants forget. Notes apps don't think. Klaud splits the difference:

- **The Store** — every idea, project, task, and session note is a plain markdown file with YAML frontmatter. Git-able, human-editable, and a valid Obsidian vault (free graph view — but nothing depends on Obsidian).
- **The Brain** — any Claude Code session (terminal *or* the built-in chat panel) reads and writes the same Store. Sessions are ephemeral; memory is permanent.
- **The Dashboard** — a local web app that renders everything in one view and fires your reminders.

## Features

- 🗂 **One board** — Tasks, Projects, and Ideas in a single dark command-center view, with quick capture
- 💬 **Jarvis chat dock** — talk to a headless Claude Code session that reads/writes your Store live; streamed replies, tool activity chips, resumable threads
- 🧠 **Multi-LLM brains** — pick the model per conversation: Claude (first-class), ChatGPT via Codex CLI, or Gemini CLI; all follow the same Store protocol (`CLAUDE.md` / `AGENTS.md` / `GEMINI.md`), so memory survives a brain swap
- ⏰ **Reminders** — a task with a `remind_at` fires a native Windows toast; the dashboard server is the always-on scheduler
- 🌱 **Ideas spawn Projects** — one click turns an idea into a linked project (idea stays put — provenance is permanent) and drops you into an AI planning chat
- 🔎 **Cross-workspace context** — register your other repos/vaults as Workspaces; the brain reads across all of them
- 🖼 **Image paste** — paste screenshots into chat; the brain views them
- 🕘 **Full history** — past chats are browsable and resumable; finished tasks and retired ideas live in the Archive, never deleted
- 💎 **Obsidian built in** — the Store is a valid Obsidian vault: one click opens it (or any single idea/task/project) in Obsidian for graph view and rich editing
- 📴 **Local & offline-first** — no hosted backend, no telemetry, self-hosted fonts; your data never leaves your machine

## Architecture

```
┌────────────┐     reads/writes      ┌──────────────────┐
│  Dashboard  │ ◄──────────────────► │      Store        │
│  (Express)  │                      │  markdown + YAML  │
└─────┬──────┘                      └──────────────────┘
      │ spawns per message                    ▲
      ▼                                       │ reads/writes
┌─────────────────────────────────┐           │
│ Brain (pick one per chat):      │ ◄─────────┘
│  · claude -p --stream-json      │   ...and any terminal
│  · codex exec  (ChatGPT)        │   agent session
│  · gemini      (Google)         │
└─────────────────────────────────┘
```

**The Store is the contract, not the model** (ADR 0004): any agent CLI that can read/write files qualifies as a Brain. Claude is first-class — structured stream, tool chips, resumable threads, and a narrow tool allowlist (read/write the Store, nothing else). Codex and Gemini run in text mode (prompt via stdin, output streamed back), stateless per message — which is fine, because continuity lives in the Store, not the conversation. The "Jarvis illusion" never degrades from context-window exhaustion. Design rationale lives in [docs/adr/](docs/adr/), the domain glossary in [CONTEXT.md](CONTEXT.md).

## Getting started

**Prereqs:** Node 18+, a [Claude subscription](https://claude.com), Windows (reminders use Windows toasts; the rest is cross-platform).

```bash
# 1. Install the Claude Code CLI and authenticate (one time)
npm install -g @anthropic-ai/claude-code
claude setup-token        # paste the sk-ant-oat01-... token into dashboard/.claude-token

# 2. Install & run
cd dashboard
npm install
npm start                 # → http://localhost:4317
```

Open the dashboard, add a task, then ask Jarvis *"what's on my plate?"*

**Optional — extra brains** (they appear in the chat dropdown automatically once on PATH):

```bash
npm install -g @openai/codex        # ChatGPT — then run `codex` once to log in
npm install -g @google/gemini-cli   # Gemini  — then run `gemini` once to log in
```

## The Store

```
store/
├── ideas/      permanent thoughts — acting on one never destroys it
├── projects/   things you've decided to do, linked back to their ideas
├── tasks/      to-dos & reminders (a reminder is just a task with remind_at)
└── sessions/   what each AI session did — the cross-session memory
```

Your Store is **yours**: this repo ships the app, not your data (`store/` contents are gitignored).

## Obsidian

The Store follows Obsidian conventions by design (ADR 0002): YAML frontmatter, `[[wikilinks]]`, one note per entity — so it *is* a vault, no export or sync needed.

- **Open in Obsidian** (sidebar) opens the whole Store as a vault — instant graph view of how your ideas, projects, and tasks connect
- The 💎 button on any card jumps straight to that entity's markdown file in Obsidian
- Edits made in Obsidian appear on the dashboard within seconds (it re-reads the files), and the AI brains see them immediately
- Nothing *depends* on Obsidian — it's a free power-up, not a requirement; `.obsidian/` state stays gitignored

Tip: open `store/` (not the repo root) as the vault so your graph shows only your knowledge, not the app's code.

## Security notes

- `dashboard/.claude-token` holds a live credential — it is gitignored; never commit it
- The dashboard binds locally with no auth (by design — see ADR 0001); don't expose the port
- The Claude brain runs with a pre-approved tool allowlist scoped to this repo + your registered Workspaces; Codex runs in its own `--full-auto` workspace sandbox, Gemini in `--yolo` — different vendors, different sandboxes, so review their docs before enabling them

## Roadmap

- Windows startup entry (always-on reminders)
- Live project health from Workspace git activity
- AI-proposed links between related ideas/projects (user-confirmed, per the [glossary](CONTEXT.md))

---

Built with [Claude Code](https://claude.com/claude-code). MIT license.
