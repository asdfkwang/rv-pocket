# Chapter 01 — The Computer as a System

> **Part I — A Computer That Can Run Code**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A computer is not a single CPU; it is a system connecting the CPU, memory, devices, and the software that coordinates them. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

A computer is not a single CPU; it is a system connecting the CPU, memory, devices, and the software that coordinates them.

Even a single line of application code eventually comes down to instructions, syscalls, drivers, registers, and real electrical behavior. That vertical path is the map for this entire book.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
Application: write(fd,"A",1)
→ kernel syscall
→ UART driver
→ DATA register
→ TX pin
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The CPU, memory, and devices are connected by buses and interrupts, and each device holds its own state.

### In RISC-V

The RISC-V ISA defines the instructions and registers that the CPU exposes to software.

### Why the OS Cares

The OS abstracts and protects CPU time, address spaces, files, and devices.

### In Linux / Driver

Linux subsystems and drivers connect hardware-specific details to a common userspace interface.

## Trace It

1. **Hardware:** The CPU, memory, and devices are connected by buses and interrupts, and each device holds its own state.
2. **RISC-V:** The RISC-V ISA defines the instructions and registers that the CPU exposes to software.
3. **OS:** The OS abstracts and protects CPU time, address spaces, files, and devices.
4. **Linux / Driver:** Linux subsystems and drivers connect hardware-specific details to a common userspace interface.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Explain why the same read() works on both a regular file and a UART, using the common interface and the different hardware paths.
2. Summarize which protections and abstractions break when userspace is allowed to control device MMIO directly.
3. Research and draw, in at least 8 steps, the path by which a single button press wakes a userspace process.
4. Find one rule or API directly related to **The Computer as a System** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- A computer is not a single CPU; it is a system connecting the CPU, memory, devices, and the software that coordinates them.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 02
