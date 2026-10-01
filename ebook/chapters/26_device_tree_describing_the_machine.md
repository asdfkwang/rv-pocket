# Chapter 26 — Device Tree: Describing the Machine

> **Part VI — How Linux Finds Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Device Tree describes hardware configuration such as addresses, IRQs, clocks, and GPIOs as data, separating the kernel and drivers from board-specific hard coding. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

Device Tree describes hardware configuration such as addresses, IRQs, clocks, and GPIOs as data, separating the kernel and drivers from board-specific hard coding.

compatible serves as the matching key, while properties such as reg, interrupts, and clocks describe resources. A binding is the contract for property meanings.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
uart@10000000 {
  compatible="vendor,my-uart";
  reg=<0x0 0x10000000 0x0 0x1000>;
  interrupts=<5>;
};
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

Addresses and IRQs in the DT represent the actual SoC wiring and memory map.

### In RISC-V

Under the RISC-V boot convention, firmware commonly passes a DTB pointer to the kernel.

### Why the OS Cares

The OS converts the description into device and resource objects for driver discovery.

### In Linux / Driver

The Linux OF and driver core match compatible strings, and the platform driver probe consumes the resources.

## Trace It

1. **Hardware:** Addresses and IRQs in the DT represent the actual SoC wiring and memory map.
2. **RISC-V:** Under the RISC-V boot convention, firmware commonly passes a DTB pointer to the kernel.
3. **OS:** The OS converts the description into device and resource objects for driver discovery.
4. **Linux / Driver:** The Linux OF and driver core match compatible strings, and the platform driver probe consumes the resources.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Explain why reg cell interpretation depends on the parent's address-cells and size-cells.
2. Research the purpose of listing multiple compatible strings from the DT specification and binding perspective.
3. Explain via irqdomain why a hardware IRQ specifier may differ from a Linux virtual IRQ number.
4. Find one rule or API directly related to **Device Tree: Describing the Machine** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)
- [Linux Driver Model](https://docs.kernel.org/driver-api/driver-model/)
- [Linux Generic IRQ](https://docs.kernel.org/core-api/genericirq.html)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Device Tree describes hardware configuration such as addresses, IRQs, clocks, and GPIOs as data, separating the kernel and drivers from board-specific hard coding.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 25, Chapter 27
