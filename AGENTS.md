# Agent Rules

- Use Bun + TypeScript + HTML + CSS.
- No frontend framework.
- No backend or database.
- Keep the prototype asset-free; text, buttons, CSS, and ASCII are enough.
- Prefer simple, explicit code over abstractions.
- Do not over-engineer.
- Add only the simulation needed by the current chapter.
- Do not build a full parser, compiler, or complete emulator.
- Prefer reusable chapter data over duplicated chapter-specific UI.
- Keep chapter state and view state separate.
- Rust/WASM may be added later only when needed.
- Do not translate content unless the user explicitly asks for translation. No unrequested localization, i18n work, or translation passes.
- Never delegate translation or rewriting prose to subagents; do that work directly when the user asks for it.

## Local build & verify (Bun)

- Install: `bun install`
- Dev server: `bun run dev` (serves `index.html`), open the printed localhost URL
- Typecheck: `bun run typecheck`
- Production build: `bun run build` (outputs gitignored `dist/`)
- Tests: `bun test`
- Commit only source (`src/`, `index.html`, `package.json`, `bun.lock`, configs); never commit `node_modules/` or `dist/`
