# Project Overview and Documentation Map

RV Pocket is a mission-driven RISC-V hardware learning game. The player restores a broken pocket computer from bare metal to Linux, one subsystem at a time.

## Current scope

The repository currently contains a blank Bun project and design documents, not a playable browser game. The next target is Chapter 00 onboarding and a small Chapter 01 UART vertical slice. Later chapters are a product roadmap, not implemented functionality or a fixed delivery commitment.

The initial prototype validates mission clarity, learning flow, navigation, and immediate machine feedback. It is a static site targeting GitHub Pages. It does not require accounts, persistent save/load, graphical assets, or real patch submission. Coding constraints live in the root [AGENTS.md](../AGENTS.md).

The long-term goal remains an actual Linux-capable machine and a short simulated kernel-review epilogue. The execution approach for Linux is deferred; it must not expand the first slice into a complete emulator.

## Where each decision belongs

Each subject has one authoritative document. Other documents summarize or link to it rather than maintaining competing specifications.

| Subject | Authoritative document |
| --- | --- |
| Public introduction and repository status | [README](../README.md) |
| Premise, mission-first loop, priorities, ending | [Product vision](01_product_vision.md) |
| Views, navigation, reset behavior, interaction | [UI / UX](02_ui_ux.md) |
| Game chapter numbers, mission scope, Chapter 01 script | [Chapter roadmap](03_chapter_roadmap.md) |
| Learning depth, quiz policy, prerequisites | [Learning design](04_learning_design.md) |
| Runtime boundaries, stack, deployment approach | [Technical architecture](05_technical_architecture.md) |
| Implementation order and exit criteria | [Development plan](06_development_plan.md) |
| Tentative milestone timing | [Schedule](07_schedule_and_milestones.md) |
| The sole Chapter interface and content/state contract | [Content and data model](08_content_and_data_model.md) |
| Coding instructions | [Root AGENTS.md](../AGENTS.md) |
| Decision rationale | [Decision log](11_decision_log.md) |
| Prior study material and its mapping to the game | [Learning inventory](12_current_learning_state.md) |
| Current actionable work and completion status | [PM backlog](13_pm_backlog.md) |

[09_agents.md](09_agents.md) and [10_readme_draft.md](10_readme_draft.md) are retained as pointers for old links, not alternate instructions or drafts.

## Numbering conventions

- **Chapter NN** always means a game mission in the chapter roadmap.
- **Study Module NN** refers only to the earlier study sequence recorded in the learning inventory. Its numbers do not match the game chapters.
- **Phase N** and **Milestone N** describe development work and timing, not learning units.
- The numeric prefixes of these Markdown filenames only order the documents.
