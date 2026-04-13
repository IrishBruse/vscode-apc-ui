# Spec 4: Remove file logging from VS Code extension RPC path

## Goal
Stop writing ACP RPC logs to disk to avoid ENOENT failures in user global storage.

## Scope
- Remove or disable file-based RPC logging implementation.
- Keep non-file logging (if any) that is useful and safe.
- Ensure extension startup and RPC operations do not depend on log file creation.

## Acceptance Criteria
- No attempts are made to open/write `ib-acp-rpc.ndjson`.
- ENOENT log-file errors no longer occur during extension use.
- Core RPC behavior remains unchanged.
