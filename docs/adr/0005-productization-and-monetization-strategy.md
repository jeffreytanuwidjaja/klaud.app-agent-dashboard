# Productization & monetization: local BYO-brain first, hosted later

Klaud will be offered to others as a product. After grilling the options, the strategy is an **open-core ladder**, sequenced — not three products at once.

## The decision

**v1 — the local product (keeps ADR 0001 intact):**
- **Free / open-source, donation-supported.** No paid tier at launch — a donation button (in-app + GitHub Sponsors via FUNDING.yml) instead. Rationale: earn users and trust first; a paid tier before an audience exists prices out the audience.
- **Friendly onboarding:** "Connect your AI" runs inside the dashboard — the brain dropdown offers *install…* / *connect…* per provider, wrapping each CLI's own browser-login (`claude setup-token` with automatic token capture, `codex login`; Gemini stays a one-time manual step until its CLI grows a login command). Lowers the wall from "developer" to "can click login."
- **Paid tier (the wedge, deferred behind a waitlist):** a *light* hosted backend for **sync across devices + always-on reminders + a Telegram/Discord Jarvis**. The brain still runs on the user's machine on their own subscription; Telegram is just the transport. Obsidian-Sync playbook, ~$5–8/mo band. Build it only when a waitlist proves demand.

**v2 — hosted fallback:** cloud brain for "when the PC is off," funded by v1 revenue. Only reached once demand is proven.

## Why (the iron constraints)

- **"Free AI via the user's subscription" is inseparable from "the CLI runs on the user's machine."** Subscriptions (ChatGPT Plus, Claude Pro, Grok Premium) are licensed for interactive, single-person use in the provider's own client. They cannot be driven from our server for many users — legally or (for OpenAI/xAI) technically. Hosted, programmatic use requires a pay-per-token **API key**, which means *we* pay or the user pastes a key.
- Therefore a **hosted, zero-install product for non-technical users cannot run on their subscription** — that audience requires either an install (local) or us paying the API. Do not build the expensive hosted-AI tier before the cheap local tier has proven demand.
- The paid backend is cheap to run precisely because it carries **no LLM cost** — it syncs markdown and relays notifications, nothing more.

## Positioning

Target beachhead: **technical-enough solo founders / indie hackers** juggling several projects (many repos/vaults). The ownable wedge, which cloud-native competitors structurally can't copy: **"turn the AI subscription you already pay for into a private life-manager — no second AI bill, your data on your machine."**

## Consequences

- This is a **lifestyle/indie business** in its v1 form (hundreds of paying users × ~$6/mo = real side income, not a venture outcome). The venture-scale version is the hosted-AI tier — bigger, crowded, capital-intensive; deliberately deferred.
- Biggest risk is **distribution/differentiation**, not engineering. The category is crowded; the subscription-reuse wedge and a genuinely frictionless installer are the two things to nail.
- ADR 0001 (local-first) is **reaffirmed for v1**, not overturned; ADR 0004 (Store is the contract) is what lets a Telegram chat and a desktop chat share memory.
