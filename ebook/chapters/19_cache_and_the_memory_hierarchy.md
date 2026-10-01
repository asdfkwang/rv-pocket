# Chapter 19 — Cache and the Memory Hierarchy

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why The CPU is fast and memory is slow. A cache is a small, fast memory close to the CPU that holds copies of recently used data. Without a cache, every load would wait for DRAM. With a cache, most loads are hits. But a cache is a copy — and copies can be stale.

## Core Idea

Memory is hierarchical: registers (fastest, smallest) → L1 cache → L2 cache → L3 cache → DRAM (slowest, largest) → storage (slowest, largest). Each level is bigger and slower than the one above. The cache exploits **locality**: temporal (recently used data is likely to be used again) and spatial (nearby data is likely to be used soon). A **cache line** is the unit of transfer (typically 64 bytes).

## Worked Example

```text
CPU reads address 0x1000
  → L1 miss (not in L1)
  → L2 miss (not in L2)
  → L3 miss (not in L3)
  → DRAM read: fetch 64-byte line containing 0x1000
  → line stored in L1, L2, L3
  → data returned to CPU
```

The next read of 0x1004 (same line) is an L1 hit — fast. The line was fetched once and serves many reads.

## The Same Idea Elsewhere

- **Hardware:** the cache controller manages lines, tracks state (valid, dirty, shared), and evicts old lines when new ones arrive.
- **RISC-V:** the ISA does not define caches — they are implementation details. But the memory model (Chapter 23) defines what software can assume about visibility.
- **OS:** the OS is cache-transparent — it does not know or care about caches. But it must flush caches when changing page tables (Chapter 20).
- **Linux/driver:** drivers must use the DMA API (Chapter 22) to ensure cache coherency for device buffers. A driver that assumes caches are coherent will see stale data.

## When It Fails

A driver allocates a buffer, writes a DMA descriptor to it, and starts DMA. The descriptor is in the cache but not yet in DRAM. The DMA engine reads DRAM and sees the old descriptor. The transfer fails or corrupts memory. The fix: flush the cache (or use coherent memory) before starting DMA.

## Check

1. A CPU reads address 0x2000. The cache line size is 64 bytes. Which addresses are fetched into the cache?
   - A) Only 0x2000
   - B) 0x2000 to 0x203F (the entire 64-byte line)
   - C) 0x2000 to 0x2007 (8 bytes)
   - D) All of memory
   - Answer: B
   - Explanation: Caches transfer entire lines. The line containing 0x2000 is 64 bytes: 0x2000 to 0x203F.
   > Hint: What is the unit of cache transfer? How big is it?

2. Which of these are types of cache misses? Pick all that apply.
   - A) Compulsory miss (first access)
   - B) Capacity miss (cache is full)
   - C) Conflict miss (multiple addresses map to the same cache set)
   - D) Coherence miss (another core modified the data)
   - Answer: A, B, C, D
   - Explanation: All four are real cache miss types. Compulsory is unavoidable. Capacity and conflict are about cache size and organization. Coherence is about multiple caches.
   > Hint: Can you think of a reason a line would be evicted even if the cache is not full?

3. A cache line is "dirty." What does this mean?
   - A) The data is corrupted
   - B) The data has been modified in the cache but not written back to DRAM
   - C) The data is shared between multiple caches
   - D) The data is invalid
   - Answer: B
   - Explanation: A dirty line has been written by the CPU but the write has not reached DRAM. The cache must write it back before evicting it.
   > Hint: What happens when the CPU writes to a cached address? When does DRAM see the write?

4. Explain why a cache improves performance — what two types of locality does it exploit, and how does each one help?

5. A driver writes a DMA descriptor to a buffer and starts DMA. The DMA engine reads the old descriptor. What cache-related operation is missing, and what are the two ways to fix it?

## Limits

This chapter shows a simple cache. Real caches have multiple levels, set-associative organization, prefetching, and write-back vs write-through policies. The principle — a copy of data that can be stale — is the source of all cache coherency problems (Chapter 23).

## Go Deeper

- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)

## Related

Chapter 18, Chapter 20
