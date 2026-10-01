# Chapter 27 — What a Linux Device Driver Is

> **Part VII — Linux Device Drivers**

## Where does a driver begin and end?

Chapter 26 produced a device object and a possible driver match. A Linux driver is code that participates in kernel frameworks through registered operations. It does not usually own a main loop. The kernel calls it when a device is bound, an operation is requested, an event arrives, power state changes, or the device is removed.

There are two different interfaces to identify. The bus-facing interface handles matching and lifecycle, such as a platform driver's probe and remove callbacks. The subsystem-facing interface implements behavior appropriate to the device class, such as serial, input, network, or storage operations. Not every driver directly implements a userspace read/write file operation.

## Follow a serial driver's two registrations

Consider our teaching UART adapted to the Linux serial framework. A platform match leads to probe. Probe prepares per-device state and registers a serial port with the serial subsystem. Serial operations then call the UART-specific callbacks when transmission or configuration changes are needed.

```text
platform bus                         serial subsystem
match device to driver               application/TTY request
        |                                     |
      probe -> prepare port -> register port   |
                                      -> UART operation callback
                                            -> MMIO / queued data
```

A conceptual operation table could include start_tx, stop_rx, and set_termios. These callback names belong to a serial framework contract; they are not interchangeable with arbitrary read/write methods. The framework handles shared policy and plumbing while the driver implements the hardware-specific part.

This division explains why copying a character-device tutorial into a serial driver can miss essential behavior. Start from the subsystem that already represents the device's function. A normal keyboard belongs in the input subsystem; a normal network interface belongs in networking. Chapter 33 compares userspace interfaces without assuming one `/dev` design fits everything.

## One driver can manage several instances

Suppose the board has UART0 and UART1. The driver code is shared, but each instance needs its own mapped registers, interrupt identifier, locks, queues, and lifecycle state. Store these in a per-device object rather than one global base pointer that the second probe overwrites.

```text
shared driver code
    device state A: base A, IRQ A, queue A, lock A
    device state B: base B, IRQ B, queue B, lock B
```

Per-device state solves instance association. It does not automatically solve concurrent access: two callbacks for the same device may still overlap or run in different contexts. Chapter 18's synchronization rules apply inside the object.

A useful review question for every callback is: how does it find the correct instance, what context does it run in, and which resources are guaranteed alive? Those three answers often explain more than the function's name.

## Unregistration is part of the design

When removing a device, stop new operations through its published interface, prevent new device work, quiesce in-flight hardware activity, and drain or synchronize relevant callbacks before releasing the resources they access. The exact ordering follows the subsystem and hardware protocol; it cannot be replaced by simply freeing the per-device structure.

A late interrupt using a freed object is a lifetime failure even if the MMIO code is correct. A queued worker using an unmapped base is another. Resource management helpers can pair acquisitions and releases, but they do not infer the device's stop sequence or cancel every asynchronous operation for you.

Likewise, loading a module only makes driver code available and registered. It does not prove a device matched, probe succeeded, or a userspace interface became usable. Diagnose these as distinct milestones.

Chapter 28 takes the first callback, probe, and follows a partial failure with explicit resource ownership.

## Check

1. A driver module loads successfully. Which conclusion is justified by that fact alone?
   - A) Every matching device is initialized and working.
   - B) The module's initialization succeeded; binding and device operation need separate evidence.
   - C) A device file must exist.
   - Answer: B
   - Explanation: Driver availability, match, probe, subsystem publication, and operation are different stages.

2. Which state should normally belong to a device instance? Select all that apply.
   - A) Its MMIO mapping
   - B) Its queue and lock
   - C) One global base pointer overwritten by every probe
   - Answer: A, B
   - Explanation: Shared code can serve several independent instances; a single mutable base pointer loses that association.

3. Draw the bus-facing and subsystem-facing paths for a UART and an input button. Identify the callback boundary where each framework hands work to device-specific code.

4. A remove callback frees the per-device object while a previously queued worker remains runnable. Construct the failure timeline and state the lifetime evidence needed before the free becomes safe.

5. Research challenge: select one upstream driver and record a commit. Identify its bus registration, subsystem registration, per-device state, and one asynchronous callback. Explain how that callback obtains its instance and what keeps the state alive.

## Limits

This chapter describes the driver model at the lifecycle level. Callback sets and contexts differ by subsystem, bus, configuration, and kernel version. It is not a template promising that every driver needs a direct userspace read/write operation.

## Go Deeper

- [Linux driver model overview](https://docs.kernel.org/driver-api/driver-model/overview.html) — identify bus, device, and driver relationships.
- [Linux low-level serial API](https://docs.kernel.org/driver-api/serial/driver.html) — inspect the UART operation contract.
- [Linux platform devices and drivers](https://docs.kernel.org/driver-api/driver-model/platform.html) — connect matching to per-device probe/remove.

## Related

- [Chapter 26 — Device Tree: Describing the Machine](26_device_tree_describing_the_machine.md)
- [Chapter 28 — Probe: Meeting the Device](28_probe_meeting_the_device.md)
