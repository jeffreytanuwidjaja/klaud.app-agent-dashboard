# Klaud launch copy

Ready-to-post copy for each channel. Personalize the bracketed bits; keep the voice: plain, honest, a little dry. The one hook that differentiates: **you already pay for the AI — Klaud makes it yours.**

---

## Product Hunt

**Name:** Klaud

**Tagline** (≤60 chars):
> Turn the AI subscription you already pay for into a Jarvis

**Description:**
> Klaud is a free, open-source dashboard that turns your existing Claude / ChatGPT / Gemini subscription into a personal Jarvis: one board for ideas, projects, tasks, and reminders, plus an AI chat that actually remembers — across sessions, and even across models. Everything lives in plain markdown on your machine (it's a valid Obsidian vault). No second AI bill, no cloud, no telemetry.

**First comment (maker comment):**
> Hey PH 👋
>
> I built Klaud because I was paying for Claude *and* drowning in my own projects — ideas in one app, tasks in another, and an AI that forgot everything between chats.
>
> The trick that makes Klaud different: it doesn't ship its own AI. It drives the CLI of the subscription you already have (Claude Code, OpenAI Codex, Gemini CLI) in headless mode. So:
>
> • **No second AI subscription** — it runs on the one you already pay for
> • **Real memory** — every session writes markdown notes to a shared Store; the next session (even on a *different* model) reads them. Start planning with Claude, continue with ChatGPT.
> • **Private by architecture** — everything is markdown files on your disk. It's literally an Obsidian vault.
> • **Jarvis things** — capture ideas, spawn them into projects, set reminders that fire as native notifications, paste screenshots into chat, let it read across all your repos.
>
> Free & open source (MIT). If it earns a place in your day, there's a donate button.
>
> Ask me anything — especially skeptical questions about the "no second AI bill" part, it's the bit people don't believe until they try it.

---

## Show HN (Hacker News)

**Title:**
> Show HN: Klaud – a local Jarvis that runs on the AI subscription you already have

**Body:**
> I pay for Claude. My notes were in Obsidian, my tasks everywhere, and every AI chat started from zero.
>
> Klaud is my fix: a local Node dashboard + a headless agent CLI (Claude Code / Codex / Gemini CLI — your pick, your subscription). The core design decision: **all memory is plain markdown in a folder** ("the Store"). Every AI session must orient from it before working and leave a session note after. That one rule gives you cross-session memory, cross-*model* memory (swap Claude→ChatGPT mid-project; the markdown remembers), and full data ownership — the Store is a valid Obsidian vault.
>
> The dashboard renders the Store (ideas → projects → tasks), fires reminders as native notifications, and hosts the chat. The brain runs with a narrow tool allowlist (read/write the Store, nothing else).
>
> No hosted backend, no telemetry, no per-token cost — it drives the CLI your subscription already includes. MIT licensed.
>
> Repo: https://github.com/jeffreytanuwidjaja/klaud.app-agent-dashboard
>
> Honest limitations: Windows-first right now (reminders use Windows toasts), the brain only answers while your PC is on, and non-Claude brains are stateless per message (the Store carries continuity). Architecture decisions are documented as ADRs in the repo — including the ones I got wrong the first time.

---

## X / Twitter thread

**1/**
> You're already paying $20/mo for Claude or ChatGPT.
>
> I turned that subscription into a full Jarvis — ideas, projects, tasks, reminders, one dashboard, an AI that remembers everything across sessions.
>
> No second AI bill. 100% local. Open source. 🧵

**2/**
> The problem with every "AI second brain" app: it's *another* subscription, *their* cloud, *their* model.
>
> But you already pay for a frontier model. Claude Code / Codex / Gemini CLI can run headless on your machine.
>
> Klaud just… uses that.

**3/**
> The whole trick is one rule: **memory lives in markdown files, not in the chat.**
>
> Every AI session reads the Store before working and writes a session note after.
>
> Result: close the chat, open a new one tomorrow — it knows. Your PC knows. You own the files.

**4/**
> It even survives switching models.
>
> Start planning a project with Claude. Continue with ChatGPT. The markdown remembers — because the memory was never inside the model.

**5/**
> And because the Store is plain markdown with wikilinks… it's literally an Obsidian vault.
>
> One click opens your whole life-graph in Obsidian. Edit there, the dashboard and the AI see it instantly.

**6/**
> Jarvis things it does:
> • capture ideas → spawn them into projects (provenance kept)
> • tasks + reminders that fire as native notifications
> • paste screenshots into chat
> • reads across ALL your repos/vaults for context
> • archive, history, the works

**7/**
> It's free and open source (MIT). Runs on Windows today.
>
> If you're juggling too many projects and already pay for an AI — this is for you.
>
> https://github.com/jeffreytanuwidjaja/klaud.app-agent-dashboard
>
> (There's a donate button if it earns its keep.)

---

## Reddit — r/SideProject / r/ObsidianMD (adapt per sub)

**Title (r/SideProject):**
> I turned my Claude subscription into a Jarvis — free, open source, all markdown

**Title (r/ObsidianMD):**
> I built an AI dashboard where the "database" is just an Obsidian vault — the AI reads/writes your notes directly

**Body (short):**
> Klaud is a local dashboard (ideas / projects / tasks / reminders) with an AI chat that drives the Claude Code / Codex / Gemini CLI you already have — so there's no second AI subscription and nothing leaves your machine. All state is plain markdown with wikilinks and frontmatter, so the whole thing opens as an Obsidian vault with a working graph view. Every AI session writes a session note, which is how the next session (or a different model) remembers. MIT, donation-supported. Feedback very welcome — especially from people who tried other "AI second brain" tools and bounced.

---

## One-liner variants (bios, link previews, elevator)

- Turn the AI subscription you already pay for into a personal Jarvis.
- A local-first life OS where the AI's memory is just markdown you own.
- Obsidian vault + your Claude/ChatGPT/Gemini subscription = Jarvis.
- The AI second brain that doesn't charge you for the AI.

## Launch checklist

- [ ] Screenshot (`docs/screenshot.png`) + demo GIF (capture → spawn project → AI plans it)
- [ ] Enroll GitHub Sponsors (or set Ko-fi/Saweria in FUNDING.yml + config.json)
- [ ] Repo topics include: chatgpt, gemini, multi-llm, obsidian
- [ ] Pin an issue: "Roadmap / what should Klaud do next?" (invites contribution + signals life)
- [ ] Post order: X thread → Show HN (weekday ~9am ET) → Product Hunt → Reddit
- [ ] Waitlist link for "Klaud Sync" (validates the paid tier per ADR 0005) — add before PH if possible
