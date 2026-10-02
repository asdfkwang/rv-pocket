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

Open the development environment directly: editor on the left, serial terminal and target status on the right, fixed Build & Flash and RESET controls below. Stack panels on narrow screens. Build logs stay separate from received serial bytes. Episode 01 permits editing only the byte in `boot.S`. Episode 02 adds START/END fields, RUN, and a memory map that highlights overlap with the draft range. Episode 03 adds a clock-source selector and an inspector showing applied clock, target ticks, and configured and observed delays.

### DATASHEET and BOOK

DATASHEET is the authoritative hardware reference, with Memory Map, UART, ASCII, and Timer sections. It has its own navigation and no quiz. The PC's DATASHEET shortcut opens the current episode's reference: UART, Memory Map, or Timer. BOOK retains the existing chapters, search, bookmarks, and checks, with reading state independent of datasheet navigation. Both are accessible from the Prologue and every episode, with a return to PC and STATION available. Neither is a completion gate.

## Guided interactions

Prefer choices, code tiles, ordering, and small value fields. Later episodes may introduce addresses, registers, and constrained code fragments as the [learning design](04_learning_design.md) permits. Do not turn the prototype into a free-form programming environment.

Episode 01 begins with `EXPECTED OUTPUT: A`, `RECEIVED: B`, and `UART ?`. The learner changes `0x42` to `0x41`, then builds and flashes. Only a received `A` from the rebooted firmware produces `UART PASS`. Invalid byte input leaves the running firmware intact. A different valid byte boots and shows its actual character, allowing another attempt. See the [Episode 01 script](03_episode_roadmap.md#episode-01--wrong-byte).

Episode 02 begins with `UART PASS`, `RAM ?`, and `TIMER ?`. RUN retries the selected range, producing changing error addresses inside MEMTEST WORKAREA while the range overlaps it. END is excluded. A non-empty range outside the workspace produces RAM PASS and the checked byte count, also shown on the Pocket's diagnostic readout. Build & Flash installs the range; RESET tests the installed range without changing the draft.

Episode 03 begins with `UART PASS`, `RAM PASS`, and `TIMER ?`. The running 5 MHz clock produces a serial tick and LED pulse every two seconds. Selecting a different source edits the draft; Build & Flash applies it and restarts measurement. Two ticks at 10 MHz establish the one-second interval and TIMER PASS. Live ticks update only the serial output, inspector, indicators, and mission status, preserving the BOOK's reading controls. Completion shows BASIC DIAGNOSTICS COMPLETE and points toward display bring-up.

## Feedback

Display the episode Problem and Objective before an explanation. Invalid actions should explain the observed machine behavior and allow immediate retry. Successful repair must produce both a machine result and a clear completion message.

Use text, CSS, and ASCII for feedback. A terminal character, PASS status, changing counter, or simple block on a screen can carry the reward without graphical assets.
