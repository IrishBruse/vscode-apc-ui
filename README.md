# ACP UI

VS Code extension that brings an **IB Chat** panel to the [Agent Client Protocol (ACP)](https://github.com/agentclientprotocol) — chat with configured agent processes from the editor.

## Features

- **IB Chat** webview: ACP-backed chat in an editor tab or panel.
- **Chats** sidebar under the **IB Chat** activity bar: list sessions, open, refresh, delete.
- **ACP RPC** output channel and optional NDJSON log for debugging protocol traffic.
- **Agent configuration** via `ib-acp.agents` in settings (command, args, env per agent).

## Usage

1. Install the extension and open the **IB Chat** view in the activity bar.
2. Use **Open IB Chat** (or **New IB Chat in Editor** from the Chats view) to start a session.
3. Adjust agents under **Settings → Extensions → ACP UI** (`ib-acp.agents`).

## Development

```bash
npm ci
npm run build      # webview + extension bundle
npm run watch      # extension esbuild watch (run build:webview first or after UI changes)
npm run check      # TypeScript
npm run test       # vitest
npm run verify     # build + check + test + lint
```

For a browser-only UI loop without VS Code, use `npm run dev:standalone` (see `standalone/`).

Publishing is automated when `package.json` **version** changes on `main` (see `.github/workflows/publish.yml`).

## Explore

| Area | Role |
| --- | --- |
| [`src/extension.ts`](src/extension.ts) | Extension entry: activates ACP services, IB Chat panel, Chats tree view. |
| [`src/extension/`](src/extension/) | Chat webview registration, sessions sidebar, agent picker, prompt history. |
| [`src/acp/`](src/acp/) | ACP session bridge, agent config from VS Code settings, RPC helpers. |
| [`src/protocol/`](src/protocol/) | Messages between extension host and webview. |
| [`webview/acp-ui/`](webview/acp-ui/) | React + Vite webview UI (chat UI, markdown, state). |
| [`standalone/`](standalone/) | Local dev server and mocks for the webview without the extension host. |
| [`specs/`](specs/) | Design notes for features and commands. |
| [`media/`](media/) | Activity bar and view icons. |

For standalone model seeding from captured ACP logs, see [`src/acp/session/readmeSessionModels.ts`](src/acp/session/readmeSessionModels.ts) and `standalone/mock/readme.ndjson`.

## License

MIT — see [`package.json`](package.json) `license` field.
