# Goal

When the user types `@` in the chat input, offer autocomplete for workspace files (similar in spirit to `/` command completion), so they can insert file paths quickly without leaving the keyboard.

# In Scope

- Trigger completion when `@` is typed in the relevant input (same surface as slash commands, unless a dedicated rule is needed).
- Suggest files from the current workspace (or “current directory” scope as defined by the product—align with how `/` resolves context).
- Insert the chosen path into the prompt in a stable, predictable format the agent can consume.
- Keyboard and mouse selection consistent with existing completion UX in ACP UI.

# Out of Scope

- Autocomplete for symbols, URLs, or arbitrary `@mentions` unrelated to files.
- Cross-workspace or remote-only file trees beyond what the host already exposes.
- Changing how the agent interprets file references beyond inserting text the protocol already supports.

# Acceptance Criteria

- Typing `@` opens a completion list populated with relevant files.
- Selecting an item inserts the file reference into the input and closes completion.
- Behavior matches or clearly parallels `/` command completion patterns (navigation, cancel, filter-as-you-type if supported elsewhere).
- No regression to plain text input when `@` is not used or completion is dismissed.
