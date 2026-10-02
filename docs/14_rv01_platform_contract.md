# RV-01 Platform and Story Contract

This is the shared reference for episode authors and Ebook authors. It describes the fictional teaching platform and the evidence the player can inspect. It is not a statement that the current prototype implements a complete machine.

## The unfinished product

The player's parents closed their small game studio before its last pocket-computer prototype and game could ship. The board is not uniformly dead: a development computer still supplies initialization, diagnostics, and inspection tools. Different unfinished software paths produce different failures.

The development objective is a reproducible release: install a clean image, apply power, boot Linux, and run the old game with working display, input, audio, and persistent saves. A successful repair must retain the capabilities already established by earlier repairs.

The failures are software, configuration, sequencing, or integration defects unless explicitly stated otherwise. A failed memory test is not automatically a damaged RAM chip, and editing software must not magically repair physical damage.

## Development connections

The development PC can install the supplied boot project and reset the Pocket. The UART cable is already connected in Episode 01 and carries the Pocket's transmitted byte to the PC's serial terminal. Build logs and inspection text never enter the receive terminal. The final product will no longer depend on the development PC for initialization.

## Episode 01 — Wrong Byte

- The parents' last `boot.S` project is open. Power, UART initialization, and fixed 115200-baud serial settings are supplied.
- The inherited firmware sends `0x42`, observed as `B`. The expected output is `A`.
- Only the byte in `li t1, [0x42]` is editable. This is a constrained simulation, with no full assembler, compiler, or emulator.
- The UART DATA address is `0xD4110000`. A 32-bit store sends bits [7:0] as one serial byte; upper bits are ignored.
- Editing a byte does not change the installed firmware. Build & Flash displays BUILD, FLASH, and RESET stages, then boots the edited byte.
- Invalid input leaves installed firmware and received output unchanged. Any valid byte can be tested; only `0x41` received as `A` completes the repair.
- RESET on the PC or Pocket retransmits the installed byte and does not flash the draft. Reset episode restores inherited `B`, draft `0x42`, and an empty build log, preserving the selected view.
- The terminal displays the latest boot's received byte. Control bytes use visible escaped forms. The Pocket's TX indicator pulses on boot; the display remains black.
- Changing views preserves the attempt. Resetting or selecting a different episode cancels an unfinished Build & Flash attempt.
- There is no reading, quiz, or forced-order gate. Later episodes start with earlier repairs represented in their own initial fixtures.

## DATASHEET and BOOK

DATASHEET is the device reference: memory-map ranges, UART register behavior, ASCII character codes, and timer clock behavior. BOOK contains the existing computer-systems study chapters, search, and checks. They are separate station objects and views. Device addresses are taken from DATASHEET; illustrative textbook examples are not a replacement for the device specification.

## Episode 02 — False Memory Failure

- UART is already repaired. The supplied `memtest.S` diagnostic initially tests START `0x00000000` to excluded END `0x00002000`.
- MEMTEST WORKAREA occupies `[0x00001800, 0x00001A00)`. Destructive testing over any part of it creates false failures; repeated runs vary the reported addresses within the overlap.
- A valid range is non-empty and inside the diagnostic RAM window. Any such range that excludes the workspace passes. `[0x00001A00, 0x00002000)` reports 1536 bytes checked and 0 errors.
- RUN tests the draft range. Build & Flash installs and runs that range; RESET reruns the installed range while preserving the draft. Invalid input leaves the installed range and last result intact.
- Serial output and the Pocket diagnostic readout show the last test's result. RAM PASS completes the episode without a reading or quiz gate.

## Episode 03 — Wrong Clock

- UART and RAM are already repaired. The supplied `timer.S` diagnostic uses TIMER at `0xA2180000` and a fixed 10,000,000-tick target.
- The active counter rate equals the installed clock source: 5 MHz gives two seconds, 10 MHz gives one second, and 20 MHz gives half a second per diagnostic tick.
- The clock selector edits a draft. Build & Flash installs it and restarts the diagnostic. RESET restarts measurement with the installed source, preserving the draft.
- Each live tick sends a serial line and pulses the TX and timer indicators. Observed delay is measured with the browser's monotonic clock between consecutive ticks.
- Applying 10 MHz and observing an interval within 200 ms of one second completes TIMER PASS. A completed observation stays verified until RESET or flashing; later browser scheduling delays do not revoke it.
- Tick updates preserve reading and editing controls. Changing views leaves the diagnostic running; leaving the episode cancels its pending ticks.
- All three checks produce BASIC DIAGNOSTICS COMPLETE. The display remains black, awaiting its own bring-up episode.

## Teaching memory map

These addresses are invented for RV Pocket and are not prescribed by the RISC-V ISA. The early diagnostic memory window is not a complete Linux system memory map.

| Region | Address / range | Meaning |
| --- | --- | --- |
| Diagnostic RAM window | `0x00000000–0x00001FFF` | 8 KiB teaching window for the supplied diagnostics |
| MEMTEST WORKAREA | `0x00001800–0x000019FF` | Reserved diagnostic workspace inside RAM; exclude from destructive tests |
| Safe upper test window | `0x00001A00–0x00001FFF` | 1536 bytes outside the diagnostic workspace |
| UART DATA | `0xD4110000` | Write-only device register; a 32-bit store transmits the low byte |
| TIMER | `0xA2180000` | Diagnostic counter driven by the installed 5, 10, or 20 MHz source |

The prototype simulates UART transmission, workspace overlap during memory diagnostics, and clock-dependent timer intervals in Episodes 01–03. Additional registers and the full system memory map remain future work.

## Boundaries for later material

- The planned Linux-capable target is a single-hart RV64 system with the privilege and address-translation capabilities needed for its eventual OS. Instruction examples state their width and supported subset; the prototype is not a full ISA implementation.
- RAM, CPU registers, device registers, CPU virtual addresses, physical addresses, and DMA addresses must be named distinctly. A Linux DMA address must not be inferred from a C pointer.
- The teaching DMA/cache scenarios explicitly use non-coherent device access to RAM. MMIO is not treated as an ordinary stale cached input register.
- Cache maintenance, ownership transfer, and ordering are separate operations. Educational cache actions are platform abstractions, not invented universal RISC-V instructions.
- Early interrupt handling supplies context preservation. Detailed stack/CSR/trap behavior is introduced only when needed; the hardware is not claimed to save every register automatically.
- Firmware prepares the execution environment; Linux still needs its own device discovery, ownership, initialization, and lifetime handling. A bare-metal device working once does not establish a correct Linux driver.
- Temporary filesystem state and persistent storage are different. A filesystem success message alone does not prove a save survives a cold boot.
- The actual kernel execution environment and later peripheral contracts remain future engineering decisions. Scripted logs can prototype a story, but do not count as a running Linux kernel.

## State continuity and evidence

Each episode begins with a reproducible fixture that includes the prior repairs. Direct episode selection remains possible; the prototype does not require a save system. A fixture should specify what is already working, what is deliberately broken, and which observations would disprove the player's first hypothesis.

In later Linux episodes, distinguish a real captured trace, an executable simulation, and an illustrative log. Never present invented test output as validation from an actual kernel.
