# Chapter 32 — DMA in a Real Linux Driver

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The Linux DMA API maps a CPU buffer to a device-visible address, hiding coherency and address-translation differences. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

The Linux DMA API maps a CPU buffer to a device-visible address, hiding coherency and address-translation differences.

Streaming mappings and coherent allocations have different ownership and lifetime rules. Ignoring mapping errors, direction, DMA masks, and sync rules can cause intermittent corruption.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
buf fill
→ dma_map_single(TO_DEVICE)
→ program dma_addr
→ device transfer
→ completion
→ dma_unmap_single
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

The DMA mask, coherency properties, and IOMMU topology limit which addresses the device can reach.

### In RISC-V

Architecture-specific cache maintenance and ordering may be implemented underneath the generic DMA API.

### Why the OS Cares

The OS and IOMMU manage DMA translation, device isolation, and buffer lifetime.

### In Linux / Driver

A dma_addr_t is not a CPU pointer and must follow the mapping/unmapping contract.

## Trace It

1. **Hardware:** The DMA mask, coherency properties, and IOMMU topology limit which addresses the device can reach.
2. **RISC-V:** Architecture-specific cache maintenance and ordering may be implemented underneath the generic DMA API.
3. **OS:** The OS and IOMMU manage DMA translation, device isolation, and buffer lifetime.
4. **Linux / Driver:** A dma_addr_t is not a CPU pointer and must follow the mapping/unmapping contract.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Explain why the return value of dma_map_single must not be dereferenced as a CPU pointer.
2. Investigate when dma_set_mask_and_coherent can fail and what choices the driver has.
3. Find in the DMA API HOWTO why the segment count can change across a scatter-gather mapping.
4. Find one rule or API in the official documentation directly related to **DMA in a Real Linux Driver**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- The Linux DMA API maps a CPU buffer to a device-visible address, hiding coherency and address-translation differences.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 31, Chapter 33
