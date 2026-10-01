# Chapter 34 — Files, Storage, and the I/O Path

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Even a single file read is end-to-end I/O connecting the VFS, page cache, filesystem, block layer, storage driver, DMA, and IRQ. This concept does not belong to a single layer. This chapter starts with the smallest example and then traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Even a single file read is end-to-end I/O connecting the VFS, page cache, filesystem, block layer, storage driver, DMA, and IRQ.

On a page cache hit it can finish without any hardware I/O; on a miss the task may sleep and wait for controller DMA and the completion interrupt.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Save exact specification details for `Go Deeper` at the end.

## Small Example

```text
read(fd,buf,4096)
→ VFS/fs
→ page-cache miss
→ block I/O
→ storage DMA
→ IRQ
→ wake/read return
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when a value changes and when control passes to a different layer.

## Follow the System

### At the Hardware

The storage controller provides a command queue, a DMA engine, and interrupts.

### In RISC-V

The CPU executes the syscall and driver code along with DMA ordering.

### Why the OS Cares

The VFS and filesystem turn storage blocks into file and directory abstractions.

### In Linux / Driver

Linux VFS objects and the block/storage subsystems make up the driver path.

## Trace It

1. **Hardware:** The storage controller provides a command queue, a DMA engine, and interrupts.
2. **RISC-V:** The CPU executes the syscall and driver code along with DMA ordering.
3. **OS:** The VFS and filesystem turn storage blocks into file and directory abstractions.
4. **Linux / Driver:** Linux VFS objects and the block/storage subsystems make up the driver path.
5. Finally, mark what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text; feel free to search specifications, docs.kernel.org, and upstream source.

1. Compare the read path on a page-cache hit versus a miss, and identify when DMA/IRQ is needed.
2. Compare the roles of VFS dentries and inodes using the official documentation.
3. Draw the sleep → IRQ completion → wakeup → schedule path of a task waiting for I/O.
4. Find one rule or API in the official documentation directly related to **Files, Storage, and the I/O Path**, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept has caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [Linux VFS](https://docs.kernel.org/filesystems/vfs.html)
- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Scheduler](https://docs.kernel.org/scheduler/)
- [Linux Driver API](https://docs.kernel.org/driver-api/)

External documents do not replace this chapter. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Even a single file read is end-to-end I/O connecting the VFS, page cache, filesystem, block layer, storage driver, DMA, and IRQ.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess at unknown details; look them up and confirm them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 33, Chapter 35
