# Chapter 15 — What an Operating System Actually Does

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Without an OS, every program must manage hardware itself — schedule its own time, handle its own I/O, protect its own memory. The OS is the software that makes this unnecessary: it provides abstractions (files, processes, sockets) so programs can focus on their logic.

## Core Idea

The OS does five things: **process management** (run multiple programs), **memory management** (give each program its own address space), **file systems** (store and retrieve data), **device management** (talk to hardware via drivers), and **system calls** (the interface between programs and the OS). Everything else is detail.

## Worked Example

A program calls `write(fd, "A", 1)`:

```text
1. Program executes ecall (system call)
2. CPU traps to S-mode, jumps to OS handler
3. OS checks: is fd valid? does the program have permission?
4. OS finds the file/device for fd
5. OS calls the driver's write function
6. Driver writes to the device register
7. OS returns the result to the program
```

The program never touched hardware. The OS did everything on its behalf.

## The Same Idea Elsewhere

- **Hardware:** the CPU provides the trap mechanism (Chapter 13) and privilege levels (Chapter 14) that make the OS possible.
- **RISC-V:** the privileged spec defines the CSRs and instructions the OS uses to manage hardware.
- **OS:** the OS is the software that uses these mechanisms to provide abstractions.
- **Linux/driver:** a driver is the OS's agent for a specific device. The OS calls the driver; the driver talks to hardware.

## When It Fails

A program writes to a file and the write succeeds, but the data is lost on reboot. The OS buffered the write in memory (for performance) and never flushed it to disk. The program should have called `fsync` to force the write to stable storage. The bug is not the write — it is assuming the OS's buffering is transparent.

## Check

1. A program calls `read(fd, buf, 100)`. What does the OS do first?
   - A) Read 100 bytes from the device
   - B) Check if fd is valid and the program has permission
   - C) Allocate 100 bytes in kernel memory
   - D) Call the driver's read function
   - Answer: B
   - Explanation: The OS validates the request before doing anything. An invalid fd or a permission violation returns an error without touching the device.
   > Hint: What does the OS check before trusting a program's request?

2. Which of these are OS responsibilities? Pick all that apply.
   - A) Scheduling processes
   - B) Managing memory
   - C) Talking directly to device registers
   - D) Providing system calls
   - Answer: A, B, D
   - Explanation: The OS schedules processes, manages memory, and provides system calls. It does NOT talk to device registers directly — drivers do that.
   > Hint: Who touches hardware registers? The OS or its agents?

3. A program opens a file, writes data, and closes it without calling `fsync`. The system crashes. What happens to the data?
   - A) It is always safe — the OS flushes on close
   - B) It may be lost — the OS may have buffered it in memory
   - C) It is corrupted — the file is incomplete
   - D) It is duplicated — the OS writes it twice
   - Answer: B
   - Explanation: The OS buffers writes for performance. Without `fsync`, the data may still be in memory when the crash occurs. `close` does not guarantee the data reached stable storage.
   > Hint: What does the OS do to make writes fast? What makes them safe?

4. Explain why the OS uses buffering for file I/O — what performance problem does it solve, and what correctness risk does it introduce?

5. Two programs open the same file and write to it simultaneously. Without any coordination, the result is interleaved garbage. Explain what the OS provides to prevent this, and what the programs must do to use it.

## Limits

This chapter shows the OS as a monolithic kernel. Microkernels move drivers and file systems to user space. The abstractions are the same; the implementation differs. The key idea — the OS provides abstractions over hardware — is universal.

## Go Deeper

- [Linux System Calls](https://docs.kernel.org/arch/riscv/syscall.html)
- [Linux File Systems](https://docs.kernel.org/filesystems/)

## Related

Chapter 14, Chapter 16
