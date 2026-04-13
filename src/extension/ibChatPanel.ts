import {
    type ExtensionContext,
    ViewColumn,
    type WebviewPanel,
    window,
    workspace,
} from "vscode";
import {
    type AcpAgentConfig,
    getAcpAgentConfigByName,
    getAcpAgentConfigsFromSettings,
} from "../acp/config/vscodeSettingsAgents";
import { AcpSessionBridge } from "../acp/session/acpSessionBridge";
import { createDefaultAcpSessionHostRuntime } from "../platform/vscode/defaultHostRuntime";
import type { ExtensionToWebviewMessage } from "../protocol/extensionHostMessages";
import { tryParseWebviewMessage } from "../protocol/extensionHostMessages";
import { registerCommandIB } from "../utils/vscode";
import { getIbAcpExtensionActivation } from "./extensionServices";
import { pickAcpAgentConfig } from "./ibChatAgentPicker";
import {
    getIbChatPromptHistoryEntries,
    setIbChatPromptHistoryEntries,
} from "./ibChatPromptHistoryMemento";
import {
    addIbChatSession,
    listIbChatSessions,
    setActiveIbChatSessionId,
    setIbChatSessionAgentName,
} from "./ibChatSessionsStore";
import { getIbChatWebviewHtml } from "./ibChatWebviewShell";

const editorViewType = "ibAcpIbChatEditor";

const panelsBySessionId = new Map<string, WebviewPanel>();
const bridgesBySessionId = new Map<string, AcpSessionBridge>();
const pendingModelIdBySessionId = new Map<string, string>();
const agentConfigBySessionId = new Map<string, AcpAgentConfig | undefined>();

function disposeBridgeForSession(sessionId: string): void {
    const bridge = bridgesBySessionId.get(sessionId);
    if (bridge !== undefined) {
        bridge.dispose();
        bridgesBySessionId.delete(sessionId);
    }
}

function postForSession(
    sessionId: string,
    msg: ExtensionToWebviewMessage,
): void {
    const panel = panelsBySessionId.get(sessionId);
    if (panel !== undefined) {
        void panel.webview.postMessage(msg);
    }
}

async function ensureBridgeConnected(
    sessionId: string,
): Promise<AcpSessionBridge | undefined> {
    const existing = bridgesBySessionId.get(sessionId);
    if (existing !== undefined) {
        return existing;
    }
    const config =
        agentConfigBySessionId.get(sessionId) ??
        getAcpAgentConfigsFromSettings()[0];
    if (config === undefined) {
        postForSession(sessionId, {
            type: "error",
            message:
                "No ACP agents configured. Add entries to the ib-acp.agents setting (name, command, optional args).",
        });
        return undefined;
    }
    const { rpcNdjsonSink } = getIbAcpExtensionActivation();
    const host = createDefaultAcpSessionHostRuntime(rpcNdjsonSink);
    const bridge = new AcpSessionBridge(
        config,
        (msg) => postForSession(sessionId, msg),
        host,
    );
    bridgesBySessionId.set(sessionId, bridge);
    const preferred = pendingModelIdBySessionId.get(sessionId);
    pendingModelIdBySessionId.delete(sessionId);
    try {
        await bridge.connect(preferred);
        return bridge;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        postForSession(sessionId, {
            type: "error",
            message: `Failed to connect to agent: ${message}`,
        });
        bridge.dispose();
        bridgesBySessionId.delete(sessionId);
        return undefined;
    }
}

/**
 * Reveals an existing editor webview for the session or creates one with the given title.
 */
export function openOrRevealIbChatEditor(
    context: ExtensionContext,
    sessionId: string,
    title: string,
    agentConfig?: AcpAgentConfig,
): void {
    const existing = panelsBySessionId.get(sessionId);
    if (existing !== undefined) {
        existing.reveal(ViewColumn.Active);
        return;
    }
    agentConfigBySessionId.set(sessionId, agentConfig);
    const panel = window.createWebviewPanel(
        editorViewType,
        title,
        ViewColumn.Active,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [context.extensionUri],
        },
    );
    panel.webview.html = getIbChatWebviewHtml(
        context.extensionUri,
        panel.webview,
    );

    const post = (msg: ExtensionToWebviewMessage): void => {
        void panel.webview.postMessage(msg);
    };

    panel.webview.onDidReceiveMessage((message: unknown) => {
        const parsed = tryParseWebviewMessage(message);
        if (parsed === null) {
            return;
        }

        if (parsed.type === "ready") {
            const pkg = context.extension.packageJSON as { version?: string };
            const versionRaw = pkg.version;
            const agentVersionLabel =
                typeof versionRaw === "string" && versionRaw.length > 0
                    ? `v${versionRaw}`
                    : undefined;
            const folder = workspace.workspaceFolders?.[0];
            const workspaceLabel =
                folder !== undefined ? folder.uri.fsPath : undefined;
            const configs = getAcpAgentConfigsFromSettings();
            const availableNames = configs.map((c) => c.name);
            const defaultAgent = agentConfig ?? configs[0];
            const promptHistory = getIbChatPromptHistoryEntries(
                context,
                sessionId,
            );
            const initPayload: ExtensionToWebviewMessage = {
                type: "init",
                sessionId,
                title,
                workspaceLabel,
                agentVersionLabel,
                acpAgentName: defaultAgent?.name,
                lockSessionAgent: true,
                ...(availableNames.length > 0
                    ? { availableAcpAgents: availableNames }
                    : {}),
                ...(promptHistory.length > 0 ? { promptHistory } : {}),
            };
            void Promise.resolve().then(() => {
                void post(initPayload);
                void ensureBridgeConnected(sessionId);
            });
            return;
        }

        if (parsed.type === "resetSession") {
            disposeBridgeForSession(sessionId);
            pendingModelIdBySessionId.delete(sessionId);
            post({ type: "sessionReset" });
            void ensureBridgeConnected(sessionId);
            return;
        }

        if (parsed.type === "savePromptHistory") {
            setIbChatPromptHistoryEntries(context, sessionId, parsed.entries);
            return;
        }

        if (parsed.type === "send") {
            void (async () => {
                const b = await ensureBridgeConnected(sessionId);
                if (b !== undefined) {
                    await b.prompt(parsed.body);
                }
            })();
            return;
        }

        if (parsed.type === "cancel") {
            void bridgesBySessionId.get(sessionId)?.cancel();
            return;
        }

        if (parsed.type === "setSessionModel") {
            void (async () => {
                const b = bridgesBySessionId.get(sessionId);
                if (b !== undefined) {
                    try {
                        await b.setSessionModel(parsed.modelId);
                    } catch (err: unknown) {
                        const msg =
                            err instanceof Error ? err.message : String(err);
                        post({
                            type: "error",
                            message: `Model change failed: ${msg}`,
                        });
                    }
                } else {
                    pendingModelIdBySessionId.set(sessionId, parsed.modelId);
                }
            })();
            return;
        }

        if (parsed.type === "setSessionAgent") {
            const config = getAcpAgentConfigByName(parsed.agentName);
            if (config === undefined) {
                post({
                    type: "error",
                    message: `Unknown agent: ${parsed.agentName}`,
                });
                return;
            }
            agentConfigBySessionId.set(sessionId, config);
            setIbChatSessionAgentName(sessionId, config.name);
            disposeBridgeForSession(sessionId);
            pendingModelIdBySessionId.delete(sessionId);
            const names = getAcpAgentConfigsFromSettings().map((c) => c.name);
            post({
                type: "acpAgentSelection",
                currentAgentName: config.name,
                availableAgentNames: names,
            });
            void ensureBridgeConnected(sessionId);
            return;
        }

        if (parsed.type === "permissionResponse") {
            bridgesBySessionId.get(sessionId)?.handlePermissionResponse(parsed);
        }
    });

    panel.onDidDispose(() => {
        panelsBySessionId.delete(sessionId);
        agentConfigBySessionId.delete(sessionId);
        disposeBridgeForSession(sessionId);
        pendingModelIdBySessionId.delete(sessionId);
    });

    panelsBySessionId.set(sessionId, panel);
    context.subscriptions.push(panel);
}

/**
 * Closes the editor webview for a session if it is open.
 */
export function disposeIbChatEditorForSession(sessionId: string): void {
    const panel = panelsBySessionId.get(sessionId);
    panel?.dispose();
}

/**
 * Registers IB Chat commands. Pass {@link refreshChatsList} from {@link IbChatSessionsViewProvider.activate}
 * so new chats update the sidebar tree.
 */
export function registerIbChatPanel(
    context: ExtensionContext,
    refreshChatsList: () => void,
): void {
    registerCommandIB(
        "ib-acp.openChat",
        () => void openNewIbChat(context, refreshChatsList),
        context,
    );
    registerCommandIB(
        "ib-acp.newIbChatInEditor",
        () => void openNewIbChat(context, refreshChatsList),
        context,
    );
}

async function openNewIbChat(
    context: ExtensionContext,
    refreshChatsList: () => void,
): Promise<void> {
    const agentConfig = await pickAcpAgentConfig();
    if (agentConfig === undefined) {
        return;
    }
    const nextIndex = listIbChatSessions().length + 1;
    const created = addIbChatSession(`Chat ${nextIndex}`, {
        agentName: agentConfig.name,
    });
    setActiveIbChatSessionId(created.id);
    openOrRevealIbChatEditor(context, created.id, created.title, agentConfig);
    refreshChatsList();
}
