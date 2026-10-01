# Chapter 28 — Probe: Meeting the Device

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Probe is the center of binding: after a device and driver match, it acquires resources, initializes the hardware, and registers with a subsystem. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

Probe is the center of binding: after a device and driver match, it acquires resources, initializes the hardware, and registers with a subsystem.

Probe in a modern platform driver is not a discovery loop that blindly pokes addresses; it is the step that binds to a device described by firmware or the bus. Missing dependencies may require deferred probe.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
compatible match
→ probe
→ map MMIO
→ get IRQ/clock/reset
→ hardware init
→ subsystem register
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

Probe may handle clocks, resets, chip-ID checks, and real hardware initialization.

### In RISC-V

MMIO and IRQs use the RISC-V-visible hardware mechanisms covered earlier.

### Why the OS Cares

The OS manages resource ownership and device lifecycle.

### In Linux / Driver

Linux devm helpers, EPROBE_DEFER, bus matching, and of_match_table are the core of the probe pattern.

## Trace It

1. **Hardware:** Probe may handle clocks, resets, chip-ID checks, and real hardware initialization.
2. **RISC-V:** MMIO and IRQs use the RISC-V-visible hardware mechanisms covered earlier.
3. **OS:** The OS manages resource ownership and device lifecycle.
4. **Linux / Driver:** Linux devm helpers, EPROBE_DEFER, bus matching, and of_match_table are the core of the probe pattern.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Construct a dependency example that needs EPROBE_DEFER and explain why the retry is needed.
2. Explain in terms of lifetime why devm-managed resources simplify error and remove paths.
3. Diagram the resource-acquisition order in one real platform driver probe.
4. Find one rule or API directly related to **Probe: Meeting the Device** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [Linux Driver Model](https://docs.kernel.org/driver-api/driver-model/)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Probe is the center of binding: after a device and driver match, it acquires resources, initializes the hardware, and registers with a subsystem.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 27, Chapter 29
