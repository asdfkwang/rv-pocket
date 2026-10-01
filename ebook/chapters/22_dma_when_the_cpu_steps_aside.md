# Chapter 22 — DMA: When the CPU Steps Aside

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

DMA lets a device perform memory transfers instead of the CPU, making large data paths efficient. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

DMA lets a device perform memory transfers instead of the CPU, making large data paths efficient.

You cannot assume that a CPU virtual address and a device DMA address are the same; you must consider mapping lifetime, direction, ownership, the IOMMU, and cache coherency.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
CPU fills buffer
→ dma_map
→ program DMA address/len
→ device transfer
→ IRQ
→ unmap
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

A device or DMA engine acts as a bus master that generates memory transactions.

### In RISC-V

Platform I/O and memory-ordering behavior matter more than the ISA for DMA correctness.

### Why the OS Cares

The OS manages DMA-capable memory, device isolation, IOMMU mappings, and ownership.

### In Linux / Driver

The Linux DMA API abstracts the difference between CPU pointers and dma_addr_t, cache maintenance, and mappings.

## Trace It

1. **Hardware:** A device or DMA engine acts as a bus master that generates memory transactions.
2. **RISC-V:** Platform I/O and memory-ordering behavior matter more than the ISA for DMA correctness.
3. **OS:** The OS manages DMA-capable memory, device isolation, IOMMU mappings, and ownership.
4. **Linux / Driver:** The Linux DMA API abstracts the difference between CPU pointers and dma_addr_t, cache maintenance, and mappings.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Explain why passing a virt_to_phys result directly to a device is not portable.
2. Research why DMA_TO_DEVICE and DMA_FROM_DEVICE matter for cache synchronization.
3. Analyze step by step what race occurs if the CPU modifies a buffer while the device is performing DMA on it.
4. Find one rule or API directly related to **DMA: When the CPU Steps Aside** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)
- [Linux Driver API](https://docs.kernel.org/driver-api/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- DMA lets a device perform memory transfers instead of the CPU, making large data paths efficient.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 21, Chapter 23
