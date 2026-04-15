export function shouldCancelRunOnCtrlC(args: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    hasSelection: boolean;
    promptInFlight: boolean;
}): boolean {
    return (
        args.key.toLowerCase() === "c" &&
        args.ctrlKey &&
        !args.metaKey &&
        !args.altKey &&
        !args.shiftKey &&
        !args.hasSelection &&
        args.promptInFlight
    );
}
