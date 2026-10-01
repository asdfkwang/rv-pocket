# Chapter 03 — Memory: Where State Lives

> **Part I — A Computer That Can Run Code**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Memory is state storage with an address on every byte, and loads/stores move that state. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Memory is state storage with an address on every byte, and loads/stores move that state.

Once you understand endianness, access width, and alignment, you can see why the same bytes appear as different register values. MMIO and DMA later also come back to moving addresses and data.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
0x1000:78  0x1001:56  0x1002:34  0x1003:12
little-endian lw @0x1000 → 0x12345678
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The memory controller and caches handle physical data access.

### In RISC-V

lb/lbu/lh/lhu/lw/lwu/ld determine the access size and sign extension.

### Why the OS Cares

The OS manages memory in page units and builds a per-process virtual address space.

### In Linux / Driver

Kernel pointers, userspace pointers, dma_addr_t values, and __iomem pointers all look like addresses but must not be used the same way.

## Trace It

1. **Hardware:** The memory controller and caches handle physical data access.
2. **RISC-V:** lb/lbu/lh/lhu/lw/lwu/ld determine the access size and sign extension.
3. **OS:** The OS manages memory in page units and builds a per-process virtual address space.
4. **Linux / Driver:** Kernel pointers, userspace pointers, dma_addr_t values, and __iomem pointers all look like addresses but must not be used the same way.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Compute the RV64 register result when byte 0xF0 is read with lb versus lbu.
2. Research why ignoring alignment in driver register accesses is dangerous even on a CPU that allows unaligned lw.
3. Find in the Linux Device I/O documentation why an __iomem pointer must not be dereferenced like normal RAM.
4. Find one rule or API directly related to **Memory: Where State Lives** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Memory Management](https://docs.kernel.org/mm/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Memory is state storage with an address on every byte, and loads/stores move that state.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 02, Chapter 04
