# Chapter 29 — MMIO in a Real Linux Driver

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A Linux driver turns a physical MMIO resource into an I/O mapping and handles registers through __iomem accessors. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

A Linux driver turns a physical MMIO resource into an I/O mapping and handles registers through __iomem accessors.

The ioremap family and readl/writel are contracts for portability, endianness, ordering, and static checking. Replacing them with plain C pointer dereferences can cause platform-specific bugs.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
base=devm_platform_ioremap_resource(...)
v=readl(base+CTRL)
writel(v|ENABLE, base+CTRL)
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

Each accessor can produce a device bus transaction and register side effects.

### In RISC-V

It ultimately comes down to CPU loads and stores with architecture I/O semantics.

### Why the OS Cares

The kernel manages physical resource reservation, mapping lifetime, and concurrent access.

### In Linux / Driver

__iomem and sparse catch I/O pointer misuse, and the accessors hide architecture differences.

## Trace It

1. **Hardware:** Each accessor can produce a device bus transaction and register side effects.
2. **RISC-V:** It ultimately comes down to CPU loads and stores with architecture I/O semantics.
3. **OS:** The kernel manages physical resource reservation, mapping lifetime, and concurrent access.
4. **Linux / Driver:** __iomem and sparse catch I/O pointer misuse, and the accessors hide architecture differences.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Find in the official documentation why plain memcpy may be wrong for MMIO.
2. Research the ordering difference between readl and readl_relaxed.
3. Analyze the problem when the resource size in the DT is smaller than the datasheet range.
4. Find one rule or API directly related to **MMIO in a Real Linux Driver** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- A Linux driver turns a physical MMIO resource into an I/O mapping and handles registers through __iomem accessors.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 28, Chapter 30
