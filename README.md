# RV Pocket

**A problem-driven RISC-V hardware learning game.**

You inherit a broken pocket computer and an old hardware manual from your parents' failed game company. Diagnose the failures, search the Manual for clues, and restore the machine one component at a time, from bare metal to Linux.

**Find the problem. Read the manual. Fix the machine.**

## Current status

The browser prototype has Prologue onboarding and playable Episodes 01–03. STATION shows the development PC, RV Pocket, connected UART cable, and two separate references. PC opens a fixed editor, serial terminal, target status, and Build & Flash controls, with a memory map or timer inspector when the episode needs it. DATASHEET contains the fictional hardware memory map, UART register contract, ASCII values, and timer clock reference. BOOK contains the existing study chapters, search, and checks. The Pocket can be inspected from the station.

Episode 01 starts with inherited firmware sending `B`. Change the single editable byte in `boot.S` from `0x42` to `0x41`, then Build & Flash to reboot and receive `A`. Episode 02 reports shifting RAM errors inside the diagnostic's reserved workspace; edit the START/END range and RUN a test outside that workspace. Build & Flash installs the range for RESET. Episode 03 sends timer ticks every two seconds with a 5 MHz source; install 10 MHz to observe one-second ticks and a matching LED pulse.

These are constrained local simulations, with no assembler or full emulator. Episode 03 measures elapsed browser time between live ticks. Later episodes, including Linux boot, remain planned work. Each episode starts with its prerequisite repairs already represented. Reload or Reset episode starts a fresh attempt; changing views preserves it.

Run `bun run dev`, `bun run typecheck`, `bun run build`, and `bun test`. Direct episode routes: `#episode=01&view=station`, `#episode=02&view=station`, and `#episode=03&view=station`.

## Prototype

Bun + TypeScript + HTML + CSS, deployed as a static site on GitHub Pages. The prototype uses text, buttons, CSS, and ASCII to validate the repair experience.

## Documentation

- [Documentation map and scope](docs/00_project_overview.md)
- [Product vision and problem-first design](docs/01_product_vision.md)
- [Episode roadmap](docs/03_episode_roadmap.md)
- [Canonical Episode data model](docs/08_content_and_data_model.md)
- [Development plan](docs/06_development_plan.md) and [current backlog](docs/13_pm_backlog.md)
- [Coding rules](AGENTS.md)
