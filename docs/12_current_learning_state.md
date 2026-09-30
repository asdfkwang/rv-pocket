# Prior Study Material and Game Mapping

This is a historical inventory of material discussed before the mission-based game roadmap. It does not report implemented chapters, a player's saved progress, or completed Manual pages.

## Separate numbering systems

Earlier lessons and quizzes use **Study Module NN**. The game uses **Chapter NN**, defined only in the [chapter roadmap](03_chapter_roadmap.md). There is no numeric one-to-one mapping.

In particular, the old “Chapter 12 quiz” is **Study Module 12**: register/PC tracing with `add` and `addi`. Its material belongs mainly in game Chapter 07 — Wrong Place. Game Chapter 12 — The Old Input is the later stale-cache/RAM-buffer mission.

## Material already discussed

| Prior study content | Candidate game destination |
| --- | --- |
| CPU, RAM, UART, Timer, Interconnect | Chapter 01 uses only minimal CPU/RAM/UART roles; timer belongs in 03 and wider address-routing detail in 06 |
| Bit, byte, address, read/write | Chapter 02 |
| Timer/counter and polling | Chapters 03–04 |
| Memory map and MMIO | Basic input access in 04, expanded device mapping in 06 |
| IRQ and interrupt controllers | Conceptual event/handler/resume in 05; internals/controller work in 19 |
| Registers, PC, ALU, fetch/decode/execute, `x0`, `add`, `addi`, immediates | Chapter 07 |
| DMA and bus-master behavior | Chapter 10 |
| Cache, hit/miss, cache line, dirty data, clean/writeback | Chapter 11 |
| CPU/DMA stale data and cache coherency | Chapter 12 |
| Memory ordering and RISC-V `FENCE` | Chapter 13 |

This is a topic mapping, not permission to insert every prior explanation into the first Manual page. Adapt depth to the [learning design](04_learning_design.md).

## Latest recorded study position

Study Module 12 reached instruction sequences such as:

```asm
addi x5, x0, 10
addi x6, x0, 20
add  x7, x5, x6
```

with register and PC tracing. These introductory examples assume 4-byte instructions; that is a teaching restriction, not a claim about all RISC-V encodings.

A five-question Study Module 12 quiz was started. The historical note records the first answer as correct with `x7 = 17`, but does not reproduce its question. The example above produces `x7 = 30`; do not attach the recorded quiz answer to it. The five-question study quiz does not define the size of the game's Chapter 01 quiz.

## Next study topic to adapt

Load/store, RAM ↔ register movement, base+offset addressing, and effective-address calculation are the next study topics. In the game, they belong in Chapter 08 — Missing Data, where moving data from RAM into the display path creates a concrete need for them.
