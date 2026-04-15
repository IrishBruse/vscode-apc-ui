# Problem
Chat scrolling affordance is constrained by the content column, reducing usability and making track/handle placement feel misaligned.

# Acceptance Criteria
- Scrollbar track appears at the right edge of the full chat pane.
- Message content stays centered and visually aligned with input width at all breakpoints.
- No layout shift when long messages appear.
- Manual QA confirms expected behavior in Chrome, Firefox, and Safari.

# Out of Scope
- Reworking chat message visual styles unrelated to scrollbar placement.
- Changing chat behavior outside layout and overflow handling.

# Anything else (optional)
- Scroll container spans full available chat pane width.
- Message content remains centered in a fixed/max width column that matches the input container width.
- Applies to desktop and responsive layouts.
- Preserve existing sticky/footer/input behavior.
