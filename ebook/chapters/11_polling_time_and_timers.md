# Chapter 11 — Polling, Time, and Timers

> **Part III — CPU Meets Hardware**

## How long should software wait?

Chapter 10 explained how to test status correctly. A correct test inside an unbounded loop can still hang forever. Polling means repeatedly observing a condition until it holds. A useful poll needs both a success condition and a deadline, plus a policy for what happens between observations.

Suppose the UART transmitter is busy. Its STATUS bit 0 means another byte may be accepted. Before writing TX_DATA, software waits for that bit. The readiness transition comes from hardware, so counting source-level loop iterations is not a reliable measure of elapsed time.

## Build a bounded poll

Assume a monotonically advancing 32-bit timer that increments once per microsecond. The following is pseudocode, not a Linux API implementation:

```text
start = timer32()
repeat:
    status = read_uart_status()
    if status & 1:
        write_uart_tx(0x41)
        return success
    elapsed = unsigned32(timer32() - start)
    if elapsed >= 500:
        return timeout
    wait_before_next_poll_if_context_allows()
```

Here, readiness observed on an iteration wins even if the later timeout test would also have expired. That is a deliberate policy. If the device protocol demands an absolute completion deadline, define and check that stronger requirement explicitly. A generic timeout does not magically make a late hardware action disappear.

A sample trace makes the cost visible:

| Time in microseconds | Ready bit | Decision |
| --- | --- | --- |
| 1000 | 0 | remember start, continue |
| 1100 | 0 | elapsed 100, continue |
| 1250 | 1 | submit byte, stop polling |

If readiness never arrives, a sample at or after 1500 ends the wait. Actual return time can be later because scheduling or access latency delays observations. The timeout expresses when software should stop waiting, not a guarantee of exact wakeup timing.

## Counter wraparound is arithmetic, not a reset

Let start be `0xFFFFFFF0` and a later timer read be `0x00000020`. Unsigned 32-bit subtraction yields `0x30`, or 48 ticks. A direct comparison of end and start would misinterpret the wrap as time going backward.

Modular subtraction works when the true elapsed interval is representable within one counter period. Software must sample often enough and bound its wait so it cannot silently miss an entire wrap. A stopped timer or one whose frequency changes violates the assumptions as surely as a wrong arithmetic expression.

A delay loop such as repeatedly decrementing a register has different problems: CPU frequency, instruction timing, interrupts, and compiler optimization affect its duration. Use the platform or OS timekeeping interface whose behavior is documented for the current context.

## Busy waiting, sleeping, and timer events

A busy poll keeps executing. That can be appropriate for a very short wait or a context in which sleeping is forbidden. For longer waits in sleepable context, yielding the CPU lets other work run, at the cost of detection latency. The condition still needs rechecking when execution resumes.

A timer compare facility can request an event when the counter reaches a programmed value. It helps software avoid continuously reading the counter, but event generation and actual handler execution are separate boundaries. Interrupt masking or higher-priority work can delay service.

Consider a reset that takes 50 ms typically and 200 ms at the documented maximum. Waiting a fixed 100 ms neither verifies completion nor covers the allowed worst case. Prefer the documented completion condition with a deadline that accounts for the maximum and relevant margins. On timeout, report failure and put hardware in a known safe state rather than continuing as if reset completed.

Chapter 12 replaces repeated device polling with a notification mechanism. Timeouts remain necessary because a notification or the underlying operation can still fail.

## Check

1. A 32-bit timer changes from `0xFFFFFFF0` to `0x00000020` with at most one wrap. What elapsed value does unsigned subtraction produce?
   - A) 48
   - B) -4294967248
   - C) 32
   - Answer: A
   - Explanation: Modular subtraction retains the low 32 bits, giving 0x30.

2. Which guarantees does the bounded poll provide under its assumptions? Select all that apply.
   - A) It has a path out when readiness never arrives.
   - B) Its return happens at exactly 500 microseconds.
   - C) It checks device status rather than inferring completion from a typical delay.
   - Answer: A, C
   - Explanation: Scheduling and access latency affect observation time; the condition and deadline govern the decision.

3. Construct a trace in which a device becomes ready just before the deadline but software does not run until after it. Explain how condition-first and deadline-first policies differ.

4. Compare a 1-microsecond and a 1-millisecond polling interval for a device usually ready after 30 microseconds. Identify costs, detection delay, and the execution contexts that constrain the choice.

5. Research challenge: inspect Linux `readl_poll_timeout` and its atomic variant in `include/linux/iopoll.h`. Identify the time units, final condition check, and sleep-related restrictions. Explain which variant fits a sleepable probe path and why.

## Limits

The timer model has a fixed frequency and uninterrupted progress. Real clock domains, power states, and split-width counter reads require platform rules. Kernel polling helpers should be used according to their current documented context and timeout semantics.

## Go Deeper

- [Linux polling helpers](https://github.com/torvalds/linux/blob/master/include/linux/iopoll.h) — read the helper implementation and comments for the research task.
- [Linux delay and sleep functions](https://docs.kernel.org/timers/delay_sleep_functions.html) — choose a waiting mechanism for the calling context.

## Related

- [Chapter 10 — Device Registers](10_device_registers.md)
- [Chapter 12 — Interrupts: Hardware Wants Attention](12_interrupts_hardware_wants_attention.md)
