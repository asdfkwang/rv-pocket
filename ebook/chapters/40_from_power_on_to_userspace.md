# Chapter 40 — From Power-On to Userspace

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The final goal is to see architecture, OS, and Linux drivers as one system path from power-on to application I/O. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

The final goal is to see architecture, OS, and Linux drivers as one system path from power-on to application I/O.

Reset, firmware, SBI, and Linux boot, the MMU and scheduler, Device Tree and driver probe, and VFS and userspace syscalls are not separate subjects but different stages of the same machine.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
Power→ROM→OpenSBI→Linux→MMU/IRQ/scheduler→DT/probe→rootfs/init→app syscall→driver→MMIO/DMA/IRQ
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

Reset, memory, interrupts, and devices are the physical basis of the whole execution.

### In RISC-V

ISA, privilege, traps, Sv39, and SBI are used throughout boot and runtime.

### Why the OS Cares

Processes, scheduling, VM, files, and synchronization turn hardware mechanisms into abstractions.

### In Linux / Driver

The driver model, DT, VFS, and DMA and IRQ subsystems assemble the real Linux system.

## Trace It

1. **Hardware:** Reset, memory, interrupts, and devices are the physical basis of the whole execution.
2. **RISC-V:** ISA, privilege, traps, Sv39, and SBI are used throughout boot and runtime.
3. **OS:** Processes, scheduling, VM, files, and synchronization turn hardware mechanisms into abstractions.
4. **Linux / Driver:** The driver model, DT, VFS, and DMA and IRQ subsystems assemble the real Linux system.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Write a timeline of at least 12 steps from power-on to the first init instruction.
2. When Linux boots but one device is missing, make a check plan in DT → match → probe → resource → subsystem order.
3. Pick a real RISC-V Linux board and connect its firmware, SBI, DT, and kernel drivers to at least 10 chapters of this book.
4. Find one rule or API in the official documentation directly related to **From Power-On to Userspace**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [RISC-V SBI Specification](https://github.com/riscv-non-isa/riscv-sbi-doc)
- [OpenSBI](https://github.com/riscv-software-src/opensbi)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- The final goal is to see architecture, OS, and Linux drivers as one system path from power-on to application I/O.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 39
