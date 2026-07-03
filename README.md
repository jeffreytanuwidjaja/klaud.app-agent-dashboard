# Klaud — Agent OS Dashboard

**A personal Jarvis: one dashboard for your ideas, projects, tasks, and reminders — with a real AI brain that remembers across every session.**

Klaud is a local-first command center built on [Claude Code](https://claude.com/claude-code). Talk to it in one session, and every other session knows what happened — because all context lives in a shared, human-readable markdown **Store**, not inside any single conversation.

## Why

Chat assistants forget. Notes apps don't think. Klaud splits the difference:

- **The Store** — every idea, project, task, and session note is a plain markdown file with YAML frontmatter. Git-able, human-editable, and a valid Obsidian vault (free graph view — but nothing depends on Obsidian).
- **The Brain** — any Claude Code session (terminal *or* the built-in chat panel) reads and writes the same Store. Sessions are ephemeral; memory is permanent.
- **The Dashboard** — a local web app that renders everything in one view and fires your reminders.

## Features

- 🗂 **One board** — Tasks, Projects, and Ideas in a single dark command-center view, with quick capture
- 💬 **Jarvis chat dock** — talk to a headless Claude Code session that reads/writes your Store live; streamed replies, tool activity chips, resumable threads
- ⏰ **Reminders** — a task with a `remind_at` fires a native Windows toast; the dashboard server is the always-on scheduler
- 🌱 **Ideas spawn Projects** — one click turns an idea into a linked project (idea stays put — provenance is permanent) and drops you into an AI planning chat
- 🔎 **Cross-workspace context** — register your other repos/vaults as Workspaces; the brain reads across all of them
- 🖼 **Image paste** — paste screenshots into chat; the brain views them
- 🕘 **Full history** — past chats are browsable and resumable; finished tasks and retired ideas live in the Archive, never deleted
- 📴 **Local & offline-first** — no hosted backend, no telemetry, self-hosted fonts; your data never leaves your machine

## Architecture

```
┌────────────┐     reads/writes      ┌──────────────────┐
│  Dashboard  │ ◄──────────────────► │      Store        │
│  (Express)  │                      │  markdown + YAML  │
└─────┬──────┘                      └──────────────────┘
      │ spawns per message                    ▲
      ▼                                       │ reads/writes
┌─────────────────────────┐                   │
│  Claude Code (headless) │ ◄─────────────────┘
│  -p --output-format     │   ...and any terminal
│     stream-json         │   Claude Code session
└─────────────────────────┘
```

The chat panel drives `claude -p --output-format stream-json` with a narrow tool allowlist (read/write the Store, nothing else). Each thread is a fresh session that orients from the Store — the "Jarvis illusion" never degrades from context-window exhaustion. Design rationale lives in [docs/adr/](docs/adr/), the domain glossary in [CONTEXT.md](CONTEXT.md).

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

## The Store

```
store/
├── ideas/      permanent thoughts — acting on one never destroys it
├── projects/   things you've decided to do, linked back to their ideas
├── tasks/      to-dos & reminders (a reminder is just a task with remind_at)
└── sessions/   what each AI session did — the cross-session memory
```

Your Store is **yours**: this repo ships the app, not your data (`store/` contents are gitignored).

## Security notes

- `dashboard/.claude-token` holds a live credential — it is gitignored; never commit it
- The dashboard binds locally with no auth (by design — see ADR 0001); don't expose the port
- The headless brain runs with a pre-approved tool allowlist scoped to this repo + your registered Workspaces

## Roadmap

- Windows startup entry (always-on reminders)
- Live project health from Workspace git activity
- AI-proposed links between related ideas/projects (user-confirmed, per the [glossary](CONTEXT.md))

---

Built with [Claude Code](https://claude.com/claude-code). MIT license.
