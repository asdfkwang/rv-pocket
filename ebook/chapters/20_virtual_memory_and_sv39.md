# Chapter 20 — Virtual Memory and Sv39

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Virtual memory translates the virtual addresses used by the CPU into physical addresses and checks permissions. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Virtual memory translates the virtual addresses used by the CPU into physical addresses and checks permissions.

Sv39 uses a multi-level page table and PTE flags. satp points to the translation root, and a bad mapping or permission leads to a page fault.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
Process A VA 0x4000→PA 0x9000
Process B VA 0x4000→PA 0xD000
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

The MMU and TLB perform translation and permission checks.

### In RISC-V

Sv39 PTEs, satp, and SFENCE.VMA are the core of RISC-V virtual memory.

### Why the OS Cares

The OS manages per-process page tables, mappings, protection, and page-fault policy.

### In Linux / Driver

The Linux generic MM combines with the RISC-V page-table implementation.

## Trace It

1. **Hardware:** The MMU and TLB perform translation and permission checks.
2. **RISC-V:** Sv39 PTEs, satp, and SFENCE.VMA are the core of RISC-V virtual memory.
3. **OS:** The OS manages per-process page tables, mappings, protection, and page-fault policy.
4. **Linux / Driver:** The Linux generic MM combines with the RISC-V page-table implementation.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. Compute the number of page-offset bits in a 4 KiB page.
2. Find in the specification which fault occurs on a store to a valid PTE without write permission.
3. Explain with satp/page-table roots why the same VA can map to different PAs in different processes.
4. Find one rule or API directly related to **Virtual Memory and Sv39** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Memory Management](https://docs.kernel.org/mm/)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Virtual memory translates the virtual addresses used by the CPU into physical addresses and checks permissions.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 19, Chapter 21
