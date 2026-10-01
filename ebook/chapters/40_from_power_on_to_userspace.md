# Chapter 40 — From Power-On to Userspace

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Everything in this book comes together in one path: power on → firmware → kernel → drivers → input/display/audio → user program. A single missing step anywhere in this chain breaks the entire system. This chapter is the capstone: trace the whole path, name every handoff, and see which chapters each step depends on.

## Core Idea

Boot is a chain of handoffs. Power-on starts firmware (Chapter 24). Firmware hands off to the kernel via SBI (Chapter 25). The kernel finds hardware through the device tree (Chapter 26). Drivers claim devices (Chapter 28) and access registers (Chapter 29). Interrupts (Chapter 30) and DMA (Chapter 32) move events and data. The input subsystem (Chapter 35) and display (Chapter 36) deliver user interaction. Then a program runs (Chapter 33).

## Worked Example

```text
1. Power on
   CPU starts at reset vector → firmware (M-mode)

2. Firmware initializes DRAM, UART
   Loads kernel, jumps to kernel entry

3. Kernel starts (S-mode via SBI)
   Parses device tree → finds UART, GPIO, display, storage

4. Drivers probe and initialize
   Drivers claim registers, request IRQs, map DMA buffers

5. Kernel mounts root filesystem
   Starts first user process (init)

6. init starts services
   Login prompt appears — a user-space program is running

7. User presses a button
   GPIO interrupt → driver → input subsystem → application reacts

8. Application updates the display
   CPU writes frame → DMA → display controller → screen
```

## The Same Idea Elsewhere

Every step in this chain has been covered. The power-on path exercises MMIO (Chapter 09), device registers (Chapter 10), timing (Chapter 11), interrupts (Chapter 12), privilege (Chapter 14), virtual memory (Chapter 20), the device tree (Chapter 26), and drivers (Chapters 27–33). The user-space path adds file I/O (Chapter 34) and cross-layer debugging (Chapter 39).

## When It Fails

The system boots to firmware but never reaches the kernel. The cause is a missing clock enable in the firmware. The driver would have caught this (Chapter 28), but the firmware runs before any driver. This is why boot failures are special: the debugging tools you would normally use (drivers, dmesg) are not yet running.

## Check

1. The system boots but no login prompt appears. The firmware runs correctly. What is the next layer to check?
   - A) The device tree
   - B) The root filesystem
   - C) The GPIO driver
   - D) The display driver
   - Answer: B
   - Explanation: The kernel is running. The login prompt requires the root filesystem to be mounted and init to start. If the root filesystem is not mounted, no user-space program runs.
   > Hint: What does the kernel need before it can start user space? What provides that?

2. Which of these are part of the power-on path? Pick all that apply.
   - A) Firmware
   - B) SBI handoff
   - C) Device tree parsing
   - D) DMA cache coherency
   - Answer: A, B, C
   - Explanation: Firmware (A), SBI handoff (B), and device tree parsing (C) are part of boot. DMA cache coherency (D) is about data transfers, not boot itself.
   > Hint: What runs first? What does the kernel need? What is not part of boot?

3. The system boots to firmware but never reaches the kernel. The firmware runs correctly. What is the most likely cause?
   - A) A missing clock enable in the firmware
   - B) The driver is not compiled into the kernel
   - C) The device tree is wrong
   - D) The GPIO driver is broken
   - Answer: A
   - Explanation: The firmware runs before any driver. A missing clock enable prevents the firmware from completing its job. The kernel is never reached.
   > Hint: What runs before the kernel? What debugging tools are available at that point?

4. Trace the complete power-on path from power to login prompt. Name every handoff and identify which chapter covers each step.

5. The system boots to the kernel but crashes during driver initialization. List three possible causes and the one diagnostic tool you would use first.

## Limits

This chapter shows a single-path boot. Real systems have recovery paths, multiple kernels, and network booting. The principle — a chain of handoffs, each depending on the previous one — is the same.

## Go Deeper

- [Linux Boot](https://docs.kernel.org/admin-guide/boot.html)
- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)

## Related

Chapter 39
