import type { ExtensionContext } from "vscode";
import { registerAcpUiPanel } from "./extension/acpUiPanel";
import { AcpUiSessionsViewProvider } from "./extension/acpUiSessionsView";
import { activateAcpUiExtension } from "./extension/activateAcpUiExtension";
import { setAcpUiExtensionActivation } from "./extension/extensionServices";

/** Composition root: shared ACP services, ACP UI webview, and commands. */
export function activate(context: ExtensionContext): void {
    setAcpUiExtensionActivation(activateAcpUiExtension(context));
    const refreshChatsList = AcpUiSessionsViewProvider.activate(context);
    registerAcpUiPanel(context, refreshChatsList);
}

export function deactivate(): void {}
