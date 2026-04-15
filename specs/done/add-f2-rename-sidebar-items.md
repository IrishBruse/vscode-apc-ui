# Goal

Enable keyboard-driven rename for focused sidebar chat items using **F2**, consistent with common VS Code list patterns.

# In Scope

- Register **F2** so it triggers rename when a sidebar item has focus.
- Ensure the command targets the focused sidebar item, not unrelated trees.
- Avoid breaking existing keybindings when focus is outside the ACP UI sidebar.

# Out of Scope

- Global F2 behavior for editors or other views; only the ACP UI sidebar rename path is in scope.

# Acceptance Criteria

- **F2** on a focused sidebar item starts inline rename for that item.
- **F2** outside the valid sidebar context does not change unrelated behavior.
- The sidebar label updates immediately after a successful rename.
