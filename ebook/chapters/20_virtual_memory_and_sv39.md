# Chapter 20 — Virtual Memory and Sv39

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Without virtual memory, every program must fit in physical memory, and one program can corrupt another. **Virtual memory** gives each program its own address space — a private, contiguous range of addresses that the hardware maps to physical memory. The mapping is done by the **MMU** (Memory Management Unit) using **page tables**.

## Core Idea

Virtual memory divides address space into **pages** (typically 4 KB). Each virtual page maps to a physical page. The mapping is stored in a **page table** — a tree of tables. Sv39 is RISC-V's 39-bit virtual address scheme: 3 levels of page tables, 4 KB pages, 512 entries per table. The MMU walks the table to translate a virtual address to a physical one.

## Worked Example

Sv39 virtual address (39 bits):

```text
| VPN[2] (9 bits) | VPN[1] (9 bits) | VPN[0] (9 bits) | offset (12 bits) |
```

Translation:

```text
1. MMU reads the root page table address from the satp CSR
2. VPN[2] indexes the root table → physical address of level-1 table
3. VPN[1] indexes the level-1 table → physical address of level-0 table
4. VPN[0] indexes the level-0 table → physical page number
5. Physical page number + offset = physical address
```

Each step is a memory read. The TLB (Chapter 21) caches the result to avoid the walk.

## The Same Idea Elsewhere

- **Hardware:** the MMU is a hardware unit that walks page tables and caches translations in the TLB.
- **RISC-V:** the privileged spec defines Sv39, the `satp` CSR, and the page table entry format.
- **OS:** the OS builds and manages page tables. It maps virtual pages to physical pages, sets permissions, and handles page faults.
- **Linux/driver:** drivers use `get_user_pages` to pin user pages for DMA, or `dma_map_single` to map a kernel buffer for device access.

## When It Fails

A driver passes a user-space virtual address directly to a device. The device uses the address as a physical address. The DMA engine reads the wrong memory — or nothing. The fix: the driver must use the DMA API to translate the user address to a device-usable address (Chapter 22).

## Check

1. In Sv39, how many levels of page tables are walked for a 4 KB page?
   - A) 1
   - B) 2
   - C) 3
   - D) 4
   - Answer: C
   - Explanation: Sv39 has 3 levels: root, level-1, and level-0. Each VPN field indexes one level.
   > Hint: How many VPN fields are in a Sv39 address?

2. Which of these are true about virtual memory? Pick all that apply.
   - A) Each process has its own virtual address space
   - B) Virtual addresses are translated to physical addresses by the MMU
   - C) Page tables are stored in physical memory
   - D) The OS can map the same physical page into multiple virtual address spaces
   - Answer: A, B, C, D
   - Explanation: All four are true. Virtual memory provides isolation (A), translation (B), uses physical memory for tables (C), and allows sharing (D).
   > Hint: What does virtual memory provide? What does the OS do with it?

3. A process accesses a virtual address that is not mapped. What happens?
   - A) The MMU returns a random physical address
   - B) The CPU raises a page fault
   - C) The access is ignored
   - D) The process is killed immediately
   - Answer: B
   - Explanation: An unmapped access causes a page fault. The OS handler decides: map the page, kill the process, or swap in data from disk.
   > Hint: What does the MMU do when it cannot find a translation?

4. Explain why virtual memory enables process isolation — how does the MMU prevent one process from reading another's memory?

5. A driver receives a user-space pointer and passes it directly to a device for DMA. The device reads garbage. Explain what went wrong and what the driver should have done.

## Limits

This chapter shows Sv39 with 4 KB pages. Sv39 also supports 2 MB and 1 GB pages (superpages) that skip levels of the walk. Real systems also have ASIDs (Address Space Identifiers) to avoid TLB flushes on context switches.

## Go Deeper

- [RISC-V Privileged Architecture (Sv39)](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Memory Management](https://docs.kernel.org/mm/)

## Related

Chapter 19, Chapter 21
