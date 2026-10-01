# Chapter 35 — One Button Press, End to End

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A button press is the simplest user input, but it travels through every layer of the system: hardware → interrupt → driver → input subsystem → event → application. Tracing one press end to end shows how all the pieces fit together — and where things can go wrong.

## Core Idea

A button is a GPIO pin. When pressed, the pin changes state. The GPIO controller raises an interrupt. The driver's interrupt handler reads the pin state and reports an input event. The input subsystem delivers the event to the application. The application reacts.

## Worked Example

```text
1. Button pressed → GPIO pin goes low
2. GPIO controller raises interrupt
3. CPU takes interrupt, jumps to handler
4. Driver handler: read pin state, report EV_KEY event
5. Input subsystem: deliver event to /dev/input/eventX
6. Application: read event, react (e.g., move character)
```

Each step is a handoff. The button press becomes an electrical signal, then an interrupt, then a driver event, then an application action.

## The Same Idea Elsewhere

- **Hardware:** the GPIO pin is a physical connection to the button. The controller detects the change.
- **RISC-V:** the CPU takes the interrupt and jumps to the handler (Chapter 12).
- **OS:** the input subsystem manages input devices and delivers events to applications.
- **Linux/driver:** the GPIO driver handles the interrupt and reports the event.

## When It Fails

A button press is missed. The driver's interrupt handler is too slow, or the interrupt is shared with another device and the handler returns `IRQ_NONE` without checking the button. The fix: check all possible interrupt sources in the handler, and keep the handler short.

## Check

1. A button is pressed. What is the first thing that happens in software?
   - A) The application reads the button state
   - B) The driver's interrupt handler runs
   - C) The input subsystem delivers an event
   - D) The GPIO controller raises an interrupt
   - Answer: D
   - Explanation: The GPIO controller detects the pin change and raises an interrupt. The CPU then jumps to the driver's handler.
   > Hint: What detects the button press? What signals the CPU?

2. Which of these are part of the button press path? Pick all that apply.
   - A) GPIO controller
   - B) Interrupt handler
   - C) Input subsystem
   - D) Page cache
   - Answer: A, B, C
   - Explanation: The GPIO controller (A), interrupt handler (B), and input subsystem (C) are all part of the path. The page cache (D) is for storage, not input.
   > Hint: What layers does a button press cross? What is not involved?

3. A button press is missed. The interrupt handler is running. What is the most likely cause?
   - A) The GPIO controller is broken
   - B) The handler returned IRQ_NONE without checking the button
   - C) The application is not reading events
   - D) The button is not connected
   - Answer: B
   - Explanation: If the handler returns `IRQ_NONE`, the kernel assumes the interrupt was not from this device. The button press is lost.
   > Hint: What does the handler return if it did not handle the interrupt? What happens to the event?

4. Explain why the input subsystem exists — why does the application not read the GPIO pin directly?

5. A button press generates an interrupt but the application does not react. List three possible causes and the one test that would distinguish them.

## Limits

This chapter shows a simple button. Real input devices have debouncing, multiple buttons, and complex event protocols. The principle — hardware event → driver → subsystem → application — is the same.

## Go Deeper

- [Linux Input Subsystem](https://docs.kernel.org/input/)
- [Linux GPIO Driver](https://docs.kernel.org/driver-api/gpio/)

## Related

Chapter 34, Chapter 36
