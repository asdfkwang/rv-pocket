# Chapter 28 — Probe: Meeting the Device

> **Part VII — Linux Device Drivers**

## What must probe establish before callbacks can run?

A match gives a driver an opportunity to initialize a particular device. Probe should either leave a fully usable instance or report failure while unwinding what it acquired. It is not simply a place to collect pointers: it establishes the invariants that every later callback relies on.

Assume a device needs mapped registers, an enabled clock, initialized software state, an interrupt handler, and registration with an upper subsystem. Its hardware interrupt source must remain masked until the handler's required state is ready. Some dependencies may not yet exist when probe first runs.

## Order initialization around the first possible observer

A conceptual sequence is:

```text
allocate per-device state; initialize locks and queues
obtain and map register resource
obtain clock/reset resources; put hardware in controlled state
mask device interrupts and clear stale causes as documented
obtain IRQ; register handler with fully initialized handler-visible state
register the device with its subsystem
unmask/start normal operation when the subsystem protocol permits
```

Requesting an IRQ can make a handler callable, including on a shared line with activity from another device. Publishing a subsystem interface can make callbacks callable. Initialize the state those paths will use before either registration. Do not rely on "no user will open it during probe" as a lifetime guarantee.

The exact order of clocks, resets, mapping, and registration is device-specific. The general constraint is that no observer should reach a partially initialized object. Some frameworks perform later startup in an explicit callback; probe should honor that contract instead of eagerly enabling hardware.

## Follow a failure after two successful acquisitions

Suppose resource mapping succeeds and a clock is enabled, but IRQ acquisition returns an error. The device must not remain active just because the normal remove callback will never be reached for a failed probe.

| Step | Owned resources | Required rollback if next step fails |
| --- | --- | --- |
| State allocated | software object | free object |
| Registers mapped | object, mapping | unmap, then free |
| Clock enabled | object, mapping, active clock | disable clock, then release earlier resources |
| IRQ registered | preceding state plus callback | stop source/synchronize as required, release IRQ, then earlier resources |

Linux devm helpers attach managed resources to the device's lifecycle. For example, devm_platform_ioremap_resource obtains a mapped platform resource and returns an error pointer on failure. Check IS_ERR and return PTR_ERR rather than treating every non-null pointer as success. platform_get_irq returns a negative error code on failure, which must not be used as an IRQ number.

Managed release simplifies bookkeeping, but enabling a clock or starting DMA may need an explicit managed action or cleanup path. A mapping release cannot stop hardware still using memory. Devres is a resource-lifetime mechanism, not a device-specific shutdown algorithm.

## Deferred probe is a dependency outcome

If a required provider is not ready, an API may return -EPROBE_DEFER. Propagating that result lets the driver core retry when dependencies become available. Replacing it with a generic permanent error or success hides the intended behavior.

A retry after failure should find no leaked active device or leftover registration from the earlier attempt. This is different from requiring that probe can be called twice on an already live instance with no cleanup. Normal driver-core binding does not ask a driver to stack duplicate live registrations on the same device.

## Define success narrowly enough to test

Returning zero means the driver has successfully bound under its subsystem's expectations. It does not prove every I/O operation has already been exercised. Test the first operation, failure paths, repeated bind/unbind, and provider-not-ready behavior where the environment supports them.

Chapter 29 examines the mapped resource: how the driver turns an offset into a safe MMIO operation and observes whether a command actually reached its intended boundary.

## Check

1. devm_platform_ioremap_resource returns an error pointer. What should the driver do?
   - A) Treat any non-null value as a usable mapping.
   - B) Check IS_ERR and propagate the encoded error.
   - C) Cast it to an integer physical address.
   - Answer: B
   - Explanation: Error pointers are not null and must not be dereferenced as I/O mappings.

2. Which must be ready before a handler can run? Select all that apply.
   - A) State and locks accessed by that handler
   - B) The instance association passed to the IRQ API
   - C) A promise that no unrelated device will trigger a shared line
   - Answer: A, B
   - Explanation: Shared-line delivery is not controlled by this driver alone.

3. Add a subsystem-registration failure after IRQ setup to the resource table. Specify which activity must be stopped or synchronized before each release, including work the handler may have queued.

4. A clock-get operation returns -EPROBE_DEFER. Explain the consequences of propagating it, converting it to success, and converting it to a permanent error. Identify what must be cleaned up before any retry.

5. Research challenge: inspect devres and a driver using devm_add_action_or_reset. Identify an active hardware state that ordinary managed memory allocation does not undo, and show how a registered action or explicit failure path handles it.

## Limits

The sequence is a reasoning framework, not a compilable universal probe. Actual subsystems define publication/startup order and removal obligations. Check the target kernel's helper signatures and dependency behavior when adapting code.

## Go Deeper

- [Linux managed device resources](https://docs.kernel.org/driver-api/driver-model/devres.html) — distinguish managed release from operational shutdown.
- [Linux driver infrastructure](https://docs.kernel.org/driver-api/infrastructure.html) — inspect platform resource, IRQ, and probe helpers.
- [Linux platform driver model](https://docs.kernel.org/driver-api/driver-model/platform.html) — follow binding and callback lifecycle.

## Related

- [Chapter 27 — What a Linux Device Driver Is](27_what_a_linux_device_driver_is.md)
- [Chapter 29 — MMIO in a Real Linux Driver](29_mmio_in_a_real_linux_driver.md)
