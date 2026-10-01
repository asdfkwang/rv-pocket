# Chapter 33 — Exposing Devices to Userspace

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A driver must not only operate the hardware but also decide which stable abstraction to present to userspace. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

A driver must not only operate the hardware but also decide which stable abstraction to present to userspace.

Before creating a custom char device or ioctl for each new device, first check whether an existing subsystem — input, IIO, hwmon, tty, DRM, ALSA, netdev — already expresses its semantics.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
GPIO key
→ input_report_key
→ input core
→ /dev/input/eventX
→ standard userspace
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

Physical device details and the userspace abstraction are not the same thing.

### In RISC-V

The final syscall enters the kernel through the ISA/ABI, but device semantics are defined by the Linux subsystem.

### Why the OS Cares

The OS ABI is a long-term contract between applications and the kernel.

### In Linux / Driver

The choice of Linux subsystem directly affects upstream review and tools/ABI compatibility.

## Trace It

1. **Hardware:** Physical device details and the userspace abstraction are not the same thing.
2. **RISC-V:** The final syscall enters the kernel through the ISA/ABI, but device semantics are defined by the Linux subsystem.
3. **OS:** The OS ABI is a long-term contract between applications and the kernel.
4. **Linux / Driver:** The choice of Linux subsystem directly affects upstream review and tools/ABI compatibility.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Research the char device, hwmon, and IIO options for an ambient-light sensor and justify where it belongs.
2. Explain why sysfs is a poor fit for a high-rate streaming path.
3. Trace the path from input_report_* to evdev userspace in a real input driver.
4. Find one rule or API in the official documentation directly related to **Exposing Devices to Userspace**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Input](https://docs.kernel.org/input/)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- A driver must not only operate the hardware but also decide which stable abstraction to present to userspace.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 32, Chapter 34
