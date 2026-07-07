# Klaud — your AI subscription, turned into a Jarvis

**You already pay for Claude, ChatGPT, or Gemini. Klaud turns that subscription into a personal Jarvis — one dashboard for ideas, projects, tasks, and reminders, with an AI that remembers across every session. No second AI bill. Your data never leaves your machine.**

<!-- screenshot: docs/screenshot.png — dashboard with sidebar, board, and Jarvis dock -->

Klaud is a local-first command center built on [Claude Code](https://claude.com/claude-code), with pluggable support for OpenAI's Codex CLI and Google's Gemini CLI. Talk to it in one session, and every other session knows what happened — because all context lives in a shared, human-readable markdown **Store**, not inside any single conversation or any single model. Start a project with Claude, continue it with ChatGPT: the markdown remembers.

Free and open source, donation-supported. Built for people juggling too many projects — indie hackers, solo founders, anyone whose life is scattered across repos, vaults, and half-finished ideas.

## Why

Chat assistants forget. Notes apps don't think. Klaud splits the difference:

- **The Store** — every idea, project, task, and session note is a plain markdown file with YAML frontmatter. Git-able, human-editable, and a valid Obsidian vault (free graph view — but nothing depends on Obsidian).
- **The Brain** — any Claude Code session (terminal *or* the built-in chat panel) reads and writes the same Store. Sessions are ephemeral; memory is permanent.
- **The Dashboard** — a local web app that renders everything in one view and fires your reminders.

## Features

- 🗂 **One board** — Tasks, Projects, and Ideas in a single dark command-center view, with quick capture
- 💬 **Jarvis chat dock** — talk to a headless Claude Code session that reads/writes your Store live; streamed replies, tool activity chips, resumable threads
- 💡 **Brainstorm mode** — flip the chat into a diverging sparring partner: it riffs, challenges, asks sharp questions, and captures the sparks you confirm as linked Ideas in your Store (works per idea card too)
- 🧠 **Multi-LLM brains** — pick the model per conversation: Claude (first-class), ChatGPT via Codex CLI, or Gemini CLI; all follow the same Store protocol (`CLAUDE.md` / `AGENTS.md` / `GEMINI.md`), so memory survives a brain swap
- ⏰ **Reminders** — a task with a `remind_at` fires a native Windows toast; the dashboard server is the always-on scheduler
- 🌱 **Ideas spawn Projects** — one click turns an idea into a linked project (idea stays put — provenance is permanent) and drops you into an AI planning chat
- 🔎 **Cross-workspace context** — register your other repos/vaults as Workspaces; the brain reads across all of them. Promote a workspace folder into a Project in one click (opens a planning chat that explores the folder), or link it to an existing Project — the relationship is two-way and optional
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

**Extra brains — install & connect from inside the app:** the brain dropdown in the chat dock offers *install…* for brains you don't have and *connect…* for ones you haven't logged into — it runs the provider's own browser login for you (Claude's `setup-token` is captured automatically; ChatGPT via `codex login`). No terminal needed. Or by hand:

```bash
npm install -g @openai/codex        # ChatGPT — connect in-app (runs `codex login`)
npm install -g @google/gemini-cli   # Gemini  — connect in-app with a free API key
```

Connecting each brain is done from the dashboard's chat dropdown:
- **Claude** — captures a `setup-token` automatically
- **ChatGPT (Codex)** — runs `codex login` (browser)
- **Gemini** — paste a free [Google AI Studio API key](https://aistudio.google.com/apikey) (Gemini's CLI has no in-app OAuth; the key path is the frictionless option)

## Support Klaud

Klaud is **free and open source** — it runs on the AI subscription you already pay for, and your data never leaves your machine. If it earns a place in your day, [a donation](https://github.com/sponsors/jeffreytanuwidjaja) keeps it alive. (The in-app **Support Klaud** button is configurable via `dashboard/config.json` → `donation_url`.)

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

## Workspaces

Workspaces are folders elsewhere on disk — your other repos, Obsidian vaults, `graphify-out/` graphs — that you let the brain read for cross-project context. Add them in the **Workspaces** tab; every AI turn then passes them to the brain (Claude via `--add-dir`), so Jarvis can reason across all your projects, not just the Store.

Workspaces and Projects are two-way linked:

- **Make project** turns a workspace folder into a managed Project (its `workspace` field is set to that path) and opens a planning chat that explores the folder
- **Link to project** attaches a folder to a Project you already have
- Project cards show their linked folder; workspace cards show which Projects point at them

The link is **optional** — a workspace can stay reference-only (just for the brain to read), become a Project, or attach to one. Nothing is forced.

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
