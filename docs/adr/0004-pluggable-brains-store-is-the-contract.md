# Pluggable brains — the Store is the contract, not the model

The chat dock supports multiple AI providers (Claude, ChatGPT via Codex CLI, Gemini CLI), selectable per conversation. This works because Agent OS's memory was never in the model: any agent CLI that can read/write files can be a Brain, guided by its own protocol file (`CLAUDE.md` / `AGENTS.md` / `GEMINI.md` — same content, different filename conventions). We rejected calling provider APIs directly for the same reason as ADR 0003: an API chat has no file tools, so it can't touch the Store and becomes a second, amnesiac brain.

## Consequences

- Claude remains first-class: structured stream (tool chips, streamed text) and resumable threads via `--resume`.
- Non-Claude brains run in generic text mode — prompt via stdin, stdout streamed back, **stateless per message**. This is acceptable by design: continuity lives in the Store (ADR 0003), so "memory" survives even a brain swap mid-project.
- Each provider needs its own install + login (`codex`, `gemini` on PATH); the dashboard detects availability and greys out missing ones.
- Text mode deliberately avoids per-provider JSON parsing: those CLIs' stream formats change between versions, and a broken parser is worse than plain text.
