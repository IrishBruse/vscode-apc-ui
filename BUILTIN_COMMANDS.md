# Built-in Commands

ACP UI supports local slash commands in the composer.

## `/clear`

- Syntax: `/clear`
- Example: `/clear`
- Behavior: Clears the transcript and reconnects a fresh ACP session for the current chat.

## `/new`

- Syntax: `/new`
- Example: `/new`
- Behavior: Alias for `/clear`.

## `/rename`

- Syntax: `/rename <new-name>`
- Example: `/rename Sprint-Planning`
- Behavior: Renames the current chat in both the editor tab and Chats sidebar.
- Edge case: The command requires exactly one non-space name token.

## `/show-thinking`

- Syntax: `/show-thinking`
- Example: `/show-thinking`
- Behavior: Toggles visibility of `agent_thought_chunk` blocks in the transcript.
