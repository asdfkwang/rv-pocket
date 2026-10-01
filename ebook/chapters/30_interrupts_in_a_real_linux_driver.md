# Chapter 30 — Interrupts in a Real Linux Driver

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Interrupts (Chapter 12) let the device signal the CPU. In Linux, a driver requests an interrupt with `request_irq` and provides a handler function. The handler runs in interrupt context — it cannot sleep, it must be fast, and it must acknowledge the interrupt. Getting any of this wrong causes panics, deadlocks, or lost interrupts.

## Core Idea

A driver's interrupt handler does three things: **acknowledge** the interrupt (clear the device's interrupt condition), **read status** (determine what happened), and **defer work** (if needed, schedule a workqueue or tasklet). The handler returns `IRQ_HANDLED` if it handled the interrupt, or `IRQ_NONE` if the interrupt was not from its device.

## Worked Example

```c
static irqreturn_t my_uart_irq(int irq, void *dev_id) {
    struct my_uart *uart = dev_id;
    u32 status = readl(uart->base + UART_STATUS);

    if (!(status & UART_RX_READY))
        return IRQ_NONE;

    // Read the byte (clears the interrupt)
    u8 ch = readb(uart->base + UART_DATA);
    // Process the byte...
    return IRQ_HANDLED;
}
```

The handler checks if the interrupt is from its device, reads the data (which clears the interrupt), and returns.

## The Same Idea Elsewhere

- **Hardware:** the device asserts its interrupt line when it needs attention. The interrupt controller routes it to the CPU.
- **RISC-V:** the CPU takes the interrupt and jumps to the handler (Chapter 12).
- **OS:** the kernel provides the `request_irq` API and the interrupt context rules.
- **Linux/driver:** the driver's handler is the bridge between hardware events and driver logic.

## When It Fails

A driver's handler calls `kmalloc` with `GFP_KERNEL`. The handler runs in interrupt context, where sleeping is illegal. `GFP_KERNEL` may sleep. The kernel detects this and panics. The fix: use `GFP_ATOMIC` for allocations in interrupt context, or defer the allocation to a workqueue.

## Check

1. A driver's interrupt handler is running. Which of these can it do?
   - A) Call `kmalloc` with `GFP_KERNEL`
   - B) Call `kmalloc` with `GFP_ATOMIC`
   - C) Sleep waiting for a mutex
   - D) Access user-space memory directly
   - Answer: B
   - Explanation: Interrupt context cannot sleep. `GFP_ATOMIC` allocation does not sleep. `GFP_KERNEL` may sleep (A is false). Sleeping (C) and user-space access (D) are illegal in interrupt context.
   > Hint: What can interrupt context not do? Which allocation flag is safe?

2. Which of these are true about interrupt handlers? Pick all that apply.
   - A) They run in interrupt context
   - B) They must be short and fast
   - C) They can sleep
   - D) They should defer long work to a workqueue
   - Answer: A, B, D
   - Explanation: Handlers run in interrupt context (A), must be short (B), and defer long work (D). They cannot sleep (C is false).
   > Hint: What is interrupt context? What are its restrictions?

3. A driver's handler returns `IRQ_NONE`. What does this mean?
   - A) The interrupt was not from this device
   - B) The interrupt was handled successfully
   - C) The interrupt is pending
   - D) The handler crashed
   - Answer: A
   - Explanation: `IRQ_NONE` means the interrupt was not from this device. The kernel will try other handlers for the same interrupt line.
   > Hint: When would a handler not handle an interrupt? What does it return then?

4. Explain why interrupt handlers must be short — what happens to other interrupts and system responsiveness if a handler runs for too long?

5. A driver requests an interrupt but the handler is never called. List three possible causes and the one register read that would distinguish them.

## Limits

This chapter shows a simple interrupt handler. Real handlers use threaded interrupts (handler + thread), NAPI (network polling), and interrupt coalescing. The principle — acknowledge, read status, defer work — is the same.

## Go Deeper

- [Linux Driver API (interrupts)](https://docs.kernel.org/driver-api/interrupts.html)
- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)

## Related

Chapter 29, Chapter 31
