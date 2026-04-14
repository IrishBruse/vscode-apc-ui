import type { ModelInfo, SessionModelState } from "@agentclientprotocol/sdk";

/**
 * Serializable model list for a chat UI. Matches `models` on `session/new` in standalone mocks.
 */
export type AcpUiSessionModelSelection = {
    currentModelId: string;
    availableModels: Array<Pick<ModelInfo, "modelId" | "name">>;
};

/**
 * Converts agent `SessionModelState` to the webview payload shape.
 */
export function sessionModelStateToAcpUiSelection(
    state: SessionModelState,
): AcpUiSessionModelSelection {
    return {
        currentModelId: state.currentModelId,
        availableModels: state.availableModels.map((m) => ({
            modelId: m.modelId,
            name: m.name,
        })),
    };
}
