# Agent OS

A personal Jarvis: one place to capture ideas, brainstorm with AI, and manage projects and tasks, with context shared across all AI sessions.

## Language

**Agent OS**:
The whole system — the Dashboard (what the user sees), the Brain (AI sessions doing the thinking), and the Store they share.

**Dashboard**:
The single always-on visual surface showing everything — ideas, projects, tasks — and delivering nudges when a Task's remind-at time arrives. A view over the Store, never the owner of the data.
_Avoid_: app, UI, frontend

**Brain**:
Any Claude Code session acting on the user's behalf, whether started from a terminal or the Dashboard's chat. Sessions are ephemeral; continuity lives in the Store, never in the conversation.
_Avoid_: assistant, bot, AI (as a noun)

**Store**:
The single shared source of truth that both the Dashboard and the Brain read and write. If it isn't in the Store, no session and no dashboard can see it.
_Avoid_: database, vault, memory

**Idea**:
A captured thought — shower thought to full brainstorm — with no obligation to ever be acted on. Ideas are permanent: acting on one never destroys or moves it.
_Avoid_: note, memo, thought

**Project**:
An undertaking the user has decided to act on, spawned from zero or more Ideas (many-to-many, with links back). May point to a Workspace where the real work happens.

**Workspace**:
The folder or repo elsewhere on disk where a Project's real work lives. The Project record holds status and links; the Workspace holds the work.
_Avoid_: repo (when meaning the pointer), directory

**Task**:
Anything the user intends to do or be nudged about; may belong to a Project or stand alone, and may carry a remind-at time. Ends by completion or dismissal.
_Avoid_: Reminder, todo — a "reminder" is just a Task with a remind-at time

**Link**:
A user-confirmed connection between two entities in the Store. The Brain proposes links; only confirmed ones are written — an unconfirmed suggestion is not a Link.
_Avoid_: relation, edge, connection

**Session Note**:
The short record every Brain session must leave behind — a few lines of what was discussed and decided, linked to the entities it touched. A session that leaves no Session Note effectively never happened.
_Avoid_: log, summary, transcript
