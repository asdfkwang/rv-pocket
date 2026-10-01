# Chapter 17 — Threads and Scheduling

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A process is heavy: its own address space, its own files, its own everything. **Threads** are lighter: multiple execution streams within one process, sharing memory and files. Threads make parallelism easier, but they also make bugs easier — shared memory means shared state, and shared state means races.

## Core Idea

A thread is like a process, but it shares the address space with other threads in the same process. Each thread has its own stack and registers, but they all see the same global variables. The **scheduler** decides which thread runs when. It uses a **time slice** (quantum): each thread runs for a short time, then the scheduler picks another.

## Worked Example

Two threads in one process:

```text
Thread 1: while (true) { x = x + 1; }
Thread 2: while (true) { x = x + 1; }
```

Both threads increment the same variable `x`. The scheduler switches between them. If the switch happens between the read and write of `x`, one increment is lost. This is a **race condition**: the result depends on the timing of the switch.

## The Same Idea Elsewhere

- **Hardware:** the CPU provides the timer interrupt that triggers the scheduler, and the context switch mechanism (Chapter 16).
- **RISC-V:** the privileged spec defines the timer and trap mechanism.
- **OS:** the OS scheduler uses these mechanisms to implement scheduling policies (round-robin, priority, etc.).
- **Linux/driver:** a driver that handles interrupts must be thread-safe. If two threads call the driver concurrently, the driver's state can be corrupted.

## When It Fails

Two threads increment a counter without a lock. The increment is `read x, add 1, write x`. If the switch happens after the read but before the write, the other thread's increment is lost. The final value is less than expected. The fix: use a lock or an atomic operation to make the increment indivisible.

## Check

1. Two threads share a global variable. Both increment it without a lock. What is the most likely outcome?
   - A) The variable is always correct
   - B) The variable may be less than expected due to lost updates
   - C) The variable is always zero
   - D) The program crashes immediately
   - Answer: B
   - Explanation: Without a lock, the read-modify-write sequence can interleave, causing lost updates. The result is non-deterministic.
   > Hint: What happens if the switch occurs between the read and the write?

2. Which of these do threads in the same process share? Pick all that apply.
   - A) Global variables
   - B) The stack
   - C) Open file descriptors
   - D) The heap
   - Answer: A, C, D
   - Explanation: Threads share the address space: globals, heap, and file descriptors. Each thread has its own stack.
   > Hint: What is per-thread? What is per-process?

3. A scheduler uses a time slice of 10ms. What happens when a thread's time slice expires?
   - A) The thread is killed
   - B) The thread is switched out and another thread runs
   - C) The thread continues running
   - D) The thread is moved to a lower priority
   - Answer: B
   - Explanation: When the time slice expires, the timer interrupt fires, the scheduler runs, and a different thread is selected. The first thread is saved and will run again later.
   > Hint: What triggers the scheduler? What does it do?

4. Explain why threads are lighter than processes — what is shared, and what is the cost of that sharing?

5. A thread acquires a lock and then blocks on I/O. What happens to other threads that need the same lock, and what is this situation called?

## Limits

This chapter shows a simple scheduler. Real schedulers have priorities, affinity (pinning threads to cores), and complex policies (CFS in Linux). The principle — time-sliced scheduling with context switches — is the same.

## Go Deeper

- [Linux Scheduler](https://docs.kernel.org/scheduler/)
- [Linux Threads](https://docs.kernel.org/process/)

## Related

Chapter 16, Chapter 18
