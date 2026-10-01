# Chapter 18 — Concurrency and Synchronization

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Threads share memory, which makes communication easy but synchronization hard. **Concurrency** means multiple execution streams overlap. **Synchronization** is the set of tools — locks, semaphores, atomics — that make concurrent access safe. Without synchronization, shared state corrupts silently.

## Core Idea

A **mutex** (mutual exclusion) is a lock that only one thread can hold at a time. A thread that wants exclusive access acquires the mutex, does its work, then releases it. If another thread holds the mutex, the acquirer waits. A **semaphore** is a counter that allows up to N threads. An **atomic operation** is a hardware instruction that is indivisible — no other thread can observe it halfway.

## Worked Example

Two threads increment a counter safely:

```text
lock:                                   # acquire mutex
  lw   t0, counter(x10)                 # read
  addi t0, t0, 1                       # increment
  sw   t0, counter(x10)                 # write
unlock:                                 # release mutex
```

Without the lock, two threads can read the same value, both increment, and both write the same result — one increment is lost. With the lock, only one thread can be in the critical section at a time.

## The Same Idea Elsewhere

- **Hardware:** the CPU provides atomic instructions (`amoswap`, `lr/sc` in RISC-V) that implement locks without software coordination.
- **RISC-V:** the ISA defines `lr` (load-reserved) and `sc` (store-conditional) for atomic read-modify-write.
- **OS:** the OS provides synchronization primitives (mutexes, semaphores, condition variables) built on hardware atomics.
- **Linux/driver:** drivers use spinlocks (busy-wait) for short critical sections in interrupt context, and mutexes (sleep) for longer sections in process context.

## When It Fails

Thread A holds lock L1 and waits for lock L2. Thread B holds lock L2 and waits for lock L1. Neither can proceed. This is a **deadlock**. The fix: always acquire locks in the same order, or use a timeout to detect and break the deadlock.

## Check

1. Thread A holds mutex M1 and requests mutex M2. Thread B holds M2 and requests M1. What happens?
   - A) Both threads proceed
   - B) Both threads wait forever — deadlock
   - C) The OS kills one thread
   - D) The mutexes are automatically released
   - Answer: B
   - Explanation: Each thread holds what the other needs. Neither can release its lock without acquiring the other. This is a classic deadlock.
   > Hint: What does each thread need? What does it hold?

2. Which of these are synchronization primitives? Pick all that apply.
   - A) Mutex
   - B) Semaphore
   - C) Atomic operation
   - D) Context switch
   - Answer: A, B, C
   - Explanation: Mutexes, semaphores, and atomics are all synchronization tools. A context switch is a mechanism the OS uses, not a synchronization primitive.
   > Hint: Which of these coordinates access to shared data?

3. A spinlock is used in interrupt context. Why can't a mutex be used instead?
   - A) Spinlocks are faster
   - B) Mutexes can sleep, and interrupt context cannot sleep
   - C) Mutexes are only for user space
   - D) Spinlocks use less memory
   - Answer: B
   - Explanation: A mutex may sleep if the lock is held. Interrupt context cannot sleep (Chapter 12). A spinlock busy-waits, which is legal in interrupt context.
   > Hint: What does a mutex do when the lock is held? Is that legal in interrupt context?

4. Explain the difference between a mutex and a semaphore — what does each one count, and when would you use one over the other?

5. A driver uses a spinlock to protect a hardware register. The critical section is very short (a few instructions). Why is a spinlock appropriate here, and what would go wrong if the critical section called a function that sleeps?

## Limits

This chapter shows basic synchronization. Real systems have reader-writer locks, RCU (Read-Copy-Update), and lock-free data structures. The principle — coordinate access to shared state — is universal.

## Go Deeper

- [Linux Kernel Locking](https://docs.kernel.org/locking/)
- [RISC-V Atomics](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)

## Related

Chapter 17, Chapter 19
