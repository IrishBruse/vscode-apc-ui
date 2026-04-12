import type { IbChatSessionModelSelection } from "../acp/session/sessionModels";

/** Plan entry forwarded from an ACP agent plan update. */
export type PlanEntry = {
    content: string;
    status: string;
    priority?: string;
};

/** Tool call status forwarded from ACP. */
export type ToolCallStatus = "pending" | "in_progress" | "completed" | "failed";

/** Line-level diff for tool output (git-style presentation in a webview). */
export type ToolCallDiffRow = {
    kind: "removed" | "added" | "context";
    text: string;
};

/** Slash commands advertised by the agent via `available_commands_update`. */
export type IbChatSlashCommand = {
    name: string;
    description: string;
    inputHint?: string;
    /** Origin label from the agent (for example user, global, workspace). */
    source?: string;
};

/**
 * Messages sent from a webview (or other UI host) to the extension host.
 */
export type WebviewToExtensionMessage =
    | { type: "ready" }
    | { type: "send"; body: string }
    | { type: "cancel" }
    | { type: "setSessionModel"; modelId: string }
    | { type: "setSessionAgent"; agentName: string }
    | {
          type: "permissionResponse";
          requestId: string;
          selectedOptionId: string;
      }
    | { type: "permissionResponse"; requestId: string; cancelled: true }
    /** Persists composer Arrow Up / Down prompt history for this session. */
    | { type: "savePromptHistory"; entries: string[] };

/**
 * Messages sent from the extension host to a webview (or other UI host).
 */
export type ExtensionToWebviewMessage =
    | {
          type: "init";
          sessionId: string;
          title: string;
          workspaceLabel?: string;
          agentVersionLabel?: string;
          acpAgentName?: string;
          /** Display names from `ib-acp.agents` for the agent picker. */
          availableAcpAgents?: string[];
          /** Optional `--vscode-*` overrides applied on `document.documentElement`. */
          vscodeThemeVariables?: Record<string, string>;
          sessionModels?: IbChatSessionModelSelection;
          promptHistory?: string[];
      }
    | {
          type: "sessionModels";
          currentModelId: string;
          availableModels: IbChatSessionModelSelection["availableModels"];
      }
    | {
          type: "acpAgentSelection";
          currentAgentName: string;
          availableAgentNames: string[];
      }
    | { type: "appendAgentText"; text: string }
    | {
          type: "appendToolCall";
          toolCallId: string;
          title: string;
          kind?: string;
          status?: ToolCallStatus;
          subtitle?: string;
      }
    | {
          type: "updateToolCall";
          toolCallId: string;
          status: ToolCallStatus;
          content?: string;
          subtitle?: string;
          diffRows?: ToolCallDiffRow[];
          /** From ACP `tool_call_update` when the agent omits an initial `tool_call` (e.g. Gemini CLI). */
          kind?: string;
      }
    | {
          type: "permissionRequest";
          requestId: string;
          toolTitle: string;
          options: { optionId: string; name: string }[];
      }
    | { type: "slashCommands"; commands: IbChatSlashCommand[] }
    | { type: "appendPlan"; entries: PlanEntry[] }
    | { type: "turnComplete"; stopReason: string }
    | { type: "error"; message: string };

/**
 * True when `raw` is a non-null object (`typeof null === "object"` is excluded).
 */
export function isPotentiallyExtensionPostMessageData(
    raw: unknown,
): raw is Record<string, unknown> {
    return raw !== null && typeof raw === "object";
}

/**
 * Parses an untrusted `postMessage` payload from a webview.
 */
export function tryParseWebviewMessage(
    raw: unknown,
): WebviewToExtensionMessage | null {
    if (raw === null || typeof raw !== "object") {
        return null;
    }
    const record = raw as Record<string, unknown>;
    const messageType = record.type;
    if (messageType === "ready") {
        return { type: "ready" };
    }
    if (messageType === "send" && typeof record.body === "string") {
        return { type: "send", body: record.body };
    }
    if (messageType === "cancel") {
        return { type: "cancel" };
    }
    if (
        messageType === "setSessionModel" &&
        typeof record.modelId === "string" &&
        record.modelId.length > 0
    ) {
        return { type: "setSessionModel", modelId: record.modelId };
    }
    if (
        messageType === "setSessionAgent" &&
        typeof record.agentName === "string" &&
        record.agentName.length > 0
    ) {
        return { type: "setSessionAgent", agentName: record.agentName };
    }
    if (
        messageType === "permissionResponse" &&
        typeof record.requestId === "string" &&
        record.requestId.length > 0
    ) {
        if (record.cancelled === true) {
            return {
                type: "permissionResponse",
                requestId: record.requestId,
                cancelled: true,
            };
        }
        if (
            typeof record.selectedOptionId === "string" &&
            record.selectedOptionId.length > 0
        ) {
            return {
                type: "permissionResponse",
                requestId: record.requestId,
                selectedOptionId: record.selectedOptionId,
            };
        }
    }
    if (messageType === "savePromptHistory" && Array.isArray(record.entries)) {
        const entries: string[] = [];
        for (const item of record.entries) {
            if (typeof item !== "string") {
                continue;
            }
            entries.push(item);
            if (entries.length >= 55) {
                break;
            }
        }
        return { type: "savePromptHistory", entries };
    }
    return null;
}
