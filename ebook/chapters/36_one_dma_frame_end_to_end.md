# Chapter 36 — One DMA Frame, End to End

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Tracking one frame's ownership through userspace → kernel → device → kernel shows how DMA, cache, barriers, and completion meet on a real data path. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Tracking one frame's ownership through userspace → kernel → device → kernel shows how DMA, cache, barriers, and completion meet on a real data path.

The control path sets up descriptors and the doorbell while the data path has the device transfer memory directly. Buffer ownership transfer is the reference point for sync and lifetime rules.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
userspace frame
→ queue/map DMA
→ fill descriptor
→ barrier
→ doorbell
→ device DMA
→ IRQ complete
→ buffer returned
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

The DMA engine, descriptor ring, doorbell, and completion IRQ are the data-path components.

### In RISC-V

Memory ordering affects the observed order of descriptor publication and the MMIO doorbell.

### Why the OS Cares

The OS manages buffer pinning and mapping, the IOMMU, and ownership lifetime.

### In Linux / Driver

The DMA API plus the queue model of the DRM/V4L2/net subsystem make up the real driver.

## Trace It

1. **Hardware:** The DMA engine, descriptor ring, doorbell, and completion IRQ are the data-path components.
2. **RISC-V:** Memory ordering affects the observed order of descriptor publication and the MMIO doorbell.
3. **OS:** The OS manages buffer pinning and mapping, the IOMMU, and ownership lifetime.
4. **Linux / Driver:** The DMA API plus the queue model of the DRM/V4L2/net subsystem make up the real driver.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Give one ghost-frame cause each for cache, ownership, and descriptor-index ordering.
2. Write step by step what happens if the producer index is published before the descriptor.
3. Investigate ownership transfer in a network RX ring or a V4L2/DRM buffer queue using real source and docs.
4. Find one rule or API in the official documentation directly related to **One DMA Frame, End to End**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)
- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Tracking one frame's ownership through userspace → kernel → device → kernel shows how DMA, cache, barriers, and completion meet on a real data path.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 35, Chapter 37
