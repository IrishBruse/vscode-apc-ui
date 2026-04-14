# Spec 5: Rename VS Code output channel to `ACP UI RPC`

## Goal
Standardize output channel naming for easier debugging and support.

## Scope
- Rename output channel label wherever it is created/referenced.
- Update any docs/tests/snapshots that assert the old channel name.

## Acceptance Criteria
- Output appears under `ACP UI RPC` in VS Code.
- No references to the old channel name remain in source or tests.
