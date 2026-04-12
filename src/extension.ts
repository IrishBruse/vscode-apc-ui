import type { ExtensionContext } from "vscode";
import { activateIbAcpExtension } from "./extension/activateIbAcp";
import { setIbAcpExtensionActivation } from "./extension/extensionServices";
import { registerIbChatPanel } from "./extension/ibChatPanel";
import { IbChatSessionsViewProvider } from "./extension/ibChatSessionsView";

/** Composition root: shared ACP services, IB Chat webview, and commands. */
export function activate(context: ExtensionContext): void {
    setIbAcpExtensionActivation(activateIbAcpExtension(context));
    const refreshChatsList = IbChatSessionsViewProvider.activate(context);
    registerIbChatPanel(context, refreshChatsList);
}

export function deactivate(): void {}
