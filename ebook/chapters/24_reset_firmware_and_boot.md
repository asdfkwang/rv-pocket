# Chapter 24 — Reset, Firmware, and Boot

> **Part VI — How Linux Finds Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

After power-on and before Linux starts, the reset vector, ROM, firmware, and boot stages prepare the CPU and the platform. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

After power-on and before Linux starts, the reset vector, ROM, firmware, and boot stages prepare the CPU and the platform.

The boot flow differs per board, but the same view applies throughout: each stage hands privilege mode, memory state, a hardware description, and arguments to the next stage.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
Power→Reset/ROM→OpenSBI→bootloader or Linux→kernel init→userspace
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

The reset vector, boot ROM, and DRAM/clock initialization may be required before the kernel.

### In RISC-V

Hart reset state, privilege handoff, and SBI connect to the RISC-V boot path.

### Why the OS Cares

The kernel consumes the memory map and hardware description passed by firmware to initialize OS state.

### In Linux / Driver

The Linux RISC-V boot protocol, early console, DTB, and initramfs are the key observation points for boot debugging.

## Trace It

1. **Hardware:** The reset vector, boot ROM, and DRAM/clock initialization may be required before the kernel.
2. **RISC-V:** Hart reset state, privilege handoff, and SBI connect to the RISC-V boot path.
3. **OS:** The kernel consumes the memory map and hardware description passed by firmware to initialize OS state.
4. **Linux / Driver:** The Linux RISC-V boot protocol, early console, DTB, and initramfs are the key observation points for boot debugging.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. List per-stage checkpoints for the case where firmware logs appear but the kernel early console does not.
2. Explain when initramfs and the real root filesystem are each needed during boot.
3. Find the DTB and hart-state requirements in the RISC-V Linux boot requirements.
4. Find one rule or API directly related to **Reset, Firmware, and Boot** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [OpenSBI](https://github.com/riscv-software-src/opensbi)
- [RISC-V SBI Specification](https://github.com/riscv-non-isa/riscv-sbi-doc)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- After power-on and before Linux starts, the reset vector, ROM, firmware, and boot stages prepare the CPU and the platform.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 23, Chapter 25
