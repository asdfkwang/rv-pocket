# Chapter 35 — One Button Press, End to End

> **Part VIII — A Complete System**

## How does a voltage change become an application event?

We can now connect interrupts, driver state, wait queues, and userspace interfaces in one path. Use an active-low button wired to a GPIO input: a pull-up holds the released pin high, and pressing connects it low. The board description identifies the pin, polarity, interrupt relationship, and input key code.

A GPIO controller driver manages the controller and its interrupt plumbing. A button driver, such as gpio-keys, interprets the button and reports through the input subsystem. These are distinct roles; a GPIO interrupt does not automatically become a keyboard event without the consumer and subsystem logic.

## Track raw state and logical state separately

For an active-low descriptor, raw electrical zero corresponds to logical asserted, or pressed. A descriptor-based GPIO accessor can account for polarity. Applying an extra manual inversion after obtaining a logical value can therefore reverse the meaning twice.

Assume a stable press, a functioning interrupt route, and a debounce policy that accepts the state after its chosen validation interval. Debouncing prevents mechanical contact transitions from being interpreted as many deliberate presses; its hardware or software implementation is device-specific.

| Boundary | State / observation |
| --- | --- |
| Released | raw GPIO high, logical pressed = 0 |
| Physical press | raw GPIO becomes low, possible contact transitions |
| Interrupt service | controller/IRQ framework dispatches the relevant consumer path |
| Debounce accepted | stable logical pressed = 1 |
| Button driver report | `EV_KEY`, selected key code, value 1 |
| Input report boundary | `EV_SYN`, `SYN_REPORT`, value 0 |
| Application read | consumes binary input-event records from its event stream |
| Application action | interprets the key according to its own state and focus |

SYN_REPORT groups related input updates; it is not another physical button press. A stable release produces the corresponding key value 0 and report boundary. Repeat behavior, where used, has its own event semantics rather than being inferred from an interrupt count.

## Follow the waiting application

Suppose the application is blocked reading its `/dev/input/eventN` stream. When the input path queues events, the relevant waiters can become runnable. The scheduler must still select the application before it reads and processes them. This is Chapter 17's wakeup-versus-execution distinction in a complete device path.

The data read are structured event records, not the character string "pressed." The application must handle record layout and read results using the interface. It may intentionally ignore a key because the window lacks focus or the current mode assigns it no action. A visible reaction is downstream of successful device service.

The precise Linux gpio-keys path may use a threaded IRQ, timer, or deferred work depending on the GPIO controller and debounce implementation. A controller whose GPIO reads can sleep cannot be treated as if it were a simple non-sleeping MMIO read in arbitrary hard IRQ context. Framework APIs make those constraints visible.

## Locate a missing press with boundary evidence

Assume a press produces no application action. First establish the raw pin transition with an appropriate observation. Next confirm the relevant IRQ/driver path and accepted logical state. Then inspect the input event stream. Finally inspect application consumption and interpretation.

If EV_KEY press and SYN_REPORT are visible to an event reader, replacing the GPIO driver is not the first supported conclusion. The electrical-to-input path has produced the expected records; the remaining failure may be access, event selection, scheduling, or application policy. If interrupts occur but no key event is reported, investigate polarity, debounce, consumer routing, and driver logic.

A pulse shorter than the configured debounce interval may intentionally be rejected. That observation is different from losing a stable press after it has been accepted. Define the test stimulus and policy before calling the result a bug.

Chapter 36 uses the same boundary method for output, where the device repeatedly reads a frame rather than delivering a one-time input record.

## Check

1. An active-low button is physically pressed and its raw pin is low. What logical value does a polarity-aware descriptor read normally represent?
   - A) Pressed/asserted, value 1
   - B) Released, because raw voltage is zero
   - C) A character byte containing ASCII zero
   - Answer: A
   - Explanation: Logical polarity maps the active electrical level to asserted state.

2. Which are distinct boundaries? Select all that apply.
   - A) The pin transition
   - B) The input subsystem's queued event
   - C) The application's chosen reaction
   - Answer: A, B, C
   - Explanation: Each boundary can succeed while a later one is delayed, filtered, or misconfigured.

3. Draw the event records for one accepted press and release, including report boundaries. Explain why counting IRQ invocations need not give the same count as accepted presses.

4. An event reader sees the expected press and release, but the game does nothing. Design the next diagnostic steps and identify which earlier hardware hypotheses the observation weakens without claiming the whole system is proven correct.

5. Research challenge: inspect gpio-keys at a recorded kernel revision. Follow the configured polarity and debounce paths to input reporting, and explain how the code handles a GPIO accessor that may sleep.

## Limits

The path assumes a GPIO-backed button exposed through the Linux input subsystem. Wiring, trigger type, debounce policy, and kernel configuration alter the concrete callbacks. Application permissions, focus, and event policy are downstream concerns beyond physical interrupt delivery.

## Go Deeper

- [Linux input event codes](https://docs.kernel.org/input/event-codes.html) — inspect EV_KEY and SYN_REPORT semantics.
- [Linux GPIO consumer interface](https://docs.kernel.org/driver-api/gpio/consumer.html) — compare raw/logical polarity and sleeping accessors.
- [Linux gpio-keys source](https://github.com/torvalds/linux/blob/v6.12/drivers/input/keyboard/gpio_keys.c) — use this fixed revision for a reproducible path trace.

## Related

- [Chapter 34 — Files, Storage, and the I/O Path](34_files_storage_and_the_i_o_path.md)
- [Chapter 36 — One DMA Frame, End to End](36_one_dma_frame_end_to_end.md)
