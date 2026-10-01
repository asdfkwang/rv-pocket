# Chapter 10 — Device Registers

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A device register is a state interface where the write or read itself triggers a hardware action, not just value storage. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

A device register is a state interface where the write or read itself triggers a hardware action, not just value storage.

Because of semantics such as RW, RO, WO, W1C, read-to-clear, and self-clearing, treating registers like normal RAM causes bugs. The datasheet's access types and reserved-bit rules are the contract.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
STATUS: bit0 READY RO, bit1 ERROR W1C
clear only ERROR from STATUS=0b11 → write 0b10
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The device state machine interprets a register transaction as a command or an acknowledgement.

### In RISC-V

The CPU only executes loads and stores; the peripheral specification defines what the registers mean.

### Why the OS Cares

When multiple contexts touch the same register, software synchronization and ownership are required.

### In Linux / Driver

Linux drivers implement register semantics through readl/writel, masks, regmap, and similar helpers.

## Trace It

1. **Hardware:** The device state machine interprets a register transaction as a command or an acknowledgement.
2. **RISC-V:** The CPU only executes loads and stores; the peripheral specification defines what the registers mean.
3. **OS:** When multiple contexts touch the same register, software synchronization and ownership are required.
4. **Linux / Driver:** Linux drivers implement register semantics through readl/writel, masks, regmap, and similar helpers.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Trace the state to show why a plain read-modify-write is dangerous when RW bits and W1C bits share one register.
2. Explain why failing to preserve reserved bits, or writing 1 to them, can be dangerous on future silicon.
3. Find W1C handling code in one upstream driver and connect it to the datasheet semantics.
4. Find one rule or API directly related to **Device Registers** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- A device register is a state interface where the write or read itself triggers a hardware action, not just value storage.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 09, Chapter 11
