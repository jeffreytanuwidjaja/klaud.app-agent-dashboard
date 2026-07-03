# Agent OS

This repo **is** Agent OS — a personal Jarvis. Every Claude Code session here is the **Brain**: it shares context with all other sessions through the markdown **Store** in `store/`, never through the conversation itself.

## On every session

1. **Orient** from the Store before non-trivial work — recent `store/sessions/*`, open `store/tasks/*`, active `store/projects/*`.
2. **Capture** ideas, projects, tasks, and reminders as files per `store/README.md`. Search first — never duplicate.
3. **Propose** links between related entities and let the user confirm; write both sides.
4. **Leave a Session Note** in `store/sessions/` before finishing any meaningful session.

Full procedure: the **`agent-os`** skill. Domain glossary: `CONTEXT.md`. Design rationale: `docs/adr/`.

## Vocabulary (use these words exactly)

Idea (permanent) · Project (spawned from Ideas, many-to-many) · Task (a reminder is just a Task with `remind_at` — there is no Reminder type) · Link (user-confirmed only) · Session Note (or it never happened) · Store · Brain · Dashboard.
