# Chapter 38 — Reading a Linux Driver

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Reading a driver is how you learn how hardware actually works. A well-written driver is a story: probe finds the device, interrupts signal events, DMA moves data, and cleanup undoes everything. Learning to read drivers is learning to write them — and learning to debug them.

## Core Idea

A driver has a structure: **probe** (find and initialize), **operations** (read/write/ioctl), **interrupt handler** (events), and **remove** (cleanup). The key is to follow the data: where does it come from, where does it go, what transforms it. The register accesses are the hardware interface; the rest is software logic.

## Worked Example

Reading a UART driver:

```c
static int uart_probe(struct platform_device *pdev) {
    // 1. Map registers
    base = devm_platform_ioremap_resource(pdev, 0);
    // 2. Request IRQ
    irq = platform_get_irq(pdev, 0);
    request_irq(irq, uart_irq, 0, "uart", uart);
    // 3. Initialize hardware
    writel(UART_ENABLE, base + UART_CONTROL);
    // 4. Register with subsystem
    uart_add_one_port(&uart_driver, port);
}
```

The story: find the device, claim its resources, initialize it, and register it with the kernel.

## The Same Idea Elsewhere

- **Hardware:** the driver's register accesses match the datasheet (Chapter 37).
- **RISC-V:** the driver uses MMIO (Chapter 09) to access registers.
- **OS:** the kernel provides the driver framework and subsystems.
- **Linux/driver:** the driver is the code that makes a specific device work.

## When It Fails

A driver is copied from a similar device and modified. The probe works, but the device does not work. The driver uses the wrong register offsets — the similar device had a different register map. The fix: read the datasheet for the actual device, not the similar one.

## Check

1. A driver's probe function maps registers and requests IRQ. What is the next step?
   - A) Return success
   - B) Initialize the hardware
   - C) Register with the subsystem
   - D) Both B and C
   - Answer: D
   - Explanation: After claiming resources, the driver initializes the hardware and registers with the subsystem.
   > Hint: What does the kernel need from the driver? What does the driver need to do before it can be used?

2. Which of these are typical driver operations? Pick all that apply.
   - A) probe
   - B) remove
   - C) read/write
   - D) schedule
   - Answer: A, B, C
   - Explanation: probe, remove, and read/write are standard driver operations. schedule is the kernel scheduler's job.
   > Hint: What does the kernel call when a device appears? When it disappears? When data is transferred?

3. A driver is copied from a similar device. The probe works but the device does not work. What is the most likely cause?
   - A) The driver is not compiled into the kernel
   - B) The driver uses the wrong register offsets
   - C) The kernel does not support device trees
   - D) The device is not described in the device tree
   - Answer: B
   - Explanation: Similar devices often have different register maps. The driver works at the software level but accesses the wrong hardware registers.
   > Hint: What is different between similar devices? What does the driver get wrong?

4. Explain how to read a driver — what is the first thing you look for, and how do you follow the data?

5. A driver's interrupt handler is called but the device does not work. List three possible causes and the one register read that would distinguish them.

## Limits

This chapter shows a simple driver. Real drivers are thousands of lines, with complex state machines and error handling. The principle — follow the data, match the datasheet — is the same.

## Go Deeper

- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)
- [Linux Driver API](https://docs.kernel.org/driver-api/)

## Related

Chapter 37, Chapter 39
