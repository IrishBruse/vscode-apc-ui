# Problem
When thought content is rendered from streamed chunks, adjacent chunks can be concatenated without required spaces, reducing readability.

# Acceptance Criteria
- `"hello"` + `"world"` renders as `hello world`.
- `"hello "` + `"world"` renders as `hello world` (single space, no double-space).
- `"hello"` + `","` renders as `hello,`.
- Existing unit/integration coverage verifies chunk-join behavior for plain text and code blocks.

# Out of Scope
- Altering whitespace semantics inside fenced code blocks.
- Redesigning thought rendering beyond chunk concatenation behavior.

# Anything else (optional)
- Applies to assistant thought text rendered from incremental/streamed updates.
- Applies to both live streaming and final re-render of the same message.
- Join adjacent text chunks so natural word boundaries are preserved.
- If one chunk ends with a word character and the next chunk starts with a word character, insert exactly one space between them.
- Do not add extra spaces when either side already contains boundary whitespace.
- Preserve punctuation behavior (no space before punctuation like `.`, `,`, `:`, `;`, `!`, `?`).
