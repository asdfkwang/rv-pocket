# Chapter 22 — DMA: When the CPU Steps Aside

> **Part V — Memory Becomes Virtual**

## What changes when a device accesses memory itself?

Until now, the CPU moved data between RAM and device registers. Direct memory access, or DMA, lets a device or DMA engine transfer data without the CPU executing a load/store loop for every byte. The CPU still configures work, arranges accessible buffers, handles completion, and manages errors.

DMA introduces another memory actor with its own address interpretation and timing. The central problem is therefore ownership: when may the CPU change a buffer, when may the device read or write it, and what event returns it to CPU use?

## Trace one transmit buffer

Assume a device reads a 16-byte packet from memory and sends it externally. The CPU holds a kernel pointer K to the buffer. Through the DMA mapping interface it obtains device address D = `0x40002000`. The mapping may involve an IOMMU, a hardware translation unit for device requests, or other platform mechanisms. D need not equal the CPU's physical address and is not a pointer the CPU should dereference.

```text
CPU-owned: allocate buffer; fill 16 payload bytes
prepare:   obtain DMA mapping and required visibility for device reads
publish:   submit device address D and length 16; start operation
device-owned: device reads buffer while CPU leaves payload untouched
complete:  device-specific evidence proves buffer access finished
reclaim:   synchronize/unmap as required; CPU may reuse or free buffer
```

If the CPU changes byte 8 while the device is reading the packet, the transmitted result can contain an old prefix and a new suffix. A fast CPU or coherent interconnect does not repair the missing ownership agreement. The device observed a buffer whose contents changed during its operation.

Similarly, the register write that starts DMA is not completion. Unmapping or freeing immediately afterward can remove the device's access or let it read memory now assigned to something else. The buffer must outlive every device access authorized by the submission.

## A descriptor describes work; it is not the work

Many devices read a descriptor containing an address, length, and control flags. A ring organizes several such descriptors for queued operations. The CPU prepares a descriptor, then publishes ownership to the device through a flag, index, or MMIO doorbell, a register write notifying hardware that work is available.

Assume descriptor 0 contains D = `0x40002000`, length 16, and an ownership bit initially zero. The CPU must ensure the address and length are visible before setting device ownership under the device's ordering contract. Otherwise the device can see "ready" with an old length or address. Chapter 23 separates this ordering requirement from cache visibility.

The payload buffer and descriptor have different lifetimes and access patterns. A device may read the descriptor once but continue reading payload afterward. Observing descriptor fetch is therefore insufficient proof that payload can be freed. The device specification must identify completion and any prefetch or repeated-access behavior.

## Receive reverses the data direction

For receive DMA, the device writes bytes into the buffer. The CPU must wait for completion and perform the required transition back to CPU access before reading the data. Direction names in the Linux DMA API are from the device relationship: DMA_TO_DEVICE means the device reads memory; DMA_FROM_DEVICE means it writes memory.

On a non-coherent system, cache maintenance may be required at ownership transitions. An IOMMU mapping answers which memory the device can address; cache synchronization answers which contents are visible. One does not automatically substitute for the other.

Timeout recovery is an ownership question too. A timeout proves software has stopped waiting, not that the device has stopped touching memory. Recovery must stop or reset the engine and establish quiescence before releasing its buffers. This reasoning will guide the real Linux lifecycle in Chapter 32.

## Check

1. A device starts reading a submitted transmit buffer. When may the CPU free it?
   - A) Immediately after writing the start register
   - B) After the protocol proves device access is finished and required reclaim operations complete
   - C) When the CPU no longer needs the original pointer value
   - Answer: B
   - Explanation: Device lifetime, not CPU instruction completion, governs when the buffer is safe to release.

2. Which statements are correct? Select all that apply.
   - A) A DMA address is always an ordinary kernel pointer.
   - B) A mapping and payload visibility are separate concerns.
   - C) A timeout alone does not prove the device is idle.
   - Answer: B, C
   - Explanation: Device addressing, visibility, and completion are distinct contracts.

3. Construct a timeline in which a device transmits a mixed old/new packet because the CPU reuses the buffer too early. Explain why a memory barrier alone cannot grant ownership back to the CPU.

4. Design a receive-buffer lifecycle with named states and legal transitions. Include normal completion, mapping failure, and timeout recovery before freeing memory.

5. Research challenge: consult the Linux DMA guide and determine which memory allocations are suitable for dma_map_single. Explain why an arbitrary userspace pointer or virtually contiguous allocation cannot simply be substituted into the example.

## Limits

This chapter describes a generic DMA-capable peripheral, not one fixed descriptor format or interrupt protocol. Hardware may prefetch, queue, or repeatedly access memory. Linux's DMA API handles platform mapping and synchronization details when used according to its documented ownership contract.

## Go Deeper

- [Linux DMA mapping guide](https://docs.kernel.org/core-api/dma-api-howto.html) — inspect CPU, physical, and bus addresses and buffer restrictions.
- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html) — compare mapping, synchronization, and unmapping lifetimes.

## Related

- [Chapter 21 — TLBs and Page Faults](21_tlbs_page_faults_and_memory_management.md)
- [Chapter 23 — Cache Coherency, DMA, and Memory Ordering](23_cache_coherency_dma_and_memory_ordering.md)
