# Chapter 18 — Concurrency and Synchronization

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Under concurrency, execution order is not fixed, so shared state can produce races and deadlocks. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Under concurrency, execution order is not fixed, so shared state can produce races and deadlocks.

Mutexes, spinlocks, and atomic operations are not interchangeable; choose by context and shared-state lifetime. Also distinguish atomicity from memory ordering.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
count=0
CPU0 read 0
CPU1 read 0
CPU0 write 1
CPU1 write 1
→ lost update
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

Atomic instructions and cache coherence are the basis of multicore synchronization.

### In RISC-V

The RISC-V A extension and memory-ordering rules are used to implement locks.

### Why the OS Cares

Sleeping locks and spinning locks affect the scheduler and execution context differently.

### In Linux / Driver

Linux lock types, PREEMPT_RT rules, and lockdep matter for finding context misuse.

## Trace It

1. **Hardware:** Atomic instructions and cache coherence are the basis of multicore synchronization.
2. **RISC-V:** The RISC-V A extension and memory-ordering rules are used to implement locks.
3. **OS:** Sleeping locks and spinning locks affect the scheduler and execution context differently.
4. **Linux / Driver:** Linux lock types, PREEMPT_RT rules, and lockdep matter for finding context misuse.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. Find in the official locking documentation why a mutex must not be used in a hard IRQ handler.
2. Explain the situation requiring irqsave when process context and IRQ context share the same spinlock.
3. Connect the Coffman deadlock conditions to a driver example.
4. Find one rule or API directly related to **Concurrency and Synchronization** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Locking](https://docs.kernel.org/locking/)
- [Linux Kernel Memory Model](https://docs.kernel.org/dev-tools/lkmm/)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Under concurrency, execution order is not fixed, so shared state can produce races and deadlocks.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 17, Chapter 19
