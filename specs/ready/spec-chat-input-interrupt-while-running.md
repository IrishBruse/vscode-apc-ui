# Problem
The chat input becomes disabled while a run is in progress, preventing users from typing an interrupt/follow-up message and reducing control during long responses.

# Acceptance Criteria
- During an active run, the chat input is editable and accepts typing/paste.
- Submitting a new message during an active run interrupts the current run and processes the new message.
- UI state clearly indicates transition from running -> interrupted -> new request.
- No deadlock state where input remains disabled after interruption.
- Tests cover input-enabled state during run and interrupt-then-send behavior.

# Out of Scope
- Removing the existing explicit stop button.
- Introducing broader workflow changes outside interrupt-then-send behavior.

# Anything else (optional)
- Applies to the main chat input while an ACP run is active.
- Applies to both keyboard entry and paste into chat input.
- Keep chat input enabled while a run is active.
- Allow users to submit an interruption message during the active run.
- On submit during an active run, trigger interruption/cancel flow first, then send the new message in a deterministic order.
- Provide clear UI feedback that the message is interrupting the current run.
- Prevent duplicate submissions caused by rapid Enter presses during transition states.
