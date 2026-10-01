# Chapter 21 — TLBs, Page Faults, and Memory Management

> **Part V — Memory Becomes Virtual**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The TLB caches page-table translations, and page faults let the OS prepare memory lazily or handle protection violations. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

The TLB caches page-table translations, and page faults let the OS prepare memory lazily or handle protection violations.

A page fault is not always a crash. Demand paging and copy-on-write use faults as a normal control path, and stale TLBs must be handled after page-table changes.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
parent/child share RO page after fork
child write → page fault
→ private copy
→ PTE update
→ retry succeeds
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

The TLB holds recent translations, and on multicore systems each CPU can hold stale entries.

### In RISC-V

SFENCE.VMA provides the ordering and invalidation needed between changes to translation data structures and subsequent translations.

### Why the OS Cares

The OS implements demand paging, COW, mapped files, and fault policy.

### In Linux / Driver

The Linux fault handler examines VMA and PTE state to handle allocation, COW, and file-backed faults.

## Trace It

1. **Hardware:** The TLB holds recent translations, and on multicore systems each CPU can hold stale entries.
2. **RISC-V:** SFENCE.VMA provides the ordering and invalidation needed between changes to translation data structures and subsequent translations.
3. **OS:** The OS implements demand paging, COW, mapped files, and fault policy.
4. **Linux / Driver:** The Linux fault handler examines VMA and PTE state to handle allocation, COW, and file-backed faults.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Give an example of a correctness or security problem caused by a missing TLB invalidation after a page-table update.
2. Research the difference between major and minor page faults from the Linux perspective.
3. Explain why multicore TLB shootdown is tied to IPIs.
4. Find one rule or API directly related to **TLBs, Page Faults, and Memory Management** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Memory Management](https://docs.kernel.org/mm/)
- [Linux Scheduler](https://docs.kernel.org/scheduler/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- The TLB caches page-table translations, and page faults let the OS prepare memory lazily or handle protection violations.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 20, Chapter 22
