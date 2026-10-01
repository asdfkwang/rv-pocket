# Chapter 30 — Interrupts in a Real Linux Driver

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The Linux driver IRQ path connects a hardware signal, an architecture trap, generic IRQ handling, and a device handler into one callback chain. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

The Linux driver IRQ path connects a hardware signal, an architecture trap, generic IRQ handling, and a device handler into one callback chain.

The primary hard-IRQ handler runs in a context that cannot sleep, so it briefly identifies and acknowledges the source and defers heavy work to a threaded IRQ or worker.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
device level IRQ
→ controller pending
→ CPU trap
→ generic IRQ
→ my_irq()
→ read status/clear source
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

Edge versus level triggering, interrupt-controller routing, and device acknowledgment determine the physical behavior.

### In RISC-V

Architecture trap entry hands the interrupt to the Linux generic-IRQ world.

### Why the OS Cares

The OS distinguishes hard-IRQ context from schedulable process and thread context.

### In Linux / Driver

request_irq, request_threaded_irq, irqdomain, and affinity abstract away hardware differences.

## Trace It

1. **Hardware:** Edge versus level triggering, interrupt-controller routing, and device acknowledgment determine the physical behavior.
2. **RISC-V:** Architecture trap entry hands the interrupt to the Linux generic-IRQ world.
3. **OS:** The OS distinguishes hard-IRQ context from schedulable process and thread context.
4. **Linux / Driver:** request_irq, request_threaded_irq, irqdomain, and affinity abstract away hardware differences.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Explain the process that leads to an interrupt storm when a level IRQ source is not cleared.
2. Construct a situation on a shared IRQ where returning IRQ_NONE is required.
3. Research the purpose of irqdomain translating a firmware specifier into a Linux IRQ number.
4. Find one rule or API directly related to **Interrupts in a Real Linux Driver** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [Linux Generic IRQ](https://docs.kernel.org/core-api/genericirq.html)
- [Linux Locking](https://docs.kernel.org/locking/)
- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- The Linux driver IRQ path connects a hardware signal, an architecture trap, generic IRQ handling, and a device handler into one callback chain.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 29, Chapter 31
