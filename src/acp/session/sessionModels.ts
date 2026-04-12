import type { ModelInfo, SessionModelState } from "@agentclientprotocol/sdk";

/**
 * Serializable model list for a chat UI. Matches `models` on `session/new` in standalone mocks.
 */
export type IbChatSessionModelSelection = {
    currentModelId: string;
    availableModels: Array<Pick<ModelInfo, "modelId" | "name">>;
};

/**
 * Converts agent `SessionModelState` to the webview payload shape.
 */
export function sessionModelStateToIbChatSelection(
    state: SessionModelState,
): IbChatSessionModelSelection {
    return {
        currentModelId: state.currentModelId,
        availableModels: state.availableModels.map((m) => ({
            modelId: m.modelId,
            name: m.name,
        })),
    };
}
