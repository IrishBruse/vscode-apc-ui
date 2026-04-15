# Goal

Standardize the VS Code output channel label to **ACP UI RPC** so logs are easy to find when debugging or supporting users.

# In Scope

- Rename the output channel wherever it is created and referenced.
- Update documentation, tests, and snapshots that assert the previous channel name.

# Out of Scope

- Changing log verbosity, format, or which events are logged.

# Acceptance Criteria

- Log output appears under `ACP UI RPC` in the VS Code Output panel.
- No references to the old channel name remain in source, tests, or user-facing docs that describe where to look for RPC logs.
