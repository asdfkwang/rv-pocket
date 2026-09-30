# Development Plan

Build the next playable mission before expanding the simulator. This document owns implementation order and exit criteria. The [roadmap](03_chapter_roadmap.md) owns mission content, the [schedule](07_schedule_and_milestones.md) owns tentative timing, and the [backlog](13_pm_backlog.md) tracks current tasks.

## Phase 0 — Browser bootstrap and deployment

The local workspace already has the repository, blank Bun initialization, root coding rules, README, and design documents. GitHub Pages is configured to use GitHub Actions. Do not repeat initialization or the Pages source setting.

Remaining work:

- Add the HTML entry point, TypeScript browser entry, and CSS.
- Add development/build commands for static output.
- Add the local build/deployment workflow for the existing GitHub Actions Pages configuration and verify deployment, including the repository base path.

**Exit:** A minimal browser page builds and opens from the deployed URL.

## Phase 1 — Global UI shell

Implement the chapter selector, Workbench / Computer / Manual views, and direct chapter navigation using [UI / UX](02_ui_ux.md). Keep navigation independent from transient mission state; expose only implemented chapters.

**Exit:** Switching views preserves the current attempt; entering a different chapter or resetting it initializes the correct state. No simulator is needed yet.

## Phase 2 — Chapter 00 onboarding

Implement the story, navigation help, and Start Chapter 01 action. The Manual contains interface help, with no hardware lesson or quiz. Before Chapter 01 is available, its entry must be clearly unavailable rather than presented as a working repair.

**Exit:** A first-time player understands the three views and the premise. Once Phase 3 lands, Start enters the actual Chapter 01 mission.

## Phase 3 — Chapter 01 UART vertical slice

Implement the [canonical Chapter contract](08_content_and_data_model.md#canonical-chapter-contract) and adapt Chapter 00 to it. Do not invent a second interface or general-purpose mission engine.

Then implement the [Chapter 01 script](03_chapter_roadmap.md#chapter-01--is-anyone-there): cable interaction, terminal, short Manual page, three feedback questions, and a guided diagnostic that produces the first `A`. Use the [minimal UART state and completion predicate](08_content_and_data_model.md#chapter-01-state-and-completion).

**Exit:** A new player can complete the repair without developer help. Verify that:

- the malfunction and objective appear before explanations;
- a disconnected cable or wrong device choice cannot complete the mission;
- a valid board transmit with the cable connected produces `A` and completion feedback;
- Manual/quiz use is available without blocking an informed repair attempt;
- view switches preserve state, while Reset restores the disconnected, silent machine;
- a fresh direct entry into Chapter 01 works without completing Chapter 00.

Playtest this loop before building more chapters. Rework unclear interactions before expanding scope.

## Later phases

Implement these only after the first slice is validated. Chapter numbers and details remain in the [roadmap](03_chapter_roadmap.md).

| Phase | Game chapters | Implementation focus | Exit criterion |
| --- | --- | --- | --- |
| 4 | 02–05 | RAM, timer, input, conceptual interrupt events | Multiple repairs reuse views and the Chapter contract with small simulation additions; no register/CSR prerequisites in Chapter 05 |
| 5 | 06–09 | Basic display, then register/PC tracing and guided instructions | A visible object can be repaired and moved using input |
| 6 | 10–13 | DMA, cache maintenance, coherency, ordering | Each failure has a distinct observable cause and repair |
| 7 | 14–17 | Calls/stack, traps, audio, integrated game | A functioning bare-metal game device |
| 8 | 18–24 | OS foundations and boot preparation | Prerequisites for Linux are motivated; the actual Linux runtime approach and revised estimate are agreed before Phase 9 |
| 9 | 25–31 | Actual Linux boot, hardware drivers, userspace, scheduler, finale | Power-on through Linux to the old game, including Linux-side audio |
| 10 | 32–33 | Constrained kernel-style fix and simulated review | One diff, commit message, authored review, and revision complete the short epilogue |

The [runtime decision boundary](05_technical_architecture.md#deferred-runtime-decisions) remains in force. A scripted boot log alone cannot satisfy Phase 9, and a live AI service is not required for Phase 10.
