# Chapter 33 — Exposing Devices to Userspace

> **Part VII — Linux Device Drivers**

## What should an application be allowed to observe?

Correct register and DMA operations are internal mechanisms. A userspace interface must define the observable service: data format, blocking behavior, partial transfers, errors, and lifetime. Choosing that contract is as important as choosing an accessor.

Prefer an existing subsystem when it expresses the device's function. Input devices can emit input events, serial devices can use TTY interfaces, and network devices can use the networking stack. A custom character device may be suitable for a different operation, but creating a device node does not automatically supply a useful or stable protocol.

## Follow a small character-device write

For illustration, define a device interface accepting a stream of command bytes into a bounded software queue. A successful write reports how many bytes were accepted into that queue. It does not promise that the physical operation completed. This explicit contract echoes Chapter 01's serial example.

Suppose the user requests four bytes `10 20 30 40`, but only two queue slots are available. The implementation can accept two and return 2 under its documented partial-write policy. The application then advances its pointer by two and requests the remaining two. Retrying all four would duplicate the prefix.

```text
first call:  requested [10 20 30 40], accepted [10 20], result 2
retry:      requested [30 40],       accepted [30 40], result 2
```

Whether an empty queue should cause blocking, EAGAIN for a nonblocking descriptor, or another outcome is part of the interface. Chapter 31's wait protocol supplies a mechanism; this chapter specifies what the application experiences when that mechanism wakes or fails.

## User memory is not kernel-owned storage

A pointer supplied by userspace must be accessed through the appropriate user-access helpers. A plain memcpy can bypass the required fault-handling and access discipline. User memory may fault, and its contents may be changed concurrently by the application. Validation followed by a later uncoordinated reread can therefore create a time-of-check/time-of-use problem.

For a small command, copy it into kernel-owned storage, check the copy result, and validate that stable copy before committing the operation. copy_from_user and copy_to_user return the number of bytes not copied, not a negative errno directly. A nonzero return needs handling according to whether the driver has already made partial progress.

Do not hold a spinlock while performing a potentially sleeping user copy. Separate preparation from the short synchronized queue update. If capacity can change between those steps, recheck it under the queue's lock or use a reservation protocol; the earlier capacity observation is not a reservation.

## Define atomicity at the useful boundary

A byte-stream interface does not inherently preserve messages across separate writes. If a command must be accepted as a complete record, define the record format, maximum size, validation, and acceptance behavior. Do not partially execute a command and then return an error implying that nothing happened.

Read has analogous concerns. If bytes are removed from a device queue before a user copy fails, decide how partial progress is reported and whether data is retained. A mature subsystem already supplies many such conventions. Custom interfaces inherit the obligation to specify them.

Readiness notification through poll means an operation can likely make progress under the interface's rules, not that a particular caller permanently owns the next item. Another consumer or removal can change state before the operation executes, so read/write must remain correct when readiness is no longer present.

## Removal and compatibility are visible too

An open descriptor can outlive device unregistration. Stop new opens and submissions as appropriate, publish a terminal condition to existing waiters, and retain state until all active users and asynchronous callbacks are finished. Returning ENODEV after removal is a policy only if the object remains safe enough to reach that return path.

Once applications rely on a layout or ioctl, changes become compatibility decisions. Fixed-width fields, explicit padding, and clear versioning are preferable to exposing kernel-private structures containing pointers or architecture-dependent sizes. The next chapter applies these interface guarantees to files and storage durability.

## Check

1. A write requests four bytes and returns 2. What should a correct stream-writing loop retry?
   - A) All four bytes
   - B) The remaining two bytes, with adjusted pointer and count
   - C) Nothing, because positive always means complete
   - Answer: B
   - Explanation: The result reports accepted progress; repeating the prefix can duplicate it.

2. Which are part of the userspace contract? Select all that apply.
   - A) Blocking and nonblocking behavior
   - B) The meaning of a successful byte count
   - C) The behavior of existing descriptors after removal
   - Answer: A, B, C
   - Explanation: Applications depend on all these observable outcomes, not only register correctness.

3. Design a complete-record command interface for an eight-byte command. Specify what happens on short input, invalid fields, full capacity, user-copy failure, and removal before commitment.

4. Construct a race between an unlocked queue-capacity check and actual enqueue. Explain why copying into private kernel memory fixes mutable-input concerns but does not by itself fix capacity ownership.

5. Research challenge: inspect the user-copy API and a real driver's read/write path. Record how partial copy and partial device progress affect the returned byte count or errno. Identify the point beyond which reporting "nothing happened" would be misleading.

## Limits

The command stream is an illustrative custom interface, not a recommendation to bypass established Linux subsystems. Permission checks, reference management, compatibility, and error conventions require a complete design before exposing an interface to applications.

## Go Deeper

- [Linux user-access and memory APIs](https://docs.kernel.org/core-api/mm-api.html) — verify user-copy return conventions and context constraints.
- [Linux ioctl guidance](https://docs.kernel.org/driver-api/ioctl.html) — inspect stable userspace layouts and compatibility.
- [Linux VFS](https://docs.kernel.org/filesystems/vfs.html) — connect file operations to the application's descriptor.

## Related

- [Chapter 32 — DMA in a Real Linux Driver](32_dma_in_a_real_linux_driver.md)
- [Chapter 34 — Files, Storage, and the I/O Path](34_files_storage_and_the_i_o_path.md)
