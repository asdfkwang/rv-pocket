# Chapter 34 — Files, Storage, and the I/O Path

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Data that matters must survive reboot. The I/O path — from `write()` in a program to bytes on a storage device — is the most complex path in the system. It crosses user space, kernel space, page cache, block layer, device driver, and hardware. Understanding it is understanding why data is fast, slow, safe, or lost.

## Core Idea

A `write()` system call does not write to disk. It copies data to the **page cache** (kernel memory) and returns. The data is flushed to disk later by the **block layer** and the **device driver**. This buffering makes writes fast but introduces the risk of data loss on crash. `fsync` forces the data to stable storage.

## Worked Example

```text
Program: write(fd, "A", 1)
  → Kernel: copy "A" to page cache
  → Return to program (fast!)

Later:
  → Block layer: schedule write to disk
  → Driver: program the storage device
  → Device: write bytes to flash
  → Interrupt: write complete
```

The program's `write` returned long before the byte reached disk. `fsync` waits for the interrupt.

## The Same Idea Elsewhere

- **Hardware:** the storage device (eMMC, SSD, NVMe) has its own controller and cache. Data may be in the device's cache, not on the flash.
- **RISC-V:** the CPU programs the storage controller via MMIO or DMA.
- **OS:** the OS manages the page cache, block layer, and I/O scheduling.
- **Linux/driver:** the storage driver handles the device-specific protocol and DMA.

## When It Fails

A program writes data, calls `fsync`, and the data is safe. But the device has a volatile cache and loses data on power loss. The program thinks the data is safe. The fix: use `fsync` + `fdatasync` + device flush commands, or use a device with power-loss protection.

## Check

1. A program calls `write(fd, "A", 1)`. Where does the data go first?
   - A) Directly to the storage device
   - B) To the page cache in kernel memory
   - C) To the CPU cache
   - D) To the device driver
   - Answer: B
   - Explanation: `write` copies data to the page cache. The data is flushed to disk later by the block layer.
   > Hint: What makes writes fast? Where is the data before it reaches disk?

2. Which of these are true about the I/O path? Pick all that apply.
   - A) The page cache buffers writes
   - B) The block layer schedules I/O
   - C) The device driver programs the hardware
   - D) The program's write always waits for the disk
   - Answer: A, B, C
   - Explanation: The page cache (A), block layer (B), and driver (C) are all part of the I/O path. The program's write does not wait for the disk (D is false).
   > Hint: What does the program's write return? When does the data reach disk?

3. A program calls `fsync(fd)`. What does this do?
   - A) Flush the page cache to disk
   - B) Close the file
   - C) Delete the file
   - D) Check the file for errors
   - Answer: A
   - Explanation: `fsync` forces the data in the page cache to stable storage. It does not close or delete the file.
   > Hint: What does "sync" mean? What is being synchronized?

4. Explain why the page cache makes writes fast — what would happen if every write went directly to disk?

5. A program writes data and calls `fsync`. The system crashes. The data is lost. What is the most likely cause?

## Limits

This chapter shows a simple I/O path. Real systems have I/O schedulers, multipath, RAID, and complex storage protocols. The principle — buffer, schedule, flush — is the same.

## Go Deeper

- [Linux File Systems](https://docs.kernel.org/filesystems/)
- [Linux Block Layer](https://docs.kernel.org/block/)

## Related

Chapter 33, Chapter 35
