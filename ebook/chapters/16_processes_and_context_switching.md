# Chapter 16 — Processes and Context Switching

> **Part IV — Protection and the Operating System**

## How can one CPU continue two computations?

A process includes an address space and resource context. A thread is an execution stream within such a process; it has its own registers and stack. We begin with one thread per process, so switching process A to process B also switches their execution streams. Chapter 17 separates the two concepts explicitly.

A context switch preserves enough execution state that a suspended thread can later continue. The kernel's records remain in memory while another thread uses the CPU's physical registers. A register's current hardware contents belong to the currently executing context, not permanently to a particular process.

## Preserve two different layers of continuation

Suppose A is executing user code at `0x4008`, with a0 = 7. B previously stopped with a user continuation at `0x600C`, a0 = 99. A timer interrupt enters the kernel.

First, trap entry preserves A's interrupted user state in a trap frame. Kernel code then runs using its own execution context. If the scheduler selects B, a lower-level switch saves A's kernel continuation and restores B's. B resumes along its kernel return path and eventually restores its own user trap frame.

```text
A user state -> A trap frame
A kernel continuation -> saved switch context
                         choose B
B saved switch context -> B kernel continuation
B trap frame -> B user state
```

This distinction explains an apparent contradiction: low-level switch code may save only a subset of registers, while arbitrary user registers still survive a preemption. The rest were preserved by another layer or are governed by the kernel call convention. A single routine need not save everything for the overall path to preserve everything required.

| Point | CPU's active computation | A's saved user a0 | B's saved user a0 |
| --- | --- | --- | --- |
| Before timer | A user code | not yet updated by this entry | 99 |
| After A trap save | kernel handling A | 7 | 99 |
| After switching to B | B kernel continuation | 7 | 99 |
| After B return to user | B user code, a0 = 99 | 7 | saved frame no longer active |

A's next restoration recovers 7 unless the kernel intentionally changes its user state, for example to deliver a signal or syscall result. Preservation is a contract with specified interventions, not a promise that nothing about a process ever changes while it is stopped.

## Memory context is separate from register context

A and B can use the same numeric user address for different memory. Switching between their address spaces selects the appropriate translation context, covered in Chapters 20–21. Threads sharing one process's address space may not need that change. Their stacks and execution registers still differ.

Device registers do not roll back when a process is descheduled. Nor do global kernel variables automatically acquire private per-process copies. If A's driver path reads shared state, pauses, and B's path changes it, A resumes in a changed shared world. Preserving CPU registers does not make a multi-step shared operation atomic.

## A switch is a scheduling decision, not every interrupt

A timer can create an opportunity to reconsider which thread should run. The scheduler may select the same thread. A device interrupt can finish without switching at all. A voluntary blocking operation can switch execution without a timer event. Separate the cause of kernel entry from the policy decision to select another runnable thread.

If a mutex owner is preempted, another thread may block waiting for it. That alone is contention, not necessarily deadlock. Progress depends on the owner eventually running and releasing the mutex. Deadlock requires a situation such as a circular wait that prevents that progress; Chapter 18 develops the distinction.

The next chapter adds multiple threads sharing one address space and asks how the scheduler distinguishes running, runnable, and blocked work.

## Check

1. What can change while A is stopped even if A's private register state is correctly preserved?
   - A) A shared device's state
   - B) Nothing in the system
   - C) A's saved PC must necessarily change
   - Answer: A
   - Explanation: Preserving one execution context does not freeze shared hardware or other threads.

2. Which statements are correct? Select all that apply.
   - A) Every interrupt must switch to a different thread.
   - B) Trap-frame saving and low-level switching can preserve different subsets of state.
   - C) Two threads sharing an address space still need separate execution state.
   - Answer: B, C
   - Explanation: Scheduling is a separate decision; the complete preservation path spans multiple layers.

3. Extend the trace so A blocks during a system call rather than being preempted in user mode. Identify which continuation lets A finish the call after wakeup.

4. A driver reads a global configuration value, is preempted, and later writes a derived value. Another thread updates the same configuration in between. Construct the lost update and explain why saving all CPU registers does not prevent it.

5. Research challenge: inspect Linux RISC-V entry and switch code for one pinned kernel revision. List where user registers and the kernel switch context are saved. Explain one register omitted by the low-level switch routine without concluding that it is lost.

## Limits

The single-CPU trace omits extension-state management, address-space optimizations, and detailed scheduler internals. Kernel and user stacks have distinct roles. Multicore execution adds genuine simultaneous access to the shared-state problem.

## Go Deeper

- [Linux RISC-V entry and switch assembly](https://github.com/torvalds/linux/blob/master/arch/riscv/kernel/entry.S) — inspect the complete preservation path at a recorded revision.
- [Linux scheduler documentation](https://docs.kernel.org/scheduler/) — separate execution mechanism from selection policy.

## Related

- [Chapter 15 — What an Operating System Actually Does](15_what_an_operating_system_actually_does.md)
- [Chapter 17 — Threads and Scheduling](17_threads_and_scheduling.md)
