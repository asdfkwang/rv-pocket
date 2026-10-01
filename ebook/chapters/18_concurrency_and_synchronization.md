# Chapter 18 — Concurrency and Synchronization

> **Part IV — Protection and the Operating System**

## What exactly needs protection?

Chapter 17 showed two increments losing an update. Synchronization should begin with an invariant, a condition that must hold whenever shared state is observed. For a bounded queue, the invariant might be that its count matches the number of valid elements and never exceeds capacity. Protecting only one counter store is insufficient if queue data and indices change separately.

A critical section is the sequence that must be observed as one coordinated update with respect to competing participants. All relevant participants must follow the same protocol. A lock in one path does not protect against another path that ignores it, nor against hardware DMA whose ownership protocol is different.

## Repair the shared update

With a mutex M, a sleepable thread acquires M before loading the counter and releases it after storing the incremented value. If another thread already owns M, the waiter may sleep rather than continuously execute.

```text
A acquires M; loads 0; stores 1
B requests M; waits
A releases M
B acquires M; loads 1; stores 2; releases M
```

The lock also supplies ordering guarantees required for protected data to be observed consistently. Merely arranging that threads "usually run one at a time" does not replace the synchronization contract. For a single independent counter, an atomic read-modify-write may be enough; a larger multi-field invariant often needs a broader critical section.

## Choose according to execution context

A hard interrupt handler cannot wait on an ordinary sleeping mutex. On a conventional non-PREEMPT_RT Linux configuration, a spinlock is used for suitable short critical sections shared with hard interrupt context. A contender spins while waiting, and the holder must not call functions that may sleep.

There is a further single-CPU trap. Suppose process-context code holds a spinlock and a local interrupt handler tries to acquire the same lock. The handler spins, but the interrupted owner cannot resume to release it. When sharing such a lock with local hard interrupt context, the process path needs the appropriate IRQ-saving locking discipline, commonly spin_lock_irqsave and its matching restore operation.

Disabling local interrupts alone is insufficient on a multicore machine: another CPU can still access the shared state. The lock handles inter-CPU exclusion; the local interrupt discipline handles that local reentry case. PREEMPT_RT changes important locking semantics, so consult its rules rather than transporting these assumptions blindly.

## Prevent circular waiting

Let A acquire L1 and then request L2 while B holds L2 and requests L1. Neither can finish because each waits for an action the other cannot reach. This is deadlock, not simply a slow lock acquisition.

One preventive design imposes a consistent order: every path acquires L1 before L2. Another reduces the need to hold both simultaneously by copying state under one lock and performing later work outside it, if the invariant permits that separation. Reducing lock duration helps latency, but shortening two incorrectly ordered critical sections does not remove the possibility of deadlock.

An interrupt acknowledgement and a software queue update may need careful ordering even when both are individually protected. First ask what observers must never see: for example, a published queue count without valid payload data. Then identify the lock or release/acquire publication mechanism establishing that relation.

## Diagnose before adding more locks

A device not responding is not automatically a software race. A wrong register address, an invalid W1C operation, and a lost shared update can all produce similar symptoms. Trace the state transition and determine which actor can interfere. A lock cannot fix an incorrect device protocol, and an MMIO fence cannot make two software increments atomic.

The next part studies memory visibility and translation. These mechanisms interact with synchronization but answer different questions: which copy is observed, which address is translated, and when data becomes available to a device.

## Check

1. A holds L1 while waiting for L2; B holds L2 while waiting for L1. What condition prevents progress?
   - A) Circular wait
   - B) Ordinary uncontended locking
   - C) A cache miss alone
   - Answer: A
   - Explanation: Each required release is beyond an acquisition blocked by the other participant.

2. Under the stated non-RT assumptions, which statements are correct? Select all that apply.
   - A) A hard IRQ handler may acquire a sleeping mutex if the critical section is short.
   - B) Local IRQ disabling alone excludes another CPU.
   - C) A shared-lock design must account for local IRQ reentry and other CPUs.
   - Answer: C
   - Explanation: Duration does not make sleeping legal, and local interrupt state does not stop remote CPUs.

3. Give a queue invariant involving payload, head, tail, and count. Show an interleaving that breaks it when only count is protected. Redesign the protected sequence.

4. Draw the self-deadlock timeline when a local interrupt acquires a spinlock held by interrupted code. Explain separately what IRQ masking and the lock accomplish in the repair.

5. Research challenge: consult Linux lock-type documentation for PREEMPT_RT. Identify one assumption about spinlock_t that changes, and explain why a driver must choose primitives based on its actual context rather than a memorized name.

## Limits

This chapter introduces exclusion, ordering, and deadlock using a conventional kernel model. It does not define every atomic ordering or RT rule. Device ownership, interrupt threading, and lock-free algorithms require their own explicit contracts.

## Go Deeper

- [Linux lock types and rules](https://docs.kernel.org/locking/locktypes.html) — compare ordinary and PREEMPT_RT semantics.
- [Linux locking lessons](https://docs.kernel.org/locking/spinlocks.html) — examine IRQ interaction and shared-data protection.
- [Linux atomic types](https://docs.kernel.org/core-api/wrappers/atomic_t.html) — distinguish indivisible updates from a whole multi-field protocol.

## Related

- [Chapter 17 — Threads and Scheduling](17_threads_and_scheduling.md)
- [Chapter 19 — Cache and the Memory Hierarchy](19_cache_and_the_memory_hierarchy.md)
