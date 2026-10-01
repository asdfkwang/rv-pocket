# Chapter 19 — Cache and the Memory Hierarchy

> **Part V — Memory Becomes Virtual**

## Which copy supplies a memory read?

The earlier instruction traces described architectural values without explaining where those values were physically supplied. A cache keeps recently used memory close to a CPU so many accesses avoid slower lower levels. The question is which copy is valid, which copy is newer, and which observers participate in keeping them consistent.

Use a simplified write-back data cache with 64-byte lines. A line is the unit stored and tracked by this cache. Accessing address `0x2004` can bring the aligned range `0x2000` through `0x203F` into the cache. The requested byte or word is part of that line; neighboring bytes arrive as well.

## Follow one dirty line

Initially RAM at `0x2004` contains integer 7. The CPU reads it, obtaining a cached line. It then stores 9 to the same location. In a write-back policy, the cache may retain 9 while lower memory still holds 7. The line is dirty because it contains modifications not yet written back.

| Event | CPU cache value | Lower-memory value | State |
| --- | --- | --- | --- |
| Before access | absent | 7 | no cached line |
| Read miss filled | 7 | 7 | clean |
| CPU store | 9 | 7 | dirty |
| Writeback | 9 or later evicted | 9 | lower copy updated |

A later load by this CPU sees its value 9 under the relevant memory rules. A hypothetical non-coherent device reading lower memory may still see 7 before writeback. That does not imply ordinary same-CPU loads randomly return old data. It identifies a particular observer outside the coherence arrangement.

Cleaning a dirty line writes its changes toward the required point of visibility. Invalidating removes a cached copy so a later access must obtain a new one. Discarding a dirty line without preserving required changes can lose data. Architecture-specific instructions and DMA APIs define exactly what maintenance is required and where it takes effect.

## Why caches usually help

Temporal locality means data used recently is likely to be used again. Spatial locality means nearby addresses are likely to be used together. A loop over consecutive four-byte elements can use sixteen elements from one 64-byte line before moving to the next. A scattered pointer chain may bring a line for only one useful field, reducing that benefit.

Capacity and placement also matter. A working set larger than the cache displaces useful lines. Addresses competing for the same limited set can cause misses even when their combined size looks small enough. An access-count estimate is therefore not automatically a cache-miss estimate.

Coherence between CPUs coordinates their copies of shared memory. It is distinct from an application's synchronization protocol: two coherent CPUs can still lose an increment as in Chapter 17. Coherence does not make several instructions one atomic transaction, and it does not promise every device is a coherent participant.

## False sharing changes cost without changing the variable

Suppose CPU A repeatedly updates a counter at `0x2000` and CPU B updates a separate counter at `0x2008`. Both lie in the same line. Even if the variables are logically independent and properly synchronized, obtaining writable ownership of that line can force coherence traffic between CPUs.

Separating heavily written independent data into different lines can reduce this false sharing, at the cost of extra space and potentially worse locality elsewhere. It is a performance design based on measured access patterns, not a reason to pad every object automatically.

The next chapter adds address translation. A cache line contains data; a page table describes an address mapping. Chapter 21's TLB caches translations rather than payload bytes. Keeping those roles separate is necessary before reasoning about stale DMA data in Chapters 22–23.

## Check

1. With 64-byte lines, which range contains address `0x203F`?
   - A) `0x2000`–`0x203F`
   - B) `0x203F`–`0x207E`
   - C) `0x2040`–`0x207F`
   - Answer: A
   - Explanation: The line base clears the low six address bits.

2. Which statements follow from the write-back example? Select all that apply.
   - A) A dirty cache line can be newer than lower memory.
   - B) CPU coherence automatically makes a multi-instruction increment atomic.
   - C) A non-coherent observer needs an explicit visibility protocol.
   - Answer: A, C
   - Explanation: Data-copy coordination and operation-level synchronization solve different problems.

3. A sequential loop reads 40 four-byte elements beginning at aligned address `0x2000`, with an initially empty cache and no eviction. Count the distinct lines touched. Repeat for a starting address of `0x203C`.

4. A CPU stores 9, a non-coherent device later writes 12 to lower memory, and a delayed dirty CPU writeback restores 9. Draw the timeline and explain why merely invalidating after the device finishes is too late to repair every such ownership violation.

5. Research challenge: inspect the DMA documentation for your chosen platform or kernel. Determine whether devices are coherent and which API performs required synchronization. Explain why the existence of a CPU cache alone does not identify the correct maintenance instruction.

## Limits

The table uses one simple write-back cache and a deliberately non-coherent observer. Actual cache levels, policies, line sizes, and coherence domains vary. Use the OS's documented DMA interfaces rather than implementing guessed cache operations in a portable driver.

## Go Deeper

- [Linux DMA mapping guide](https://docs.kernel.org/core-api/dma-api-howto.html) — connect cache visibility to device access.
- [Linux false sharing guidance](https://docs.kernel.org/kernel-hacking/false-sharing.html) — inspect line-level interference and measurement techniques.

## Related

- [Chapter 18 — Concurrency and Synchronization](18_concurrency_and_synchronization.md)
- [Chapter 20 — Virtual Memory and Sv39](20_virtual_memory_and_sv39.md)
