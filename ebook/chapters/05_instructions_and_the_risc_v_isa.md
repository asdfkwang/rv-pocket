# Chapter 05 — Instructions and the RISC-V ISA

> **Part II — Speaking RISC-V**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

An ISA is a contract between hardware and software about what instructions mean. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

An ISA is a contract between hardware and software about what instructions mean.

CPUs implementing the same ISA must agree on the architectural result of the same binary even when their internal pipelines and caches differ. RISC-V combines a base ISA with extensions.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
addi x5,x0,10
addi x6,x0,20
add x7,x5,x6
→ x7=30
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The instruction decoder turns a bit pattern into an operation and operand selection.

### In RISC-V

Base ISAs and extensions such as RV64I, M, A, and C define the software-visible capabilities.

### Why the OS Cares

The kernel executes the same ISA but in a different privilege and mapping environment.

### In Linux / Driver

The Linux toolchain's -march/-mabi flags and the kernel configuration affect which ISA features are available.

## Trace It

1. **Hardware:** The instruction decoder turns a bit pattern into an operation and operand selection.
2. **RISC-V:** Base ISAs and extensions such as RV64I, M, A, and C define the software-visible capabilities.
3. **OS:** The kernel executes the same ISA but in a different privilege and mapping environment.
4. **Linux / Driver:** The Linux toolchain's -march/-mabi flags and the kernel configuration affect which ISA features are available.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Give the RV64 value of x5 in hex after executing addi x5,x0,-1.
2. Find in the official specification which trap can occur when mul executes on a CPU without the M extension.
3. Research example -march and -mabi values for a current RISC-V Linux toolchain and interpret each part.
4. Find one rule or API directly related to **Instructions and the RISC-V ISA** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [RISC-V psABI](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- An ISA is a contract between hardware and software about what instructions mean.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 04, Chapter 06
