# Chapter 39 — Bugs Across Layers

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Good system debugging narrows the cause space by collecting observable state at layer boundaries instead of guessing. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Good system debugging narrows the cause space by collecting observable state at layer boundaries instead of guessing.

The symptom and the root cause can live in different layers. Cross-layer bugs — a race that vanishes when logging is added, a late page fault caused by DMA — require tracking state and timing.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
old frame
check userspace buffer → kernel buffer → DMA address/descriptor → completion → cache/order → display register
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

A logic analyzer and register dumps provide hardware evidence.

### In RISC-V

Trap cause, EPC, and register dumps show the CPU/exception boundary.

### Why the OS Cares

Scheduler state, VM, and wait queues serve as kernel control-flow evidence.

### In Linux / Driver

dmesg, ftrace, tracepoints, dynamic debug, debugfs, and /proc/interrupts are the Linux observation tools.

## Trace It

1. **Hardware:** A logic analyzer and register dumps provide hardware evidence.
2. **RISC-V:** Trap cause, EPC, and register dumps show the CPU/exception boundary.
3. **OS:** Scheduler state, VM, and wait queues serve as kernel control-flow evidence.
4. **Linux / Driver:** dmesg, ftrace, tracepoints, dynamic debug, debugfs, and /proc/interrupts are the Linux observation tools.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Give at least four software/config causes that rule out concluding "hardware fault" from an IRQ count of zero alone.
2. Make a plan to investigate, in race/order terms, a Heisenbug that disappears when printk is added.
3. Construct a path by which DMA memory corruption can surface later as an unrelated page fault.
4. Find one rule or API in the official documentation directly related to **Bugs Across Layers**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Upstream Linux source](https://github.com/torvalds/linux)
- [Linux Generic IRQ](https://docs.kernel.org/core-api/genericirq.html)
- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Good system debugging narrows the cause space by collecting observable state at layer boundaries instead of guessing.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 38, Chapter 40
