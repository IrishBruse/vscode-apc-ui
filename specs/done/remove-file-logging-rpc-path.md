# Goal

Stop writing ACP RPC logs to disk so extension startup and RPC traffic no longer hit `ENOENT` when log file paths are missing or unusable.

# In Scope

- Remove or disable file-based RPC logging (for example writes to `ib-acp-ui-rpc.ndjson`).
- Retain useful non-file logging paths that are safe in constrained environments.
- Ensure RPC handling does not depend on creating or opening a log file on disk.

# Out of Scope

- Redesigning the full logging strategy (structured telemetry, remote sinks) beyond removing the problematic file sink.

# Acceptance Criteria

- No attempts are made to open or write `ib-acp-ui-rpc.ndjson`.
- ENOENT errors tied to that log file no longer occur during normal extension use.
- Core RPC behavior is unchanged aside from logging destination.
