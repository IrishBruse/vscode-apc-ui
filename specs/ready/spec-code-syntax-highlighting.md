# Problem
Code displayed in read/write message sections is currently unstyled or inconsistently styled, making code hard to scan.

# Acceptance Criteria
- Fenced `json`, `markdown`, and `typescript` blocks render with distinct token coloring.
- Fenced blocks with unknown language still render readable plain code.
- No runtime console errors when rendering mixed-language transcripts.
- Snapshot or visual tests cover the three supported languages.

# Out of Scope
- Adding support for languages beyond the initial set in this phase.
- Changing the semantics of code copy behavior.

# Anything else (optional)
- Add syntax highlighting for code blocks in assistant/user messages where code is shown as read/write content.
- Detect language from fenced code block info string.
- Apply syntax highlighting theme consistent with the app theme (light/dark aware).
- Unknown or missing language falls back to plain text rendering without errors.
- Rendering must be deterministic between SSR/hydration (if applicable) and client updates.
- Keep copy/paste behavior unchanged (copied content must be raw code text).
