# Chapter 23 — Cache Coherency, DMA, and Memory Ordering

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Coherency is about agreement on the value at the same location, while ordering is about the order in which different accesses are observed. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

Coherency is about agreement on the value at the same location, while ordering is about the order in which different accesses are observed.

Just because the CPU writes a descriptor and then rings a doorbell in program order, you cannot conclude the device observes the same order. You must distinguish the guarantees of RISC-V FENCE from those of Linux barriers and the MMIO/DMA APIs.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
descriptor.len=4096
descriptor.addr=dma
MMIO DOORBELL=GO
→ device must not see GO first
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

Cache, interconnect, and device coherence capabilities together with bus ordering determine what each observer sees.

### In RISC-V

RVWMO and FENCE define the CPU memory-ordering contract.

### Why the OS Cares

The OS hides hardware differences behind architecture-independent synchronization primitives.

### In Linux / Driver

Linux mb/rmb/wmb, DMA barriers, readl/writel, and relaxed accessors each carry different contracts.

## Trace It

1. **Hardware:** Cache, interconnect, and device coherence capabilities together with bus ordering determine what each observer sees.
2. **RISC-V:** RVWMO and FENCE define the CPU memory-ordering contract.
3. **OS:** The OS hides hardware differences behind architecture-independent synchronization primitives.
4. **Linux / Driver:** Linux mb/rmb/wmb, DMA barriers, readl/writel, and relaxed accessors each carry different contracts.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Explain why volatile alone does not solve hardware memory ordering.
2. Look up the predecessor and successor sets of RISC-V FENCE in the specification.
3. Trace the corruption that occurs when the producer index is published before the descriptor.
4. Find one rule or API directly related to **Cache Coherency, DMA, and Memory Ordering** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)
- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Coherency is about agreement on the value at the same location, while ordering is about the order in which different accesses are observed.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 22, Chapter 24
