import { randomUUID } from "node:crypto";
import type { ExtensionContext } from "vscode";

/**
 * One saved ACP UI session listed in the Chats tree.
 */
export type AcpUiSessionRecord = {
    id: string;
    title: string;
    updatedAt: number;
    agentName?: string;
    sessionId?: string;
};

export type StoredChatItem = {
    id: string;
    title: string;
    agentName: string;
    sessionId: string;
    updatedAt: number;
};

const chatsStorageKey = "acpUi.chats.v1";
const sessions: AcpUiSessionRecord[] = [];
let activeId: string | null = null;
let extensionContext: ExtensionContext | null = null;
let logWarn: ((message: string) => void) | null = null;

function persistSessions(): void {
    if (extensionContext === null) {
        return;
    }
    const payload: StoredChatItem[] = sessions
        .filter(
            (
                row,
            ): row is AcpUiSessionRecord & {
                agentName: string;
                sessionId: string;
            } =>
                typeof row.agentName === "string" &&
                row.agentName.length > 0 &&
                typeof row.sessionId === "string" &&
                row.sessionId.length > 0,
        )
        .map((row) => ({
            id: row.id,
            title: row.title,
            agentName: row.agentName,
            sessionId: row.sessionId,
            updatedAt: row.updatedAt,
        }));
    void extensionContext.globalState.update(chatsStorageKey, payload);
}

function markUpdated(sessionId: string): void {
    const row = sessions.find((s) => s.id === sessionId);
    if (row === undefined) {
        return;
    }
    row.updatedAt = Date.now();
    persistSessions();
}

/**
 * Initializes in-memory chats from extension global state.
 */
export function initializeAcpUiSessionsStore(
    context: ExtensionContext,
    options?: { log?: (message: string) => void },
): void {
    extensionContext = context;
    logWarn = options?.log ?? null;
    sessions.length = 0;
    activeId = null;
    const raw = context.globalState.get<unknown>(chatsStorageKey);
    const restored = parseStoredChatItems(raw);
    if (restored === null) {
        logWarn?.(
            "Ignored malformed persisted chat storage at acpUi.chats.v1; starting with an empty chats list.",
        );
        void context.globalState.update(chatsStorageKey, []);
        return;
    }
    sessions.push(
        ...restored.map((row) => ({
            id: row.id,
            title: row.title,
            updatedAt: row.updatedAt,
            agentName: row.agentName,
            sessionId: row.sessionId,
        })),
    );
    activeId = sessions[0]?.id ?? null;
}

export function parseStoredChatItems(raw: unknown): StoredChatItem[] | null {
    if (!Array.isArray(raw)) {
        return raw === undefined ? [] : null;
    }
    const out: StoredChatItem[] = [];
    for (const item of raw) {
        if (item === null || typeof item !== "object") {
            return null;
        }
        const row = item as Record<string, unknown>;
        if (
            typeof row.id !== "string" ||
            row.id.length === 0 ||
            typeof row.title !== "string" ||
            row.title.trim().length === 0 ||
            typeof row.agentName !== "string" ||
            row.agentName.length === 0 ||
            typeof row.sessionId !== "string" ||
            row.sessionId.length === 0 ||
            typeof row.updatedAt !== "number" ||
            !Number.isFinite(row.updatedAt)
        ) {
            return null;
        }
        out.push({
            id: row.id,
            title: row.title.trim(),
            agentName: row.agentName,
            sessionId: row.sessionId,
            updatedAt: row.updatedAt,
        });
    }
    return out;
}

/**
 * Returns sessions by most-recent activity first.
 */
export function listAcpUiSessions(): AcpUiSessionRecord[] {
    return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Returns the session id currently selected in the Chats list, if any.
 */
export function getActiveAcpUiSessionId(): string | null {
    return activeId;
}

/**
 * Marks a session as active for the Chats tree.
 */
export function setActiveAcpUiSessionId(id: string | null): void {
    activeId = id;
}

/**
 * Appends a new session and returns it.
 */
export function addAcpUiSession(
    title: string,
    options?: { agentName?: string },
): AcpUiSessionRecord {
    const now = Date.now();
    const record: AcpUiSessionRecord = {
        id: randomUUID(),
        title,
        updatedAt: now,
        agentName: options?.agentName,
    };
    sessions.push(record);
    persistSessions();
    return record;
}

/**
 * Removes a session by id and clears active selection when it pointed at that id.
 */
export function removeAcpUiSession(id: string): void {
    const index = sessions.findIndex((s) => s.id === id);
    if (index >= 0) {
        sessions.splice(index, 1);
    }
    if (activeId === id) {
        activeId = sessions[0]?.id ?? null;
    }
    persistSessions();
}

/**
 * Updates the stored ACP agent name for a session (for example when the user picks another agent in the editor).
 */
export function setAcpUiSessionAgentName(id: string, agentName: string): void {
    const row = sessions.find((s) => s.id === id);
    if (row !== undefined) {
        row.agentName = agentName;
        row.updatedAt = Date.now();
        persistSessions();
    }
}

/**
 * Stores ACP runtime session id for later restore attempts.
 */
export function setAcpUiSessionRuntimeSessionId(
    id: string,
    sessionId: string,
): void {
    const row = sessions.find((s) => s.id === id);
    if (row !== undefined) {
        row.sessionId = sessionId;
        row.updatedAt = Date.now();
        persistSessions();
    }
}

/**
 * Marks a session as recently used.
 */
export function touchAcpUiSession(id: string): void {
    markUpdated(id);
}

/**
 * Renames a session title.
 * Returns true when the session exists and a non-empty title was applied.
 */
export function renameAcpUiSession(id: string, nextTitle: string): boolean {
    const row = sessions.find((s) => s.id === id);
    const title = nextTitle.trim();
    if (row === undefined || title.length === 0) {
        return false;
    }
    row.title = title;
    row.updatedAt = Date.now();
    persistSessions();
    return true;
}
