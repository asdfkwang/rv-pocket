# Chapter 21 — TLBs and Page Faults

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Every virtual memory access requires a page table walk — multiple memory reads just to find the physical address. The **TLB** (Translation Lookaside Buffer) is a cache of recent translations. Without it, virtual memory would be too slow. A **page fault** is when the translation is not in the TLB or the page is not mapped — the OS must intervene.

## Core Idea

The TLB caches virtual-to-physical translations. On a memory access, the MMU checks the TLB first. If the translation is there (a **TLB hit**), the physical address is returned immediately. If not (a **TLB miss**), the MMU walks the page table. If the page table has the mapping, the translation is added to the TLB. If the page table does not have the mapping, the CPU raises a **page fault**.

## Worked Example

```text
CPU accesses virtual address 0x12345000
  → TLB miss (not cached)
  → MMU walks page tables (3 reads for Sv39)
  → mapping found: virtual 0x12345000 → physical 0xABCDE000
  → translation added to TLB
  → physical address 0xABCDE000 returned to CPU
```

Next access to 0x12345000 is a TLB hit — no walk needed.

## The Same Idea Elsewhere

- **Hardware:** the TLB is a small, fast cache inside the MMU. It is fully associative or set-associative.
- **RISC-V:** the privileged spec defines `sfence.vma` to flush TLB entries when page tables change.
- **OS:** the OS manages the TLB indirectly — it flushes entries when changing mappings, and uses ASIDs to avoid flushes on context switches.
- **Linux/driver:** drivers do not manage the TLB directly. But they must be aware that DMA mappings (Chapter 22) may have different TLB behavior than CPU mappings.

## When It Fails

The OS updates a page table but forgets to flush the TLB. The CPU continues using the old translation. The process sees stale data or crashes. The fix: always execute `sfence.vma` after changing page tables. This is a common bug in OS porting.

## Check

1. A TLB miss occurs. What does the MMU do?
   - A) Return a random physical address
   - B) Walk the page table to find the translation
   - C) Raise a page fault immediately
   - D) Ignore the access
   - Answer: B
   - Explanation: A TLB miss means the translation is not cached. The MMU walks the page table to find it. A page fault occurs only if the page table also lacks the mapping.
   > Hint: What is the TLB? What happens when it does not have the answer?

2. Which of these are true about page faults? Pick all that apply.
   - A) A page fault means the page is not in physical memory
   - B) A page fault means the virtual address is not mapped
   - C) The OS handles page faults
   - D) A page fault always kills the process
   - Answer: B, C
   - Explanation: A page fault means the mapping is not in the page table (B). The OS handler decides what to do (C). A is false — the page may be in physical memory but not mapped. D is false — the OS may map the page and resume.
   > Hint: What does the OS do when a page fault occurs? Does it always kill the process?

3. The OS updates a page table. What must it do before the CPU uses the new mapping?
   - A) Nothing — the CPU sees the change immediately
   - B) Flush the TLB (sfence.vma)
   - C) Reboot the CPU
   - D) Invalidate the cache
   - Answer: B
   - Explanation: The TLB caches old translations. Without a flush, the CPU may use the stale mapping. `sfence.vma` invalidates TLB entries.
   > Hint: What caches translations? What happens if that cache is not updated?

4. Explain the difference between a TLB miss and a page fault — what causes each, and what happens in each case?

5. A process accesses a valid virtual address but gets a page fault. The OS handler finds the page is mapped but the TLB entry is stale. What instruction should the OS have executed, and what is the symptom of forgetting it?

## Limits

This chapter shows a simple TLB. Real TLBs have multiple levels, support huge pages, and may be shared between cores. The principle — cache translations, flush on change — is universal.

## Go Deeper

- [RISC-V Privileged Architecture (TLB)](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Memory Management (Page Faults)](https://docs.kernel.org/mm/)

## Related

Chapter 20, Chapter 22
