import type { ExtensionContext } from "vscode";
import { activateIbAcpExtension } from "./extension/activateIbAcp";
import { setIbAcpExtensionActivation } from "./extension/extensionServices";

/** Composition root: registers shared ACP services (RPC log, NDJSON file). */
export function activate(context: ExtensionContext): void {
    setIbAcpExtensionActivation(activateIbAcpExtension(context));
}

export function deactivate(): void {}
