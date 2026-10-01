# Chapter 16 — Processes and Context Switching

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A process is not an executable file; it is a bundle of live state: registers, address space, files, credentials, and scheduling state. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

A process is not an executable file; it is a bundle of live state: registers, address space, files, credentials, and scheduling state.

A context switch saves the required CPU state of the current task and restores another task's state. The CPU does not know PIDs; the OS creates the process abstraction.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
A: pc=A_pc sp=A_sp s0=A_s0
--save/load→
B: pc=B_pc sp=B_sp s0=B_s0
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

The CPU only provides registers and MMU state; it knows no process list.

### In RISC-V

State such as SP, saved registers, and satp connects to the architecture-specific switch.

### Why the OS Cares

The scheduler manages running/runnable/sleeping state and selects the next task.

### In Linux / Driver

The Linux task_struct and architecture switch code connect task state to CPU state.

## Trace It

1. **Hardware:** The CPU only provides registers and MMU state; it knows no process list.
2. **RISC-V:** State such as SP, saved registers, and satp connects to the architecture-specific switch.
3. **OS:** The scheduler manages running/runnable/sleeping state and selects the next task.
4. **Linux / Driver:** The Linux task_struct and architecture switch code connect task state to CPU state.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. List five examples each of process state and CPU register state.
2. Explain why a stale TLB can be a problem when switching address spaces.
3. Find the mm, files, and PID-related fields in the current Linux task_struct.
4. Find one rule or API directly related to **Processes and Context Switching** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Scheduler](https://docs.kernel.org/scheduler/)
- [Linux Memory Management](https://docs.kernel.org/mm/)
- [Upstream Linux source](https://github.com/torvalds/linux)
- [RISC-V psABI](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- A process is not an executable file; it is a bundle of live state: registers, address space, files, credentials, and scheduling state.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 15, Chapter 17
