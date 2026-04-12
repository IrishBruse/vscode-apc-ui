import { randomUUID } from "node:crypto";
import {
    type ExtensionContext,
    ViewColumn,
    type WebviewPanel,
    window,
    workspace,
} from "vscode";
import {
    getAcpAgentConfigByName,
    getAcpAgentConfigsFromSettings,
} from "../acp/config/vscodeSettingsAgents";
import { AcpSessionBridge } from "../acp/session/acpSessionBridge";
import { createDefaultAcpSessionHostRuntime } from "../platform/vscode/defaultHostRuntime";
import type { ExtensionToWebviewMessage } from "../protocol/extensionHostMessages";
import { tryParseWebviewMessage } from "../protocol/extensionHostMessages";
import { registerCommandIB } from "../utils/vscode";
import { getIbAcpExtensionActivation } from "./extensionServices";
import { getIbChatWebviewHtml } from "./ibChatWebviewShell";

const editorViewType = "ibAcpIbChatEditor";

let activePanel: WebviewPanel | undefined;
let activeSessionId: string | undefined;
let bridge: AcpSessionBridge | undefined;
let pendingModelId: string | undefined;
let selectedAgentName: string | undefined;

function disposeBridge(): void {
    if (bridge !== undefined) {
        bridge.dispose();
        bridge = undefined;
    }
}

function postToActivePanel(msg: ExtensionToWebviewMessage): void {
    if (activePanel !== undefined) {
        void activePanel.webview.postMessage(msg);
    }
}

async function ensureBridgeConnected(): Promise<AcpSessionBridge | undefined> {
    if (bridge !== undefined) {
        return bridge;
    }
    const configs = getAcpAgentConfigsFromSettings();
    const config =
        (selectedAgentName !== undefined
            ? getAcpAgentConfigByName(selectedAgentName)
            : undefined) ?? configs[0];
    if (config === undefined) {
        postToActivePanel({
            type: "error",
            message:
                "No ACP agents configured. Add entries to the ib-acp.agents setting (name, command, optional args).",
        });
        return undefined;
    }
    const { rpcNdjsonSink } = getIbAcpExtensionActivation();
    const host = createDefaultAcpSessionHostRuntime(rpcNdjsonSink);
    const next = new AcpSessionBridge(config, postToActivePanel, host);
    bridge = next;
    const preferred = pendingModelId;
    pendingModelId = undefined;
    try {
        await next.connect(preferred);
        return next;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        postToActivePanel({
            type: "error",
            message: `Failed to connect to agent: ${message}`,
        });
        disposeBridge();
        return undefined;
    }
}

/**
 * Registers **IB Chat: Open** and opens the editor tab backed by the same React bundle and
 * {@link AcpSessionBridge} as the standalone Vite app.
 */
export function registerIbChatPanel(context: ExtensionContext): void {
    registerCommandIB(
        "ib-acp.openChat",
        () => openIbChatPanel(context),
        context,
    );
}

export function openIbChatPanel(context: ExtensionContext): void {
    if (activePanel !== undefined) {
        activePanel.reveal(ViewColumn.Active);
        return;
    }
    const sessionId = randomUUID();
    activeSessionId = sessionId;
    const panel = window.createWebviewPanel(
        editorViewType,
        "IB Chat",
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
    activePanel = panel;
    wirePanel(context, panel);
    context.subscriptions.push(panel);
}

function wirePanel(context: ExtensionContext, panel: WebviewPanel): void {
    panel.onDidDispose(() => {
        if (activePanel === panel) {
            activePanel = undefined;
            activeSessionId = undefined;
        }
        disposeBridge();
    });

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
            const availableNames = getAcpAgentConfigsFromSettings().map(
                (c) => c.name,
            );
            const configs = getAcpAgentConfigsFromSettings();
            const defaultAgent = configs[0];
            if (selectedAgentName === undefined && defaultAgent !== undefined) {
                selectedAgentName = defaultAgent.name;
            }
            const initPayload: ExtensionToWebviewMessage = {
                type: "init",
                sessionId: activeSessionId ?? "ib-acp",
                title: "IB Chat",
                workspaceLabel,
                agentVersionLabel,
                acpAgentName: selectedAgentName,
                ...(availableNames.length > 0
                    ? { availableAcpAgents: availableNames }
                    : {}),
            };
            void Promise.resolve().then(() => {
                void panel.webview.postMessage(initPayload);
                void ensureBridgeConnected();
            });
            return;
        }

        if (parsed.type === "savePromptHistory") {
            return;
        }

        if (parsed.type === "send") {
            void (async () => {
                const b = await ensureBridgeConnected();
                if (b !== undefined) {
                    await b.prompt(parsed.body);
                }
            })();
            return;
        }

        if (parsed.type === "cancel") {
            void bridge?.cancel();
            return;
        }

        if (parsed.type === "setSessionModel") {
            void (async () => {
                if (bridge !== undefined) {
                    try {
                        await bridge.setSessionModel(parsed.modelId);
                    } catch (err: unknown) {
                        const message =
                            err instanceof Error ? err.message : String(err);
                        void panel.webview.postMessage({
                            type: "error",
                            message: `Model change failed: ${message}`,
                        });
                    }
                } else {
                    pendingModelId = parsed.modelId;
                }
            })();
            return;
        }

        if (parsed.type === "setSessionAgent") {
            const config = getAcpAgentConfigByName(parsed.agentName);
            if (config === undefined) {
                void panel.webview.postMessage({
                    type: "error",
                    message: `Unknown agent: ${parsed.agentName}`,
                });
                return;
            }
            selectedAgentName = config.name;
            disposeBridge();
            pendingModelId = undefined;
            const names = getAcpAgentConfigsFromSettings().map((c) => c.name);
            void panel.webview.postMessage({
                type: "acpAgentSelection",
                currentAgentName: config.name,
                availableAgentNames: names,
            });
            void ensureBridgeConnected();
            return;
        }

        if (parsed.type === "permissionResponse") {
            bridge?.handlePermissionResponse(parsed);
        }
    });
}
