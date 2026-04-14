import {
  type KeyboardEvent,
  type ReactElement,
  type RefObject,
  useMemo,
} from "react";
import "./ChatComposer.css";
import type { AcpUiSessionModelSelection } from "../../../../src/acp/session/sessionModels";
import type { AcpUiSlashCommand } from "../../../../src/protocol/extensionHostMessages";

export type ChatComposerProps = {
  activityLabel: string | null;
  /** Shown in the activity slot when nothing is in flight (e.g. workspace cwd). */
  workspacePathHint: string;
  modelSelection: AcpUiSessionModelSelection | null;
  /** When true, model is shown as a label (standalone: after the first message). */
  modelPickerLocked: boolean;
  promptInFlight: boolean;
  /** When set, blocks the textarea (e.g. pending permission dialog). */
  inputBlocked: boolean;
  slashCommands: AcpUiSlashCommand[];
  draft: string;
  onDraftChange: (value: string) => void;
  onPickSessionModel: (modelId: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Focus target after external inserts (e.g. file drop). */
  composerInputRef?: RefObject<HTMLTextAreaElement | null>;
};

/**
 * Activity hint, optional model picker, message input, and send/cancel actions.
 */
export function ChatComposer({
  activityLabel,
  workspacePathHint,
  modelSelection,
  modelPickerLocked,
  promptInFlight,
  inputBlocked,
  slashCommands,
  draft,
  onDraftChange,
  onPickSessionModel,
  onSubmit,
  onCancel,
  onKeyDown,
  composerInputRef,
}: ChatComposerProps): ReactElement {
  const textareaDisabled = promptInFlight || inputBlocked;
  const slashQuery = useMemo(() => {
    const line = draft.split("\n")[0] ?? "";
    const match = line.match(/^\/([\w-]*)$/);
    if (match === null || slashCommands.length === 0) {
      return null;
    }
    return match[1] ?? "";
  }, [draft, slashCommands]);
  const slashMatches = useMemo(() => {
    if (slashQuery === null) {
      return [];
    }
    const q = slashQuery.toLowerCase();
    return slashCommands.filter((c) => c.name.toLowerCase().startsWith(q));
  }, [slashQuery, slashCommands]);
  const showSlashMenu = slashMatches.length > 0 && slashQuery !== null;
  const modelSel = modelSelection;
  const modelReady = modelSel !== null && modelSel.availableModels.length > 0;
  const modelSelectDisabled =
    modelPickerLocked || textareaDisabled || !modelReady;
  const modelLabel =
    modelReady && modelSel !== null
      ? (modelSel.availableModels.find(
          (m) => m.modelId === modelSel.currentModelId,
        )?.name ?? modelSel.currentModelId)
      : "";

  const inflight =
    activityLabel !== null && activityLabel.length > 0;
  const activityDisplay = inflight ? activityLabel : workspacePathHint;

  return (
    <footer className="composer-frame">
      <div className="composer-top-bar">
        <div
          className={
            inflight
              ? "composer-activity composer-activity--inflight"
              : "composer-activity"
          }
          role="status"
          aria-live="polite"
          title={inflight ? undefined : workspacePathHint}
        >
          {activityDisplay}
        </div>
        <div className="composer-top-bar-right">
          <span className="composer-inline-label">Model</span>
          {modelPickerLocked ? (
            <span
              className="composer-pick-value"
              title={modelLabel}
              aria-label={`Model: ${modelLabel}`}
            >
              {modelLabel.length > 0 ? modelLabel : "\u2014"}
            </span>
          ) : (
            <select
              id="acp-ui-model-select"
              className="composer-model-select"
              aria-label="Model"
              value={
                modelReady && modelSel !== null ? modelSel.currentModelId : ""
              }
              disabled={modelSelectDisabled}
              onChange={(e) => {
                onPickSessionModel(e.target.value);
              }}
            >
              {modelReady && modelSel !== null ? (
                modelSel.availableModels.map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {"\u2014"}
                </option>
              )}
            </select>
          )}
        </div>
      </div>
      <div className="composer-input-wrap">
        {showSlashMenu ? (
          <div
            className="composer-slash-menu"
            role="listbox"
            aria-label="Slash commands"
          >
            {slashMatches.map((cmd) => (
              <button
                key={cmd.name}
                type="button"
                role="option"
                className="composer-slash-item"
                onClick={() => {
                  onDraftChange(`/${cmd.name} `);
                }}
              >
                <span className="composer-slash-name">/{cmd.name}</span>
                <span className="composer-slash-desc">{cmd.description}</span>
                {cmd.source !== undefined && cmd.source.length > 0 ? (
                  <span className="composer-slash-source" title={cmd.source}>
                    {cmd.source}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        <textarea
          ref={composerInputRef}
          className="composer-input"
          placeholder="Describe a task for the agent to do..."
          aria-label="Agent input"
          title="Enter to send. Shift+Enter for newline. Arrow up and down for prompt history."
          rows={2}
          value={draft}
          disabled={textareaDisabled}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="composer-footer">
        <span className="composer-footer-hint-left">
          / commands · @ files (Hold shift to drop)
        </span>
        <button
          type="button"
          className="composer-cancel"
          disabled={!promptInFlight}
          onClick={() => onCancel()}
        >
          Cancel
        </button>
        <button
          type="button"
          className="composer-send"
          disabled={textareaDisabled}
          onClick={() => onSubmit()}
        >
          Send
        </button>
      </div>
    </footer>
  );
}
