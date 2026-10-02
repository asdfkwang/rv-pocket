# RV Pocket

**A problem-driven RISC-V hardware learning game.**

You inherit a broken pocket computer and an old hardware manual from your parents' failed game company. Diagnose the failures, search the Manual for clues, and restore the machine one component at a time, from bare metal to Linux.

**Find the problem. Read the manual. Fix the machine.**

## Current status

The browser prototype has Prologue onboarding and playable Episodes 01–03. The PC edits and installs programs; STATION observes the Pocket's reaction. STATION shows the development PC, RV Pocket, connected UART cable, and two separate references. PC opens a fixed editor, serial terminal, and Build & Flash controls. DATASHEET contains RV Pocket's Atlantis-inspired RV32G address map, UART1 register contract, ASCII values, and 1 GHz ACLINT timer reference. BOOK contains the existing study chapters, search, and checks. The Pocket can be inspected from the station.

Episode 01 starts with inherited firmware sending `B`. Change the single editable byte in `boot.S` from `0x42` to `0x41`, then Build & Flash to reboot and receive `A`. It has no cover, so the run stays a plain execution. Episode 02 stores a value, but the inherited destination is the UART1 DATA address, so the value is transmitted instead of reaching RAM `0x00002000`. Change the destination in `store.S` to the RAM address and Build & Flash; OPEN COVER then shows the value in memory. The build produces a different value on every flash, so the repair is the destination, not the number. Episode 03 assumes a 2 GHz program timebase and waits two seconds on the actual 1 GHz timer; install the correct 1 GHz timebase to observe one-second ticks.

The Pocket's cover opens under the device on STATION in Episodes 02 and 03 and shows the machine's hardware modules as tabs. Episode 02 opens directly to the RAM module: one row per 32-bit word, stepping by four bytes, with the target word highlighted. Episode 03 adds a CPU module showing the program counter and a few registers. MTIME is a memory-mapped register, so it appears as a row in the RAM module rather than a module of its own. UART is not a module: the PC's serial terminal already shows it, the way Episode 01 does. The cover is an observation aid, not a completion gate, and the PC holds every setting.

These are constrained local simulations, with no assembler or full emulator. No full RAM array exists: only the words the cover displays are tracked. Episode 03 measures elapsed browser time between live ticks. Later episodes, including display bring-up and Linux boot, remain planned work. Each episode starts with its prerequisite repairs already represented. Reload or Reset episode starts a fresh attempt; changing views preserves it.

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
