# PM Backlog

This file tracks current repository work. The [development plan](06_development_plan.md) owns implementation order and exit criteria; the [roadmap](03_episode_roadmap.md) owns episode details. A checked design task does not mean its runtime implementation exists.

## Established repository and design baseline

- [x] Initialize the repository with a blank Bun project.
- [x] Maintain short coding-only root AGENTS.md.
- [x] Add the README and linked design documentation.
- [x] Configure GitHub Pages to use GitHub Actions.
- [x] Separate Study Module numbering from game Episode numbering.
- [x] Specify the canonical Episode contract, including Manual/quiz shape and state lifecycle.
- [x] Specify the light Episode 01 repair script and its three questions.

## P0 — Browser shell and onboarding

- [ ] Add browser HTML, TypeScript, CSS, and development/build commands.
- [ ] Add the build/deployment workflow and verify a deployed build under the repository base path using the existing Pages configuration.
- [ ] Build the episode selector, direct URLs, and view selector.
- [ ] Build Workbench / Computer / Manual with the documented navigation/reset behavior.
- [ ] Complete Prologue story and interface onboarding.

## P0 — Episode 01 vertical slice

- [ ] Implement the [canonical Episode contract](08_content_and_data_model.md#canonical-episode-contract) and use it for the Prologue and Episode 01.
- [ ] Implement the fresh UART episode state, cable connection, and terminal.
- [ ] Render the short Manual page and three questions with retry feedback.
- [ ] Implement the guided diagnostic and minimal UART behavior, including missing-cable/wrong-choice feedback.
- [ ] Derive repair completion from received `A` and connection state.
- [ ] Connect the Prologue Start action and Episode 01 completion navigation as targets become available.
- [ ] Verify the [Phase 3 exit criteria](06_development_plan.md#phase-3--chapter-01-uart-vertical-slice) and playtest with a new player before adding more chapters.

## Next, after the slice is validated

- [ ] Implement Phase 4's early repair episodes, extending shared views and simulation only as each episode requires.
- [ ] Reestimate the later phases using playtest results and [milestone checkpoints](07_schedule_and_milestones.md).

All later chapter work remains in the roadmap and development plan rather than a second per-chapter checklist here. The Linux execution approach must be resolved before committing to that implementation milestone.

Prototype exclusions are maintained in the [scope overview](00_project_overview.md#current-scope) and [root coding rules](../AGENTS.md), not a second policy list in this backlog.
