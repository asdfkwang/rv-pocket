# Chapter 15 — What an Operating System Actually Does

> **Part IV — Protection and the Operating System**

## What does the OS add to the hardware mechanisms?

Privilege and traps provide controlled entry. They do not by themselves define a process, file descriptor, or sharing policy. An operating system maintains those abstractions and uses hardware mechanisms to enforce their rules. Its job is to let programs request useful operations while coordinating finite CPU time, memory, storage, and devices.

Return to Chapter 01's write. We can now unpack the box labeled OS without pretending that it is one instruction or one table lookup. The kernel needs both a record of the requesting process and a representation of the object the descriptor selects.

## One descriptor number, different objects

Suppose process A has descriptor 3 connected to a serial device, while process B has descriptor 3 connected to a regular file. The integer 3 is meaningful only with the process's descriptor table. It is not a global device identifier.

For the serial write, use this conceptual path:

```text
A: fd=3, buffer contains 41, count=1
system-call entry: preserve caller state and obtain arguments
lookup: A's descriptor 3 -> open serial object
checks: access mode, buffer access, object-specific conditions
dispatch: appropriate file/subsystem operation accepts data
serial subsystem/driver: queue and transmit when possible
return: result delivered to A
```

Linux's actual serial path includes subsystem code rather than one universal driver's write callback. The important connection is that the kernel dispatches an abstract operation through the selected object's implementation. B's same-numbered descriptor dispatches through a filesystem path instead.

The buffer pointer comes from userspace. It cannot be trusted merely because its numeric value fits in a register. Kernel user-access helpers support the architecture's access checks and fault handling. The kernel must also handle short transfers and errors according to the interface, rather than treating the application's requested length as proof of available data.

## Accepted work can outlive the call

Assume a buffered regular-file write. The kernel can copy data into memory associated with that file and mark it dirty, meaning it differs from backing storage. Later writeback submits storage work. A successful write records acceptance under the file interface; it does not necessarily certify persistence after power failure.

The application can request stronger synchronization using an interface such as fsync and must check its result. File contents and the directory entry naming the file have distinct persistence considerations; Chapter 34 works through a replacement-file sequence. The existence of a flush operation is not a reason to call every successful write "durable."

For a serial object, the relevant completion may instead be transmitter drain or a protocol-level acknowledgement from the peer. "Finished" must name the boundary being observed. The same OS abstraction can hide implementation details while still requiring the application to understand its documented guarantees.

## Isolation does not mean independent hardware

Two programs may have separate memory yet share one device. The OS can serialize operations, enforce permissions, and provide queues, but it cannot create two physical baud-rate configurations in a UART that has only one. Some conflicts require a higher-level sharing policy or exclusive ownership.

Similarly, file locking does not automatically establish an application message protocol. The application must decide the unit of a logical update and use the relevant atomicity or locking interface. Otherwise two individually valid operations can combine into a result neither application intended.

These examples show why an OS is more than a list of services. It carries state across requests: which object is open, which data is buffered, who may access it, and who is waiting. Chapter 16 focuses on the state needed to stop one execution and resume another.

## Check

1. A and B both call write with fd = 3. Why can the destinations differ?
   - A) Each descriptor is interpreted through its process's table.
   - B) The instruction encoding chooses the destination.
   - C) Descriptor 3 always means a UART.
   - Answer: A
   - Explanation: The handle's meaning depends on the kernel-managed process context.

2. Which claims follow from a successful buffered file write? Select all that apply.
   - A) Some amount of data was accepted, as reported by the result.
   - B) The same amount is necessarily durable after sudden power loss.
   - C) The result must still be interpreted according to that object's interface.
   - Answer: A, C
   - Explanation: Acceptance and persistence are different guarantees.

3. Draw the state retained by the kernel between a successful write and later physical completion. Explain why returning from the system call does not imply that all related kernel work has ended.

4. Two writers each issue a header write followed by a payload write. Give an interleaving that breaks their message format. Identify the additional assumptions needed for a correct serialization scheme.

5. Research challenge: follow Linux VFS documentation from a descriptor-associated file object to an operation implementation. Contrast one regular-file path with a character-device path, naming the subsystem boundary rather than assuming both call the same driver method.

## Limits

The syscall path is conceptual and does not prescribe Linux's exact validation order. Permission policy, buffering, atomicity, and completion guarantees depend on the object and operation. This chapter establishes questions to ask; later chapters trace particular interfaces.

## Go Deeper

- [Linux VFS](https://docs.kernel.org/filesystems/vfs.html) — inspect file objects and operation dispatch.
- [Linux user-space memory access](https://docs.kernel.org/core-api/mm-api.html) — locate the user-access helper contracts rather than using an ordinary memcpy.

## Related

- [Chapter 14 — Privilege: M, S, and U](14_privilege_m_s_and_u.md)
- [Chapter 16 — Processes and Context Switching](16_processes_and_context_switching.md)
