# Decision Log

This file records decisions and their rationale. The linked design documents own the detailed requirements; do not duplicate schemas or mission scripts here.

| ID | Decision | Rationale and authoritative detail |
| --- | --- | --- |
| D-001 | Start repair chapters with a malfunction or repair goal; Chapter 00 is onboarding | Knowledge answers a need created by the mission. [Product vision](01_product_vision.md#mission-first-design) |
| D-002 | Keep explanations and quizzes in the Manual | Learning remains part of investigation; quiz completion does not gate repairs. [Learning design](04_learning_design.md#quiz-policy) |
| D-003 | Expose hardware behavior before software abstraction | Build hardware understanding through observation. [Product vision](01_product_vision.md#hardware-before-software) |
| D-004 | Put UART, RAM, timer, and input before display/pixel work | Build diagnostic confidence before visual complexity. [Roadmap](03_chapter_roadmap.md) |
| D-005 | Finish the bare-metal arc with a working game device | Repairs need a concrete combined payoff. [Roadmap](03_chapter_roadmap.md#chapter-17--the-first-game) |
| D-006 | Revisit the same hardware under Linux | Drivers and OS abstractions solve already-familiar problems. [Learning design](04_learning_design.md#reuse-without-false-generalization) |
| D-007 | Keep kernel contribution to a short simulated epilogue | Contribution mechanics are not the main game. [Product vision](01_product_vision.md#ending-and-epilogue) |
| D-008 | Separate chapter and view navigation | Inspection must preserve the active repair attempt. [UI / UX](02_ui_ux.md#state-and-navigation-behavior) |
| D-009 | Allow direct access to implemented chapters with fresh state | Avoid persistence and unlock complexity in the prototype. [UI / UX](02_ui_ux.md#state-and-navigation-behavior) |
| D-010 | Keep the prototype asset-free | Prioritize interaction and feedback over art. [Root coding rules](../AGENTS.md) |
| D-011 | Use guided coding interactions | Teach hardware concepts without syntax/parser overhead. [UI / UX](02_ui_ux.md#guided-interactions) |
| D-012 | Use Bun, TypeScript, HTML, CSS, and static GitHub Pages hosting | Match the client-only prototype. [Architecture](05_technical_architecture.md) |
| D-013 | Exclude frontend frameworks, a backend, and a database | Keep the current scope small and explicit. [Root coding rules](../AGENTS.md) |
| D-014 | Start with small TypeScript simulation functions | Iterate on the actual repair loop. [Architecture](05_technical_architecture.md#simulation-strategy) |
| D-015 | Defer Rust/WASM until needed | Solve an observed limitation, not a hypothetical one. [Architecture](05_technical_architecture.md#deferred-runtime-decisions) |
| D-016 | Grow simulation only with current chapters | A complete emulator is not a prerequisite for the first mission. [Development plan](06_development_plan.md) |
| D-017 | Separate Study Module numbers from game Chapter numbers | Prior lesson order differs from the mission roadmap. [Learning inventory](12_current_learning_state.md#separate-numbering-systems) |
| D-018 | Maintain one canonical `Chapter<State>` contract | Remove incompatible sketches and define reset/completion behavior once. [Content model](08_content_and_data_model.md#canonical-chapter-contract) |
| D-019 | Keep root AGENTS.md extremely short and coding-only | Detailed product design belongs in docs; old AGENTS/README drafts are pointers. [Documentation map](00_project_overview.md) |
| D-020 | Teach Chapter 05 interrupts conceptually | Register/PC/stack/CSR internals must follow their prerequisites. [Learning design](04_learning_design.md#prerequisite-boundaries) |
| D-021 | Limit Chapter 01 to the first UART response and three short questions | Validate a light vertical slice before broadening content. [Chapter 01 script](03_chapter_roadmap.md#chapter-01--is-anyone-there) |
| D-022 | Keep actual Linux boot as a long-term goal with a deferred runtime decision | Do not confuse a prototype log with kernel execution or assume the original estimate is validated. [Architecture](05_technical_architecture.md#deferred-runtime-decisions) |
| D-023 | Use authored feedback for the simulated reviewer | Preserve the epilogue without adding a live service dependency. [Product vision](01_product_vision.md#ending-and-epilogue) |
