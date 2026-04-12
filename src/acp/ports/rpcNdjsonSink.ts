/**
 * Optional sink for raw NDJSON-RPC lines (stdio transport), used for debugging and support.
 * When {@link isLoggingEnabled} is false, transports should not insert extra stream taps.
 */
export interface AcpRpcNdjsonSink {
    readonly isLoggingEnabled: boolean;
    appendRawNdjsonLine(line: string): void;
}

/** No-op sink for tests or hosts that do not surface RPC traffic. */
export class NullAcpRpcNdjsonSink implements AcpRpcNdjsonSink {
    readonly isLoggingEnabled = false;
    appendRawNdjsonLine(_line: string): void {}
}
