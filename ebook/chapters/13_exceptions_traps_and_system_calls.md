# Chapter 13 — Exceptions, Traps, and System Calls

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Interrupts, illegal instructions, page faults, and syscalls can all be understood in one trap framework that redirects the normal PC flow to a privileged handler. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Interrupts, illegal instructions, page faults, and syscalls can all be understood in one trap framework that redirects the normal PC flow to a privileged handler.

Exceptions are usually synchronous with the current instruction, while interrupts are asynchronous. An ecall is an exception that deliberately requests a kernel service, and a page fault is one the OS may recover from.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
a0=fd, a1=buf, a2=len, a7=syscall_nr
ecall
→ kernel handler
→ return to userspace
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

Trap entry logic records the saved PC and cause, then selects the handler target.

### In RISC-V

Ecall, illegal instructions, page/access faults, and interrupts are defined in the privileged ISA.

### Why the OS Cares

The OS applies a policy based on the cause, such as a syscall, a signal, page allocation, or a retry.

### In Linux / Driver

Linux RISC-V entry code passes saved state in pt_regs form to the generic kernel path.

## Trace It

1. **Hardware:** Trap entry logic records the saved PC and cause, then selects the handler target.
2. **RISC-V:** Ecall, illegal instructions, page/access faults, and interrupts are defined in the privileged ISA.
3. **OS:** The OS applies a policy based on the cause, such as a syscall, a signal, page allocation, or a retry.
4. **Linux / Driver:** Linux RISC-V entry code passes saved state in pt_regs form to the generic kernel path.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. Explain what the saved PC must point to in order to retry the faulting instruction after handling a page fault.
2. Explain, in terms of privilege and mapping, why userspace simply jumping to a kernel address differs from a syscall.
3. Find the exception cause number for a U-mode ecall in the official specification.
4. Find one rule or API directly related to **Exceptions, Traps, and System Calls** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Upstream Linux source](https://github.com/torvalds/linux)
- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Interrupts, illegal instructions, page faults, and syscalls can all be understood in one trap framework that redirects the normal PC flow to a privileged handler.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 12, Chapter 14
