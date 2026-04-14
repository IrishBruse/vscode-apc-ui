import type { ExtensionContext } from "vscode";
import { registerAcpUiPanel } from "./extension/acpUiPanel";
import { AcpUiSessionsViewProvider } from "./extension/acpUiSessionsView";
import { activateIbAcpExtension } from "./extension/activateIbAcp";
import { setIbAcpExtensionActivation } from "./extension/extensionServices";

/** Composition root: shared ACP services, ACP UI webview, and commands. */
export function activate(context: ExtensionContext): void {
    setIbAcpExtensionActivation(activateIbAcpExtension(context));
    const refreshChatsList = AcpUiSessionsViewProvider.activate(context);
    registerAcpUiPanel(context, refreshChatsList);
}

export function deactivate(): void {}
