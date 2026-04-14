import { randomUUID } from "node:crypto";

/**
 * One saved ACP UI session listed in the Chats tree (in-memory until persistence exists).
 */
export type AcpUiSessionRecord = {
    id: string;
    title: string;
    createdAt: number;
    agentName?: string;
};

const sessions: AcpUiSessionRecord[] = [];

let activeId: string | null = null;

/**
 * Returns sessions in creation order (oldest first).
 */
export function listAcpUiSessions(): AcpUiSessionRecord[] {
    return [...sessions].sort((a, b) => a.createdAt - b.createdAt);
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
    const record: AcpUiSessionRecord = {
        id: randomUUID(),
        title,
        createdAt: Date.now(),
        agentName: options?.agentName,
    };
    sessions.push(record);
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
}

/**
 * Updates the stored ACP agent name for a session (for example when the user picks another agent in the editor).
 */
export function setAcpUiSessionAgentName(id: string, agentName: string): void {
    const row = sessions.find((s) => s.id === id);
    if (row !== undefined) {
        row.agentName = agentName;
    }
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
    return true;
}
