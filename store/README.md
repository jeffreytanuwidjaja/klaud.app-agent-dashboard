# The Store

The single source of truth for Agent OS. Plain markdown + YAML frontmatter, one file per entity. If it isn't here, no session and no dashboard can see it. See [[../CONTEXT.md]] for the domain glossary and `docs/adr/` for why it's built this way.

Both the Dashboard and the Brain (any Claude Code session) read and write these files directly. It is also a valid Obsidian vault — nothing depends on Obsidian, but you can open this folder in it for a free graph view.

## Layout

```
store/
├── ideas/      one .md per Idea       — permanent, never deleted
├── projects/   one .md per Project    — spawned from Ideas
├── tasks/      one .md per Task        — includes reminders (Task + remind_at)
└── sessions/   one .md per Session Note
```

## Filenames and links

- Filename is a lowercase kebab-case **slug** of the title, unique across the whole Store: `personal-jarvis.md`, `agent-os.md`. Sessions are prefixed with a timestamp: `2026-07-02-1500-agent-os-design.md`.
- Links are **quoted wikilinks** in frontmatter list fields: `from_ideas: ["[[personal-jarvis]]"]`. The quotes keep the YAML valid; the dashboard strips the `[[ ]]`; Obsidian resolves them in graph view.
- Links are bidirectional. When the Brain writes a link on one entity, it writes the reciprocal on the other (an Idea's `spawned` mirrors a Project's `from_ideas`).

## Schemas

Only `type`, `title`, and `created` are required everywhere. Everything else is optional; omit rather than leave blank where you can.

### Idea — `ideas/<slug>.md`
```yaml
---
type: idea
title: Personal Jarvis
created: 2026-07-02
tags: [meta, tooling]
spawned: ["[[agent-os]]"]     # Projects born from this Idea
related: []                    # other Ideas
---
Freeform body: the thought, the brainstorm, whatever.
```
Ideas are permanent. To retire one, add the `archived` tag — never delete.

### Project — `projects/<slug>.md`
```yaml
---
type: project
title: Agent OS
created: 2026-07-02
status: active                 # active | paused | done | abandoned
workspace: "D:\\agentos"      # optional: folder/repo where the real work lives
from_ideas: ["[[personal-jarvis]]"]
related: []
---
Body: goal, current state, next steps.
```

### Task — `tasks/<slug>.md`
```yaml
---
type: task
title: Build the Dashboard (Phase 2)
created: 2026-07-02
status: open                   # open | done | dismissed
remind_at: ""                  # optional ISO local datetime, e.g. 2026-07-03T09:00
project: "[[agent-os]]"        # optional
tags: []
---
Body: detail, acceptance, links.
```
A Task with a `remind_at` **is** a reminder — there is no separate Reminder type. Tasks end by `done` (work finished) or `dismissed` (a nudge with nothing to complete, e.g. a birthday).

### Session Note — `sessions/<YYYY-MM-DD-HHmm>-<slug>.md`
```yaml
---
type: session
started: 2026-07-02T15:00
touched: ["[[agent-os]]", "[[personal-jarvis]]"]   # entities this session created or changed
---
2–5 lines: what was discussed and what was decided. Not a transcript.
```
Every session that does meaningful work leaves one. A session with no Session Note effectively never happened.
