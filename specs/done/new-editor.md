# Goal

Improve the primary “new ACP UI” entry so users can start a chat with the default agent in one click, while still being able to pick another agent without hunting through menus.

# In Scope

- Primary control: one action that starts a new agent session using the configured default agent profile.
- Secondary control: a split or attached affordance (for example, a chevron / dropdown button) on the same control to choose a different agent before starting.
- Visual grouping so the default path is obvious and the alternate path is discoverable but not noisy.
- Respect existing agent list and default-agent configuration from the extension.

# Out of Scope

- Redesigning the full agent management or settings UI.
- Per-workspace default agents (unless already part of existing settings—then only wire-up, no new policy).
- Changing ACP session protocol behavior beyond which agent profile is selected at `session/new` (or equivalent).

# Acceptance Criteria

- Default path: single click on the main control creates a session with the first/default agent without extra steps.
- Alternate path: user can open the secondary control and select another agent; the new session uses that choice.
- Labels and tooltips make the distinction between “new chat (default)” and “pick agent” clear.
- Layout remains usable at typical sidebar widths and matches existing ACP UI spacing and control styles.
