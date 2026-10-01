# Chapter 27 — What a Linux Device Driver Is

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A Linux driver is not just code that touches registers; it is an adapter that connects hardware to the kernel's common subsystems and userspace abstractions. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

A Linux driver is not just code that touches registers; it is an adapter that connects hardware to the kernel's common subsystems and userspace abstractions.

The driver core manages device and driver lifecycles, while subsystems such as input, IIO, tty, net, and DRM provide userspace semantics. One driver can bind to multiple device instances.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
Hardware↔MMIO/IRQ/DMA↔Driver↔Input/IIO/TTY/Net↔Userspace
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

The driver implements the register, interrupt, and DMA-engine contract from the datasheet.

### In RISC-V

Below the portable C driver, RISC-V MMIO, barriers, and trap machinery perform the actual execution.

### Why the OS Cares

The OS wraps device-specific mechanisms in a generic resource and object model.

### In Linux / Driver

The Linux subsystem choice directly affects the userspace ABI and upstream design.

## Trace It

1. **Hardware:** The driver implements the register, interrupt, and DMA-engine contract from the datasheet.
2. **RISC-V:** Below the portable C driver, RISC-V MMIO, barriers, and trap machinery perform the actual execution.
3. **OS:** The OS wraps device-specific mechanisms in a generic resource and object model.
4. **Linux / Driver:** The Linux subsystem choice directly affects the userspace ABI and upstream design.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Explain why struct device and struct device_driver are not in a 1:1 relationship.
2. Research why IIO or hwmon should be considered before a custom char device for a new sensor.
3. Find hardware-facing code and subsystem-facing code in a real driver.
4. Find one rule or API directly related to **What a Linux Device Driver Is** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Linux Driver Model](https://docs.kernel.org/driver-api/driver-model/)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- A Linux driver is not just code that touches registers; it is an adapter that connects hardware to the kernel's common subsystems and userspace abstractions.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 26, Chapter 28
