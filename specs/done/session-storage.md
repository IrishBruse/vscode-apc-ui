# Goal

Retain chat items in the **Chats** sidebar across VS Code reloads and allow reopening prior ACP sessions from the list, so users are not forced to start over when the window or extension restarts even when the agent supports `session/load`.

# In Scope

- Persist chat metadata needed to repopulate the sidebar after restart; validate on read; hydrate the sidebar provider during extension activation.
- On open, resolve the stored agent profile and call ACP `session/load` when possible; bind the UI to the live session on success.
- Mark or restyle items that cannot be restored (missing agent config, invalid session id, load failure) with clear errors and recoverable actions (retry, pick another agent, delete).
- Keep existing rename and delete behavior for both new and restored items; deleted chats must not reappear after reload.
- **UX:** Restored entries show their prior display name; opening a restored chat should feel the same as an in-memory chat; failures show user-friendly messaging without crashing activation.
- **Data model:** Persist a lightweight record per chat item in extension global state under `acpUi.chats.v1` (version suffix for migrations). Payload stays minimal—no full transcript in extension storage.

```ts
type StoredChatItem = {
  id: string; // sidebar item id
  title: string; // user-visible chat label
  agentName: string; // selected agent profile name
  sessionId: string; // ACP session id used by session/load
  updatedAt: number; // epoch ms for sorting/recency
};
```

- **Lifecycle:** On create, rename, delete, or recency update, write the full list back through a single persistence path; prefer atomic replacement writes (`globalState.update`). On activation, ignore malformed records, log to `ACP UI RPC` output, continue with an empty list if needed.
- **Failure handling:** Missing agent config—item stays listed; opening prompts to select another agent or delete. Invalid `sessionId`—graceful failure, no crash. Storage parse errors—ignore bad payload, log, empty list.
- **Implementation:** Small repository or service module for read/validate/write; map between runtime chat model and storage model; debounce writes only if profiling shows churn (correctness first).

# Out of Scope

- Persisting full message transcript in extension storage.
- Cross-machine sync beyond what VS Code storage already provides.
- Migrating or importing sessions from other tools.

# Acceptance Criteria

- After creating chats, reloading VS Code preserves sidebar entries.
- Restored entries can reopen prior sessions via ACP `session/load` when the agent and session are still valid.
- Rename and delete operations persist across reload.
- Invalid records in storage do not crash activation and are ignored or surfaced safely.
- Opening a non-restorable chat shows a clear error and a recovery action; the item remains manageable.
- **Tests:** Validation accepts well-formed records and rejects malformed ones; persistence writes expected payload after create/rename/delete; integration path verifies reload visibility, `session/load` invocation, and failure surfacing without losing the sidebar item.
