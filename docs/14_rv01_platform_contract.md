# RV-01 Platform and Story Contract

This is the shared reference for episode authors and Ebook authors. It describes the fictional teaching platform and the evidence the player can inspect. It is not a statement that the current prototype implements a complete machine.

RV Pocket is a single-hart RV32G teaching SoC adopting the low-address layout of Tenstorrent Atlantis. Atlantis's QEMU model is a separate RV64 platform; RV Pocket omits its high DDR alias, additional UARTs, PRCM, and SoC-specific processor complexity. Shared addresses and the 1 GHz timer follow [QEMU's Atlantis platform source](https://github.com/qemu/qemu/blob/master/hw/riscv/tt_atlantis.c); the episode-specific diagnostic workspace is an RV Pocket software allocation.

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
- UART1 occupies `0xD4110000–0xD411FFFF`, with IRQ 39, four-byte register spacing (`reg-shift = 2`), and 32-bit register access (`reg-io-width = 4`). With supplied initialization setting DLAB = 0, offset zero is THR on write and RBR on read. A 32-bit write sends bits [7:0] as one serial byte; upper bits are ignored.
- Editing a byte does not change the installed firmware. Build & Flash displays BUILD, FLASH, and RESET stages, then boots the edited byte.
- Invalid input leaves installed firmware and received output unchanged. Any valid byte can be tested; only `0x41` received as `A` completes the repair.
- RESET on the PC or Pocket retransmits the installed byte and does not flash the draft. Reset episode restores inherited `B`, draft `0x42`, and an empty build log, preserving the selected view.
- The terminal displays the latest boot's received byte. Control bytes use visible escaped forms. The Pocket's TX indicator pulses on boot; the display remains black.
- Changing views preserves the attempt. Resetting or selecting a different episode cancels an unfinished Build & Flash attempt.
- There is no reading, quiz, or forced-order gate. Later episodes start with earlier repairs represented in their own initial fixtures.

## DATASHEET and BOOK

DATASHEET is the device reference: memory-map ranges, UART register behavior, ASCII character codes, and timer clock behavior. BOOK contains the existing computer-systems study chapters, search, and checks. They are separate station objects and views. Device addresses are taken from DATASHEET; illustrative textbook examples are not a replacement for the device specification.

## Episode 02 — Wrong Destination

- UART is already repaired. The supplied `store.S` program is `li t0, [destination] / li t1, <value> / sw t1, 0(t0)`. Only the destination is editable; the value is chosen by the build.
- The inherited destination is the UART1 DATA address, `0xD4110000`, so the 32-bit store transmits bits [7:0] and the terminal receives a character. The target word at `0x00002000` stays `0x00000000`.
- A valid destination is four-byte aligned and is either inside the RAM region, `0x00000000–0x7FFFFFFF`, or the UART1 DATA address. Boot ROM is read-only, and other device writes are outside this repair. Invalid input is rejected before installing, leaving the installed program and last result intact.
- The goal is any value at `0x00002000`. A store there completes the repair and transmits nothing. Because the build produces a new value on every flash, the repair is the destination rather than a number to type.
- Success is judged on the current run: the store must land on the target address in the same execution that follows the latest flash. An earlier correct value cannot carry a later wrong program.
- Editing the destination is a draft. Build & Flash installs it and boots; RESET reruns only the installed program, preserving the draft.
- Serial output cannot show where a store went, so Episode 02 introduces OPEN COVER. The cover shows the machine's hardware modules as tabs. Episode 02 declares only RAM, so the target word is already on screen. The RAM module is a list of 32-bit words with addresses stepping by four bytes, and a store to an address outside the listed words adds its own row so a wrong destination is never silent. No full RAM array exists; only the displayed words are tracked. The cover is an observation aid, never a completion gate, and completing the repair requires no reading or quiz.

## Episode 03 — Wrong Clock

- UART and RAM are already repaired. ACLINT occupies `0xA2180000–0xA218FFFF`; MTIME is at base + `0x0000` and hart 0's MTIMECMP at base + `0x8000`. Both registers are 64-bit; the supplied RV32 diagnostic handles accesses through 32-bit halves.
- The actual timer rate is fixed at 1,000,000,000 Hz: one tick per nanosecond. This is a timer frequency, not a CPU clock specification.
- The inherited program assumes a 2 GHz timebase. Its intended one-second target becomes 2,000,000,000 ticks, taking two seconds on the actual timer. A 1 GHz assumption requests 1,000,000,000 ticks and takes one second; 500 MHz requests 500,000,000 ticks and takes half a second.
- The TIMER INSPECTOR from the PC prototype has moved to the STATION cover. MTIME is a memory-mapped register, so it is a row in the RAM module rather than a module of its own, and the CPU module shows the program counter and the register being compared against. The program assumption stays on the PC, keeping the PC for settings and the cover for observation. The counter is shown as a 32-bit word of the 64-bit register, enough to see it advance, and updates at 100 ms intervals by patching only its own text rather than redrawing the page.
- PROGRAM TIMEBASE edits the diagnostic's conversion assumption. Build & Flash installs it and restarts the diagnostic. RESET restarts measurement with the installed assumption, preserving the draft. These operations do not alter the hardware timer frequency, and neither restarts MTIME itself.
- Each live tick sends a serial line and pulses the TX and timer indicators. Observed delay is measured with the browser's monotonic clock between consecutive ticks.
- Applying the correct 1 GHz program timebase and observing an interval within 200 ms of one second completes TIMER PASS. A completed observation stays verified until RESET or flashing; later browser scheduling delays do not revoke it.
- Tick updates preserve reading and editing controls. Changing views leaves the diagnostic running; leaving the episode cancels its pending ticks.
- All three checks produce BASIC DIAGNOSTICS COMPLETE. The display remains black, awaiting its own bring-up episode.

## Physical memory map

The address ranges below inherit Atlantis's low-address layout. They include both endpoints. RV Pocket maps RAM directly at low addresses and has no DDR_HI window above 4 GiB. Gaps are unassigned. These addresses are platform choices, not requirements of the RISC-V ISA. `src/platform.ts` is the shared source for the browser's hardware reference and device constants.

| Block | Address range | Size | Meaning |
| --- | --- | --- | --- |
| RAM / DDR_LO | `0x00000000–0x7FFFFFFF` | 2 GiB | RAM in the RV32G low address space |
| BOOTROM | `0x80000000–0x80001FFF` | 8 KiB | Reset and boot ROM; reset vector `0x80000000` |
| M-IMSIC | `0xA0000000–0xA01FFFFF` | 2 MiB | Machine-mode MSI interrupt files |
| ACLINT | `0xA2180000–0xA218FFFF` | 64 KiB | Machine timer / 1 GHz |
| S-IMSIC | `0xA4000000–0xA41FFFFF` | 2 MiB | Supervisor-mode MSI interrupt files |
| M-APLIC | `0xCC000000–0xCFFFFFFF` | 64 MiB | Machine external interrupt controller |
| I2C0 | `0xD4040000–0xD404FFFF` | 64 KiB | DesignWare I²C / IRQ 33 |
| I2C1 | `0xD4050000–0xD405FFFF` | 64 KiB | DesignWare I²C / IRQ 34 |
| I2C2 | `0xD4060000–0xD406FFFF` | 64 KiB | DesignWare I²C / IRQ 35 |
| I2C3 | `0xD4070000–0xD407FFFF` | 64 KiB | DesignWare I²C / IRQ 36 |
| I2C4 | `0xD4080000–0xD408FFFF` | 64 KiB | DesignWare I²C / IRQ 37 |
| UART1 | `0xD4110000–0xD411FFFF` | 64 KiB | Console / IRQ 39 |
| S-APLIC | `0xE8000000–0xEBFFFFFF` | 64 MiB | Supervisor external interrupt controller |

The AIA interrupt path is peripheral → APLIC → IMSIC → CPU. Its reference contract has 128 interrupt sources per APLIC and 255 MSI IDs per IMSIC. These controllers and I²C blocks are address-map references for later episodes; they are not simulated by the current browser prototype. PRCM and UART0/2/3/4 remain outside this revision.

### Episode 02 observed locations

| Item | Address | Role |
| --- | --- | --- |
| Target word | `0x00002000–0x00002003` | The 32-bit word the store program is expected to fill |
| Inherited destination | `0xD4110000` | UART1 DATA, so the value is transmitted instead of stored |
| MTIME (Episode 03) | `0xA2180000` | Memory-mapped timer counter, read through the same RAM module |

The target word is one 32-bit location inside the platform's 2 GiB RAM region, not a window the program owns. RISC-V is byte-addressed, and the supplied store is a 32-bit word store, so the cover's rows step by four bytes. Stores are little-endian, so a word like `0x12345678` appears at increasing byte addresses as `78 56 34 12`. The prototype tracks only the words the cover displays rather than allocating a RAM array, and it simulates UART transmission, a destination-dependent store, and timebase-dependent timer waits in Episodes 01–03. It does not allocate or emulate the full 2 GiB RAM region.

## Boundaries for later material

- The target is a single-hart RV32G system. Its eventual Linux execution environment must define the privilege and address-translation capabilities it needs; the ISA base alone does not specify those. Instruction examples state their width and supported subset; the prototype is not a full ISA implementation.
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
