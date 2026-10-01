# Chapter 32 — DMA in a Real Linux Driver

> **Part VII — Linux Device Drivers**

## How do the DMA concepts map to Linux calls?

Chapters 22–23 established three obligations: use a device-visible address, transfer ownership correctly, and establish the required visibility/order. Linux's DMA API expresses these obligations without making a driver hard-code one cache or IOMMU implementation.

Use a device that reads a 16-byte transmit buffer. During setup, the driver selects a DMA mask supported by the actual hardware and platform, checks the result, and refuses unsupported configurations. A 32-bit address register cannot safely receive an unchecked truncated 64-bit DMA address.

## Trace a successful streaming mapping

The following fragments illustrate a kmalloc-backed transmit buffer and the normal successful lifecycle. The device-specific fill, submission, and completion protocol must be supplied by the driver.

```c
void *buf = kmalloc(16, GFP_KERNEL);
if (!buf)
    return -ENOMEM;
fill_payload(buf, 16);

dma_addr_t addr = dma_map_single(dev, buf, 16, DMA_TO_DEVICE);
if (dma_mapping_error(dev, addr)) {
    kfree(buf);
    return -EIO;
}
/* Submit addr and length 16; leave payload untouched while device owns it. */
```

The CPU retains buf for allocation/lifetime management. Hardware receives addr, a dma_addr_t value interpreted in its DMA address space. Do not give hardware buf, and do not cast addr to a CPU pointer to inspect payload.

After the device protocol proves that all accesses to this transfer's buffer have ended:

```c
dma_unmap_single(dev, addr, 16, DMA_TO_DEVICE);
kfree(buf);
```

The device, size, direction, and mapping kind must correspond to the mapping operation. If submission fails before hardware can access the buffer, unwind the mapping and allocation. If submission may have reached hardware, cancellation must establish quiescence before that unwind. The unmap call itself does not stop an engine.

## Receive and reuse require explicit transitions

For a receive buffer, use DMA_FROM_DEVICE when the device writes memory. After confirmed completion, ending the mapping with the matching unmap operation permits the CPU to consume the received contents under that lifecycle. If keeping the mapping across repeated transfers, use the appropriate sync-for-CPU and sync-for-device operations at ownership transitions.

A reusable mapping saves some setup work but makes state management more explicit. The CPU must not inspect a device-owned buffer just because the pointer still exists. A stale payload can result from missing synchronization; a corrupted payload can also result from overlapping ownership, wrong length, or a device writing somewhere else. Diagnose which guarantee failed.

For user buffers, subsystem-specific pinning and mapping rules apply. A userspace virtual pointer is not a suitable argument to dma_map_single. Pinning establishes page lifetime under its API; it does not by itself produce one contiguous device address for an arbitrary range. The full design must address scatter/gather layout, access permissions, unpinning, and cancellation.

## Coherent descriptors and scatter/gather payloads

dma_alloc_coherent returns a CPU-accessible pointer and a separate DMA handle for suitable shared control memory. It avoids streaming ownership synchronization for coherent visibility but does not remove descriptor ordering barriers or lifetime obligations. Pair it with the corresponding coherent free operation after hardware no longer accesses it.

For a payload spanning multiple suitable segments, dma_map_sg maps a scatterlist. The returned mapped segment count can be smaller than the original entry count because mappings may merge segments. Program hardware using the mapped DMA segments, while passing the original input count to the corresponding unmap/sync API as documented. Confusing those counts creates architecture-dependent bugs.

## Make timeout and removal first-class paths

On timeout, stop accepting new submissions, halt/reset the relevant engine according to its protocol, synchronize completion paths, and reclaim mappings only after device access is impossible. Removal adds the same requirement for every outstanding buffer. Automatic resource cleanup cannot infer a safe DMA stop sequence.

Chapter 33 moves outward to the userspace contract. Correct DMA movement is only one part of what an application's read or write result promises.

## Check

1. Which value should be programmed into a device's DMA address field?
   - A) The CPU's buf pointer
   - B) The validated DMA handle returned for that device and mapping
   - C) Any physical address inferred by casting the pointer
   - Answer: B
   - Explanation: The mapping API accounts for the device's address view and platform constraints.

2. Which are valid lifecycle obligations? Select all that apply.
   - A) Check mapping failure.
   - B) Match the unmap's size and direction to the mapping.
   - C) Treat timeout as proof that DMA has stopped.
   - Answer: A, B
   - Explanation: Timeout only ends a software wait; safe reclamation requires completion or quiescence.

3. Draw the complete ownership state machine for a persistent receive mapping used three times. Include the point at which each result may be read and the final unmap/free.

4. dma_map_sg receives six entries and returns four DMA segments. Explain which count drives device programming and which count is used when unmapping. Describe the failure if the counts are interchanged.

5. Research challenge: inspect an upstream driver's mapping failure and timeout paths at a recorded revision. Identify how it proves the device can no longer access a buffer before release, including any late IRQ or workqueue path.

## Limits

The code fragments show one successful mapping shape, not a complete DMA driver. Hardware masks, descriptor formats, allocation restrictions, boundary limits, and DMA direction must match the actual device. Kernel DMA helpers do not replace the hardware's completion and reset protocol.

## Go Deeper

- [Linux DMA mapping guide](https://docs.kernel.org/core-api/dma-api-howto.html) — inspect masks, mapping errors, coherent allocation, and scatter/gather counts.
- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html) — verify sync/unmap pairings and allocation restrictions.
- [Linux pin_user_pages guidance](https://docs.kernel.org/core-api/pin_user_pages.html) — distinguish user-page lifetime from device mapping.

## Related

- [Chapter 31 — Sleeping, Waiting, and Asynchronous Events](31_sleeping_waiting_and_asynchronous_events.md)
- [Chapter 33 — Exposing Devices to Userspace](33_exposing_devices_to_userspace.md)
