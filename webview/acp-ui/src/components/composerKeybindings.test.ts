import { describe, expect, it } from "vitest";
import { shouldCancelRunOnCtrlC } from "./composerKeybindings";

describe("shouldCancelRunOnCtrlC", () => {
    it("cancels when in-flight and no selection", () => {
        expect(
            shouldCancelRunOnCtrlC({
                key: "c",
                ctrlKey: true,
                metaKey: false,
                altKey: false,
                shiftKey: false,
                hasSelection: false,
                promptInFlight: true,
            }),
        ).toBe(true);
    });

    it("does not cancel when text is selected", () => {
        expect(
            shouldCancelRunOnCtrlC({
                key: "c",
                ctrlKey: true,
                metaKey: false,
                altKey: false,
                shiftKey: false,
                hasSelection: true,
                promptInFlight: true,
            }),
        ).toBe(false);
    });
});
