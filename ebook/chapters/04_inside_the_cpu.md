# Chapter 04 — Inside the CPU

> **Part I — A Computer That Can Run Code**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The architectural state of the CPU can be understood around registers and the PC. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

The architectural state of the CPU can be understood around registers and the PC.

The CPU changes state through fetch, decode, execute, memory access, and write-back. No matter how complex the real microarchitecture is, the result observed by software is defined by the ISA.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
x5=10, x6=20, PC=0x8000
add x7,x5,x6
→ x7=30, next PC=0x8004
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The register file, ALU, fetch path, and control logic form the datapath.

### In RISC-V

x0–x31 and the PC are the core of RISC-V execution state.

### Why the OS Cares

A context switch saves the current CPU state and restores another task's state, creating the process abstraction.

### In Linux / Driver

Linux trap entry and context-switch code are where architecture-specific assembly meets C.

## Trace It

1. **Hardware:** The register file, ALU, fetch path, and control logic form the datapath.
2. **RISC-V:** x0–x31 and the PC are the core of RISC-V execution state.
3. **OS:** A context switch saves the current CPU state and restores another task's state, creating the process abstraction.
4. **Linux / Driver:** Linux trap entry and context-switch code are where architecture-specific assembly meets C.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Explain why the PC is not simply PC+4 after a taken branch.
2. Research which registers the OS must save at a context switch, from the ABI and lazy-state point of view.
3. Connect the fact that the CPU does not know PIDs with how process isolation is still possible, using the MMU and privilege.
4. Find one rule or API directly related to **Inside the CPU** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V psABI](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)
- [Linux Scheduler](https://docs.kernel.org/scheduler/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- The architectural state of the CPU can be understood around registers and the PC.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 03, Chapter 05
