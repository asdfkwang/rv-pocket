# Chapter 23 — Cache Coherency, DMA, and Memory Ordering

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A cache is a copy of memory. A DMA engine reads memory directly. If the cache has a newer copy than DRAM, DMA reads stale data. **Cache coherency** is the set of rules that keep caches and DMA consistent. **Memory ordering** is the set of rules that determine when writes become visible to other observers. Getting either wrong causes intermittent, hardware-dependent bugs.

## Core Idea

Two problems: **coherency** (is the data the same everywhere?) and **ordering** (when do writes become visible?). For DMA, the driver must ensure that: (1) the CPU's writes to a buffer are in DRAM before DMA starts (flush), and (2) the CPU does not read stale data after DMA completes (invalidate). For ordering, the CPU may reorder writes for performance — a **fence** instruction forces ordering.

## Worked Example

DMA transfer with cache maintenance:

```text
1. CPU writes descriptor to buffer (in cache)
2. CPU flushes cache: descriptor is now in DRAM
3. CPU starts DMA
4. DMA engine reads descriptor from DRAM, transfers data
5. DMA engine raises interrupt
6. CPU invalidates cache: next read of buffer sees DMA's data
7. CPU processes the transferred data
```

Without step 2, DMA may read a stale descriptor. Without step 6, the CPU may read stale data.

## The Same Idea Elsewhere

- **Hardware:** the cache controller implements a coherency protocol (MESI: Modified, Exclusive, Shared, Invalid). DMA bypasses the protocol, so software must manage it.
- **RISC-V:** the memory model (RVWMO) defines ordering rules. The `fence` instruction enforces ordering. Cache management instructions (`cbo.flush`, `cbo.inval`) maintain coherency.
- **OS:** the OS provides cache maintenance primitives. For DMA, the Linux DMA API handles coherency automatically for coherent mappings.
- **Linux/driver:** a driver using the DMA API does not need manual cache maintenance for coherent mappings. For streaming mappings, the API handles flush/invalidate at map/unmap time.

## When It Fails

A driver writes a DMA descriptor, starts DMA, and the engine reads the old descriptor. The driver forgot to flush the cache. The bug is intermittent — sometimes the write reaches DRAM in time, sometimes not. The fix: use the DMA API (which handles coherency) or manually flush before starting DMA.

## Check

1. A CPU writes a value to a cached address. A DMA engine reads the same address from DRAM. What does the DMA engine see?
   - A) The new value — caches are always coherent
   - B) The old value — the write may still be in the cache
   - C) A random value
   - D) The DMA engine cannot read cached addresses
   - Answer: B
   - Explanation: The CPU's write may be in the cache but not yet in DRAM. The DMA engine reads DRAM and sees the old value. Software must flush the cache.
   > Hint: Where does the CPU write? Where does the DMA engine read?

2. Which of these are cache coherency operations? Pick all that apply.
   - A) Flush (write back dirty data to DRAM)
   - B) Invalidate (discard cached data, force re-read from DRAM)
   - C) Clean (write back but keep the line)
   - D) Prefetch (load data into cache before it is needed)
   - Answer: A, B, C
   - Explanation: Flush, invalidate, and clean are coherency operations. Prefetch is a performance optimization, not a coherency operation.
   > Hint: Which of these ensure that DRAM and the cache agree?

3. A driver uses a streaming DMA mapping. When does the DMA API flush the cache?
   - A) Never — streaming mappings are not coherent
   - B) At map time (before DMA starts) and unmap time (after DMA completes)
   - C) Only at map time
   - D) Only at unmap time
   - Answer: B
   - Explanation: For streaming mappings, the API flushes before DMA (so the device sees the CPU's writes) and invalidates after (so the CPU sees the device's writes).
   > Hint: When does the device need to see the CPU's data? When does the CPU need to see the device's data?

4. Explain the difference between a fence instruction and a cache maintenance instruction — what does each one guarantee, and when would you use each?

5. A driver shares a buffer between the CPU and a DMA engine. The CPU writes, DMA reads, DMA writes, CPU reads. Without any cache maintenance, list the four points where stale data could be observed and the operation needed at each.

## Limits

This chapter shows manual cache maintenance. Modern systems have hardware coherency (snooping) between CPU caches, but DMA still bypasses it. The Linux DMA API abstracts most of this, but understanding the underlying operations is essential for debugging.

## Go Deeper

- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)
- [RISC-V Memory Model](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)

## Related

Chapter 22, Chapter 24
