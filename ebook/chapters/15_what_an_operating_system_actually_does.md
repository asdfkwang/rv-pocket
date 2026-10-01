# Chapter 15 — What an Operating System Actually Does

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

An OS abstracts and protects hardware resources and manages them so multiple execution flows can share them. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

An OS abstracts and protects hardware resources and manages them so multiple execution flows can share them.

It turns a CPU into process execution time, RAM into virtual address spaces, storage blocks into files, and raw device events into standardized I/O. Syscalls and interrupts are the main kernel entry paths.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
CPU core→tasks
RAM→virtual memory
SSD blocks→files
GPIO IRQ→input event
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

Privilege, the MMU, timers, interrupts, and atomics are the basis of OS mechanisms.

### In RISC-V

The privileged ISA provides traps, translation, and protection.

### Why the OS Cares

The OS builds scheduler, VM, file, and synchronization policies on top of these mechanisms.

### In Linux / Driver

Inside Linux, subsystems such as the scheduler, MM, VFS, networking, and the driver model cooperate.

## Trace It

1. **Hardware:** Privilege, the MMU, timers, interrupts, and atomics are the basis of OS mechanisms.
2. **RISC-V:** The privileged ISA provides traps, translation, and protection.
3. **OS:** The OS builds scheduler, VM, file, and synchronization policies on top of these mechanisms.
4. **Linux / Driver:** Inside Linux, subsystems such as the scheduler, MM, VFS, networking, and the driver model cooperate.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. Connect CPU virtualization, memory virtualization, and device abstraction each to its hardware mechanism.
2. Explain why saying the CPU stops during a blocked read can be wrong.
3. Find the representative directories for the scheduler, MM, VFS, and driver core in the Linux source tree and summarize their roles.
4. Find one rule or API directly related to **What an Operating System Actually Does** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Scheduler](https://docs.kernel.org/scheduler/)
- [Linux Memory Management](https://docs.kernel.org/mm/)
- [Linux VFS](https://docs.kernel.org/filesystems/vfs.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- An OS abstracts and protects hardware resources and manages them so multiple execution flows can share them.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 14, Chapter 16
