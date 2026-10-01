# Chapter 11 — Polling, Time, and Timers

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Software often needs to wait: wait for a device to be ready, wait for a byte to arrive, wait for a timeout. The simplest way is **polling** — repeatedly reading a status register until the condition holds. Polling works but wastes CPU. The alternative is a **timer** that lets software sleep or measure intervals.

## Core Idea

A timer is a hardware counter that increments at a known rate (e.g., every microsecond). Software reads the counter to measure elapsed time, or writes a compare value to trigger an interrupt when the counter reaches it. Polling is a loop: read status, check condition, repeat. A delay loop is polling with a counter.

## Worked Example

Poll until TX ready:

```text
loop:
  lw   t0, STATUS(x10)     # read status
  andi t0, t0, 0x01        # mask bit 0 (TX ready)
  beq  t0, x0, loop        # if not ready, loop
  # TX is ready, write data
```

Timer-based delay (1 million cycles):

```text
  li   t0, 1000000         # delay amount
  rdtime t1                # read current time
  add  t1, t1, t0          # target = now + delay
wait:
  rdtime t2                # read current time
  bltu t2, t1, wait        # loop until now >= target
```

## The Same Idea Elsewhere

- **Hardware:** the timer is a counter register and a compare register. When they match, an interrupt fires.
- **RISC-V:** the `time` CSR (or `rdtime` pseudo-instruction) reads the timer. The privileged spec defines timer interrupts.
- **OS:** the OS uses timer interrupts for scheduling — every tick, the timer fires and the scheduler decides whether to switch tasks.
- **Linux/driver:** drivers use `udelay`/`mdelay`/`msleep` for short waits. For longer waits, they sleep and let the scheduler run other tasks.

## When It Fails

A driver polls a status bit in a tight loop with no timeout. The device never sets the bit (hardware bug, wrong initialization), and the driver hangs forever. The fix is a timeout counter: poll at most N times, then return an error. Polling without a timeout is a hang waiting to happen.

## Check

1. A driver polls a status register in a loop. The device never sets the expected bit. What is the most likely outcome?
   - A) The driver returns an error immediately
   - B) The driver loops forever
   - C) The CPU traps and the OS kills the process
   - D) The driver skips the poll and continues
   - Answer: B
   - Explanation: A polling loop with no exit condition other than the bit being set will loop forever if the bit never sets. The driver needs a timeout.
   > Hint: What ends a polling loop? Only the condition being true — or a timeout.

2. A timer increments every microsecond. Software reads it, waits 500 microseconds, then reads it again. What is the expected difference?
   - A) 500
   - B) 500000
   - C) 0
   - D) It depends on the CPU frequency
   - Answer: A
   - Explanation: 500 microseconds × 1 increment per microsecond = 500 increments. The timer measures time in its own units.
   > Hint: The timer rate is given. Multiply time by rate.

3. Which of these are advantages of timer interrupts over polling? Pick all that apply.
   - A) The CPU can sleep instead of spinning
   - B) The CPU can run other tasks while waiting
   - C) Timer interrupts are always faster than polling
   - D) Timer interrupts use less power
   - Answer: A, B, D
   - Explanation: Interrupts let the CPU do other work (or sleep) while waiting. Polling burns CPU cycles. C is false — polling can be faster for very short waits because it avoids interrupt overhead.
   > Hint: What does polling do with the CPU? What does an interrupt let the CPU do?

4. Explain why a delay loop (`for (i = 0; i < N; i++);`) is unreliable on a modern CPU — what factors make the actual delay unpredictable?

5. A driver uses `mdelay(100)` to wait for a device to reset. The device datasheet says reset takes 50ms typical, 200ms maximum. Is `mdelay(100)` safe? What should the driver do instead?

## Limits

This chapter assumes a simple timer. Real systems have multiple timers (per-core, per-cluster), dynamic tick rates, and clock sources that can change. Timer interrupts are the foundation of OS scheduling (Chapter 17) and are revisited with controllers in Chapter 19.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Driver API (delays)](https://docs.kernel.org/driver-api/basics.html)

## Related

Chapter 10, Chapter 12
