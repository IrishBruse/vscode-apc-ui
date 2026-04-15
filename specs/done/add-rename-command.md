# Goal

Add `/rename` so users can rename the currently selected sidebar resource from the same command input flow as other slash commands.

# In Scope

- Parse `/rename <new-name>` with exactly one name argument.
- Route to the existing rename action and surface success or errors in the same channel as other slash commands.

# Out of Scope

- Bulk rename, regex rename, or file-tree rename outside the current selection model.

# Acceptance Criteria

- `/rename NewName` renames the currently selected item when rename is valid.
- `/rename` with no name shows a clear usage hint.
- Errors from the underlying rename operation are shown to the user without silent failure.
