# Chapter 12 — Interrupts: Hardware Wants Attention

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

An interrupt is the path by which a device reports an asynchronous event so the CPU does not have to keep polling. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

An interrupt is the path by which a device reports an asynchronous event so the CPU does not have to keep polling.

A hardware IRQ signal changes CPU control flow through the RISC-V trap mechanism and reaches a driver handler via the Linux generic IRQ layer.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
button press
→ GPIO STATUS set
→ IRQ
→ RISC-V trap
→ Linux generic IRQ
→ driver ISR
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

An interrupt controller can mask, route, and prioritize multiple sources.

### In RISC-V

Cause, EPC, the trap vector, and enable state describe an interrupt trap.

### Why the OS Cares

An OS separates interrupt context from process context and defers heavy work.

### In Linux / Driver

request_irq/request_threaded_irq and the generic IRQ layer abstract away controller differences.

## Trace It

1. **Hardware:** An interrupt controller can mask, route, and prioritize multiple sources.
2. **RISC-V:** Cause, EPC, the trap vector, and enable state describe an interrupt trap.
3. **OS:** An OS separates interrupt context from process context and defers heavy work.
4. **Linux / Driver:** request_irq/request_threaded_irq and the generic IRQ layer abstract away controller differences.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. Explain what happens if you return without clearing a level-triggered IRQ source.
2. Find in the official specification how RISC-V cause distinguishes interrupts from exceptions.
3. Compare request_irq with request_threaded_irq and give an example of work to hand off to thread_fn.
4. Find one rule or API directly related to **Interrupts: Hardware Wants Attention** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Generic IRQ](https://docs.kernel.org/core-api/genericirq.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- An interrupt is the path by which a device reports an asynchronous event so the CPU does not have to keep polling.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 11, Chapter 13
