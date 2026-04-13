# Spec 3: Add `F2` rename in sidebar items

## Goal
Enable keyboard rename from sidebar items using `F2`.

## Scope
- Register `F2` keybinding for rename when a sidebar item is focused.
- Ensure command targets the focused sidebar item.
- Prevent conflicts with existing keybindings in non-sidebar contexts.

## Acceptance Criteria
- Pressing `F2` on a focused sidebar item starts rename.
- Pressing `F2` outside valid sidebar context does not break existing behavior.
- Rename result updates the sidebar item label immediately.
