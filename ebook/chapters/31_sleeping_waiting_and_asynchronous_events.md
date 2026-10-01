# Chapter 31 — Sleeping, Waiting, and Asynchronous Events

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A driver often needs to wait for something: a device to be ready, a transfer to complete, a buffer to be available. **Sleeping** lets the driver wait without burning CPU. **Asynchronous events** let the device notify the driver when something happens. Getting the wait wrong causes deadlocks, lost wakeups, and system hangs.

## Core Idea

A driver waits with `wait_event_interruptible` (sleeps until a condition is true) or `completion` (sleeps until another thread signals). The device signals completion with an interrupt. The driver's interrupt handler wakes the waiting thread. The key rule: the condition must be checked before sleeping, and the wakeup must happen after the condition is set.

## Worked Example

```c
DECLARE_WAIT_QUEUE_HEAD(wq);
int data_ready = 0;

// Thread A: wait for data
wait_event_interruptible(wq, data_ready);
// process data...

// Interrupt handler: wake the thread
data_ready = 1;
wake_up_interruptible(&wq);
```

Thread A sleeps until `data_ready` is set. The interrupt handler sets it and wakes the thread. The order matters: set the condition, then wake.

## The Same Idea Elsewhere

- **Hardware:** the device raises an interrupt when data is ready. The interrupt handler runs.
- **RISC-V:** the CPU takes the interrupt and jumps to the handler (Chapter 12).
- **OS:** the kernel provides wait queues, completions, and the scheduler that sleeps and wakes threads.
- **Linux/driver:** the driver uses these primitives to wait for device events.

## When It Fails

A driver checks a condition, finds it false, and sleeps. But the interrupt fires between the check and the sleep. The wakeup is lost. The driver sleeps forever. The fix: use a wait queue that handles this race — the kernel rechecks the condition after the thread is queued but before it sleeps.

## Check

1. A driver calls `wait_event_interruptible(wq, condition)`. What happens if the condition is already true?
   - A) The thread sleeps anyway
   - B) The thread does not sleep and continues immediately
   - C) The thread sleeps for a fixed time
   - D) The thread crashes
   - Answer: B
   - Explanation: `wait_event_interruptible` checks the condition first. If it is true, the thread does not sleep.
   > Hint: What does the function check before sleeping?

2. Which of these are true about sleeping in a driver? Pick all that apply.
   - A) Sleeping allows the CPU to run other threads
   - B) Sleeping is legal in interrupt context
   - C) Sleeping is legal in process context
   - D) Sleeping wastes CPU cycles
   - Answer: A, C
   - Explanation: Sleeping lets the CPU run other threads (A) and is legal in process context (C). It is illegal in interrupt context (B is false). Sleeping does not waste CPU (D is false).
   > Hint: What context can sleep? What happens to the CPU when a thread sleeps?

3. A driver waits for a condition but the wakeup is lost. What is the most likely cause?
   - A) The condition was set before the thread started waiting
   - B) The interrupt handler did not call wakeup
   - C) The thread checked the condition, found it false, and slept — but the wakeup happened between the check and the sleep
   - D) The kernel does not support wait queues
   - Answer: C
   - Explanation: The race between checking the condition and sleeping can lose a wakeup. The fix is to use a wait queue that handles this race.
   > Hint: What is the window between checking and sleeping? What can happen in that window?

4. Explain the difference between a wait queue and a completion — when would you use each?

5. A driver waits for a DMA transfer to complete. The transfer never completes. List three possible causes and the one register read that would distinguish them.

## Limits

This chapter shows basic waiting. Real drivers use timeouts, poll, and select for multiple event sources. The principle — check condition, sleep, wake on event — is the same.

## Go Deeper

- [Linux Driver API (waiting)](https://docs.kernel.org/driver-api/basics.html)
- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)

## Related

Chapter 30, Chapter 32
