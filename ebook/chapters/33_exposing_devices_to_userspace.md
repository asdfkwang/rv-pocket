# Chapter 33 — Exposing Devices to Userspace

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A driver is useless if programs cannot use it. The driver exposes the device to userspace through device files (`/dev/...`), sysfs (`/sys/...`), or ioctl commands. Userspace programs open the device file, read/write data, and send ioctl commands. The driver translates these into device operations.

## Core Idea

A driver creates a device file with `register_chrdev` (for character devices) or a bus-specific registration. Userspace opens the file, gets a file descriptor, and calls `read`, `write`, `ioctl`, `mmap`. The kernel routes these calls to the driver's functions. The driver's `file_operations` structure maps userspace calls to driver functions.

## Worked Example

```c
static const struct file_operations my_uart_fops = {
    .owner = THIS_MODULE,
    .open = my_uart_open,
    .read = my_uart_read,
    .write = my_uart_write,
    .unlocked_ioctl = my_uart_ioctl,
};

// In probe:
register_chrdev(major, "my_uart", &my_uart_fops);
```

Userspace:

```c
int fd = open("/dev/my_uart", O_RDWR);
write(fd, "A", 1);
read(fd, buf, 1);
```

The kernel routes `write` to `my_uart_write` and `read` to `my_uart_read`.

## The Same Idea Elsewhere

- **Hardware:** the driver's read/write functions access device registers (Chapter 29).
- **RISC-V:** the CPU executes the driver's code in S-mode.
- **OS:** the kernel provides the device file abstraction and routes calls to drivers.
- **Linux/driver:** the driver's `file_operations` is the interface between userspace and the device.

## When It Fails

A driver's `write` function copies data from userspace with `memcpy` instead of `copy_from_user`. If the userspace pointer is invalid, the kernel panics. The fix: always use `copy_from_user`/`copy_to_user` for userspace data. These functions handle page faults and security checks.

## Check

1. A userspace program calls `write(fd, buf, 1)`. What does the kernel do?
   - A) Call the driver's write function directly
   - B) Route the call to the driver's write function via the file operations table
   - C) Write directly to the device register
   - D) Return an error — userspace cannot write to devices
   - Answer: B
   - Explanation: The kernel looks up the file operations table for the device file and calls the driver's write function.
   > Hint: How does the kernel know which driver function to call? Where is the mapping?

2. Which of these are true about device files? Pick all that apply.
   - A) They are created by the driver
   - B) They are accessed through the file operations table
   - C) They allow direct hardware access from userspace
   - D) They are the interface between userspace and the driver
   - Answer: A, B, D
   - Explanation: Device files are created by the driver (A), accessed via the file operations table (B), and are the userspace-driver interface (D). They do not allow direct hardware access (C is false).
   > Hint: What does the device file abstract? What does userspace see?

3. A driver uses `memcpy` to copy data from userspace. What is the risk?
   - A) It is slower than `copy_from_user`
   - B) It may panic if the userspace pointer is invalid
   - C) It does not work on 64-bit systems
   - D) It requires more memory
   - Answer: B
   - Explanation: `memcpy` does not handle page faults or security checks. An invalid userspace pointer causes a kernel panic. `copy_from_user` handles these safely.
   > Hint: What does `copy_from_user` do that `memcpy` does not?

4. Explain why userspace cannot access device registers directly — what would break if it could?

5. A driver's `write` function is called with a userspace buffer. The driver reads the buffer but gets garbage. What is the most likely cause?

## Limits

This chapter shows a simple character device. Real devices use block devices, network devices, and complex ioctl interfaces. The principle — expose the device through a file abstraction — is the same.

## Go Deeper

- [Linux Driver API (file operations)](https://docs.kernel.org/driver-api/basics.html)
- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)

## Related

Chapter 32, Chapter 34
