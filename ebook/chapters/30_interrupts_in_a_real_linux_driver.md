# Chapter 30 — Interrupts in a Real Linux Driver

> **Part VII — Linux Device Drivers**

## What is a Linux handler responsible for?

Chapter 12 traced hardware notification and trap entry. Linux's IRQ subsystem connects a device's interrupt resource to a handler. A Linux IRQ number is an identifier managed by the kernel; it is not necessarily the raw source number in a device-tree cell or interrupt controller.

Probe obtains the appropriate IRQ through the bus/platform interface and registers a handler with an instance pointer. The handler must identify whether its device has relevant pending work, service or safely defer it, and return the proper result. A shared line can invoke a handler because another device requested service.

## Follow a bounded receive service

Use the teaching UART's latched receive event and reassertion rule from Chapter 10. The following is a protocol sketch using Linux-style calls; queue_byte_irqsafe stands for a bounded, non-sleeping software queue operation with an explicit overflow policy:

```c
u32 pending = readl(d->base + IRQ_STATUS) & RX_EVENT;
if (!pending)
    return IRQ_NONE;

for (unsigned int n = 0; n < 32; n++) {
    if (!(readl(d->base + STATUS) & RX_READY))
        break;
    u8 byte = readl(d->base + RX_DATA) & 0xff;
    queue_byte_irqsafe(d, byte);
}
writel(RX_EVENT, d->base + IRQ_STATUS);
wake_up_interruptible(&d->readers);
return IRQ_HANDLED;
```

The iteration budget bounds one invocation's work. Our device reasserts the receive event if unread data remains after acknowledgement, so stopping at the budget does not declare the FIFO empty. Real hardware might instead require masking and deferred draining; use its actual protocol.

The queue records data beyond the hardware event's lifetime. The wakeup makes waiting consumers eligible to recheck their condition. It does not transfer the queued byte directly into a user's buffer or guarantee the consumer runs immediately.

IRQ_NONE means this handler found no relevant cause to handle. It does not clear hardware and is not a generic error-reporting mechanism. Returning IRQ_HANDLED without servicing or managing the source can leave a level-sensitive condition repeatedly interrupting the CPU.

## The context constrains the implementation

A hard IRQ handler cannot perform arbitrary sleeping work. User-memory access, blocking locks, and sleeping allocations are unsuitable in this path. Queueing a small result for later consumption separates urgent device service from potentially blocking operations.

A threaded IRQ is another arrangement: a primary handler can identify/manage the source and request a thread to perform sleepable work under the framework's rules. IRQF_ONESHOT and device masking have specific semantics; they do not eliminate the need to know what keeps the source asserted or how removal synchronizes activity.

An interrupt handler's return occurs long after low-level trap entry saved the interrupted state. The driver should not manually reproduce the architecture's complete register-save sequence in its C callback. That responsibility belongs to the kernel entry/IRQ framework.

## Design the stop path alongside the start path

During removal, prevent new hardware requests as required, synchronize in-flight IRQ execution, and drain any work queued by the handler before releasing its state. Synchronizing the IRQ alone does not necessarily cancel a worker that the handler scheduled earlier.

The same ordering matters on probe failure after IRQ registration. An automatic managed IRQ release cannot make a freed queue safe for an independently pending work item. Trace every asynchronous user of the instance and establish when each can no longer run.

If the handler never runs, investigate pending device state, device enable, routing, Linux IRQ registration, and CPU delivery. If it runs repeatedly, investigate source service and acknowledgement. If it runs once but readers stay blocked, inspect the software publication/wakeup path developed in Chapter 31.

## Check

1. On a shared line, this device reports no relevant cause. What should its handler normally return?
   - A) IRQ_NONE
   - B) IRQ_HANDLED while clearing unrelated device state
   - C) A request to sleep on a mutex
   - Answer: A
   - Explanation: Shared-line dispatch requires each handler to determine whether its own device needs service.

2. Which are obligations beyond simply returning IRQ_HANDLED? Select all that apply.
   - A) Service or manage the actual device cause.
   - B) Respect the handler's execution context.
   - C) Ensure asynchronous state remains alive.
   - Answer: A, B, C
   - Explanation: The return value does not implement protocol, context safety, or resource lifetime.

3. Suppose 40 bytes are pending on entry. Trace two invocations under the stated budget and reassertion rules. Explain what additional state you need if the software queue holds only 16 bytes.

4. Draw a removal race involving an IRQ handler that queues work. Identify why synchronize_irq alone does not establish that every callback using the device object is finished.

5. Research challenge: inspect request_threaded_irq and IRQF_ONESHOT documentation. Describe which work remains in the primary handler and which can run in the thread for a chosen device protocol. Include the source-masking and teardown assumptions.

## Limits

The handler is a teaching fragment with symbolic offsets, an omitted queue implementation, and a fictional event protocol. Real serial drivers normally integrate with the serial subsystem rather than introducing an independent receive interface. Kernel configuration can change interrupt and locking contexts.

## Go Deeper

- [Linux generic IRQ handling](https://docs.kernel.org/core-api/genericirq.html) — inspect shared IRQs, threaded handlers, return values, and synchronization.
- [Linux workqueues](https://docs.kernel.org/core-api/workqueue.html) — follow deferred-work lifetime and cancellation.

## Related

- [Chapter 29 — MMIO in a Real Linux Driver](29_mmio_in_a_real_linux_driver.md)
- [Chapter 31 — Sleeping, Waiting, and Asynchronous Events](31_sleeping_waiting_and_asynchronous_events.md)
