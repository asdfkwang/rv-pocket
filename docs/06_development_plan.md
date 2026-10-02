# Development Plan

Build the next playable episode before expanding the simulator. This document owns implementation order and exit criteria. The [roadmap](03_episode_roadmap.md) owns episode content, the [schedule](07_schedule_and_milestones.md) owns tentative timing, and the [backlog](13_pm_backlog.md) tracks current tasks.

## Phase 0 — Browser bootstrap and deployment

The local workspace already has the repository, blank Bun initialization, root coding rules, README, and design documents. GitHub Pages is configured to use GitHub Actions. Do not repeat initialization or the Pages source setting.

Remaining work:

- Add the HTML entry point, TypeScript browser entry, and CSS.
- Add development/build commands for static output.
- Add the local build/deployment workflow for the existing GitHub Actions Pages configuration and verify deployment, including the repository base path.

**Exit:** A minimal browser page builds and opens from the deployed URL.

## Phase 1 — Global UI shell

Implement the episode selector, Workbench / Computer / Manual views, and direct episode navigation using [UI / UX](02_ui_ux.md). Keep navigation independent from transient episode state; expose only implemented episodes.

**Exit:** Switching views preserves the current attempt; entering a different chapter or resetting it initializes the correct state. No simulator is needed yet.

## Phase 2 — Prologue onboarding

Implement the story, navigation help, and Start Episode 01 action. The Manual contains interface help, with no hardware lesson or quiz. Before Episode 01 is available, its entry must be clearly unavailable rather than presented as a working repair.

**Exit:** A first-time player understands the three views and the premise. Once Phase 3 lands, Start enters the actual Episode 01 repair.

## Phase 3 — Episode 01 UART vertical slice

Implement the [canonical Episode contract](08_content_and_data_model.md#canonical-episode-contract) and adapt the Prologue to it. Do not invent a second interface or general-purpose episode engine.

Then implement the [Episode 01 script](03_episode_roadmap.md#episode-01--output-in-the-wrong-place): cable interaction, terminal, short Manual page, three feedback questions, and a guided diagnostic that produces the first `A`. Use the [minimal UART state and completion predicate](08_content_and_data_model.md#episode-01-state-and-completion).

**Exit:** A new player can complete the repair without developer help. Verify that:

- the malfunction and objective appear before explanations;
- a disconnected cable or wrong device choice cannot complete the repair;
- a valid board transmit with the cable connected produces `A` and completion feedback;
- Manual/quiz use is available without blocking an informed repair attempt;
- view switches preserve state, while Reset restores the disconnected, silent machine;
- a fresh direct entry into Episode 01 works without completing the Prologue.

Playtest this loop before building more chapters. Rework unclear interactions before expanding scope.

## Later phases

Implement these only after the first slice is validated. Episode numbers and details remain in the [roadmap](03_episode_roadmap.md).

> TODO: the phase grouping below still follows the old 33-episode outline. Replan the phases against the new Episodes 01–26 roadmap before committing to them.

| Phase | Game episodes | Implementation focus | Exit criterion |
| --- | --- | --- | --- |
| 4 | 02–05 | RAM, timer, input, then basic display; conceptual interrupt events | Multiple repairs reuse views and the Episode contract with small simulation additions; no register/CSR prerequisites in Episode 07 |
| --- | --- | --- | --- |
| 5 | 06–09 | Pixel math, non-blocking waits, then register/PC tracing and guided instructions | A visible object can be repaired and moved using input |
| 6 | 10–13 | DMA, cache maintenance, coherency, ordering | Each failure has a distinct observable cause and repair |
| 7 | 14–17 | Calls/stack, traps, audio, integrated game | A functioning bare-metal game device |
| 8 | 18–24 | OS foundations and boot preparation | Prerequisites for Linux are motivated; the actual Linux runtime approach and revised estimate are agreed before Phase 9 |
| 9 | 25–31 | Actual Linux boot, hardware drivers, userspace, scheduler, finale | Power-on through Linux to the old game, including Linux-side audio |
| 10 | 32–33 | Constrained kernel-style fix and simulated review | One diff, commit message, authored review, and revision complete the short epilogue |

The [runtime decision boundary](05_technical_architecture.md#deferred-runtime-decisions) remains in force. A scripted boot log alone cannot satisfy Phase 9, and a live AI service is not required for Phase 10.
