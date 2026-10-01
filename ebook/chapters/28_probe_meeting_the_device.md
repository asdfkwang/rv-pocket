# Chapter 28 — Probe: Meeting the Device

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Probe is where the driver and the device first meet. The kernel has found a matching device tree node; now the driver must claim the device, map its registers, and prepare it for use. A probe that succeeds but leaves the device half-initialized is worse than a probe that fails loudly.

## Core Idea

Probe does three things: **claim resources** (map registers, request IRQ), **initialize the device** (enable clocks, reset, configure), and **register operations** (tell the kernel what the device can do). If any step fails, probe returns an error and the kernel cleans up. Probe must be idempotent — it may be called multiple times for multiple devices.

## Worked Example

```c
static int my_uart_probe(struct platform_device *pdev) {
    struct resource *res;
    void __iomem *base;

    // 1. Claim resources
    res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    base = devm_platform_ioremap_resource(pdev, 0);
    if (IS_ERR(base)) return PTR_ERR(base);

    // 2. Initialize device
    // (enable clocks, reset, configure)

    // 3. Register operations
    // (add UART port, register IRQ handler)
    return 0;
}
```

Each step is explicit. If step 1 fails, the kernel cleans up. If step 2 fails, the driver returns an error. If step 3 fails, the driver undoes steps 1 and 2.

## The Same Idea Elsewhere

- **Hardware:** the device is idle until probe configures it. Probe writes to control registers to enable the device.
- **RISC-V:** the driver uses MMIO (Chapter 09) to access registers.
- **OS:** the kernel provides the platform device framework and resource management.
- **Linux/driver:** probe is the driver's entry point. It is where most driver bugs live.

## When It Fails

Probe maps the registers and returns success, but the device does not work. The driver forgot to enable the device's clock. The registers are accessible but the device is not running. The bug is not the mapping — it is the missing initialization. The fix: read the datasheet and enable all required clocks and resets.

## Check

1. A driver's probe function returns an error. What does the kernel do?
   - A) Ignore the error and continue
   - B) Clean up and mark the device as unprobed
   - C) Retry probe forever
   - D) Panic
   - Answer: B
   - Explanation: If probe fails, the kernel cleans up any resources that were claimed and leaves the device unprobed. The driver may be tried again later.
   > Hint: What does the kernel do when a driver fails? Does it retry immediately?

2. Which of these are probe responsibilities? Pick all that apply.
   - A) Map device registers
   - B) Request the device's IRQ
   - C) Register the driver's operations
   - D) Load the device firmware
   - Answer: A, B, C
   - Explanation: Probe maps registers, requests IRQ, and registers operations. Firmware loading is a separate step (and not all devices need it).
   > Hint: What does the driver need from the device? What does the kernel need from the driver?

3. A driver is loaded but the device does not work. Probe returned success. What is the most likely cause?
   - A) The driver is not compiled into the kernel
   - B) Probe did not fully initialize the device
   - C) The kernel does not support device trees
   - D) The device is not described in the device tree
   - Answer: B
   - Explanation: Probe returned success, so the driver is loaded and the device is described. The bug is in probe's initialization — something was missed.
   > Hint: What does probe do? What could it do incompletely?

4. Explain why probe must be idempotent — what happens if probe is called twice for the same device?

5. A driver's probe function maps registers and requests IRQ, but the device still does not work. List three possible missing initialization steps and the one register read that would distinguish them.

## Limits

This chapter shows a simple probe. Real probes handle power management, clock gating, and complex reset sequences. The principle — claim, initialize, register — is the same.

## Go Deeper

- [Linux Driver Model (probe)](https://docs.kernel.org/driver-api/driver-model/)
- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)

## Related

Chapter 27, Chapter 29
