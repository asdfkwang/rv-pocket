# Chapter 21 — TLBs and Page Faults

> **Part V — Memory Becomes Virtual**

## Why is a missing translation not always a fault?

Chapter 20 required three page-table reads before the final data access. A translation lookaside buffer, or TLB, caches recently used translations and relevant permissions. It is different from a data cache: its answer is where and under what permissions an address can be accessed, not the payload stored there.

A TLB miss means the needed translation is not currently available in that cache. A page fault means translation or access checks could not authorize the requested operation. A miss can trigger a successful hardware walk and require no OS intervention at all.

## Compare three paths for one virtual address

Use Chapter 20's mapping from virtual page `0x40403000` to physical page `0x82005000`.

| Situation | Translation action | Outcome |
| --- | --- | --- |
| Valid matching TLB entry | use cached page and permissions | access physical offset location |
| No TLB entry, valid page tables | walk tables and cache result as appropriate | same permitted access |
| No usable translation, leaf invalid | walk cannot authorize access | page fault to OS |

In the second row, the extra work is primarily hardware translation work. In the third, the OS must interpret the fault against the process's intended mappings. A missing leaf might mean a valid demand-allocated page has not been populated yet; it might also mean the program used an invalid pointer. The PTE alone is not the kernel's entire memory-management policy.

For a recoverable anonymous-memory fault, the kernel can allocate and initialize a physical page, install the mapping with appropriate synchronization, and retry the instruction. Chapter 13 explained why the saved PC remains at the faulting load or store. If allocation fails or the address is disallowed, the response is different.

## A copy-on-write fault can be intentional

After sharing a page between processes under a copy-on-write policy, the OS can mark both mappings read-only. Reads share the original page. A write faults, allowing the kernel to allocate a private copy for the writer and change its mapping before retrying the store.

```text
before write: A's VA -> shared page P, read-only
              B's VA -> shared page P, read-only
A writes:     protection fault
kernel:       copy P to Q; map A's VA -> Q, writable
retry:        A's store changes Q; B continues reading P
```

A page fault here implements a policy rather than reporting a broken program. It does not necessarily involve storage I/O. Other faults can require fetching data from a file or swap, while many are resolved entirely in memory.

## Updating the table is not updating every cached answer

Suppose a CPU cached `VA -> P` and the OS changes the PTE to `VA -> Q`. A coherent data-cache system may make the new PTE bytes visible, yet the CPU can still hold an old translation. Data coherence does not automatically replace cached address-translation state.

RISC-V's SFENCE.VMA provides the required ordering/invalidation operation for relevant local address-translation state. Its operands can limit the address and address-space scope under the architectural rules. It is not a generic instruction to flush payload data from the CPU cache.

If another CPU may use the mapping, the OS needs a coordinated remote operation, often called a TLB shootdown, before reusing memory that stale translations could still reach. The initiating CPU cannot satisfy another CPU's local translation obligations merely by executing its own fence.

The safe conceptual sequence is: publish the mapping change according to the kernel's page-table rules, arrange the necessary local and remote translation synchronization, wait for required completion, and only then reuse an old page when no valid reference remains. Reusing too early can turn a stale translation into access to an unrelated object's data.

Chapter 22 adds devices as another kind of memory actor. A device's address view may differ from either the application's or the CPU's physical view.

## Check

1. A TLB miss finds a valid permitted mapping during the hardware walk. What follows?
   - A) The process must be killed.
   - B) The access can proceed without a page-fault handler.
   - C) The page must be read from disk.
   - Answer: B
   - Explanation: Missing cached translation and invalid mapping are distinct conditions.

2. Which can require OS handling? Select all that apply.
   - A) An intentional copy-on-write write fault
   - B) An access to a disallowed user address
   - C) Every successful hardware TLB refill
   - Answer: A, B
   - Explanation: Fault policy is handled by software; a successful hardware walk need not trap.

3. In the copy-on-write trace, show the page contents before and after A changes byte offset 8. Identify what B observes and when Q can become writable without violating the intended sharing policy.

4. Construct a two-CPU use-after-reassignment bug caused by freeing P before remote TLB synchronization completes. Explain why ordinary data-cache coherence does not prevent it.

5. Research challenge: inspect SFENCE.VMA and the rules surrounding satp updates. Explain why writing satp is not a universal substitute for the required translation synchronization, and describe the role of address-space identifiers.

## Limits

The fault and shootdown sequences are conceptual. Linux supplies architecture-specific page-table locking, reference tracking, and TLB APIs; driver authors should not replace them with ad hoc CSR operations. Page sizes, ASIDs, and accessed/dirty-bit mechanisms add cases beyond the example.

## Go Deeper

- [RISC-V supervisor translation synchronization](https://docs.riscv.org/reference/isa/priv/supervisor.html) — inspect SFENCE.VMA, satp, and ASID rules.
- [Linux cache and TLB flushing](https://docs.kernel.org/core-api/cachetlb.html) — distinguish the kernel's cache and translation interfaces.
- [Linux page tables](https://docs.kernel.org/mm/page_tables.html) — follow fault handling and mapping changes.

## Related

- [Chapter 20 — Virtual Memory and Sv39](20_virtual_memory_and_sv39.md)
- [Chapter 22 — DMA: When the CPU Steps Aside](22_dma_when_the_cpu_steps_aside.md)
