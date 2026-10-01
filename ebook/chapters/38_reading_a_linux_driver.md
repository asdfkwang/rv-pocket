# Chapter 38 — Reading a Linux Driver

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Do not read a large driver line by line from the top; anchor on registration, match, probe, private state, I/O, IRQ, subsystem callbacks, and remove. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Do not read a large driver line by line from the top; anchor on registration, match, probe, private state, I/O, IRQ, subsystem callbacks, and remove.

Understanding the control inversion where the Linux framework calls your callbacks quickly answers "who calls this function?" The private struct gathers hardware and software state in one place.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
search order: id/of table → *_driver struct → probe → private struct → MMIO helpers → IRQ → subsystem ops → PM/remove
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

Read register offsets and masks against the datasheet tables.

### In RISC-V

Underneath portable driver C, architecture-specific MMIO, barrier, and DMA implementations do the work.

### Why the OS Cares

Read lifecycle, context, ownership, and concurrency together.

### In Linux / Driver

devm, regmap, runtime PM, and subsystem helpers shape the actual code structure.

## Trace It

1. **Hardware:** Read register offsets and masks against the datasheet tables.
2. **RISC-V:** Underneath portable driver C, architecture-specific MMIO, barrier, and DMA implementations do the work.
3. **OS:** Read lifecycle, context, ownership, and concurrency together.
4. **Linux / Driver:** devm, regmap, runtime PM, and subsystem helpers shape the actual code structure.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Write the match → probe → IRQ → remove path of a real platform driver, with function names.
2. Classify private-struct fields into hardware state, kernel resources, and synchronization objects.
3. Find five clues in real code for deciding whether a callback runs in process, IRQ, or worker context.
4. Find one rule or API in the official documentation directly related to **Reading a Linux Driver**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Linux Driver Model](https://docs.kernel.org/driver-api/driver-model/)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Do not read a large driver line by line from the top; anchor on registration, match, probe, private state, I/O, IRQ, subsystem callbacks, and remove.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 37, Chapter 39
