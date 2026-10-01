# Chapter 16 — Processes and Context Switching

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A computer runs many programs at once — or so it seems. The OS creates this illusion by switching between them quickly. Each program is a **process**: an address space, a set of open files, and a saved CPU state. The switch between processes is a **context switch**: save one process's state, load another's.

## Core Idea

A process is the OS's representation of a running program. It has: an address space (memory), file descriptors (open files), and saved CPU state (registers, PC). The OS saves the CPU state when switching away from a process and restores it when switching back. The process never knows it was switched — the state is preserved exactly.

## Worked Example

Two processes, A and B:

```text
1. Process A is running
2. Timer interrupt fires (Chapter 11)
3. OS saves A's registers and PC to A's process control block
4. OS loads B's registers and PC from B's process control block
5. OS returns from the interrupt — now B is running
6. Later, the reverse happens: B is saved, A is restored
```

The switch is transparent to both processes. Each thinks it has the CPU to itself.

## The Same Idea Elsewhere

- **Hardware:** the CPU provides the trap mechanism (interrupts) that triggers the switch, and the CSRs that save/restore state.
- **RISC-V:** the privileged spec defines the CSRs (`mepc`, `mstatus`, etc.) that are saved and restored.
- **OS:** the OS is the software that decides when to switch and performs the save/restore.
- **Linux/driver:** drivers must be context-switch-safe. A driver that assumes it runs to completion without interruption can corrupt state if a context switch happens mid-operation.

## When It Fails

A driver uses a global variable to track state across multiple register accesses. A context switch happens between accesses. Another process runs, modifies the global, and when the first process resumes, the state is wrong. The fix: use per-device state, or disable interrupts during the critical section.

## Check

1. A context switch occurs. What is saved?
   - A) Only the PC
   - B) Only the general-purpose registers
   - C) The PC, general-purpose registers, and OS bookkeeping state
   - D) Nothing — the CPU saves everything automatically
   - Answer: C
   - Explanation: The OS saves the PC and registers to the process control block. The OS also updates its own data structures (scheduler queues, etc.). The CPU does not save general-purpose registers automatically.
   > Hint: What does the hardware save? What must software save?

2. Which of these are part of a process's state? Pick all that apply.
   - A) The program counter
   - B) The stack pointer
   - C) Open file descriptors
   - D) The process's source code
   - Answer: A, B, C
   - Explanation: The PC, stack pointer, and file descriptors are all part of the process's runtime state. The source code is static — it does not change at runtime.
   > Hint: What changes while a program runs? What stays the same?

3. Why does a context switch make the illusion of parallelism?
   - A) Because the CPU runs multiple instructions at once
   - B) Because the switch is fast enough that each process seems to run continuously
   - C) Because processes share the same memory
   - D) Because the OS duplicates the CPU
   - Answer: B
   - Explanation: The switch is fast (microseconds). Each process runs for a short time, then switches. To human perception, all processes run simultaneously.
   > Hint: How fast is a context switch? How does that compare to human perception?

4. Explain why a driver must be reentrant or use locks when it can be interrupted by a context switch — what goes wrong if two executions of the driver code overlap?

5. A process is switched out while holding a lock. Another process tries to acquire the same lock. What happens, and what is this situation called?

## Limits

This chapter shows a simple context switch. Real systems have nested interrupts, lazy state saving (only save what is used), and hardware support for address space switching (TLB, Chapter 21). The principle — save state, switch, restore — is the same.

## Go Deeper

- [Linux Scheduler](https://docs.kernel.org/scheduler/)
- [Linux Process Management](https://docs.kernel.org/process/)

## Related

Chapter 15, Chapter 17
