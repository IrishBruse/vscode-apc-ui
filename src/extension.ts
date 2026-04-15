import type { ExtensionContext } from "vscode";
import { registerAcpUiPanel } from "./extension/acpUiPanel";
import { initializeAcpUiSessionsStore } from "./extension/acpUiSessionsStore";
import { AcpUiSessionsViewProvider } from "./extension/acpUiSessionsView";
import { activateAcpUiExtension } from "./extension/activateAcpUiExtension";
import { setAcpUiExtensionActivation } from "./extension/extensionServices";

/** Composition root: shared ACP services, ACP UI webview, and commands. */
export function activate(context: ExtensionContext): void {
    const activation = activateAcpUiExtension(context);
    setAcpUiExtensionActivation(activation);
    initializeAcpUiSessionsStore(context, {
        log: (message) => activation.outputChannel.appendLine(message),
    });
    const refreshChatsList = AcpUiSessionsViewProvider.activate(context);
    registerAcpUiPanel(context, refreshChatsList);
}

export function deactivate(): void {}
