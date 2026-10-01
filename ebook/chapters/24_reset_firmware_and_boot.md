# Chapter 24 — Reset, Firmware, and Boot

> **Part VI — How Linux Finds Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

When power is applied, the CPU starts executing at a fixed address — the **reset vector**. The first code that runs is **firmware**: it initializes memory, finds the bootloader or kernel, and hands control to the OS. Without firmware, the hardware is inert. Understanding boot is understanding who owns the machine at each stage.

## Core Idea

Boot is a chain of handoffs: firmware → bootloader → kernel → init. Each stage sets up more of the system and passes control to the next. The firmware runs in M-mode (most privileged), initializes DRAM and essential devices, loads the kernel into memory, and jumps to it. The kernel takes over, initializes drivers, and starts the first user process.

## Worked Example

```text
1. Power on
2. CPU starts at reset vector (e.g., 0x1000)
3. Firmware (M-mode) runs:
     - initialize DRAM
     - initialize UART (for debug output)
     - load kernel from storage to RAM
     - jump to kernel entry
4. Kernel (S-mode) runs:
     - initialize page tables
     - initialize drivers
     - mount root filesystem
     - start init process
5. Init (U-mode) runs:
     - start system services
     - present login prompt
```

Each stage is more complex than the last. The firmware is small and hardware-specific; the kernel is large and portable.

## The Same Idea Elsewhere

- **Hardware:** the reset vector is a fixed address. The CPU's first instruction is fetched from there.
- **RISC-V:** the privileged spec defines the reset behavior and the CSRs that firmware configures.
- **OS:** the kernel is the second stage. It assumes firmware has done minimal setup (DRAM, UART).
- **Linux/driver:** drivers are initialized by the kernel after boot. A driver's probe function runs when the kernel finds a matching device.

## When It Fails

The firmware initializes DRAM but forgets to set the memory size in the device tree. The kernel reads the device tree, sees zero available memory, and panics. The bug is not the kernel — it is the firmware's incomplete hardware description. The fix: firmware must describe the hardware accurately.

## Check

1. The CPU is reset. Where does it start executing?
   - A) At address 0x00000000
   - B) At the reset vector (a fixed address defined by the platform)
   - C) At the kernel entry point
   - D) At the first instruction of the firmware's data section
   - Answer: B
   - Explanation: The reset vector is a fixed address. The CPU's first fetch is from there. The firmware is typically placed at the reset vector.
   > Hint: What is the first thing the CPU does after reset? Where does it look?

2. Which of these are firmware responsibilities? Pick all that apply.
   - A) Initialize DRAM
   - B) Load the kernel into memory
   - C) Initialize all device drivers
   - D) Jump to the kernel entry point
   - Answer: A, B, D
   - Explanation: Firmware initializes essential hardware (DRAM), loads the kernel, and jumps to it. Device drivers are the kernel's job, not firmware's.
   > Hint: What does the kernel need before it can run? What is the kernel's job?

3. The kernel starts but panics with "no memory available." The firmware initialized DRAM correctly. What is the most likely cause?
   - A) The kernel is corrupted
   - B) The firmware did not describe the memory in the device tree
   - C) The CPU is too slow
   - D) The UART is not initialized
   - Answer: B
   - Explanation: The kernel learns about memory from the device tree. If the firmware does not describe it, the kernel sees no memory.
   > Hint: How does the kernel know how much memory exists? Who tells it?

4. Explain the handoff from firmware to kernel — what state does the firmware set up, and what does the kernel assume is already done?

5. A board boots to firmware but never reaches the kernel. The firmware prints "loading kernel" and then stops. List three possible causes and the one test that would distinguish them.

## Limits

This chapter shows a simple boot chain. Real systems have secure boot (verified signatures), multiple firmware stages (ROM → SPL → U-Boot), and complex storage (eMMC, NVMe). The principle — a chain of handoffs from firmware to kernel — is the same.

## Go Deeper

- [RISC-V Boot Protocol](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Boot](https://docs.kernel.org/admin-guide/boot.html)

## Related

Chapter 23, Chapter 25
