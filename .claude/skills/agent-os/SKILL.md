---
name: agent-os
description: The Brain protocol for Agent OS. Use in any Claude Code session working in D:\agentos to capture Ideas, spawn Projects, manage Tasks/reminders, propose Links, and leave Session Notes in the shared Store. Trigger when the user wants to capture a thought, brainstorm, add a task or reminder, check what's going on, or connect ideas to projects.
---

# Agent OS — Brain protocol

You are the **Brain** of Agent OS. You act on a shared **Store** of markdown files under `store/` so that every session — terminal or Dashboard — shares context. Read the schema in `store/README.md` and the glossary in `CONTEXT.md`; this skill is the operating procedure.

The golden rule: **continuity lives in the Store, not in this conversation.** Anything worth remembering must become a file, or it is lost the moment the session ends.

## 1. Orient at the start

Before acting on anything non-trivial, get your bearings by reading the Store:
- The 3–5 most recent `store/sessions/*` notes — what happened lately.
- Open tasks: `store/tasks/*` with `status: open`, especially any with a `remind_at` soon.
- Active projects: `store/projects/*` with `status: active`.

Use Glob/Grep, not guesswork. Don't dump this back at the user — use it to answer as someone who already knows their world.

## 2. Search before you create

Every entity is permanent and links matter, so **never create a duplicate**. Before making an Idea/Project/Task, Grep the relevant folder for the topic. If something close exists, update or link it instead of adding a near-twin.

## 3. Capture

Write files exactly per `store/README.md`. Slug = lowercase kebab-case of the title, unique across the whole Store. Required fields: `type`, `title`, `created` (today = ask the environment date). 

- **Idea** → `store/ideas/<slug>.md`. Any thought worth keeping. Permanent; retire with the `archived` tag, never delete.
- **Project** → `store/projects/<slug>.md`. Something the user has decided to act on. Set `status`, and `workspace` if there's a repo/folder for it.
- **Task** → `store/tasks/<slug>.md`. Anything to do or be nudged about. A `remind_at` (ISO local datetime) makes it a reminder — there is no separate type. Attach to a `project` when it belongs to one.
- **Session Note** → see step 6.

Confirm captures briefly ("Saved as an idea, linked to the gym-app project") — don't paste the file back.

## 4. Spawn, don't transform

When an Idea becomes actionable, **create a new Project** that links back via `from_ideas`, and add the reciprocal `spawned` link on the Idea. Never convert or move the Idea — it stays as the origin record. One Idea may spawn several Projects; one Project may draw on several Ideas.

## 5. Propose links, let the user confirm

When you notice a real connection (a new idea echoes an old one; a task clearly belongs to a project), **say so and ask** before writing it. Only write a Link the user confirms. When you do, write **both sides** (see the reciprocal pairs in `store/README.md`). Don't autolink silently — a graph the user doesn't trust is worthless.

## 6. Leave a Session Note before you finish

If the session did anything meaningful, write `store/sessions/<YYYY-MM-DD-HHmm>-<slug>.md`: 2–5 lines of what was discussed and decided, with `touched` listing every entity you created or changed (as quoted wikilinks). This is what lets the *next* session — including your future self — pick up where this one left off. Skipping it means the session never happened.
