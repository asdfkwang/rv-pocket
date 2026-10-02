# RV Pocket

**A problem-driven RISC-V hardware learning game.**

You inherit a broken pocket computer and an old hardware manual from your parents' failed game company. Diagnose the failures, search the Manual for clues, and restore the machine one component at a time, from bare metal to Linux.

**Find the problem. Read the manual. Fix the machine.**

## Current status

The browser prototype has Prologue onboarding and playable Episodes 01–08. The PC edits and installs programs; STATION observes the Pocket's reaction. STATION shows the development PC, RV Pocket, connected UART cable, and two separate references. PC opens a fixed editor and Build & Flash controls, with serial output in early episodes and LIVE POCKET in Episodes 06–08. DATASHEET contains RV Pocket's Atlantis-inspired RV32G address map, UART1 register contract, ASCII values, and 1 GHz ACLINT timer reference. BOOK contains the existing study chapters, search, and checks. The Pocket can be inspected from the station.

Episode 01 starts with inherited firmware sending `B`. Change the single editable byte in `boot.S` from `0x42` to `0x41`, then Build & Flash to reboot and receive `A`. It has no cover, so the run stays a plain execution. Episode 02 stores a value, but the inherited destination is the UART1 DATA address, so the value is transmitted instead of reaching RAM `0x00002000`. Change the destination in `store.S` to the RAM address and Build & Flash; OPEN COVER then shows the value in memory. The build produces a different value on every flash, so the repair is the destination, not the number. Episode 03 assumes a 2 GHz program timebase and waits two seconds on the actual 1 GHz timer; install the correct 1 GHz timebase to observe one-second ticks. Episode 04 assembles a first real program from C blocks: read the button, test its bit, write the LED. Episode 05 — Stop Asking begins with that working polling program and a BUTTON READS counter that climbs while nothing happens. Switch to an interrupt draft, enable button IRQs, wait in main, and assemble READ → UPDATE → ACK in the handler. The CPU waits between events; omitting ACK leaves a pending IRQ that repeatedly calls the handler. Completion requires a real press/release and one second of idle without additional reads.

The Pocket's A button is a real control on the station, Pocket view, and the later PC live preview. Hold it and the LED follows, which is the first payoff the player produces with a finger rather than a setting.

The Pocket's cover opens under the device on STATION in Episodes 02 and 03 and shows the machine's hardware modules as tabs. Episode 02 opens directly to the RAM module: one row per 32-bit word, stepping by four bytes, with the target word highlighted. Episode 03 adds a CPU module showing the program counter and a few registers. MTIME is a memory-mapped register, so it appears as a row in the RAM module rather than a module of its own. UART is not a module: the PC's serial terminal already shows it, the way Episode 01 does. The cover is an observation aid, not a completion gate, and the PC holds every setting.

These are constrained local simulations, with no assembler or full emulator. No full RAM array exists: the prototype tracks observed words, 128 framebuffer bytes, and sparse off-screen writes. Episode 03 measures elapsed browser time between live ticks. Episode 06 — First Light repairs display startup: power on, wait for readiness, select test mode, and enable output. The PC shows LIVE POCKET and actual startup results; settings sent too early are ignored. Episode 07 — Wrong Place repairs the row stride of a 16×8, one-byte-per-pixel framebuffer. The PC grid and D-pad test installed address math; the cover shows visible bytes and off-screen RAM writes. Verify the center and four corners with a 16-byte stride. Episode 08 — Keep Moving fixes a long handler that waits for A release and stalls frame service. Record input and ACK in the handler, apply input in main, then hold A for one second while animation continues and use the D-pad. The runtime supplies safe event waiting; Linux boot remains planned work. Each episode starts with its prerequisite repairs already represented. Reload or Reset episode starts a fresh attempt; changing views preserves it.

Run `bun run dev`, `bun run typecheck`, `bun run build`, and `bun test`. Direct episode routes: `#episode=01&view=station` through `#episode=08&view=station`.

Manual screen-test steps for the new episodes: [Episodes 06–08 verification](docs/15_episode_06_08_verification.md).

## Prototype

Bun + TypeScript + HTML + CSS, deployed as a static site on GitHub Pages. The prototype uses text, buttons, CSS, and ASCII to validate the repair experience.

## Documentation

- [Documentation map and scope](docs/00_project_overview.md)
- [Product vision and problem-first design](docs/01_product_vision.md)
- [Episode roadmap](docs/03_episode_roadmap.md)
- [Canonical Episode data model](docs/08_content_and_data_model.md)
- [Development plan](docs/06_development_plan.md) and [current backlog](docs/13_pm_backlog.md)
- [Coding rules](AGENTS.md)
