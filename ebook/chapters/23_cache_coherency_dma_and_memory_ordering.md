# Chapter 23 — Cache Coherency, DMA, and Memory Ordering

> **Part V — Memory Becomes Virtual**

## Which guarantee is missing when DMA sees old data?

Chapter 22 introduced ownership transitions. Three different failures can look like "DMA read stale memory": the device sees an old cached copy, it observes fields in the wrong order, or it accesses a buffer while the CPU is changing it. Cache visibility, ordering, and ownership require separate reasoning.

Coherent DMA memory provides a defined shared visibility arrangement between CPU and device. It does not make a sequence of CPU stores indivisible or automatically enforce every device-required publication order. Streaming mappings provide a lifecycle with explicit device/CPU ownership transitions and any platform-required synchronization.

## Publish a coherent descriptor in the right order

Assume a descriptor ring allocated as coherent DMA memory. The device observes an OWN flag; once it sees OWN = 1, it may read the address and length. Initially the descriptor contains an old address, length zero, and OWN = 0.

Conceptual Linux-style publication is:

```c
/* Descriptor layout/endian conversion are device-specific and omitted. */
desc->address = payload_dma;
desc->length = 16;
dma_wmb();
WRITE_ONCE(desc->own, 1);
/* Notify through the documented MMIO accessor/protocol if required. */
```

The barrier establishes the required order between earlier descriptor writes and ownership publication for this DMA-sharing pattern. Without it, the device could observe OWN = 1 before the new length or address becomes observable in the required order. Coherence ensures participation in visibility; the barrier expresses a relationship between observations.

This is a protocol fragment. The descriptor's flag width, endian format, device guarantees, and doorbell ordering must all match the actual hardware. WRITE_ONCE constrains a compiler access; it does not independently supply the entire DMA synchronization contract.

On completion, some devices write result fields and then clear OWN. If their contract guarantees that ordering, the CPU can observe ownership return and use the appropriate DMA read barrier before consuming the result fields. A barrier in software cannot compensate for hardware that never promised the required completion ordering.

## Transfer a streaming buffer between owners

Now consider a separately mapped payload on a non-coherent machine. Preparing descriptor order does not necessarily clean dirty payload cache lines. Use the DMA API's mapping/synchronization lifecycle for the payload in addition to descriptor publication.

For a persistent receive mapping, a typical conceptual cycle is:

```text
device owns buffer and writes payload
completion establishes device no longer accesses this buffer
dma_sync_single_for_cpu(..., DMA_FROM_DEVICE)
CPU reads completed bytes
dma_sync_single_for_device(..., DMA_FROM_DEVICE)
device may own the buffer again after resubmission
```

If the mapping is being retired rather than reused, the corresponding unmap operation performs the required end-of-mapping transition. A direction mismatch is not a harmless optimization hint: the platform uses direction to determine permitted access and necessary maintenance.

The CPU must not write unrelated data into the same cache lines while the device owns a streaming buffer. Cache maintenance works at line granularity, so careless sharing can overwrite or invalidate neighboring data even when nominal byte ranges differ. Use allocation and alignment rules supported by the DMA API.

## Do not interchange fences and cache maintenance

An ordering fence constrains when classes of operations may be observed relative to one another. Cache maintenance arranges the state of cached copies. Translation synchronization concerns cached mappings. The three operations can involve the same memory yet solve different problems.

A CPU memory barrier does not turn a userspace pointer into a DMA address. SFENCE.VMA does not publish dirty payload bytes to a non-coherent device. Flushing data cannot prove that a timed-out DMA engine has stopped. When proposing a fix, name the observer and the missing guarantee before selecting an API.

The next part begins before Linux runs and asks how firmware establishes the environment in which all these mechanisms can be used. We return to the DMA API with a complete lifecycle in Chapter 32.

## Check

1. A coherent descriptor's OWN flag becomes visible before its new length. Which missing guarantee is directly implicated?
   - A) Publication ordering
   - B) That the buffer's virtual address is numerically small
   - C) That the cache line is necessarily absent
   - Answer: A
   - Explanation: Coherent visibility does not replace the ordering relationship required between fields and ownership.

2. Which claims are correct? Select all that apply.
   - A) A barrier proves an engine has stopped after timeout.
   - B) DMA synchronization direction is part of the access contract.
   - C) Cache-line sharing can matter even for non-overlapping byte ranges.
   - Answer: B, C
   - Explanation: Lifetime needs completion or quiescence; cache maintenance can affect a whole line.

3. Draw separate failing timelines for stale payload bytes and prematurely published descriptor ownership. Explain why fixing only the descriptor barrier does not necessarily fix the payload case.

4. Design a repeated receive cycle for a persistent streaming mapping. Mark each ownership transition and identify which operations disappear or change if the buffer is unmapped after each completed transfer instead.

5. Research challenge: inspect dma_wmb/dma_rmb usage in the kernel memory-barrier documentation and DMA guide. State the assumed device behavior that makes one example correct, then identify a guarantee those barriers do not provide.

## Limits

The snippets are protocol sketches, not a universal ring implementation. Actual hardware defines completion visibility, doorbell behavior, cache alignment, and endian fields. Use kernel DMA and I/O APIs for the target platform instead of substituting an arbitrary RISC-V fence or cache instruction.

## Go Deeper

- [Linux memory barriers](https://docs.kernel.org/core-api/wrappers/memory-barriers.html) — inspect the DMA barrier examples and their assumptions.
- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html) — follow synchronization direction and ownership rules.
- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html) — distinguish MMIO accessor guarantees from shared-memory publication.

## Related

- [Chapter 22 — DMA: When the CPU Steps Aside](22_dma_when_the_cpu_steps_aside.md)
- [Chapter 24 — Reset, Firmware, and Boot](24_reset_firmware_and_boot.md)
