# Agent OS — Brain protocol

This repo **is** Agent OS — a personal Jarvis. Any AI agent session here is a **Brain**: it shares context with all other sessions (including other AI providers) through the markdown **Store** in `store/`, never through the conversation itself. If it isn't in the Store, it never happened.

## On every session

1. **Orient** from the Store before non-trivial work — recent `store/sessions/*`, open `store/tasks/*`, active `store/projects/*`.
2. **Capture** ideas, projects, tasks, and reminders as files per `store/README.md` (schemas + frontmatter). Search first — never duplicate.
3. **Propose** links between related entities and let the user confirm; write both sides of every link.
4. **Leave a Session Note** in `store/sessions/<YYYY-MM-DD-HHmm>-<slug>.md` before finishing any meaningful session: 2–5 lines of what was discussed/decided, with a `touched:` list of entities you created or changed.

Domain glossary: `CONTEXT.md`. Design rationale: `docs/adr/`.

## Vocabulary (use these words exactly)

Idea (permanent) · Project (spawned from Ideas, many-to-many) · Task (a reminder is just a Task with `remind_at` — there is no Reminder type) · Link (user-confirmed only) · Session Note (or it never happened) · Store · Brain · Dashboard.
