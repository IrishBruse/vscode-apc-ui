import {
    commands,
    type Event,
    EventEmitter,
    type ExtensionContext,
    ThemeIcon,
    type TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    window,
} from "vscode";
import {
    getAcpAgentConfigByName,
    getAcpAgentConfigsFromSettings,
} from "../acp/config/vscodeSettingsAgents";
import { registerCommandIB } from "../utils/vscode";
import {
    disposeAcpUiEditorForSession,
    openOrRevealAcpUiEditor,
} from "./acpUiPanel";
import { removeAcpUiPromptHistoryEntries } from "./acpUiPromptHistoryMemento";
import {
    type AcpUiSessionRecord,
    getActiveAcpUiSessionId,
    listAcpUiSessions,
    removeAcpUiSession,
    setActiveAcpUiSessionId,
} from "./acpUiSessionsStore";

const viewIdAcpUiSessions = "acpUiSessionsView";

const cmdFocusAcpUiSessions = "ib-acp-ui.focusAcpUiSessions";
const cmdRefreshAcpUiSessions = "ib-acp-ui.refreshAcpUiSessions";
const cmdOpenAcpUiSession = "ib-acp-ui.openAcpUiSession";
const cmdDeleteAcpUiSession = "ib-acp-ui.deleteAcpUiSession";

const iconChat = "comment-discussion";

type AcpUiSessionsTreeNode = AcpUiSessionTreeItem | AcpUiPlaceholderTreeItem;

class AcpUiPlaceholderTreeItem extends TreeItem {
    constructor() {
        super(
            "No chats yet — use New ACP UI in Editor above",
            TreeItemCollapsibleState.None,
        );
        this.contextValue = "placeholder";
        this.tooltip =
            "Use New ACP UI in Editor on the Chats view title to create a chat";
    }
}

class AcpUiSessionTreeItem extends TreeItem {
    constructor(
        public readonly sessionId: string,
        label: string,
        isActive: boolean,
    ) {
        super(label, TreeItemCollapsibleState.None);
        this.contextValue = "session";
        this.description = isActive ? "active" : undefined;
        this.tooltip = label;
        this.iconPath = new ThemeIcon(iconChat);
        this.command = {
            title: "Open Chat",
            command: cmdOpenAcpUiSession,
            arguments: [sessionId],
        };
    }
}

export class AcpUiSessionsViewProvider
    implements TreeDataProvider<AcpUiSessionsTreeNode>
{
    private changeEvent = new EventEmitter<AcpUiSessionsTreeNode | undefined>();

    private readonly extensionContext: ExtensionContext;

    private constructor(extensionContext: ExtensionContext) {
        this.extensionContext = extensionContext;
    }

    public get onDidChangeTreeData(): Event<AcpUiSessionsTreeNode | undefined> {
        return this.changeEvent.event;
    }

    /**
     * Registers the Chats tree view and session commands. Returns a function that refreshes the tree.
     */
    static activate(context: ExtensionContext): () => void {
        const provider = new AcpUiSessionsViewProvider(context);
        context.subscriptions.push(
            window.registerTreeDataProvider(viewIdAcpUiSessions, provider),
        );

        registerCommandIB(
            cmdRefreshAcpUiSessions,
            () => provider.refresh(),
            context,
        );
        registerCommandIB(
            cmdOpenAcpUiSession,
            (...args: unknown[]) =>
                void provider.openSession(args[0] as string | undefined),
            context,
        );
        registerCommandIB(
            cmdDeleteAcpUiSession,
            (...args: unknown[]) =>
                void provider.deleteSession(
                    args[0] as AcpUiSessionsTreeNode | undefined,
                ),
            context,
        );
        registerCommandIB(
            cmdFocusAcpUiSessions,
            () => commands.executeCommand(`${viewIdAcpUiSessions}.focus`),
            context,
        );

        return () => provider.refresh();
    }

    refresh(): void {
        this.changeEvent.fire(undefined);
    }

    getTreeItem(element: AcpUiSessionsTreeNode): TreeItem {
        return element;
    }

    async getChildren(
        element?: AcpUiSessionsTreeNode,
    ): Promise<AcpUiSessionsTreeNode[]> {
        if (element) {
            return [];
        }
        const rows = listAcpUiSessions();
        if (rows.length === 0) {
            return [new AcpUiPlaceholderTreeItem()];
        }
        const active = getActiveAcpUiSessionId();
        return rows.map((row) => this.toTreeItem(row, active));
    }

    getParent(): undefined {
        return undefined;
    }

    private toTreeItem(
        row: AcpUiSessionRecord,
        activeId: string | null,
    ): AcpUiSessionTreeItem {
        return new AcpUiSessionTreeItem(row.id, row.title, row.id === activeId);
    }

    private async openSession(sessionId?: string): Promise<void> {
        if (typeof sessionId !== "string" || sessionId.length === 0) {
            window.showInformationMessage("Choose a chat from the Chats list");
            return;
        }
        const row = listAcpUiSessions().find((s) => s.id === sessionId);
        if (!row) {
            window.showErrorMessage("That chat no longer exists");
            this.refresh();
            return;
        }
        setActiveAcpUiSessionId(sessionId);
        this.refresh();
        const agentConfig =
            row.agentName !== undefined
                ? getAcpAgentConfigByName(row.agentName)
                : getAcpAgentConfigsFromSettings()[0];
        openOrRevealAcpUiEditor(
            this.extensionContext,
            sessionId,
            row.title,
            agentConfig,
        );
    }

    private async deleteSession(
        item: AcpUiSessionsTreeNode | undefined,
    ): Promise<void> {
        if (!item || !("sessionId" in item)) {
            window.showErrorMessage("Select a chat in the Chats list");
            return;
        }
        const row = listAcpUiSessions().find((s) => s.id === item.sessionId);
        const labelText = row?.title ?? "chat";
        const answer = await window.showWarningMessage(
            `Delete chat "${labelText}"? This cannot be undone.`,
            { modal: true },
            "Delete",
        );
        if (answer !== "Delete") {
            return;
        }
        disposeAcpUiEditorForSession(item.sessionId);
        removeAcpUiPromptHistoryEntries(this.extensionContext, item.sessionId);
        removeAcpUiSession(item.sessionId);
        this.refresh();
    }
}
