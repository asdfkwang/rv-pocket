# Chapter 35 — One Button Press, End to End

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Tracing a single button event from the physical level to the userspace input event connects everything so far — MMIO, IRQ, trap, driver, and scheduler — into one path. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Tracing a single button event from the physical level to the userspace input event connects everything so far — MMIO, IRQ, trap, driver, and scheduler — into one path.

End-to-end debugging means checking the state each layer owns and the signal the next layer observes. The same "button does not work" symptom can come from different failing layers.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
finger
→ GPIO level/status
→ interrupt controller
→ RISC-V trap
→ Linux IRQ
→ input_report_key
→ evdev
→ userspace
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

Pinmux, pull, debounce, GPIO direction, and IRQ trigger settings determine the physical starting point.

### In RISC-V

The interrupt trap moves CPU control flow into the kernel.

### Why the OS Cares

The event can wake a sleeping reader and make it runnable.

### In Linux / Driver

The GPIO/IRQ/input subsystems produce a standardized event across several driver layers.

## Trace It

1. **Hardware:** Pinmux, pull, debounce, GPIO direction, and IRQ trigger settings determine the physical starting point.
2. **RISC-V:** The interrupt trap moves CPU control flow into the kernel.
3. **OS:** The event can wake a sleeping reader and make it runnable.
4. **Linux / Driver:** The GPIO/IRQ/input subsystems produce a standardized event across several driver layers.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Give five possible causes for an IRQ count of zero, spread across the physical, pinmux, DT, and controller stages.
2. Design the next observation points when the IRQ count increases but evtest stays silent.
3. Find the upstream gpio-keys binding and source, and map it onto this path.
4. Find one rule or API in the official documentation directly related to **One Button Press, End to End**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Input](https://docs.kernel.org/input/)
- [Linux Generic IRQ](https://docs.kernel.org/core-api/genericirq.html)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Tracing a single button event from the physical level to the userspace input event connects everything so far — MMIO, IRQ, trap, driver, and scheduler — into one path.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 34, Chapter 36
