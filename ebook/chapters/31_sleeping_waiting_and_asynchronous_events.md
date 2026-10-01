# Chapter 31 — Sleeping, Waiting, and Asynchronous Events

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Instead of holding a waiting task on the CPU with polling, the OS puts it to sleep and makes it runnable again when the event arrives. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Instead of holding a waiting task on the CPU with polling, the OS puts it to sleep and makes it runnable again when the event arrives.

Wait queues, completions, workqueues, and threaded IRQs each provide different async semantics and execution contexts. A wakeup does not run the task immediately; it is a state change that lets the scheduler pick the task again.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
read() no data
→ wait queue / TASK_SLEEPING
→ IRQ puts data
→ wake_up
→ TASK_RUNNABLE
→ later scheduled
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

An interrupt can serve as the physical trigger for an asynchronous event.

### In RISC-V

Trap entry hands a hardware event to a software handler, but sleep/wakeup policy is an OS concern outside the ISA.

### Why the OS Cares

The scheduler takes a blocked task off the CPU and makes it runnable again after the wake event.

### In Linux / Driver

Linux completions and workqueues help move execution between IRQ, worker, and process contexts.

## Trace It

1. **Hardware:** An interrupt can serve as the physical trigger for an asynchronous event.
2. **RISC-V:** Trap entry hands a hardware event to a software handler, but sleep/wakeup policy is an OS concern outside the ISA.
3. **OS:** The scheduler takes a blocked task off the CPU and makes it runnable again after the wake event.
4. **Linux / Driver:** Linux completions and workqueues help move execution between IRQ, worker, and process contexts.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Find in the official documentation why wait_for_completion must not be called from hard IRQ context.
2. Explain why a task does not run immediately after a wakeup.
3. Give one example driver job well suited to a workqueue and one well suited to a threaded IRQ.
4. Find one rule or API in the official documentation directly related to **Sleeping, Waiting, and Asynchronous Events**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux Completions](https://docs.kernel.org/scheduler/completion.html)
- [Linux Workqueues](https://docs.kernel.org/core-api/workqueue.html)
- [Linux Scheduler](https://docs.kernel.org/scheduler/)
- [Linux Generic IRQ](https://docs.kernel.org/core-api/genericirq.html)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Instead of holding a waiting task on the CPU with polling, the OS puts it to sleep and makes it runnable again when the event arrives.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 30, Chapter 32
