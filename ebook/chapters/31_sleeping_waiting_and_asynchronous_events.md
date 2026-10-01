# Chapter 31 — Sleeping, Waiting, and Asynchronous Events

> **Part VII — Linux Device Drivers**

## How can a reader wait without missing data?

Chapter 30 put received bytes into a software queue and issued a wakeup. A reader needs a protocol that works whether data arrives before it starts waiting, while it prepares to sleep, or after it has slept. The persistent condition is "the queue contains data," not "an interrupt just happened."

A wait queue coordinates tasks waiting for a condition. A wakeup prompts eligible waiters to recheck; it does not grant one exclusive ownership of the data and does not store an unlimited history of events. The condition and its synchronized state are the source of truth.

## See the lost-wakeup race first

A naive reader checks empty and then sleeps as two unrelated actions:

```text
reader: queue is empty
producer: enqueue 41; wake readers (none are sleeping yet)
reader: goes to sleep
```

The byte exists but the reader may sleep until another event occurs. Adding a delay before sleeping does not fix the race; it changes the window. The wait protocol must coordinate preparing to sleep with rechecking the condition.

Linux wait_event-style helpers perform the wait/recheck protocol, but the driver still has to publish the condition correctly and use suitable synchronization for the associated data. Waking before making data visible can re-create a failure at a different boundary.

## Trace the producer and consumer contracts

Assume a bounded queue protected by an IRQ-safe spinlock, possibly several readers, and a persistent gone flag for removal. A helper data_or_gone takes that lock briefly, tests queue state or gone, and releases it without sleeping. The following is pseudocode showing the locking boundaries:

```text
producer in IRQ context:
    lock queue
    append byte, or record overflow according to the chosen policy
    unlock queue
    wake readers

consumer in sleepable context:
    repeat:
        wait_event_interruptible(readers, data_or_gone())
        if interrupted by signal: return the reported error
        lock queue
        if queue has data:
            remove one byte into private local storage
            unlock queue
            process/deliver the byte outside the lock
            finish this operation
        if gone:
            unlock queue
            return device-removed outcome
        unlock queue
        repeat
```

Why the second queue test? Another reader may consume the byte between wakeup and acquisition. A wakeup says recheck, not "this byte is yours." Dequeuing under the same lock establishes which reader owns the item. The example chooses to drain already queued data before reporting removal; an actual interface must document its chosen policy.

Operations that may sleep, such as a userspace copy, happen after releasing the spinlock. A full read implementation must also handle partial copies, return counts, and the chosen policy for data already removed from the queue. Chapter 33 addresses that interface rather than concealing it inside this synchronization sketch.

## A completion represents a different condition

For a one-shot request, a completion object can represent "this operation has finished." Initialize it before submission, have the producer complete it after publishing the result, and wait using the appropriate timeout/interruption policy. Completion state can account for completion occurring before the waiter starts, unlike an unrecorded transient notification.

Reinitializing while a prior operation or waiter is still active can erase or misattribute progress. A timeout also does not prove the producer stopped: a DMA engine or worker may still complete later. The associated object must remain alive until the outstanding work is canceled or confirmed finished.

For repeated incoming bytes, queue content is usually the more informative persistent condition. For one operation's terminal result, a completion can be clearer. Choose by the state being represented, not by treating all notification primitives as interchangeable.

## Removal must wake the path out

If a reader waits only for data and the device disappears permanently, it can wait forever. Removal should publish the terminal condition under the same state protocol and wake blocked readers, while ensuring the wait structure and instance remain alive until those users are finished.

This closes the chain from hardware event to a runnable task. Chapter 32 applies the same completion and lifetime reasoning to DMA buffers.

## Check

1. A reader wakes but another reader consumed the only byte. What must happen?
   - A) Read nonexistent queue data because wakeup grants ownership.
   - B) Recheck under synchronization and wait again if appropriate.
   - C) Treat every such occurrence as a hardware failure.
   - Answer: B
   - Explanation: Eligibility to run does not reserve a queue item.

2. Which belong in a robust blocking protocol? Select all that apply.
   - A) A persistent condition
   - B) Synchronized publication of associated data
   - C) A terminal path for device removal or operation cancellation
   - Answer: A, B, C
   - Explanation: Notification alone does not preserve data, establish visibility, or provide an exit after removal.

3. Draw arrival timelines before, during, and after the wait helper's preparation. Explain which condition checks prevent sleeping indefinitely with queued data.

4. A DMA completion wait times out and the driver frees the completion-containing object. The IRQ arrives afterward. Explain the lifetime failure and design a cancellation/quiescence sequence before releasing the object.

5. Research challenge: compare wait_event_interruptible, completion waits, and their timed variants in kernel documentation. Record their different return conventions and explain how confusing zero, positive, and negative results can turn a timeout into false success.

## Limits

The sketch defines synchronization and removal policy, not a complete character-device read implementation. Queue capacity, overflow, multiple readers, partial user copies, and object references must be specified by the real subsystem. Wait helpers do not independently protect arbitrary shared payload data.

## Go Deeper

- [Linux wait queues and driver basics](https://docs.kernel.org/driver-api/basics.html) — inspect condition rechecking and interruptible waits.
- [Linux completions](https://docs.kernel.org/scheduler/completion.html) — inspect initialization, lifetime, and wait return values.

## Related

- [Chapter 30 — Interrupts in a Real Linux Driver](30_interrupts_in_a_real_linux_driver.md)
- [Chapter 32 — DMA in a Real Linux Driver](32_dma_in_a_real_linux_driver.md)
