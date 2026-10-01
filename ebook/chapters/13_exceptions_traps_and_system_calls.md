# Chapter 13 — Exceptions, Traps, and System Calls

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Interrupts are hardware events. **Exceptions** are software events — the CPU detects something wrong (invalid instruction, division by zero, page fault) and transfers control to a handler. **System calls** are deliberate exceptions — the program asks the OS for help. All three are **traps**: the CPU saves state and jumps to a handler.

## Core Idea

A trap has three parts: **cause** (why it happened), **saved PC** (where to return), and **handler address** (where to go). The cause is recorded in a CSR (Control and Status Register). The saved PC is in `mepc` (Machine Exception Program Counter). The handler address is in `mtvec` (Machine Trap Vector). When the trap ends, `mret` restores the saved PC and resumes.

## Worked Example

A program executes an invalid instruction:

```text
1. CPU detects the invalid instruction, raises an exception
2. Cause is recorded in mcause (e.g., 2 = illegal instruction)
3. Current PC is saved in mepc
4. CPU jumps to the handler address in mtvec
5. Handler reads mcause, decides what to do (kill the program, emulate, etc.)
6. Handler executes mret, CPU resumes at mepc
```

A system call is the same mechanism, but the program triggers it deliberately with the `ecall` instruction.

## The Same Idea Elsewhere

- **Hardware:** the trap logic is hardwired — detect exception, save state, jump to vector.
- **RISC-V:** the privileged spec defines `mcause`, `mepc`, `mtvec`, and `mret`. Different causes have different exception codes.
- **OS:** the OS installs a trap handler at boot. The handler dispatches based on the cause: page fault → allocate page, system call → service request, illegal instruction → kill process.
- **Linux/driver:** drivers rarely handle traps directly, but page faults in kernel space are fatal (no user process to kill). Understanding traps helps read oops messages.

## When It Fails

A driver accesses a bad pointer in kernel space. The CPU raises a page fault. The OS tries to handle it, but the fault happened in kernel context — there is no user process to kill. The kernel panics. The bug is the bad pointer; the panic is the consequence of being in kernel context.

## Check

1. A program executes `ecall`. What type of trap is this?
   - A) Interrupt
   - B) Exception
   - C) System call
   - D) Both B and C
   - Answer: D
   - Explanation: `ecall` is a deliberate exception (B) used to make system calls (C). It is not an interrupt — interrupts come from hardware.
   > Hint: `ecall` is executed by software. What is it for?

2. Which of these are recorded when a trap occurs? Pick all that apply.
   - A) The cause of the trap (mcause)
   - B) The PC of the trapping instruction (mepc)
   - C) The handler address (mtvec)
   - D) All general-purpose registers
   - Answer: A, B, C
   - Explanation: The CPU saves the cause, the PC, and uses the handler address. General-purpose registers are NOT automatically saved — the handler must save them if needed.
   > Hint: What does the hardware save automatically? What must software save?

3. A page fault occurs in kernel space. Why is this more serious than a page fault in user space?
   - A) Kernel page faults are slower
   - B) There is no user process to kill — the kernel panics
   - C) Kernel page faults corrupt hardware
   - D) Kernel page faults are always caused by hardware bugs
   - Answer: B
   - Explanation: A user-space page fault can be handled by killing the process. A kernel-space page fault means the kernel itself accessed an invalid address — there is nothing to fall back to, so the kernel panics.
   > Hint: What does the OS do with a user process that faults? What happens when the kernel itself faults?

4. Explain the difference between a trap and an interrupt — what is the source of each, and how does the handler know which one occurred?

5. A program divides by zero. Trace the trap: what instruction triggered it, what cause code is recorded, where is the PC saved, and what does the OS handler do?

## Limits

This chapter shows the RISC-V trap mechanism. Other architectures have similar concepts with different names (x86: IDT, exception vectors). The key idea — save state, jump to handler, restore state — is universal.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Kernel Oops](https://docs.kernel.org/admin-guide/bug-hunting.html)

## Related

Chapter 12, Chapter 14
