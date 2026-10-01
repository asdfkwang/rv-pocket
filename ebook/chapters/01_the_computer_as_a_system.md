# Chapter 01 — The Computer as a System

> **Part I — A Computer That Can Run Code**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A single line like `write(fd, "A", 1)` can print `A` on a screen, save it to a file, or push it out of a serial pin. The line looks the same every time. What happens underneath is completely different each time, and most real bugs live in the gap between "the call looked right" and "the bytes went somewhere unexpected."

## Core Idea

A computer is not one CPU. It is a CPU, memory, devices, and software connected so that a request travels down through layers: program → operating system → driver → register → wire. Every layer holds some state, and every step changes some state.

Two words used in this book: a **system call** is the doorway a program knocks on to ask the OS for something (like writing). A **register** is a tiny named storage slot inside the CPU or a device that holds one value the hardware acts on.

## Worked Example

Print `A` (value 65) to a serial port:

```text
program: write(fd, "A", 1)
  → OS: find which device fd means
  → driver: put 65 into the UART DATA register
  → pin: TX line sends 65 bit by bit
```

Track the value 65 across the trip: it starts in the program's memory, gets copied into a CPU register, gets stored into the device's DATA register, then leaves as electrical pulses. Same number, four different homes.

## The Same Idea Elsewhere

- **Hardware:** the CPU, memory, and the UART device are wired to one bus; the device keeps its own registers regardless of what the CPU is doing.
- **RISC-V:** the instruction set defines which instructions and registers software may use; it does not describe the UART — that lives in the platform, outside the ISA chapters (05–08).
- **OS:** the OS owns the mapping from `fd` to device, so two programs can share one UART without tripping over each other.
- **Linux/driver:** a UART driver turns `write()` into register operations; the same `write()` on a regular file turns into completely different operations.

## When It Fails

A program writes `A` and gets no error, but nothing appears on the serial terminal. The natural suspect is "the write failed" — but the write succeeded. What failed is everything after it: the driver stored 65 into the wrong register, or the cable was never connected, or another program reconfigured the port. "No error" only means the top layer accepted the request.

## Check

1. A program runs `write(fd, "A", 1)` where `fd` is a serial port, and `A` appears on the terminal. Which path did the byte take?
   - A) Program → CPU register → TX pin, the OS is not involved
   - B) Program → system call → driver → UART DATA register → TX pin
   - C) Program → file on disk → UART reads the file → TX pin
   - D) Program → CPU cache → RAM → TX pin
   - Answer: B
   - Explanation: A user program cannot touch the pin directly; the system call hands the byte to the driver, and the driver stores it in the device register that feeds the transmitter.
   > Hint: Ask who is allowed to touch hardware. The program, or the OS on its behalf?

2. Which of these change during the trip of `A` above? Pick all that apply.
   - A) The program's memory holding `"A"`
   - B) A CPU register carrying 65
   - C) The UART DATA register
   - D) The voltage on the TX pin
   - Answer: B, C, D
   - Explanation: The program's buffer is only read, never rewritten. The value moves through a CPU register, into the device register, and out as pin voltage — those three change.
   > Hint: Reading a value does not change it. Follow 65 and mark each home it leaves.

3. The same `read()` call works on a regular file and on a UART, but one evening the UART `read()` never returns while the file `read()` always does. What is the most useful first question?
   - A) Is the baud rate correct?
   - B) Is there any byte available to read right now?
   - C) Is the file descriptor a small number?
   - D) Is the CPU fast enough?
   - Answer: B
   - Explanation: A file `read()` returns whatever is stored, even zero bytes at end of file. A UART `read()` waits for the outside world — no arriving byte means nothing to return. Availability, not speed or settings, is the first split.
   > Hint: A file holds the past. A UART waits for the future.

4. Two programs open the same serial port. One changes the port speed and the other one's output turns to garbage. Why didn't each program get its own private port?
   - A) Because both file descriptors point at one shared device with one speed register
   - B) Because the CPU cache was not flushed
   - C) Because the programs share the same CPU registers
   - D) Because the baud rate is stored per process
   - Answer: A
   - Explanation: `open()` gives each program its own handle, but both handles lead to the same device and its single speed register. Handles are private; hardware is shared.
   > Hint: What exactly does each program own after `open()` — the device, or a path to it?

5. Sketch the full path of one button press waking up a sleeping program, in at least 6 steps from finger to running code. Mark every place where some state changes owner (hardware → driver → OS → program).

## Limits

This chapter's model hides interrupts, buffering, baud-rate setup, and flow control — a real UART transfer needs all of them (Chapters 11–12). It also pretends one `write()` equals one transmission; buffering and scheduling can delay or merge bytes.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Driver API](https://docs.kernel.org/driver-api/)
- [Upstream Linux source](https://github.com/torvalds/linux)

## Related

Chapter 02, Chapter 03
