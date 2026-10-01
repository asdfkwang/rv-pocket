# RV-01 Platform and Story Contract

This is the shared reference for episode authors and Ebook authors. It describes the fictional teaching platform and the evidence the player can inspect. It is not a statement that the current prototype implements a complete machine.

## The unfinished product

The player's parents closed their small game studio before its last pocket-computer prototype and game could ship. The board is not uniformly dead: a development computer still supplies initialization, diagnostics, and inspection tools. Different unfinished software paths produce different failures.

The development objective is a reproducible release: install a clean image, apply power, boot Linux, and run the old game with working display, input, audio, and persistent saves. A successful repair must retain the capabilities already established by earlier repairs.

The failures are software, configuration, sequencing, or integration defects unless explicitly stated otherwise. A failed memory test is not automatically a damaged RAM chip, and editing software must not magically repair physical damage.

## Two independent development paths

| Path | Starting condition | What it can establish |
| --- | --- | --- |
| Development/debug link | Already attached and working | Load or launch the supplied diagnostic; inspect its completion, RAM log, and instrumented transmit events |
| UART serial cable | Disconnected in Episode 01 | Carry transmitted board characters to the separate host receive terminal |

The developer trace is a provided debugging instrument. It is not output secretly delivered over the broken UART connection. A trace observation and a received serial character are different evidence. The final product will no longer depend on the development link for initialization.

## Episode 01 assumptions

- Power, the diagnostic launcher, the small working RAM region, and the UART transmitter are functional.
- UART initialization and matching serial settings are supplied. Baud rate, parity, FIFO configuration, interrupts, and instruction encoding are outside this repair.
- A diagnostic run generates one byte, decimal `65` / hexadecimal `0x41`, displayed as `A`.
- Its initial destination is `RAM log`. The other editable destination is `UART transmit`.
- `RAM log` appends one byte to the diagnostic's buffer. It does not cause a UART transmit event.
- `UART transmit` sends one byte, including when the serial cable is disconnected. A disconnected host receives nothing. Reconnecting later does not replay the missed transmission.
- Connecting a cable or changing the destination never runs the diagnostic implicitly.
- The receive terminal contains only actual received board bytes. Inspection text, feedback, and the RAM log never enter it. Local echo is disabled.
- Changing the destination affects the next run; recorded runs retain their original settings and observations.

### Deterministic observation table

Counts below are increments for one run, not accumulated totals.

| Destination | Cable | RAM log append | UART transmit events | Host receive append |
| --- | --- | --- | --- | --- |
| RAM log | Disconnected | `A` | 0 | nothing |
| RAM log | Connected | `A` | 0 | nothing |
| UART transmit | Disconnected | nothing | 1 | nothing |
| UART transmit | Connected | nothing | 1 | `A` |

Completion requires a UART destination, a connected cable, and at least one actual received `A` in the current attempt. There is no reading, quiz, or forced-order gate. Reset restores the disconnected cable, RAM destination, empty records, and empty terminal. View changes preserve the attempt.

## Teaching memory map

These addresses are invented for RV-01. They are not addresses required by the RISC-V ISA, and they do not specify a standard commercial UART.

| Region | Address / range | Meaning |
| --- | --- | --- |
| Main RAM | `0x80000000–0x8fffffff` | Planned 256 MiB physical address range; the prototype models only the locations its current episode needs |
| Diagnostic work area | `0x80000000–0x80000fff` | Reserved for the supplied diagnostic; never include it in a destructive RAM test |
| Diagnostic RAM log | Starts at `0x80001000` | A byte buffer; the named log operation advances to the next slot |
| Safe introductory RAM test window | `0x80002000–0x80002fff` | A supplied scratch window for Episode 02 |
| UART resource | `0x10000000–0x10000fff` | Device space, not ordinary RAM |
| UART `TX_DATA` | Base + `0x00` | Byte write requests transmission; do not read it as a stored RAM byte |
| UART `STATUS` | Base + `0x04` | 32-bit read; bit 0 is `TX_READY`; supplied as ready for Episode 01 |

Episode 01 exposes named destinations rather than numeric addresses. The Ebook can use the map to explain why those destinations differ. Address entry is introduced only when a later episode needs it. Other peripherals receive exact register contracts with their episode specifications, not speculative register banks now.

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
