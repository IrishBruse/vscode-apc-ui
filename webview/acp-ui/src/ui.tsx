import type { RefObject } from "react";
import { createRoot } from "react-dom/client";
import type { ExtensionMessageAfterInit, InitPayload } from "./chatReducer";
import { AcpUiApp } from "./AcpUiApp";

export type { ExtensionMessageAfterInit, InitPayload } from "./chatReducer";

export type ChatView = {
    handleMessage(message: ExtensionMessageAfterInit): void;
};

/**
 * Mounts the ACP UI into `root`. Returns a view handle whose `handleMessage`
 * must be called for every non-init message received from the host.
 */
export function mountChatView(
    root: HTMLElement,
    init: InitPayload,
    postSend: (body: string) => void,
    postCancel: () => void,
    postResetSession: () => void,
    postSetSessionModel: (modelId: string) => void,
    postSavePromptHistory: (entries: string[]) => void,
    postPermissionResponse: (
        payload:
            | { requestId: string; selectedOptionId: string }
            | { requestId: string; cancelled: true },
    ) => void,
): ChatView {
    root.replaceChildren();
    root.className = "root agent-root";
    const extensionDispatchRef: RefObject<
        ((message: ExtensionMessageAfterInit) => void) | null
    > = {
        current: null,
    };
    const reactRoot = createRoot(root);
    reactRoot.render(
        <AcpUiApp
            init={init}
            postSend={postSend}
            postCancel={postCancel}
            postResetSession={postResetSession}
            postSetSessionModel={postSetSessionModel}
            postSavePromptHistory={postSavePromptHistory}
            postPermissionResponse={postPermissionResponse}
            extensionDispatchRef={extensionDispatchRef}
        />,
    );
    return {
        handleMessage(message: ExtensionMessageAfterInit): void {
            extensionDispatchRef.current?.(message);
        },
    };
}
