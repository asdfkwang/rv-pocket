# RV Pocket

**A problem-driven RISC-V hardware learning game.**

You inherit a broken pocket computer and an old hardware manual from your parents' failed game company. Diagnose the failures, search the Manual for clues, and restore the machine one component at a time, from bare metal to Linux.

**Find the problem. Read the manual. Fix the machine.**

## Current status

The local workspace has a blank Bun project and design documentation. GitHub Pages is already configured to use GitHub Actions. The browser UI, playable chapters, and local build/deployment workflow still need implementation and verification.

The first playable target is Prologue onboarding followed by Episode 01: connect UART and receive the machine's first `A`. The longer roadmap describes planned work, including a future Linux boot milestone.

## Prototype

Bun + TypeScript + HTML + CSS, deployed as a static site on GitHub Pages. The prototype uses text, buttons, CSS, and ASCII to validate the repair experience.

## Documentation

- [Documentation map and scope](docs/00_project_overview.md)
- [Product vision and problem-first design](docs/01_product_vision.md)
- [Episode roadmap](docs/03_episode_roadmap.md)
- [Canonical Episode data model](docs/08_content_and_data_model.md)
- [Development plan](docs/06_development_plan.md) and [current backlog](docs/13_pm_backlog.md)
- [Coding rules](AGENTS.md)
