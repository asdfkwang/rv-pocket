# Chapter 12 — Interrupts: Hardware Wants Attention

> **Part III — CPU Meets Hardware**

## How can a device request attention?

Polling makes software ask whether something happened. An interrupt lets hardware request service. The CPU may accept the request at an architectural boundary and transfer control to an entry routine. The key distinction is between an event occurring, an interrupt becoming pending, and a handler actually running.

Our teaching UART sets IRQ_STATUS bit 0 when receive data becomes available. IRQ_ENABLE bit 0 controls whether that pending event requests an external interrupt. The platform's interrupt controller routes device requests toward a CPU. CPU interrupt-enable and priority rules determine when the request is eligible for delivery.

A pending event does not prove that every gate is open. Nor does disabling delivery necessarily remove the event from the device. This distinction explains both "interrupt never arrives" and "interrupt fires again immediately."

## Follow one received byte

Assume receive interrupts are enabled at the UART, controller, and CPU, and the relevant source is routed to this CPU. The foreground program has PC = `0x8008` and x5 = 7. A byte `0x41` arrives.

```text
UART FIFO: empty -> [41]
UART event latch: 0 -> 1
controller: records/routes the pending source
CPU: enters interrupt trap at an eligible boundary
entry software: preserves the registers it will disturb
driver: consumes RX_DATA, producing software byte 41
driver/controller: acknowledge according to their distinct protocols
exit software: restores state; trap-return resumes the program
```

On RISC-V, hardware records a return PC, a cause, and relevant privilege/status information in control registers. It does **not** automatically push every general-purpose register onto a stack. Entry software must save the interrupted register values before ordinary handler code overwrites them. If it uses x5 without restoring 7, the foreground program resumes with corrupted state.

Acknowledging the device and completing service at an interrupt controller are different operations. One handles the UART's reason for requesting service; the other updates the controller's bookkeeping. Depending on the controller and trigger mode, neglecting either can prevent another notification or cause repeated delivery.

For our UART, drain RX_DATA while RX-ready is set, then acknowledge the receive event. Recall Chapter 10's assumption: unread data after acknowledgement reasserts the event. That rule closes a particular arrival race; a different datasheet may prescribe another sequence.

## Why level and edge behavior matter

A level-sensitive request remains asserted while its condition holds. Returning without removing the condition can immediately trigger service again. An edge-sensitive input records a transition instead; whether repeated transitions are retained depends on the controller and device.

Suppose two bytes arrive before the handler runs. A single pending bit may represent both. The handler must examine device state rather than assume one invocation means exactly one byte. Interrupt count, event count, and data count are different quantities.

If the handler never runs, inspect the chain in order: does the device report a pending cause, is device notification enabled, is the controller route/unmask state correct, and is CPU delivery permitted? One UART status read cannot distinguish every possible break in that chain.

## Service now, finish later

A hard interrupt handler runs under restrictions: it cannot sleep as though it were an ordinary process. Long work also delays other service. A common design handles the immediate hardware obligation, saves enough information, and defers work to an appropriate context. Threaded interrupts and workqueues provide different mechanisms for doing that in Linux; Chapter 30 covers the concrete interface.

Interrupts support efficient I/O and preemptive scheduling, but they are not a logical prerequisite for every form of multitasking. Cooperative systems can switch tasks at explicit yield points. What interrupts add is a way to request attention independently of the current program's voluntary calls.

Chapter 13 now generalizes this control transfer to exceptions and system calls, where the reason for entry is different.

## Check

1. What preserves arbitrary foreground general-purpose registers across a RISC-V interrupt handler?
   - A) Hardware automatically pushes all registers.
   - B) Correct trap entry/exit software, using hardware's trap metadata.
   - C) Ordinary caller-saved ABI rules require the foreground program to anticipate the interrupt.
   - Answer: B
   - Explanation: The interrupted program did not make a function call and may have live values in any register.

2. Which observations can coexist? Select all that apply.
   - A) UART data pending while CPU interrupt delivery is disabled
   - B) Two received bytes represented by one pending event bit
   - C) A handler invocation that requires checking the device cause
   - Answer: A, B, C
   - Explanation: Pending state, delivery, and data count belong to different parts of the protocol.

3. Draw a timeline where a second byte arrives during receive-event acknowledgement. Use the stated reassertion rule to explain why it remains serviceable. Then identify what you would need to know for a device without that rule.

4. Construct one missing-interrupt failure at each of three gates. For each, specify an observation that tests that gate and why observing only RX-ready does not distinguish them.

5. Research challenge: choose a documented RISC-V external interrupt controller. Follow its source identification and completion procedure, and separate those operations from clearing the originating peripheral's cause.

## Limits

The controller protocol is intentionally not fixed here: PLIC and newer interrupt architectures differ. Our UART event behavior is fictional. Real entry code also handles stack selection, nesting, privilege transitions, and extension state under its OS policy.

## Go Deeper

- [RISC-V privileged architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html) — inspect trap-entry state and interrupt-enable rules.
- [Linux generic IRQ handling](https://docs.kernel.org/core-api/genericirq.html) — distinguish controller flow handling, device actions, and threaded service.

## Related

- [Chapter 11 — Polling, Time, and Timers](11_polling_time_and_timers.md)
- [Chapter 13 — Exceptions, Traps, and System Calls](13_exceptions_traps_and_system_calls.md)
