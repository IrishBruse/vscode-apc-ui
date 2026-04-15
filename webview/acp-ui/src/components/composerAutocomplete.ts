export type ComposerSuggestionItem = {
    key: string;
    primary: string;
    secondary?: string;
    insertText: string;
};

export type ComposerAutocompleteState = {
    mode: "slash" | "file";
    query: string;
    items: ComposerSuggestionItem[];
    activeIndex: number;
};

function formatPathMention(path: string): string {
    return /[\s\n"]/.test(path) ? `@"${path.replace(/"/g, '\\"')}"` : `@${path}`;
}

function queryFromCaret(draft: string, caret: number, prefix: "/" | "@"): string | null {
    const left = draft.slice(0, caret);
    const lineStart = left.lastIndexOf("\n") + 1;
    const fragment = left.slice(lineStart);
    const escaped = prefix === "/" ? "\\/" : "@";
    const match = fragment.match(new RegExp(`(?:^|\\s)${escaped}([^\\s]*)$`));
    if (match === null) {
        return null;
    }
    return match[1] ?? "";
}

export function buildComposerAutocompleteState(args: {
    draft: string;
    caret: number;
    slashCommands: Array<{ name: string; description: string; source?: string }>;
    workspaceFiles: string[];
}): ComposerAutocompleteState | null {
    const slashQuery = queryFromCaret(args.draft, args.caret, "/");
    if (slashQuery !== null) {
        const queryLower = slashQuery.toLowerCase();
        const items = args.slashCommands
            .filter((command) => command.name.toLowerCase().startsWith(queryLower))
            .map((command) => ({
                key: `slash:${command.name}`,
                primary: `/${command.name}`,
                secondary: command.description,
                insertText: `/${command.name} `,
                source: command.source,
            }))
            .map(({ source, ...item }) => ({
                ...item,
                ...(source !== undefined ? { secondary: `${item.secondary} · ${source}` } : {}),
            }));
        return items.length > 0
            ? { mode: "slash", query: slashQuery, items, activeIndex: 0 }
            : null;
    }
    const fileQuery = queryFromCaret(args.draft, args.caret, "@");
    if (fileQuery === null) {
        return null;
    }
    const queryLower = fileQuery.toLowerCase();
    const items = args.workspaceFiles
        .filter((filePath) => filePath.toLowerCase().includes(queryLower))
        .slice(0, 30)
        .map((filePath) => ({
            key: `file:${filePath}`,
            primary: filePath,
            insertText: `${formatPathMention(filePath)} `,
        }));
    return items.length > 0
        ? { mode: "file", query: fileQuery, items, activeIndex: 0 }
        : null;
}

export function wrapIndex(index: number, size: number): number {
    if (size <= 0) {
        return 0;
    }
    const mod = index % size;
    return mod < 0 ? mod + size : mod;
}
