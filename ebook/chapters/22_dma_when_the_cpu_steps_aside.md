# Chapter 22 — DMA: When the CPU Steps Aside

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Copying data with the CPU is slow — every byte passes through registers. **DMA** (Direct Memory Access) lets a device read and write memory directly, without CPU involvement. The CPU sets up the transfer, the device does the work, and an interrupt signals completion. DMA is essential for high-throughput devices like displays, network cards, and storage.

## Core Idea

A DMA engine is a hardware unit that generates memory transactions. The CPU programs it with: source address, destination address, and length. The engine transfers data and raises an interrupt when done. The CPU is free to do other work during the transfer. DMA addresses are **physical** (or bus) addresses — the device does not understand virtual memory.

## Worked Example

Copy 4 KB from RAM to a display buffer:

```text
1. CPU writes to DMA registers:
     source = 0x1000 (physical)
     dest   = 0x2000 (physical)
     length = 4096
2. CPU starts the transfer
3. DMA engine reads 0x1000..0x10FFF, writes 0x2000..0x20FFF
4. DMA engine raises an interrupt
5. CPU handles the interrupt, knows the transfer is done
```

The CPU did almost nothing — just setup and completion handling.

## The Same Idea Elsewhere

- **Hardware:** the DMA engine is a bus master — it can initiate memory transactions independently of the CPU.
- **RISC-V:** the ISA does not define DMA — it is a platform feature. The CPU programs the DMA engine via MMIO (Chapter 09).
- **OS:** the OS provides DMA abstractions (like the Linux DMA API) that handle mapping, coherency, and streaming.
- **Linux/driver:** a driver uses `dma_map_single` (for coherent buffers) or `dma_map_sg` (for scatter-gather) to get device-usable addresses, and `dma_unmap_*` when done.

## When It Fails

A driver passes a kernel virtual address to the DMA engine. The engine uses it as a physical address. The transfer reads or writes the wrong memory. The fix: use the DMA API to get the correct bus address. The virtual-to-physical translation is not optional — it is the difference between working and corruption.

## Check

1. A DMA transfer is set up with source 0x1000, dest 0x2000, length 4096. What does the DMA engine do?
   - A) Copy 4096 bytes from virtual 0x1000 to virtual 0x2000
   - B) Copy 4096 bytes from physical 0x1000 to physical 0x2000
   - C) Copy 4096 bytes from CPU register to memory
   - D) Nothing — the CPU must do the copy
   - Answer: B
   - Explanation: DMA works with physical (bus) addresses. The engine copies directly between physical addresses.
   > Hint: What kind of address does a device understand? Virtual or physical?

2. Which of these are true about DMA? Pick all that apply.
   - A) DMA transfers do not use the CPU
   - B) DMA addresses are physical addresses
   - C) DMA requires cache coherency management
   - D) DMA is slower than CPU copying
   - Answer: A, B, C
   - Explanation: DMA is faster than CPU copying (D is false). It does not use the CPU (A), uses physical addresses (B), and requires cache management (C).
   > Hint: Why is DMA faster? What does the CPU do during a DMA transfer?

3. A driver allocates a buffer, writes a descriptor to it, and starts DMA. The DMA engine reads the old descriptor. What is the most likely cause?
   - A) The DMA engine is broken
   - B) The descriptor is in the cache but not in DRAM
   - C) The buffer is too small
   - D) The interrupt is not configured
   - Answer: B
   - Explanation: The CPU wrote the descriptor to the cache. The DMA engine reads DRAM. Without a cache flush, the engine sees the old data.
   > Hint: Where does the CPU write? Where does the DMA engine read?

4. Explain the difference between coherent and streaming DMA mappings — when would you use each, and what is the performance tradeoff?

5. A driver uses `dma_map_single` for a buffer, starts DMA, and immediately calls `dma_unmap_single`. The transfer fails. What went wrong, and what is the correct order of operations?

## Limits

This chapter shows simple DMA. Real systems have scatter-gather (multiple buffers in one transfer), IOMMU (device address translation), and DMA rings (hardware-managed descriptor lists). The principle — the device accesses memory directly — is the same.

## Go Deeper

- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Driver API (DMA)](https://docs.kernel.org/driver-api/dma.html)

## Related

Chapter 21, Chapter 23
