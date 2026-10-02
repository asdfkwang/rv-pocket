# Learning Design

> Easy to read, hard to solve, always searchable.

## Manual inside the episode

The [product vision](01_product_vision.md#problem-first-design) defines the problem-first loop. The Manual answers questions raised by the malfunction and remains available while the player experiments. It is not a mandatory lesson screen before tools become usable.

Use explanations, small diagrams, and examples relevant to the current episode and its prerequisites. The Prologue contains interface help only. Episode 01's exact content and three-question quiz are specified in the [roadmap](03_episode_roadmap.md#episode-01--output-in-the-wrong-place).

## Quiz policy

Quizzes live in the Manual and check reasoning rather than vocabulary recall. Show an explanation after each answer and allow retry. They do not unlock tools or determine repair completion; the machine's repaired behavior does.

Episode 01 has exactly three short questions. Later episodes should use only the questions needed to reveal likely misconceptions, usually three to five, with no mandatory five-question template. Keep reading and quizzes short enough that the player can return to the repair quickly.

Useful question forms include state tracking, address routing, CPU/peripheral responsibility, operation ordering, and eventually register/PC tracing. Introduce each form only after its required concepts are available.

## Open book, open web

Quizzes and episodes are open-book/open-web by design. A player who cannot recall an answer is expected to search the Manual, follow related chapters, check the official specification, or search the internet. What matters is knowing what to look for and solving the problem, not memorization. A hard Check never has to be answerable from the Manual text alone.

## Prerequisite boundaries

| Game episode | What the player works with | What remains deferred |
| --- | --- | --- |
| 01 | CPU/RAM/UART roles and one guided transmit request | SoC internals, address math, CPU instruction execution |
| 02–03 | RAM addresses/data and a named timer control | CPU registers, PC, assembly handlers |
| 04 | Input polling and basic MMIO read/write through a button and an LED | CPU registers, PC, assembly handlers |
| 05 | When work runs: an unconditional loop versus waiting for a change | Trap/CSR internals, interrupt controller setup |
| 06–07 | Display control and memory map with a simple test pattern, then pixel math | Trap/CSR internals |
| 08 | Notification, pause, handle event, resume interrupted work | Implementation of saving/restoring context, stack, trap CSRs |
| 09–10 | CPU registers, PC, arithmetic, load/store, branches | Trap/CSR internals |
| 15–16 | Calls/stack, followed by fault diagnosis, saved PC and trap CSR introduction | Full interrupt-controller configuration |
| 20 | Interrupt internals and controller state using earlier CPU/trap knowledge | No new early-episode prerequisite |

The [roadmap](03_episode_roadmap.md) owns episode numbers and repair details. Device registers in early MMIO episodes are peripheral control/status locations; they are not the CPU register file taught in Episode 09.

For Episode 08, “save/return” means that interrupted work resumes correctly. Use a supplied event/handler/resume model. Do not require an assembly prologue, PC calculation, CSR manipulation, or trap-return instruction to complete that early repair.

Episode 05 names the concept as polling cost, not as an interrupt. The player learns that re-reading a register forever is real work with a real cost, and that waiting for change is a decision the program can make on its own. The interrupt controller is still deferred to Episode 20.

## Interaction progression

- Early: named controls, guided choices, supplied values, and direct feedback; address entry begins when the episode teaches addresses.
- Middle: trace registers, reorder operations, inspect multiple hardware states, and edit bounded instruction sequences.
- Late: diagnose boot logs, fill Device Tree fragments, repair constrained driver snippets, and write a short commit message.

Increase freedom only when it supports the repair. The prototype does not require a full parser or compiler. See [UI / UX](02_ui_ux.md#guided-interactions) for interaction behavior.

## Reuse without false generalization

Revisit familiar hardware under Linux: MMIO becomes driver access, button events become Linux IRQ/input handling, and DMA/cache problems motivate the DMA API.

Keep the mental models accurate when simplifying:

- Receiving one UART character proves a limited diagnostic path, not complete machine health.
- Peripheral MMIO and cacheable RAM buffers have different roles.
- Cache clean/invalidate and memory ordering solve different problems.
- Early IRQ context preservation is supplied behavior, not a claim that every register is automatically saved by hardware.
- Introductory PC examples use a deliberately restricted set of 4-byte instructions; do not imply that every RISC-V instruction is always 4 bytes.

Earlier study material is reusable content, not game progress. Map it by topic using the [learning inventory](12_current_learning_state.md), not by matching numbers.
