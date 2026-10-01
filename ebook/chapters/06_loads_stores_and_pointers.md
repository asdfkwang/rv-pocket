# Chapter 06 — Loads, Stores, and Pointers

> **Part II — Speaking RISC-V**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

RISC-V is a load/store architecture: it loads memory values into registers and stores results back. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

RISC-V is a load/store architecture: it loads memory values into registers and stores results back.

Addresses are usually computed as a base register plus an immediate offset. C pointers, stack fields, struct members, and MMIO offsets all connect to this pattern.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
x10=0x1000
ld x5,8(x10) → read 0x1008
addi x5,x5,1
sd x5,8(x10)
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The load/store unit computes the effective address and issues the request to the MMU, caches, and bus.

### In RISC-V

lw/lwu/ld and sw/sd define the width and sign-extension behavior.

### Why the OS Cares

When virtual memory is on, every address an instruction uses goes through translation and a permission check.

### In Linux / Driver

readl(base+offset) addresses a device register but follows a different I/O contract than a normal pointer dereference.

## Trace It

1. **Hardware:** The load/store unit computes the effective address and issues the request to the MMU, caches, and bus.
2. **RISC-V:** lw/lwu/ld and sw/sd define the width and sign-extension behavior.
3. **OS:** When virtual memory is on, every address an instruction uses goes through translation and a permission check.
4. **Linux / Driver:** readl(base+offset) addresses a device register but follows a different I/O contract than a normal pointer dereference.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Compare the RV64 results when lw versus lwu reads 0xffffffff.
2. Compute the effective address of a[7] for int a[10] and explain how the compiler builds it as base+offset.
3. Find in the Linux documentation why readl() must be used instead of a volatile u32 pointer.
4. Find one rule or API directly related to **Loads, Stores, and Pointers** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Memory Management](https://docs.kernel.org/mm/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- RISC-V is a load/store architecture: it loads memory values into registers and stores results back.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 05, Chapter 07
