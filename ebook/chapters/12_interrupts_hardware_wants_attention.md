# Chapter 12 — Interrupts: Hardware Wants Attention

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Polling (Chapter 11) wastes CPU. Interrupts let the hardware say "I need attention" and the CPU respond only when something happens. Without interrupts, there is no multitasking, no responsive input, and no efficient I/O. Every keystroke, every network packet, every timer tick arrives as an interrupt.

## Core Idea

An **interrupt** is a signal from hardware that causes the CPU to stop the current program, save its state, and jump to an **interrupt handler**. The handler services the device, then returns to the interrupted program. The CPU has an **interrupt enable** bit — when set, interrupts are delivered; when clear, they are pending but not delivered.

## Worked Example

A UART receives a byte:

```text
1. UART sets its RX-ready bit and asserts its interrupt line
2. Interrupt controller forwards the UART's interrupt to the CPU
3. CPU finishes the current instruction, saves PC and status, jumps to handler
4. Handler reads the UART DATA register (clearing the interrupt)
5. Handler restores saved state, returns to the interrupted program
```

The interrupted program never knew it was interrupted — the CPU saved and restored everything.

## The Same Idea Elsewhere

- **Hardware:** the interrupt controller prioritizes and routes interrupt lines to the CPU. Each device has an interrupt line (or shares one).
- **RISC-V:** the privileged spec defines interrupt enable (`mie`), pending (`mip`), and the trap mechanism. Interrupts are a type of trap (Chapter 13).
- **OS:** the OS installs interrupt handlers at boot. The handler is the bridge between hardware events and OS logic (scheduler, I/O completion).
- **Linux/driver:** a driver requests an interrupt with `request_irq` and provides a handler function. The handler runs in interrupt context — it cannot sleep.

## When It Fails

A driver's interrupt handler calls a function that sleeps (like `kmalloc` with `GFP_KERNEL`). The handler runs in interrupt context, where sleeping is illegal. The kernel detects this and panics or deadlocks. The fix: use `GFP_ATOMIC` for allocations in interrupt context, or defer work to a workqueue.

## Check

1. A UART asserts its interrupt line. What does the CPU do first?
   - A) Jump immediately to the interrupt handler
   - B) Finish the current instruction, then jump to the handler
   - C) Ignore the interrupt if interrupts are disabled
   - D) Both B and C
   - Answer: D
   - Explanation: The CPU finishes the current instruction before taking the interrupt (B). If interrupts are disabled, the interrupt is pending but not delivered (C). Both are true.
   > Hint: When can the CPU not take an interrupt? What does it do with the pending interrupt?

2. Which of these are true about interrupt handlers? Pick all that apply.
   - A) They run in a special context where sleeping is not allowed
   - B) They must be short and fast
   - C) They can access user-space memory directly
   - D) They should defer long work to a workqueue or tasklet
   - Answer: A, B, D
   - Explanation: Interrupt handlers run in atomic context — no sleeping, no user-space access. Long work is deferred. C is false — user-space access requires a different context.
   > Hint: What can interrupt context not do? What should it do with long tasks?

3. Two devices share the same interrupt line. The handler is invoked. How does it know which device interrupted?
   - A) It cannot — each device must have its own line
   - B) It reads a status register from each device on that line
   - C) The interrupt controller tells it which device
   - D) It asks the OS which device interrupted
   - Answer: B
   - Explanation: Shared interrupt lines require the handler to poll each device's status register to find which one asserted the interrupt. This is why shared lines are discouraged.
   > Hint: If two devices share a line, the handler sees the line asserted. How does it find the source?

4. Explain why interrupt handlers should be short — what happens to other interrupts and system responsiveness if a handler runs for too long?

5. A driver requests an interrupt but the handler is never called. List three possible causes and the one register read that would distinguish them.

## Limits

This chapter shows a single interrupt line per device. Real systems have interrupt controllers with priority, masking, and MSI (Message Signaled Interrupts) for PCIe. Interrupt coalescing (batching multiple events into one interrupt) is common in high-performance devices.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Driver API (interrupts)](https://docs.kernel.org/driver-api/interrupts.html)

## Related

Chapter 11, Chapter 13
