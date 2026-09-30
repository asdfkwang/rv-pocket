# Technical Architecture

## Stack and current state

Use Bun + TypeScript + HTML + CSS. The prototype runs entirely in the browser and targets GitHub Pages. No frontend framework, backend, database, or server-side rendering is part of this scope. The root [AGENTS.md](../AGENTS.md) owns the short coding rules.

The repository currently has the blank Bun bootstrap only. The structure below is a target, not a claim that these files or build scripts already exist:

```text
rv-pocket/
├─ index.html
├─ src/
│  ├─ main.ts
│  ├─ style.css
│  ├─ app-state.ts
│  ├─ chapters/
│  │  ├─ types.ts
│  │  ├─ chapter-00.ts
│  │  └─ chapter-01.ts
│  ├─ views/
│  │  ├─ workbench.ts
│  │  ├─ computer.ts
│  │  └─ manual.ts
│  └─ sim/
│     └─ uart.ts
├─ docs/
├─ AGENTS.md
└─ README.md
```

Add further modules only when an implemented chapter requires them.

## Content, state, and simulation boundaries

The sole chapter schema is [`Chapter<State>` in the content model](08_content_and_data_model.md#canonical-chapter-contract). When implementation starts, place that contract in `src/chapters/types.ts`; keep this document as a reference, not another interface definition.

- Chapter definitions contain mission text, view configuration, Manual/quiz content, initial-state creation, and a success predicate.
- Application navigation owns the selected chapter and view. Its behavior is specified in [UI / UX](02_ui_ux.md#state-and-navigation-behavior).
- The active mission owns transient machine state. View changes must not recreate it.
- Views dispatch explicit actions to small simulation functions, then render the resulting state and completion result. They do not independently invent hardware behavior.

For Chapter 01, a supplied diagnostic performs a UART transmit operation. A connected cable lets the host terminal receive `A`; without the cable it receives nothing. This models the observable repair without instruction execution, baud-rate configuration, an address map, or a parser.

## Simulation strategy

Implement only behavior required by current chapters. Prefer conceptual correctness, deterministic execution, inspectable state, and simple code over cycle accuracy.

RAM, timer, input, interrupt events, display, CPU tracing, DMA, and cache models are later additions driven by the [roadmap](03_chapter_roadmap.md). Early interrupt behavior is an event/handler/resume model; register and CSR internals are not hidden prerequisites.

In later cache missions, distinguish ordinary RAM buffers from MMIO device registers. Cache maintenance and ordering are separate operations; one should not silently stand in for the other. Document deliberate simplifications in the relevant mission's Manual.

## Deferred runtime decisions

Rust/WASM is an option only after an observed limitation justifies it. Do not build a generic simulator API, full ISA implementation, or emulator framework for hypothetical chapters.

The long-term Linux boot goal requires an execution environment capable of running a kernel. That runtime has not been selected. Evaluate the approach and revise estimates before committing to the Linux implementation milestone; a small educational simulator or scripted log alone does not satisfy actual Linux boot.

The simulated review epilogue can use authored feedback in the static client. Live AI integration is outside the prototype scope.

## Deployment target

GitHub Pages is already configured to use GitHub Actions. The deployment path is Bun-generated static output → GitHub Actions → GitHub Pages. Development/build scripts and a workflow file are not present in the local repository yet; add them and verify the built site under its repository base path. The Pages source setting is complete, while a working site deployment remains to be verified.
