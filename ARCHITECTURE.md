# IrishBruse ACP — architecture

This extension isolates **Agent Client Protocol (ACP)** concerns from presentation (webview, tree views, editors). The layout is optimized for migrating chat UI out of `irishbruse-utilities` while keeping boundaries testable.

## Layers

1. **`protocol/`** — Serialized messages between the extension host and a UI host (webview today, other surfaces later). Pure types + `tryParseWebviewMessage` for untrusted `postMessage` input.

2. **`acp/domain/`** — Spawn configuration parsing and types with **no** VS Code imports. Safe to unit test and reuse in standalone servers or tests.

3. **`acp/ports/`** — Narrow interfaces the ACP stack needs from the host:
   - **`AcpHostFilesystem`** — maps ACP `readTextFile` / `writeTextFile` to workspace I/O.
   - **`AcpRpcNdjsonSink`** — optional raw NDJSON-RPC logging (Output channel + file).

4. **`acp/infrastructure/`** — `AcpAgentProcess`: subprocess + `@agentclientprotocol/sdk` connection. Depends only on domain types and ports (no globals).

5. **`acp/mapping/`** — Translates ACP `session/update` payloads into `ExtensionToWebviewMessage` batches (migrated from utilities). Depends on the protocol types, not on VS Code.

6. **`acp/session/`** — `AcpSessionBridge` orchestrates one agent session: permissions, model selection, prompt/cancel, and update forwarding.

7. **`platform/vscode/`** — Adapters: `createVscodeAcpHostFilesystem`, `VscodeAcpRpcNdjsonSink`, `createDefaultAcpSessionHostRuntime`.

8. **`extension/`** — Activation wiring (output channel, commands). This is the **composition root** for the VS Code host. `extensionServices.ts` exposes `getIbAcpExtensionActivation()` so migrated UI code can share the same RPC NDJSON sink and output channel without module-level globals.

## Migration notes

- Settings use **`ib-acp.agents`** (same JSON shape as `ib-utilities.acpAgents`). During migration you can duplicate settings or add a one-time sync.
- Import the stable barrel **`./acp`** (or `src/acp/index.ts`) from feature code instead of deep relative paths.
- UI code should construct **`AcpSessionBridge`** with `createDefaultAcpSessionHostRuntime(rpcNdjsonSink)` so stdio taps and FS behavior stay consistent with the RPC log.

## Testing

- **Domain** parsing is covered with Vitest (`src/**/*.test.ts`).
- **Ports** allow fakes: `NullAcpRpcNdjsonSink`, in-memory `AcpHostFilesystem` for integration-style tests without VS Code.
