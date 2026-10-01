# Chapter 01 — The Computer as a System

> **Part I — A Computer That Can Run Code**

## The question this book follows

You can already write a program with variables, functions, loops, and pointers. Yet a successful function call does not explain what happened outside the program. If `write(fd, "A", 1)` returns 1, did a receiver see the letter? If two programs write at once, who owns the output? These questions require following a request through a computer, including the places where it waits.

This book assumes basic programming, including reading small C examples. It develops the machine and operating-system knowledge needed to answer such questions; it does not assume that you have written assembly or a Linux driver. The recurring task is to name the state, identify who may change it, and distinguish a request from its completion.

Our running machine is a teaching RV64 RISC-V system. Its examples use little-endian byte order. When we introduce a UART, its deliberately small register map is fictional, not a claim about a particular development board. Linux examples later use real kernel interfaces, with omitted production details stated explicitly. Keep the numerical machine model separate from an actual board's datasheet.

## Start with a byte and an observation

A UART is a device that sends and receives bits sequentially on serial signal lines. Imagine a process, a running instance of a program, whose file descriptor `fd` refers to a serial connection. A file descriptor is a small integer used to look up an open resource in that process. It is not the address of the UART.

`"A"` supplies one character. In the ASCII encoding its byte value is 65, written `0x41` in hexadecimal. The final argument 1 requests one byte. A system call transfers the request to the operating-system kernel, the privileged software that manages shared resources. A device driver is kernel code that knows how to operate a particular kind of hardware.

For now, use a simplified buffered transmit path:

```text
application buffer       kernel transmit queue       UART       receiver
       41         copy          [41]           feed    41   bits   'A'
```

These boxes contain different copies or representations of the same information. Copying a byte out of the application does not erase its buffer. Nor does putting the byte in a queue immediately place it on a wire.

| Moment | Application buffer | Kernel queue | UART / line |
| --- | --- | --- | --- |
| Before request | `41` | empty | idle |
| Kernel accepts one byte | `41` | `41` | may still be busy |
| Driver feeds transmitter | `41` | empty | byte in transmitter |
| Transmission finishes | `41` | empty | bits have left the pin |

In this model, `write` may return 1 at the second row. The application learns that one byte was accepted. It does not learn that the final row occurred, that a cable exists, or that a receiving program consumed the byte. The precise guarantee depends on the object and interface, which is why we must name them.

## Why the layers exist

Why not let every program write directly to the device? A UART has shared configuration, finite buffering, and physical pins. Two programs independently reconfiguring its speed would interfere even if they had separate memory. The kernel offers an interface through which software can share and control access to that resource.

The same `write` interface can also target a regular file. The first part of the request looks similar, but the later path uses filesystem and storage code instead of a serial transmitter. The interface lets applications request an operation without knowing every hardware detail. Its convenience makes the exact meaning of success especially important.

RISC-V specifies instructions the CPU can execute. It does not specify this UART's address or Linux's file descriptor table. We will separate three contracts: the ISA describes instruction behavior; the platform describes devices and their connections; the OS describes services available to programs. A bug can respect one contract while violating another.

## Diagnose a missing character

Suppose `write` returns 1 but nothing appears. Repeating the call only proves that another request can be accepted. First identify the last confirmed boundary: did the byte enter the software queue, reach the transmitter, leave the pin, or reach the receiving process? Evidence from one boundary narrows the search; it does not certify the remaining boundaries.

A queue containing `41` while the transmitter is idle suggests that feeding the device has stalled. An empty queue plus observed signal transitions moves the investigation toward serial settings, wiring, or the receiver. These are hypotheses, not conclusions from a return value alone.

The next chapters make the boxes in this diagram precise. First we need to represent the byte and its address, then understand how instructions move it. Later we will explain how a busy device makes software wait and how completion makes that software runnable again.

## Check

1. In the buffered model above, `write` returns 1 before the transmitter becomes ready. Which statement is justified?
   - A) The receiver consumed `A`.
   - B) The kernel accepted one byte for this write.
   - C) The UART line is idle.
   - Answer: B
   - Explanation: Acceptance is the observed boundary. Neither physical transmission nor receiver consumption follows from it.

2. Two processes use different file descriptors for the same UART. Which state can still be shared? Select all that apply.
   - A) Physical serial speed configuration
   - B) Transmit hardware
   - C) The numerical meaning of each process's descriptor table entry must be identical
   - Answer: A, B
   - Explanation: Separate handles can lead to one physical resource. Descriptor numbers are interpreted within each process.

3. Construct two different failures that produce a successful write and a silent receiver. For each, identify an observation that distinguishes it from the other. State what that observation cannot prove.
   > Hint: Place one failure before the UART and the other after its output pin.

4. A program sends the two-byte command `GO` through two writes. Another program sends `STOP` concurrently. What additional interface guarantees would you need before claiming the receiver sees complete commands? Separate byte acceptance, ordering, and message boundaries.

5. Research challenge: consult the operating system's `write` documentation. Find a case where a positive result is smaller than the requested count. Design the application's bookkeeping so retrying does not duplicate the accepted prefix.

## Limits

The transmit queue is a teaching model, not a complete Linux TTY trace. Actual serial paths may include additional queues, line processing, flow control, and DMA. We assume a working process and open descriptor here; boot, access permissions, and driver initialization are developed later. No episode or simulator is required to follow the book.

## Go Deeper

- [Linux TTY driver documentation](https://docs.kernel.org/driver-api/tty/tty_driver.html) — identify the driver boundary beneath the application interface.
- [Linux VFS](https://docs.kernel.org/filesystems/vfs.html) — see how one file interface dispatches to different implementations.

## Related

- [Chapter 02 — Bits, Bytes, Numbers, and Addresses](02_bits_bytes_numbers_and_addresses.md)
