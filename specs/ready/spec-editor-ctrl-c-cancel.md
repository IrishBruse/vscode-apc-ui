# Problem
When focus is in the editor/input area, users cannot reliably cancel the active run with `Ctrl+C`, which breaks expected terminal-like behavior and slows interruption workflows.

# Acceptance Criteria
- With an active run and editor focus, pressing `Ctrl+C` cancels the run.
- With selected text in the editor/input, pressing `Ctrl+C` copies selection and does not cancel.
- With no active run, pressing `Ctrl+C` has no cancel side effects.
- Automated tests cover active-run cancel path and selected-text copy path.

# Out of Scope
- Changes to non-editor/global keyboard shortcut behavior.
- Modifying standard copy semantics when text is selected.

# Anything else (optional)
- Applies when an ACP run is active and the editor/input surface is focused.
- Applies to keyboard handling in ACP UI only.
- While a run is active and no text selection is present, `Ctrl+C` triggers the same cancel action as the existing stop/interruption control.
- If text is selected in the editor/input, `Ctrl+C` preserves standard copy behavior and must not cancel.
- If no run is active, `Ctrl+C` should not trigger cancel.
- Keyboard shortcut handling should be consistent with platform conventions and existing app shortcuts.
