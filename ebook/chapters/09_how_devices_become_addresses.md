# Chapter 09 — How Devices Become Addresses

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

MMIO places device registers in the address space so CPU loads and stores can control devices. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

MMIO places device registers in the address space so CPU loads and stores can control devices.

The CPU issues the same loads and stores, but the interconnect's address decoder picks the destination among RAM, UART, and GPIO. The OS manages this memory map as resources.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
0x80000000.. = RAM
0x10000000..0x10000fff = UART
store 0x41 → 0x10000000 → UART DATA
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The interconnect and address decoder select the physical target.

### In RISC-V

RISC-V loads and stores are the starting point of an MMIO transaction and must follow ordering rules.

### Why the OS Cares

The OS manages ownership and mapping of physical MMIO ranges.

### In Linux / Driver

Device Tree reg properties or PCI BARs provide the resource, and the driver maps it as __iomem.

## Trace It

1. **Hardware:** The interconnect and address decoder select the physical target.
2. **RISC-V:** RISC-V loads and stores are the starting point of an MMIO transaction and must follow ordering rules.
3. **OS:** The OS manages ownership and mapping of physical MMIO ranges.
4. **Linux / Driver:** Device Tree reg properties or PCI BARs provide the resource, and the driver maps it as __iomem.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Compute the register address for UART base 0x10000000 plus offset 0x104.
2. Explain why the same kernel breaks on a different board when it uses hard-coded MMIO addresses.
3. Research and draw the path from a DT reg property to devm_platform_ioremap_resource.
4. Find one rule or API directly related to **How Devices Become Addresses** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)
- [Linux Driver Model](https://docs.kernel.org/driver-api/driver-model/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- MMIO places device registers in the address space so CPU loads and stores can control devices.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 08, Chapter 10
