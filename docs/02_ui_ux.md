# UI / UX Specification

## Global navigation

The top-left control selects an episode. The view navigation has four entries:

| Label | ID | Purpose |
| --- | --- | --- |
| STATION | `station` | Observe the desk and open its physical objects |
| PC | `pc` | Edit the constrained source and build, flash, and observe serial output |
| DATASHEET | `datasheet` | Look up the Pocket's memory map, device registers, and character codes |
| BOOK | `book` | Study the existing chapters and answer their checks |

RV Pocket is a clickable station object with a `pocket` inspection screen, outside the top navigation. Legacy `workbench` routes map to STATION, `computer` and `terminal` to PC, and `manual` and `ebook` to BOOK.

Any implemented episode can be selected directly. Future roadmap entries are not playable until implemented; no persistent unlock system is needed.

## State and navigation behavior

Keep the selected episode, selected view, and the active episode state separate.

- Switching views preserves both the episode and its current episode state.
- Selecting a different episode creates that episode's initial episode state and preserves the selected view.
- Loading a direct episode URL starts that episode fresh; use STATION if no valid view is specified.
- Selecting an unavailable episode URL falls back to the Prologue with a short explanation.
- Reset episode restores the attempt without changing the episode or view. The PC/Pocket RESET control reboots the installed firmware and preserves the edited source.
- Reloading the page starts fresh. The prototype has no save/load or cross-episode progress persistence.

Each episode starts with the prerequisite repairs represented in its initial state, so jumping to a later episode does not require playing earlier episodes. Narrative continuity does not require carrying mutable state across episodes. The [Episode contract](08_content_and_data_model.md#canonical-episode-contract) defines state creation.

## Views

### STATION

Use CSS and text for the PC monitor, RV Pocket, UART cable, and two separate books. DATASHEET has a green hardware-reference cover; BOOK has a light study-book cover. Each object opens its own view. Episode 01 starts with UART already connected.

### PC

Open the development environment directly: editor on the left, serial terminal on the right, fixed Build & Flash with a secondary RESET below. Stack panels on narrow screens. Build logs stay separate from received serial bytes. The PC shows no internal observation panel and no separate target detail; the Pocket's state is observed on STATION.

Episode 01 permits editing only the byte in `boot.S`. Episode 02 permits editing only the destination address in `store.S`, in the same inline field style. Episode 03 adds a PROGRAM TIMEBASE selector below the source. Episodes 04 and 05 assemble a program from C blocks instead: the loop skeleton is fixed, the player adds and removes blocks, and only the order is a decision. The editable field or block list is the only draft control; every other value on the PC is either a build stage or received output.

### OPEN COVER

The Pocket's cover opens under the device on STATION as a labelled button. Only episodes that declare a cover expose it, so Episode 01 and the Prologue show none. The panel spans the desk below the UART cable and shows the machine's hardware modules as tabs.

Episode 02 declares only RAM, so there is nothing to switch and the target word is already on screen when the cover opens. Episode 03 adds CPU next to RAM; RAM stays selected. Episode 04 returns to RAM alone, showing the button and LED registers. Episode 05 opens on CPU, where the loop-pass, button-read, and heartbeat counters make the cost of polling visible. A module the episode does not declare is not drawn, so the tab row never offers a view that would be empty. UART is deliberately not a module: the serial terminal on the PC already shows it, the way Episode 01 does.

The RAM module is a list of 32-bit words, one row each, with addresses stepping by four bytes and the target word highlighted. A store to an address outside the listed words adds that row, so a wrong destination is never silent. The CPU module shows the program counter and a few registers in Episode 03, and the loop counters in Episode 05.

The Pocket's A button is a real hold control on the station and on the Pocket view, not decoration. Press and release both act, so the LED follows the finger. The press patches the LED indicator, the register rows, and the mission strip in place rather than redrawing, which keeps the focus the player is holding and the reading position in BOOK.

The cover is an observation aid, not a completion gate. Nothing requires it to be opened, and it never blocks another control. It persists across view changes and closes on episode change or Reset episode. Toggling it never interrupts a running diagnostic, and the live timer counter updates its own text rather than redrawing the page, so BOOK reading state and editor focus survive.

### DATASHEET and BOOK

DATASHEET is the authoritative hardware reference, with Memory Map, UART, ASCII, and Timer sections. It has its own navigation and no quiz. The PC's DATASHEET shortcut opens the current episode's reference: UART, Memory Map, or Timer. BOOK retains the existing chapters, search, bookmarks, and checks, with reading state independent of datasheet navigation. Both are accessible from the Prologue and every episode, with a return to PC and STATION available. Neither is a completion gate.

Memory Map shows the Atlantis-inspired RV32G physical layout: 2 GiB RAM, 8 KiB Boot ROM, ACLINT, UART1, I2C0–4, APLIC, and IMSIC. Episode 02's target word, inherited UART destination, word size, and byte order appear in a separate detail table, making the transmitting-versus-storing distinction explicit. UART1 uses IRQ 39 and four-byte register spacing; Timer specifies the fixed 1 GHz timebase, MTIME, and MTIMECMP, and notes that MTIME is read through the RAM module rather than a module of its own.

## Guided interactions

Prefer choices, code tiles, ordering, and small value fields. Later episodes may introduce addresses, registers, and constrained code fragments as the [learning design](04_learning_design.md) permits. Do not turn the prototype into a free-form programming environment.

The mission strip shows the episode, its objective, and the one observed value for that episode. It carries no checklist of subsystems, so a repair is read from the observation and the success banner rather than from a pass/fail list.

Episode 01 begins with `EXPECTED OUTPUT: A` and `RECEIVED: B`. The learner changes `0x42` to `0x41`, then builds and flashes. Only a received `A` from the rebooted firmware completes the repair. Invalid byte input leaves the running firmware intact. A different valid byte boots and shows its actual character, allowing another attempt. See the [Episode 01 script](03_episode_roadmap.md#episode-01--wrong-byte).

Episode 02 begins with the objective naming the target address rather than a received character, because the program's output cannot show where a store went. The introduction explains that reason and points at OPEN COVER. The build produces a new value on every flash, so the player never types a number to match and only the destination matters. Editing the destination alone changes nothing observable: the target word stays empty until the program runs. After a valid Build & Flash and its reset run, the target word holds the value, the terminal receives nothing, and RAM PASS appears. A store to any other valid RAM address adds its own row to the cover and leaves the target word empty, so the player can see where the value actually went. RESET reruns the installed program without changing the draft.

Episode 03 begins with the expected interval and the measured one. The hardware timer runs at a fixed 1 GHz, but the program assumes 2 GHz and requests two billion ticks for its intended one-second wait. Selecting a different PROGRAM TIMEBASE updates the draft target in the source preview; Build & Flash applies it and restarts measurement. Because MTIME is a memory-mapped register, it is a row in the RAM module rather than a tab of its own, and the CPU module shows the register the program is comparing against. MTIME keeps counting across a firmware reset while the wait measurement restarts. The assumed timebase stays on the PC, so the two views stay in their roles. Two ticks with the correct 1 GHz assumption establish the one-second interval and complete the repair. Live ticks update only the serial output, cover observations, indicators, and mission status, preserving the BOOK's reading controls. Completion shows BASIC DIAGNOSTICS COMPLETE and points toward display bring-up.

Episode 04 begins with the objective naming a press, not a value. The inherited program reads the button and never writes the LED, so holding the A button does nothing while the button register under OPEN COVER reports the press. The player adds the missing blocks, in order, and Build & Flash. Success requires an actual press and release, so the repair cannot be finished by configuring alone. The PC's status line describes the draft: whether it turns the LED on, whether it inverts, and whether the read happens before the test.

Episode 05 begins with Episode 04's program still working and a loop that never stops asking. The CPU module counts loop passes, button reads, and a heartbeat that stands for the second job waiting below the loop. All three climb together while nothing is pressed, which is the defect: the reads were never caused by input. Adding the wait block at the top of the body makes the read count stop climbing while the button is untouched, and the heartbeat advances only on the passes that reach it. The counters update on their own tick and patch only their own text, so the loop runs whether or not the cover is open and never interrupts reading or editing.

## Feedback

Display the episode Problem and Objective before an explanation. Invalid actions should explain the observed machine behavior and allow immediate retry. Successful repair must produce both a machine result and a clear completion message.

Use text, CSS, and ASCII for feedback. A terminal character, PASS status, changing counter, or simple block on a screen can carry the reward without graphical assets.
