# Markdown files + frontmatter as the Store, Obsidian-compatible

The Store is plain markdown files — one per Idea/Project/Task — with YAML frontmatter for structured fields and `[[wikilinks]]` for Links, rather than SQLite or JSON. Claude Code is natively good at editing markdown, the user can read and fix anything in a text editor, and it's git-able. We follow Obsidian conventions so the Store is a valid vault (free graph view, mobile reading), but nothing may ever *depend* on Obsidian — the Dashboard is the primary surface.

## Considered Options

- **SQLite as source of truth** — better queries, but opaque to the user and awkward for the Brain; acceptable later as a *derived* index, never as the truth.
- **JSON files** — structured but miserable for long-form idea prose.

## Consequences

- The Dashboard must parse frontmatter/wikilinks rather than query a database; if views get slow, build a derived index that can be rebuilt from the files at any time.
