# Chapter 17 — Threads and Scheduling

> **Part IV — Protection and the Operating System**

## What does a second thread share?

Chapter 16 explained switching one execution stream for another. A process can contain several threads that share an address space and process resources while each retains its own execution registers and stack. Sharing reduces the need to copy or explicitly exchange data, but it makes one thread's writes visible to code that may execute at an inconvenient time.

A stack belongs to one thread by convention and lifetime management; it is not generally protected from other threads in the same address space. Passing a pointer to a stack object can let another thread access it. The object's lifetime and synchronization remain the program's responsibility.

## Follow runnable, running, and blocked states

Consider threads A and B on one CPU. A parses input; B waits for a device result. Running means currently using the CPU. Runnable means eligible to execute when selected. Blocked means waiting for a condition or event rather than competing for CPU time.

| Event | A | B | CPU |
| --- | --- | --- | --- |
| Initial state | running | blocked on result | A |
| Device result arrives | running | becomes runnable | A or interrupt service |
| Scheduler selects B | runnable | running | B |
| B consumes result, waits again | runnable | blocked | A can resume |

Waking B changes its eligibility. It does not guarantee immediate execution or transfer the CPU to B at the exact instant the device finishes. This distinction becomes essential when measuring I/O latency: device completion, wakeup, and actual scheduling are separate timestamps.

A scheduler considers runnable work according to its policy, priorities, and CPU eligibility. An expired time allocation can trigger reconsideration, but the kernel need not choose another thread if none is eligible or policy says otherwise. Linux has multiple scheduling classes; "every thread gets exactly 10 ms" is not a general description.

## Sharing exposes intermediate states

Suppose A and B increment a shared counter initially zero. At the machine-operation level, each increment can be modeled as load, add one, store. A possible interleaving is:

```text
A loads 0
B loads 0
A computes 1 and stores 1
B computes 1 and stores 1
final counter: 1, despite two requested increments
```

The interleaving illustrates a lost update. In C, unsynchronized conflicting accesses to an ordinary shared variable can constitute a data race and undefined behavior, so the table is not an exhaustive prediction of all compiled outcomes. Use language-level atomics or suitable synchronization to establish a legal program first.

The scheduler did not promise to keep the multi-instruction increment indivisible. Even on one CPU, preemption can interleave the operations. On multiple CPUs, they can overlap physically. Reducing a time slice or hoping an operation is "fast enough" does not provide a synchronization guarantee.

## Responsiveness is not only CPU speed

Imagine B is a high-priority consumer waiting for a mutex owned by low-priority A. Unrelated runnable work can delay A and indirectly delay B. This is priority inversion; supported priority-inheritance mechanisms can help by allowing the owner to run with appropriate effective priority while needed.

Do not label every blocked thread a deadlock. A thread waiting for a device that will complete is ordinary blocking. A thread waiting for a lock whose owner will resume is ordinary contention. Investigate whether progress is possible, what condition enables it, and whether the responsible producer can run.

Chapter 18 turns these observations into synchronization choices: what must be indivisible, which contexts can sleep, and how to avoid circular waits.

## Check

1. A device wakes blocked B while A is executing. What is necessarily established by a successful wakeup of B?
   - A) B immediately owns the CPU.
   - B) B becomes eligible to run.
   - C) B has already consumed the result.
   - Answer: B
   - Explanation: Wakeup changes scheduling state; execution and consumption happen later.

2. Which are normally distinct per thread? Select all that apply.
   - A) Execution registers
   - B) Stack allocation
   - C) The entire process address space
   - Answer: A, B
   - Explanation: Threads in the same process share the address space, which can include each other's stacks.

3. Add timestamps to device completion, wakeup, scheduling, and consumption. Construct a 20 ms application delay even though the device completed in 1 ms. Identify where measurements must be taken to find the extra delay.

4. Explain why making a C counter volatile does not repair the shared increment. Give one appropriate atomic operation and one lock-based design, stating the invariant each protects.

5. Research challenge: choose one documented Linux scheduling policy. Describe when a runnable thread can be selected and identify why a fixed universal time-slice explanation would be inaccurate for that policy.

## Limits

The state table omits stopped, exiting, and other detailed kernel states. Scheduling behavior depends on policy and configuration. The counter example illustrates a machine-level race; language rules are part of the correctness contract, not an optional refinement.

## Go Deeper

- [Linux scheduler documentation](https://docs.kernel.org/scheduler/) — select a scheduling policy and inspect its actual rules.
- [Priority inheritance and RT mutexes](https://docs.kernel.org/locking/rt-mutex.html) — follow the dependency between a waiting task and the lock owner.

## Related

- [Chapter 16 — Processes and Context Switching](16_processes_and_context_switching.md)
- [Chapter 18 — Concurrency and Synchronization](18_concurrency_and_synchronization.md)
