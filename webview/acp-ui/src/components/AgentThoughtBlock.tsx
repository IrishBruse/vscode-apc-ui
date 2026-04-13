import type { ReactElement } from "react";
import "./AgentThoughtBlock.css";

function durationLabel(durationMs: number | undefined): string {
    if (durationMs === undefined || !Number.isFinite(durationMs) || durationMs < 0) {
        return "Thought";
    }
    return `Thought for ${Math.round(durationMs)}ms`;
}

/**
 * Renders a compact model-thought chunk as a dim terminal-style block.
 */
export function AgentThoughtBlock({
    text,
    durationMs,
}: {
    text: string;
    durationMs?: number;
}): ReactElement {
    return (
        <section className="agent-thought-chunk" aria-label="Agent thought">
            <div className="agent-thought-chunk-title">{durationLabel(durationMs)}</div>
            <pre className="agent-thought-chunk-body">{text}</pre>
        </section>
    );
}
