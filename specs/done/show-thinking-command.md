# Goal

Let users toggle visibility of agent “thinking” streaming (`agent_thought_chunk` blocks) from the chat UI so they can reduce noise or inspect reasoning when needed.

# In Scope

- Implement `/show-thinking` (or equivalent registered command) as a toggle for displaying `agent_thought_chunk` content.
- Persist or default the toggle consistently with other chat display preferences (match existing patterns in ACP UI).
- Ensure toggling does not drop already-received chunks from the session model—only affects presentation.

# Out of Scope

- Changing how the agent emits thoughts or server-side summarization of thoughts.
- Separate UI for exporting or searching thought history.

# Acceptance Criteria

- Invoking the toggle switches between hidden and visible states for thought chunks in the active chat view.
- State is obvious to the user (label, hint, or command feedback) after each invocation.
- No regression to normal assistant message rendering when thoughts are hidden.
