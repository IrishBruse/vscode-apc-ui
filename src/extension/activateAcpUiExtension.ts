import {
    Disposable,
    type ExtensionContext,
    type OutputChannel,
    Uri,
    window,
} from "vscode";
import { VscodeAcpRpcNdjsonSink } from "../platform/vscode/vscodeRpcNdjsonSink";
import { registerCommandIB } from "../utils/vscode";

export type AcpUiExtensionActivation = {
    /** Shared between stdio taps and optional UI hosts that embed a bridge. */
    rpcNdjsonSink: VscodeAcpRpcNdjsonSink;
    outputChannel: OutputChannel;
};

/**
 * Registers the ACP RPC output channel, on-disk NDJSON log, and related commands.
 */
export function activateAcpUiExtension(
    context: ExtensionContext,
): AcpUiExtensionActivation {
    const outputChannel = window.createOutputChannel(
        "IrishBruse ACP RPC",
        "json",
    );
    const logUri = Uri.joinPath(
        context.globalStorageUri,
        "ib-acp-ui-rpc.ndjson",
    );
    const rpcNdjsonSink = new VscodeAcpRpcNdjsonSink(
        outputChannel,
        logUri.fsPath,
    );
    context.subscriptions.push(outputChannel);
    context.subscriptions.push(new Disposable(() => rpcNdjsonSink.dispose()));
    registerCommandIB(
        "ib-acp-ui.showAcpRpcLog",
        () => {
            outputChannel.show(true);
        },
        context,
    );
    return { rpcNdjsonSink, outputChannel };
}
