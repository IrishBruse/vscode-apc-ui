import { type ChildProcess, spawn } from "node:child_process";
import { Readable, Transform, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import type { AcpAgentSpawnConfig } from "../domain/agentSpawnConfig";
import type { AcpHostFilesystem } from "../ports/hostFilesystem";
import type { AcpRpcNdjsonSink } from "../ports/rpcNdjsonSink";

/**
 * Passes bytes through while appending each complete NDJSON line to the configured sink.
 */
function createNdjsonRpcLogTap(sink: AcpRpcNdjsonSink): Transform {
    let buffer = "";
    return new Transform({
        transform(
            chunk: Buffer,
            chunkEncoding: BufferEncoding,
            callback,
        ): void {
            void chunkEncoding;
            buffer += chunk.toString("utf8");
            const parts = buffer.split("\n");
            buffer = parts.pop() ?? "";
            for (const part of parts) {
                const trimmed = part.trim();
                if (trimmed.length > 0) {
                    sink.appendRawNdjsonLine(trimmed);
                }
            }
            callback(null, chunk);
        },
        flush(callback): void {
            const trimmed = buffer.trim();
            if (trimmed.length > 0) {
                sink.appendRawNdjsonLine(trimmed);
            }
            buffer = "";
            callback();
        },
    });
}

function ndJsonStreamTapsForChild(
    child: ChildProcess,
    rpcNdjsonSink: AcpRpcNdjsonSink,
): {
    stdinWeb: WritableStream;
    stdoutWeb: ReadableStream<Uint8Array>;
} {
    if (!rpcNdjsonSink.isLoggingEnabled) {
        return {
            stdinWeb: Writable.toWeb(child.stdin!),
            stdoutWeb: Readable.toWeb(
                child.stdout!,
            ) as ReadableStream<Uint8Array>,
        };
    }
    const towardAgent = createNdjsonRpcLogTap(rpcNdjsonSink);
    const fromAgent = createNdjsonRpcLogTap(rpcNdjsonSink);
    towardAgent.pipe(child.stdin!);
    child.stdout!.pipe(fromAgent);
    return {
        stdinWeb: Writable.toWeb(towardAgent),
        stdoutWeb: Readable.toWeb(fromAgent) as ReadableStream<Uint8Array>,
    };
}

/** Callback invoked whenever the agent sends a session/update notification. */
export type SessionUpdateHandler = (params: acp.SessionNotification) => void;

/** Resolves `session/request_permission` (UI surfaces this as a dialog). */
export type RequestPermissionHandler = (
    params: acp.RequestPermissionRequest,
) => Promise<acp.RequestPermissionResponse>;

export type AcpAgentProcessOptions = {
    config: AcpAgentSpawnConfig;
    requestPermission: RequestPermissionHandler;
    hostFilesystem: AcpHostFilesystem;
    rpcNdjsonSink: AcpRpcNdjsonSink;
    /** Workspace folder used for spawn `cwd` and `session/new` `cwd` metadata. */
    getWorkspaceRoot: () => string | undefined;
};

/**
 * Manages the lifecycle of a single ACP agent subprocess: spawn, initialize handshake,
 * session creation, prompting, and teardown.
 */
export class AcpAgentProcess {
    private child: ChildProcess | null = null;
    private connection: acp.ClientSideConnection | null = null;
    private sessionUpdateHandler: SessionUpdateHandler | null = null;

    constructor(private readonly options: AcpAgentProcessOptions) {}

    /** Registers a handler that receives every `session/update` notification. */
    onSessionUpdate(handler: SessionUpdateHandler): void {
        this.sessionUpdateHandler = handler;
    }

    async start(): Promise<acp.InitializeResponse> {
        const cwd = this.options.getWorkspaceRoot();

        this.child = spawn(
            this.options.config.command,
            this.options.config.args,
            {
                stdio: ["pipe", "pipe", "pipe"],
                cwd,
                env: { ...process.env, ...this.options.config.env },
            },
        );

        this.child.stderr?.on("data", (chunk: Buffer) => {
            const text = chunk.toString();
            console.error(`[ACP Agent ${this.options.config.name}] ${text}`);
        });

        this.child.on("error", (err) => {
            console.error(
                `[ACP Agent ${this.options.config.name}] process error:`,
                err,
            );
        });

        const { stdinWeb, stdoutWeb } = ndJsonStreamTapsForChild(
            this.child,
            this.options.rpcNdjsonSink,
        );
        const stream = acp.ndJsonStream(stdinWeb, stdoutWeb);

        const client: acp.Client = {
            requestPermission: async (params) =>
                this.options.requestPermission(params),
            sessionUpdate: async (params) => {
                this.sessionUpdateHandler?.(params);
            },
            readTextFile: async (params) => this.handleReadTextFile(params),
            writeTextFile: async (params) => this.handleWriteTextFile(params),
        };

        this.connection = new acp.ClientSideConnection(
            (_agent) => client,
            stream,
        );

        const response = await this.connection.initialize({
            protocolVersion: acp.PROTOCOL_VERSION,
            clientCapabilities: {
                fs: { readTextFile: true, writeTextFile: true },
            },
        });

        return response;
    }

    async newSession(): Promise<acp.NewSessionResponse> {
        if (!this.connection) {
            throw new Error("Agent not started");
        }
        const cwd = this.options.getWorkspaceRoot() ?? process.cwd();
        return this.connection.newSession({ cwd, mcpServers: [] });
    }

    async setSessionModel(sessionId: string, modelId: string): Promise<void> {
        if (!this.connection) {
            throw new Error("Agent not started");
        }
        await this.connection.unstable_setSessionModel({ sessionId, modelId });
    }

    async prompt(sessionId: string, text: string): Promise<acp.PromptResponse> {
        if (!this.connection) {
            throw new Error("Agent not started");
        }
        return this.connection.prompt({
            sessionId,
            prompt: [{ type: "text", text }],
        });
    }

    async cancel(sessionId: string): Promise<void> {
        if (!this.connection) {
            return;
        }
        await this.connection.cancel({ sessionId });
    }

    dispose(): void {
        if (this.child) {
            this.child.kill();
            this.child = null;
        }
        this.connection = null;
    }

    private async handleReadTextFile(
        params: acp.ReadTextFileRequest,
    ): Promise<acp.ReadTextFileResponse> {
        const content = await this.options.hostFilesystem.readTextFile(
            params.path,
        );
        return { content };
    }

    private async handleWriteTextFile(
        params: acp.WriteTextFileRequest,
    ): Promise<acp.WriteTextFileResponse> {
        await this.options.hostFilesystem.writeTextFile(
            params.path,
            params.content,
        );
        return {};
    }
}
