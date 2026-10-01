# Chapter 07 — Branches, Jumps, and Control Flow

> **Part II — Speaking RISC-V**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Conditionals and loops are ultimately about where to send the next PC. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Conditionals and loops are ultimately about where to send the next PC.

A branch changes the PC conditionally, while jal/jalr can combine a jump with saving a return address. The compiler lowers if statements, loops, and function calls into this flow.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
x5=3
loop: addi x5,x5,-1
bne x5,x0,loop
→ fall-through when x5 is 0
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The branch unit and prediction logic select the next fetch address.

### In RISC-V

beq/bne/blt and jal/jalr create PC-relative or indirect control flow.

### Why the OS Cares

Trap returns and scheduler switches carry more state, but they still move the execution flow to a different point.

### In Linux / Driver

Understanding control flow matters when reading a kernel crash's PC, return addresses, and disassembly.

## Trace It

1. **Hardware:** The branch unit and prediction logic select the next fetch address.
2. **RISC-V:** beq/bne/blt and jal/jalr create PC-relative or indirect control flow.
3. **OS:** Trap returns and scheduler switches carry more state, but they still move the execution flow to a different point.
4. **Linux / Driver:** Understanding control flow matters when reading a kernel crash's PC, return addresses, and disassembly.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Given initial x5=5, count how many times the loop's addi and bne each execute.
2. Explain with bit patterns why blt and bltu give different results when comparing -1 and 1.
3. Design a procedure using objdump to trace the branch/call path from a single kernel PC.
4. Find one rule or API directly related to **Branches, Jumps, and Control Flow** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V psABI](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Conditionals and loops are ultimately about where to send the next PC.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 06, Chapter 08
