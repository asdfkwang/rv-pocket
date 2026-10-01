# Chapter 17 — Threads and Scheduling

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A thread has independent execution state while sharing an address space with other threads, and the scheduler allocates CPUs to runnable tasks. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

A thread has independent execution state while sharing an address space with other threads, and the scheduler allocates CPUs to runnable tasks.

A wakeup does not mean immediate execution; it is the event that makes a task runnable. Preemption, timers, and I/O completion keep changing the execution order.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
CPU0: A running, B runnable, C sleeping
IRQ wakes C
→ C runnable
→ scheduler decides next
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

Timers and IPIs can trigger scheduling decisions.

### In RISC-V

Timer interrupts and software interrupts can connect to SMP scheduling.

### Why the OS Cares

The scheduler invokes a context switch based on the runnable set and policy.

### In Linux / Driver

The Linux scheduler uses scheduling classes and per-CPU state and interacts with driver wakeups.

## Trace It

1. **Hardware:** Timers and IPIs can trigger scheduling decisions.
2. **RISC-V:** Timer interrupts and software interrupts can connect to SMP scheduling.
3. **OS:** The scheduler invokes a context switch based on the runnable set and policy.
4. **Linux / Driver:** The Linux scheduler uses scheduling classes and per-CPU state and interacts with driver wakeups.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. Explain why a wakeup and a context switch are not the same event.
2. Explain why two threads need their own stacks and registers even though they share memory.
3. Find and summarize the EEVDF/CFS description in the current Linux scheduler documentation.
4. Find one rule or API directly related to **Threads and Scheduling** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Scheduler](https://docs.kernel.org/scheduler/)
- [Linux Generic IRQ](https://docs.kernel.org/core-api/genericirq.html)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- A thread has independent execution state while sharing an address space with other threads, and the scheduler allocates CPUs to runnable tasks.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 16, Chapter 18
