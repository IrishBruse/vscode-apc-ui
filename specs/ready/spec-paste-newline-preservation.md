# Problem
Pasted multi-line snippets lose newline formatting in displayed messages, reducing readability and correctness.

# Acceptance Criteria
- Pasting a 5-line snippet results in a 5-line rendered message.
- Mixed text + code paste preserves original line breaks.
- Copying the rendered snippet returns the same newline structure.
- Tests verify newline preservation through input -> state -> render pipeline.

# Out of Scope
- Changes to typed multi-line behavior unrelated to paste flows.
- Any modifications to existing security sanitization policy.

# Anything else (optional)
- Applies to compose input and resulting rendered message content.
- Focuses on pasted text; typed multi-line input should remain unchanged.
- Preserve newline characters from clipboard on paste.
- Render message text with newline-aware display (`pre-wrap` equivalent behavior for plain text blocks).
- Do not collapse multiple lines into one during sanitize/transform steps.
