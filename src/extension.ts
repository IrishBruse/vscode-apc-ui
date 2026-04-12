import type { ExtensionContext } from "vscode";
import { activateIbAcpExtension } from "./extension/activateIbAcp";
import { setIbAcpExtensionActivation } from "./extension/extensionServices";
import { registerIbChatPanel } from "./extension/ibChatPanel";

/** Composition root: shared ACP services, IB Chat webview, and commands. */
export function activate(context: ExtensionContext): void {
    setIbAcpExtensionActivation(activateIbAcpExtension(context));
    registerIbChatPanel(context);
}

export function deactivate(): void {}
