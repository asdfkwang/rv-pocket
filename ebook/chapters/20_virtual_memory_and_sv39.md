# Chapter 20 — Virtual Memory and Sv39

> **Part V — Memory Becomes Virtual**

## How can two programs use the same address?

Chapter 16 left an important mechanism hidden: process A and process B can both refer to virtual address `0x40403123` while reaching different physical memory. Virtual memory translates the address used by an instruction and checks permissions. It does not require each process's physical pages to be contiguous.

A page is a fixed-size region for mapping and protection. We begin with 4 KB pages, so the low 12 address bits are the offset within a page. Translation changes the page number while retaining that offset. A page table records the mapping; the memory-management unit, or MMU, consults it when an applicable translation is not already cached.

Our example uses Sv39 on RV64, user-mode execution, and a successful three-level walk to a 4 KB leaf. Sv39 uses 39 meaningful virtual-address bits, with the upper bits of a 64-bit address required to match bit 38. The chosen address lies in its lower canonical region.

## First split the actual address

Translate `VA = 0x0000000040403123`. Its fields are:

```text
VPN[2] = 1     bits 38:30
VPN[1] = 2     bits 29:21
VPN[0] = 3     bits 20:12
offset = 0x123 bits 11:0

VA = (1 << 30) + (2 << 21) + (3 << 12) + 0x123
```

Each VPN field is nine bits, so it selects one of 512 entries. An Sv39 page-table entry occupies eight bytes: `512 * 8 = 4096`, allowing one table to fit in one 4 KB page. Multiple levels let the OS allocate lower tables only for regions it needs, instead of allocating a flat entry for every possible virtual page.

## Walk three concrete tables

Assume satp selects Sv39 and names root physical page `0x81000`, whose base is `0x81000000`. All page-table memory is accessible to the walker. The OS has installed these entries:

| Table base | Index | Entry's physical address | Entry meaning |
| --- | --- | --- | --- |
| `0x81000000` | 1 | `0x81000008` | valid non-leaf, next table `0x81001000` |
| `0x81001000` | 2 | `0x81001010` | valid non-leaf, next table `0x81002000` |
| `0x81002000` | 3 | `0x81002018` | valid leaf, physical page base `0x82005000` |

At each level, the entry address is `table_base + index * 8`. The pointer to the next table is extracted from that entry's physical page number, not inferred from adjacency. We chose adjacent table pages for readability; they need not be adjacent in RAM.

For this user read/write mapping, the leaf has V, R, W, U, A, and D set, and X clear. These mean valid, readable, writable, user-accessible, accessed, dirty, and not executable. The two non-leaf entries have V set and R/W/X clear. We avoid accessed/dirty update policy in this first successful walk by setting A and D in advance.

The result is `0x82005000 + 0x123 = 0x82005123`. A read from that location obtains data; the page-table reads obtained mapping metadata. Mixing those two kinds of reads makes a walk diagram hard to interpret.

## Change the process, change the root

Process B can have a different root and a leaf for the same virtual page that points to `0x83007000`. Its same VA then reaches `0x83007123`. Alternatively, both processes can intentionally map one physical page for sharing. Separate address spaces allow isolation and controlled sharing; they do not require every physical byte to be private.

A user access to a leaf without the necessary user/read/write permission is rejected even if the physical page exists. An invalid entry or a forbidden access produces a page fault under the relevant translation rules. The OS decides whether the access represents a recoverable condition or a policy violation.

The program cannot normally repair its own privileged translation state directly. Chapter 14's privilege checks protect the kernel's mapping decisions. Chapter 21 explains how cached translations and faults interact with changes to those decisions.

## Check

1. In the worked walk, what is the final physical address?
   - A) `0x81002018`
   - B) `0x82005123`
   - C) `0x40403123`
   - Answer: B
   - Explanation: The leaf supplies the physical page base and the original VA supplies offset 0x123.

2. Which statements are correct? Select all that apply.
   - A) Page-table entries are data stored in physical memory.
   - B) Adjacent virtual pages must map to adjacent physical pages.
   - C) Two roots can map the same VA differently.
   - Answer: A, C
   - Explanation: The OS chooses each mapping; virtual adjacency does not impose physical adjacency.

3. Translate `0x40403ABC` with the same tables. Then explain what additional entry would be needed for `0x40404123`. Show the index that changes and why.

4. Keep the leaf's physical page number but clear U. Explain the outcome of a user load and why changing only the numeric address in the application does not grant permission to that page.

5. Research challenge: use the Sv39 specification to construct a valid 2 MB leaf at the middle level for an aligned region. State which table lookup disappears, how more low address bits become the offset, and what alignment rule would make an otherwise valid-looking entry fault.

## Limits

The trace assumes 4 KB leaves, valid canonical addresses, permitted page-table memory accesses, and preset A/D bits. Sv39 also supports larger leaves and additional permission rules. TLBs can avoid repeated walks, but do not replace the page tables as the mapping's software-managed source.

## Go Deeper

- [RISC-V Sv39 and address translation](https://docs.riscv.org/reference/isa/priv/supervisor.html) — verify VPN fields, PTE flags, walk termination, and superpage alignment.
- [Linux page tables](https://docs.kernel.org/mm/page_tables.html) — compare architecture-specific levels with kernel abstractions.

## Related

- [Chapter 19 — Cache and the Memory Hierarchy](19_cache_and_the_memory_hierarchy.md)
- [Chapter 21 — TLBs and Page Faults](21_tlbs_page_faults_and_memory_management.md)
