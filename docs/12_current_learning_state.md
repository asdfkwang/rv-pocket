# Prior Study Material and Game Mapping

This is a historical inventory of material discussed before the problem-driven game roadmap. It does not report implemented episodes, a player's saved progress, or completed Manual pages.

## Separate numbering systems

Earlier lessons and quizzes use **Study Module NN**. The game uses **Episode NN** (plus an unnumbered **Prologue** opening), defined only in the [episode roadmap](03_episode_roadmap.md). Manual knowledge units will use a separate **Manual Chapter NN** system with no numeric mapping to episodes. There is no numeric one-to-one mapping between any of these systems.

In particular, the old “Chapter 12 quiz” is **Study Module 12**: register/PC tracing with `add` and `addi`. Its material belongs mainly in game Episodes 09–10, which introduce CPU execution. Game Episode 12 — The Old Input is the later stale-cache/RAM-buffer repair.

## Material already discussed

| Prior study content | Candidate game destination |
| --- | --- |
| CPU, RAM, UART, Timer, Interconnect | Episode 01 uses only minimal CPU/RAM/UART roles; timer belongs in 03 and wider address-routing detail in 06 |
| Bit, byte, address, read/write | Episode 02 |
| Timer/counter and polling | Episodes 03–04 |
| Memory map and MMIO | Basic input access in 04, expanded device mapping in 06 |
| IRQ and interrupt controllers | Conceptual event/handler/resume in 05; internals/controller work in 19 |
| Registers, PC, ALU, fetch/decode/execute, `x0`, `add`, `addi`, immediates | Episodes 09–10 |
| DMA and bus-master behavior | Episode 10 |
| Cache, hit/miss, cache line, dirty data, clean/writeback | Episode 11 |
| CPU/DMA stale data and cache coherency | Episode 12 |
| Memory ordering and RISC-V `FENCE` | Episode 13 |

This is a topic mapping, not permission to insert every prior explanation into the first Manual page. Adapt depth to the [learning design](04_learning_design.md).

## Latest recorded study position

Study Module 12 reached instruction sequences such as:

```asm
addi x5, x0, 10
addi x6, x0, 20
add  x7, x5, x6
```

with register and PC tracing. These introductory examples assume 4-byte instructions; that is a teaching restriction, not a claim about all RISC-V encodings.

A five-question Study Module 12 quiz was started. The historical note records the first answer as correct with `x7 = 17`, but does not reproduce its question. The example above produces `x7 = 30`; do not attach the recorded quiz answer to it. The five-question study quiz does not define the size of the game's Episode 01 quiz.

## Next study topic to adapt

Load/store, RAM ↔ register movement, base+offset addressing, and effective-address calculation are the next study topics. Episode 07 — Wrong Place uses a bounded framebuffer byte-address calculation without register tracing. CPU execution and explicit RAM-to-register work belong to the later CPU episodes. Episode 08 — Keep Moving instead teaches short handlers and input/frame event processing.
