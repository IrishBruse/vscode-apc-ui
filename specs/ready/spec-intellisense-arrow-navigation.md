# Problem
Arrow key navigation in slash-command and mention IntelliSense is unreliable or not switching active options correctly.

# Acceptance Criteria
- Typing `/` opens command suggestions; up/down changes active option predictably.
- Typing `@` opens mention suggestions; up/down changes active option predictably.
- Pressing `Enter` inserts the highlighted command/mention.
- Keyboard navigation works without requiring mouse hover.
- Tests cover keydown behavior for `/` and `@` suggestion states.

# Out of Scope
- Redesigning mouse interactions for suggestion popovers.
- Adding new suggestion types beyond `/` commands and `@` mentions.

# Anything else (optional)
- Applies to suggestion popovers triggered by `/` command mode and `@` mention mode.
- Keyboard handling only; mouse interactions should continue to work.
- `ArrowDown` moves active selection to next item.
- `ArrowUp` moves active selection to previous item.
- Navigation wraps at boundaries (last -> first, first -> last), or uses clamped behavior if existing UX standard requires it; behavior must be consistent and documented.
- `Enter` inserts the currently active item.
- `Escape` closes the suggestion list and returns focus to editor/input.
- Active item is visibly highlighted and kept in view while navigating.
