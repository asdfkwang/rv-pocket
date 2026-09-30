# Mission Chapter Roadmap

This roadmap is organized around **broken behavior and repair objectives**, not academic topic names.

The Manual contains the theory and quizzes needed to solve each mission.

Display/pixel work is intentionally not the first major repair; the player first gains diagnostic access and repairs simpler subsystems.

This is the authoritative numbering for game Chapters 00–33. Earlier **Study Module** numbers belong to a separate sequence; see the [learning inventory](12_current_learning_state.md). All chapters below are planned, not implemented.

Use the [canonical Chapter contract](08_content_and_data_model.md#canonical-chapter-contract) for implementation and the [learning design](04_learning_design.md) for depth and quiz policy. Chapter 00 is onboarding; every later chapter starts with a malfunction or concrete repair objective and ends with an observable result.

---

## Chapter 00 — Before You Begin

**Mission:** Understand what was left behind and learn the interface.

- Story setup.
- Chapter selector.
- Workbench / Computer / Manual views.
- No hardware lesson or quiz; the Manual contains interface help only.
- Start Chapter 01 action.

**Result:** Player is ready to begin repairs.

---

# Act I — Bring the machine back to life

## Chapter 01 — Is Anyone There?

**Mission:** Power is on, but the screen is black and the host terminal is silent. Obtain the machine's first UART response.

This is the first vertical slice. Success means receiving one `A`, not repairing the display or learning the complete SoC.

### Initial state and supplied tools

- The board has enough working CPU/RAM to run a supplied diagnostic; RAM correctness is investigated in Chapter 02.
- The UART cable is disconnected and the host terminal is empty.
- Workbench offers RV Pocket inspection and the cable connection. Computer offers a terminal and one guided transmit task.
- A successful diagnostic proves this narrow path works; it does not certify the entire machine.

### Mission script

1. Show the silent machine and the repair objective.
2. Let the player inspect RV Pocket and find its UART connector.
3. Offer the Manual as a clue when they need to identify the output path.
4. Connect the UART cable in Workbench.
5. In Computer, select UART as the output device and run the supplied diagnostic with the displayed value `65 ('A')`.
6. The board's diagnostic requests UART transmission; the connected host terminal receives `A`.
7. Show “UART response received. The machine is alive.” Offer Chapter 02 once implemented; until then, show it as the next planned repair without an active navigation action.

Steps 3–5 can be explored in any order. Running without the cable shows no received character and explains the disconnected path. Selecting CPU or RAM as the output device explains its role and allows retry. Cable connection alone must not print `A`, and host-local echo must not count as the board's response.

### Manual and quiz scope

Use one short page: CPU executes instructions, RAM stores data, and UART is a separate peripheral that handles serial communication. Explain that the cable connects this output to the development computer. Supply the `65 ('A')` mapping without testing number conversion.

Include exactly three short reasoning questions:

1. Which part handles serial transmission after software requests it? **UART.**
2. Does a silent built-in screen alone prove the CPU is dead? **No; UART offers another way to observe a response.**
3. Why does a successful transmit request produce no received character with the cable disconnected? **The path to the host terminal is disconnected.**

Quizzes provide feedback inside the Manual; they do not gate running the diagnostic or completing the repair.

### Completion and exclusions

**Repair result:** The machine says `A` through UART. Completion checks the connected cable and received terminal output, as represented in the [content model](08_content_and_data_model.md#chapter-01-state-and-completion).

Do not require a full SoC tour, interconnect, MMIO/address calculations, baud rates, CPU registers, PC, RISC-V instructions, or a free-form program. Reset clears the terminal and disconnects the cable; switching views preserves both.

## Chapter 02 — Bad Memory

**Mission:** Diagnostics show inconsistent values. Verify the RAM.

Player actions:

- write test values to addresses,
- read them back,
- identify address/data mistakes,
- complete a small RAM diagnostic.

**Manual topics:** bit, byte, address, data, read, write.

**Repair result:** RAM diagnostic changes to PASS.

## Chapter 03 — Too Fast

**Mission:** Boot diagnostics run too quickly to observe reliably.

Player actions:

- inspect a hardware counter,
- implement a simple delay using a timer,
- compare uncontrolled vs timed behavior.

**Manual topics:** clock, counter, timer, polling. Use a named timer/counter control; device address lookup and CPU instruction internals are not prerequisites.

**Repair result:** Diagnostic output occurs at predictable intervals.

## Chapter 04 — No Controls

**Mission:** Buttons appear electrically present but software never reacts.

Player actions:

- inspect input status,
- identify the input register,
- poll for button changes,
- observe button state in the terminal/debug panel.

**Manual topics:** device registers, polling, input peripherals, basic MMIO introduction. Distinguish peripheral control/status registers from the CPU registers introduced in Chapter 07.

**Repair result:** D-pad / buttons are detected.

## Chapter 05 — The Frozen Button

**Mission:** Constantly checking buttons makes the rest of the system sluggish.

Player actions:

- observe excessive polling,
- enable interrupt-driven input with a named control,
- assemble a guided pause → handle event → resume flow.

**Manual topics:** An IRQ notifies the CPU of an event; a handler responds, then interrupted work resumes. “Save/return” is only the conceptual promise that work can continue correctly. The supplied model handles preservation/restoration; the player does not implement it here.

**Depth limit:** No CPU register tracing, PC arithmetic, stack frames, CSR names, trap-entry code, or return instructions. Chapter 07 introduces registers/PC, Chapter 14 introduces calls/stack, Chapter 15 introduces saved PC/trap CSRs, and Chapter 19 revisits interrupt internals and controllers.

**Repair result:** Input remains responsive while CPU work drops.

## Chapter 06 — The Dead Screen

**Mission:** Serial diagnostics work, but the built-in screen is still dead.

Player actions:

- search the memory map,
- find display control registers,
- enable the display,
- write a minimal test pattern/status block.

**Manual topics:** memory map, MMIO, address decoding, device registers.

**Repair result:** The screen turns on and shows a simple test pattern.

> Note: The first display mission should avoid requiring detailed pixel math. Fine-grained pixel/framebuffer work comes later.

## Chapter 07 — Wrong Place

**Mission:** A simple marker/status block appears in the wrong position.

Player actions:

- inspect CPU register values,
- single-step the coordinate/address calculation,
- repair a bad arithmetic instruction sequence.

**Manual topics:** registers, PC, ALU, fetch/decode/execute, `add`, `addi`, `x0`, immediate values.

**Repair result:** The marker appears where intended.

## Chapter 08 — Missing Data

**Mission:** Graphic/sprite data exists in RAM but is not reaching the display path correctly.

Player actions:

- load values from RAM,
- modify them,
- store them to the correct destination.

**Manual topics:** RISC-V load/store, base+offset addressing.

**Repair result:** A simple sprite or block appears correctly.

## Chapter 09 — Make It Move

**Mission:** The object appears but does not respond to player input.

Player actions:

- combine input state with branch logic,
- update position,
- build a simple loop.

**Manual topics:** branch, jump, loop, PC control flow.

**Repair result:** The player can move an object with the D-pad.

## Chapter 10 — 8 FPS

**Mission:** Full-screen updates are too slow.

Player actions:

- compare CPU copying with hardware transfer,
- configure source, destination, length,
- start DMA.

**Manual topics:** DMA, bus master, CPU vs DMA transfer.

**Repair result:** Rendering becomes visibly smoother.

## Chapter 11 — Ghost Frames

**Mission:** DMA is fast, but old visual data sometimes appears.

Player actions:

- compare CPU cache contents with RAM,
- inspect dirty cache state,
- clean/write back data before DMA.

**Manual topics:** cache, hit/miss, cache line, dirty data, clean/writeback.

**Repair result:** Display output becomes consistent.

## Chapter 12 — The Old Input

**Mission:** DMA writes new input samples into a RAM buffer, but the CPU still sees an older cached value.

Player actions:

- inspect cache and RAM values,
- confirm that the transfer has completed, then invalidate the stale, clean cache line before reading the buffer.

**Manual topics:** cache coherency, stale cache, invalidate.

The buffer is ordinary cacheable RAM, not the input MMIO register from Chapter 04. The mission supplies a completed device write and a clean stale CPU line; it must not imply that discarding dirty CPU data is generally safe.

**Repair result:** CPU observes fresh device data.

## Chapter 13 — Works... Sometimes

**Mission:** Display/DMA startup fails intermittently even though individual values look correct.

Player actions:

- inspect ordering of descriptor writes and device start,
- insert an ordering barrier.

**Manual topics:** memory ordering, visibility, barrier, RISC-V `FENCE`.

Start with the cache-maintenance issue already resolved. Ordering writes and notifying a device is a separate problem; `FENCE` does not replace cache clean/invalidate operations.

**Repair result:** Startup becomes deterministic.

## Chapter 14 — The Mess

**Mission:** The working bare-metal codebase is becoming impossible to maintain.

Player actions:

- split repeated behavior into functions,
- inspect return addresses and stack changes.

**Manual topics:** function call, `sp`, `ra`, calling convention, stack frame.

**Repair result:** Rendering/input/update code becomes structured and stable.

## Chapter 15 — Crash!

**Mission:** A particular action crashes the machine.

Player actions:

- reproduce the failure,
- inspect trap state,
- identify the faulting instruction,
- fix the cause.

**Manual topics:** exception, trap, cause, saved PC, CSR introduction.

**Repair result:** The machine can detect/recover from the fault path.

## Chapter 16 — Sound Is Dead

**Mission:** The machine works visually but produces no audio.

Player actions:

- read a new peripheral section of the Manual with less hand-holding,
- configure audio control/data,
- trigger a simple sound.

**Manual topics:** applying the already-learned MMIO/peripheral model to unfamiliar hardware.

**Repair result:** Sound returns.

## Chapter 17 — The First Game

**Mission:** Combine repaired subsystems into a tiny bare-metal game.

Uses:

- UART,
- timer,
- input,
- display,
- interrupts,
- DMA,
- cache handling,
- audio.

**Repair result:** RV Pocket is once again a functioning bare-metal game device.

---

# Act II — The machine has outgrown bare metal

## Chapter 18 — Two Programs, One Machine

**Mission:** Diagnostics and the game interfere with each other.

**Manual topics:** privilege separation, why an OS needs different execution modes, RISC-V M/S/U modes.

**Result:** Privileged execution model is introduced as a solution to a real problem.

## Chapter 19 — Who Called the CPU?

**Mission:** Several devices can interrupt the CPU and the system cannot manage them cleanly.

**Manual topics:** Revisit Chapter 05's event/handler/resume model using the register/PC and trap foundations already learned: CSR state, interrupt enable/pending state, and interrupt controller priority/routing.

**Result:** Interrupt sources are managed centrally.

## Chapter 20 — Stay Out of My Memory

**Mission:** One program corrupts another program's memory.

**Manual topics:** MMU, virtual vs physical address, page tables and permissions, Sv39.

**Result:** Separate virtual address spaces become possible.

## Chapter 21 — Where Did This Address Go?

**Mission:** Address translation becomes slow or faults unexpectedly.

**Manual topics:** TLB, page-table walk, page fault.

**Result:** Translation behavior is understandable and diagnosable.

## Chapter 22 — Power On, Do Everything

**Mission:** Every boot still requires manual initialization from the development computer.

**Manual topics:** reset vector, Boot ROM, firmware, DRAM setup concept.

**Result:** The machine performs an autonomous boot sequence.

## Chapter 23 — Prepare for an OS

**Mission:** Linux cannot yet be entered in the required execution environment.

**Manual topics:** M-mode firmware, S-mode handoff, OpenSBI role.

**Result:** Firmware can hand control to an OS.

## Chapter 24 — Linux Can't Find the Hardware

**Mission:** Linux starts but does not know what devices RV Pocket contains.

**Manual topics:** Device Tree, hardware description, addresses, interrupts.

**Result:** Linux can discover the platform layout.

## Chapter 25 — Boot Linux

**Mission:** Boot the Linux kernel successfully.

Player investigates boot progress through UART logs.

**Result:**

```text
rvpocket login:
```

This is the main OS milestone and the long-term target is an actual running kernel. The execution environment is still undecided; see the [runtime decision boundary](05_technical_architecture.md#deferred-runtime-decisions). A mock boot log can prototype the UX but does not complete this milestone.

---

# Act III — Bring the hardware back under Linux

## Chapter 26 — The Screen Is Black Again

**Mission:** Linux boots, but the RV Pocket display is not functional.

**Manual topics:** Linux driver model, MMIO mapping, device matching.

**Result:** Linux can drive the display.

## Chapter 27 — Where Are the Buttons?

**Mission:** D-pad and buttons do not appear to Linux.

**Manual topics:** Linux IRQ flow and input driver concepts.

**Result:** RV Pocket controls are visible to Linux/userspace.

## Chapter 28 — Smooth Again

**Mission:** Linux display transfer is slow or inefficient.

**Manual topics:** Linux DMA API, coherent vs non-coherent behavior.

**Result:** Efficient rendering returns under Linux.

## Chapter 29 — The Old Game

**Mission:** Discover and run an old game from the parents' company.

**Manual topics:** userspace, files, syscall boundary.

**Result:** The old game runs as a Linux userspace process.

## Chapter 30 — Don't Stop the Shell

**Mission:** Keep the game running while other work continues.

**Manual topics:** process, scheduler, context switch.

**Result:** RV Pocket behaves like a general-purpose computer rather than a single bare-metal program.

## Chapter 31 — RV Pocket Restored

**Mission:** Complete the full power-on path:

power → firmware → Linux → drivers → input/display/audio → old game.

Include Linux-side audio bring-up using the peripheral knowledge from Chapter 16 and the driver pattern from Chapter 26. Do not assume bare-metal audio setup survives OS startup.

**Result:** Main story complete.

---

# Epilogue — A taste of kernel development

## Chapter 32 — One Last Bug

**Mission:** Fix one small, realistic Linux driver bug.

Player edits a constrained kernel-style code fragment and checks the resulting diff.

## Chapter 33 — Commit & Review

**Mission:** Write a good commit subject/body and send it to a simulated reviewer.

The simulated reviewer provides one or two authored maintainer comments. The player revises once; no live AI service or real patch submission is required.

**Result:** Short kernel-development epilogue complete.
