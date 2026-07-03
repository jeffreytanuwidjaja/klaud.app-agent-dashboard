# Dashboard chat drives Claude Code headless

The Dashboard embeds a chat panel that runs Claude Code in headless/programmatic mode — the single-window Jarvis experience is the product, so chat was accepted into v1 despite being its largest engineering chunk (streaming, session management, permission handling). Calling the Claude API directly was rejected: it costs per-token on top of the existing subscription and produces a second brain with none of the skills, tools, or Store conventions the terminal sessions have.

Each chat starts a **fresh session** that reads the Store (recent Session Notes, open Tasks, active Projects) rather than resuming one eternal conversation — continuity lives in the Store, so the Jarvis illusion never degrades from context-window exhaustion.

## Consequences

- Headless sessions cannot pop permission prompts mid-stream, so the Brain runs with a pre-approved allowlist — essentially read/write to the Store and little else.
- Chat is built last (after the Store + capture skill and the dashboard views), so a working system exists even while the riskiest piece is in progress.
