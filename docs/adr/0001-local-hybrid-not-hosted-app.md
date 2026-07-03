# Local hybrid (dashboard + Claude Code brain), not a hosted app

Agent OS could have been a standalone hosted product (own backend, Claude API, mobile access) or a pure Claude-Code workflow with no UI. We chose the hybrid: a local-only web dashboard and Claude Code sessions as the Brain, both operating on one shared Store in this repo. The user already pays for Claude Code — a hosted app would rebuild its agent capabilities at per-token cost, while a UI-less workflow would abandon the dashboard that is central to the product vision.

## Consequences

- Everything runs on the user's PC; nothing works when it's off. Phone notifications and remote access are explicitly out of scope for v1.
- No auth, no hosting, no server ops — the entire system is files plus one local process.
