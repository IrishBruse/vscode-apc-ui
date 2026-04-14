# Spec 1: Add `/rename` command

## Goal
Add a slash command to rename a selected resource from the command input flow.

## Scope
- Parse `/rename <new-name>` from user input.
- Validate the command has exactly one target name argument.
- Trigger existing rename action through the current command execution path.
- Show success or error feedback in the same channel used by other slash commands.

## Acceptance Criteria
- `/rename NewName` renames the currently selected item.
- Invalid usage (`/rename` with no name) returns a helpful usage hint.
- Errors from rename action are surfaced to the user.
