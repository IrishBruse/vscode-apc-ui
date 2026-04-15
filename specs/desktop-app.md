# Goal

Ship a standalone **desktop application** packaging ACP UI so users who do not want to run inside VS Code still get the same product surface, while reusing the existing webview/UI implementation from the extension rather than rebuilding screens.

# In Scope

- Evaluate and document wrapper options (for example **Electron**, **Tauri**, or embedding the same UI in a minimal Chromium shell), including tradeoffs: bundle size, security model, native integrations, maintenance, and team familiarity.
- Choose one approach and describe how the **same UI bundle** used by the VS Code extension is loaded (no duplicate feature implementation for chat, sidebar, and ACP client wiring).
- Define how the desktop shell obtains workspace roots, file access, and spawning of `agent acp` (or equivalent) so behavior stays aligned with the extension.
- Basic window lifecycle: install, open project/folder, quit.

# Out of Scope

- Mobile or tablet apps.
- Replacing VS Code as the only supported host; the extension remains a first-class distribution.
- Full auto-update and code-signing policy unless explicitly added in a follow-up spec.

# Acceptance Criteria

- Written recommendation names a primary wrapper and at least one rejected alternative with concise rationale.
- Architecture note explains how UI code is shared with the extension (build artifact, package layout, or monorepo path—TBD in implementation).
- Acceptance for v1: desktop build launches, loads the shared UI, and can complete a minimal happy path (connect agent, send one prompt) against a local workspace.
- Security and packaging risks (Node integration, remote content) are called out with mitigations or follow-up items.

### Notes (non-normative)

| Option | Pros | Cons |
|--------|------|------|
| Electron | Mature ecosystem, Node alongside Chromium, well-known patterns | Larger downloads, Chromium per app |
| Tauri | Smaller binaries, Rust security boundary | Rust toolchain, different native API surface |
| Other (e.g. neutral webview2 / embedded) | Platform-native web hosts | Platform-specific work splits effort |

Reuse of extension UI is a hard requirement for whatever option is selected.

Choice Wails
