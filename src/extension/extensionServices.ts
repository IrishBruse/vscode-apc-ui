import type { IbAcpExtensionActivation } from "./activateIbAcp";

let activation: IbAcpExtensionActivation | undefined;

/** Called once from the extension `activate` function. */
export function setIbAcpExtensionActivation(
    next: IbAcpExtensionActivation,
): void {
    activation = next;
}

/**
 * Shared extension-host services (RPC NDJSON sink, output channel) for UI features that compose
 * `AcpSessionBridge` after migrating from `irishbruse-utilities`.
 */
export function getIbAcpExtensionActivation(): IbAcpExtensionActivation {
    if (activation === undefined) {
        throw new Error("ib-acp extension is not activated");
    }
    return activation;
}
