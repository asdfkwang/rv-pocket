# Chapter 11 — Polling, Time, and Timers

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Polling is simple waiting that repeatedly checks device state, and timers and timeouts make that waiting safe. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Polling is simple waiting that repeatedly checks device state, and timers and timeouts make that waiting safe.

Polling is convenient for short boot-time waits, but long polling wastes CPU and can become an infinite loop on hardware failure. An OS extends timers into sleep and scheduling.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
while (!(STATUS & READY)) { if (elapsed>10ms) timeout; }
write DATA after READY
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

Clock/counter/compare logic counts time and generates an event or interrupt.

### In RISC-V

The RISC-V timer facility and the SBI timer service can feed the S-mode OS timer.

### Why the OS Cares

The scheduler decides whether a waiting task keeps running or sleeps.

### In Linux / Driver

A Linux driver picks among polling helpers, delays, completions, and interrupts according to context.

## Trace It

1. **Hardware:** Clock/counter/compare logic counts time and generates an event or interrupt.
2. **RISC-V:** The RISC-V timer facility and the SBI timer service can feed the S-mode OS timer.
3. **OS:** The scheduler decides whether a waiting task keeps running or sleeps.
4. **Linux / Driver:** A Linux driver picks among polling helpers, delays, completions, and interrupts according to context.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. Estimate roughly how many cycles a 1 GHz CPU can burn in 1 ms of tight polling.
2. Explain why hardware polling without a timeout is dangerous in a production system, from the fault and scheduler perspectives.
3. Look up the readl_poll_timeout family of helpers and investigate what problem they solve.
4. Find one rule or API directly related to **Polling, Time, and Timers** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Linux Scheduler](https://docs.kernel.org/scheduler/)
- [RISC-V SBI Specification](https://github.com/riscv-non-isa/riscv-sbi-doc)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Polling is simple waiting that repeatedly checks device state, and timers and timeouts make that waiting safe.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 10, Chapter 12
