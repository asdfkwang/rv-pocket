# Chapter 19 — Cache and the Memory Hierarchy

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A cache hides the latency between a fast CPU and slow memory, but complicates when a value is observed with DMA and multicore. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

A cache hides the latency between a fast CPU and slow memory, but complicates when a value is observed with DMA and multicore.

From registers to cache to DRAM to storage, storage generally gets slower and larger. Cache lines, locality, hits/misses, and dirty state affect both performance and correctness.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
CPU cache: buffer=NEW dirty
RAM: buffer=OLD
CPU load→NEW
non-coherent DMA may see OLD
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

The cache controller and coherence protocol manage line state.

### In RISC-V

The RISC-V memory model and cache-management rules constrain software-visible behavior.

### Why the OS Cares

The OS manages cacheability/coherency differences through page mappings and DMA abstractions.

### In Linux / Driver

A Linux driver must follow the DMA API contract rather than flushing caches arbitrarily.

## Trace It

1. **Hardware:** The cache controller and coherence protocol manage line state.
2. **RISC-V:** The RISC-V memory model and cache-management rules constrain software-visible behavior.
3. **OS:** The OS manages cacheability/coherency differences through page mappings and DMA abstractions.
4. **Linux / Driver:** A Linux driver must follow the DMA API contract rather than flushing caches arbitrarily.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. With a 1-cycle hit and 101-cycle miss, compute average latency for 99% and 90% hit rates.
2. Investigate why CPU cache coherence and DMA coherence are not the same thing.
3. Construct and explain a false-sharing example based on a 64-byte cache line.
4. Find one rule or API directly related to **Cache and the Memory Hierarchy** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- A cache hides the latency between a fast CPU and slow memory, but complicates when a value is observed with DMA and multicore.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 18, Chapter 20
