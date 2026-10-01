# Chapter 27 — What a Linux Device Driver Is

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A driver is the kernel's agent for a specific device. It translates generic OS operations (read, write, ioctl) into device-specific register operations. When a device misbehaves, the driver is usually where the bug lives — wrong register, wrong timing, wrong assumption about hardware state.

## Core Idea

A driver is a set of functions that the kernel calls: probe (initialize), remove (cleanup), read/write (data transfer), ioctl (device-specific commands), and interrupt handler (event notification). The driver registers these functions with the kernel. When the kernel finds a matching device, it calls probe. When the device is removed, it calls remove.

## Worked Example

A simple UART driver:

```c
static struct uart_ops my_uart_ops = {
    .start_tx = my_uart_start_tx,
    .stop_rx = my_uart_stop_rx,
    .set_termios = my_uart_set_termios,
};

static int my_uart_probe(struct platform_device *pdev) {
    // map registers
    // request IRQ
    // register UART port
    return 0;
}

static struct platform_driver my_uart_driver = {
    .probe = my_uart_probe,
    .driver = { .name = "my_uart", .of_match_table = my_uart_of_match },
};
```

The kernel matches the device tree node to `my_uart_of_match`, calls probe, and the driver is live.

## The Same Idea Elsewhere

- **Hardware:** the driver programs the device's registers (Chapter 10) and handles its interrupts (Chapter 12).
- **RISC-V:** the driver uses MMIO (Chapter 09) to access device registers.
- **OS:** the kernel provides the driver framework (platform devices, device tree matching).
- **Linux/driver:** the driver is the code that makes a specific device work under Linux.

## When It Fails

A driver's probe function returns success but the device does not work. The driver mapped the registers but forgot to enable the device's clock. The device is accessible but not running. The bug is not the mapping — it is the missing initialization step. The fix: read the datasheet and enable all required clocks and resets.

## Check

1. A driver's probe function is called. What is its main job?
   - A) Register the driver with the kernel
   - B) Initialize the device and register its operations
   - C) Load the device firmware
   - D) Create a device file in /dev
   - Answer: B
   - Explanation: probe initializes the device (map registers, enable clocks) and registers the driver's operations with the kernel.
   > Hint: What does the kernel need from the driver? What does the driver need from the device?

2. Which of these are typical driver functions? Pick all that apply.
   - A) probe
   - B) remove
   - C) read/write
   - D) schedule
   - Answer: A, B, C
   - Explanation: probe, remove, and read/write are standard driver functions. schedule is the kernel scheduler's job, not the driver's.
   > Hint: What does the kernel call when a device appears? When it disappears? When data is transferred?

3. A driver is loaded but the device does not work. The device tree node exists with the correct compatible string. What is the most likely cause?
   - A) The driver is not compiled into the kernel
   - B) The driver's probe function failed silently
   - C) The kernel does not support device trees
   - D) The device is not described in the device tree
   - Answer: B
   - Explanation: If probe fails (e.g., register mapping fails), the driver may return an error but the kernel may not report it clearly. The device is described but not initialized.
   > Hint: What does probe do? What happens if it fails?

4. Explain the difference between a platform driver and a PCI driver — how does each one discover its devices?

5. A driver handles interrupts but the handler is never called. List three possible causes and the one register read that would distinguish them.

## Limits

This chapter shows a simple platform driver. Real drivers handle DMA (Chapter 32), power management, and complex initialization sequences. The principle — a set of functions the kernel calls to manage a device — is the same.

## Go Deeper

- [Linux Driver Model](https://docs.kernel.org/driver-api/driver-model/)
- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)

## Related

Chapter 26, Chapter 28
