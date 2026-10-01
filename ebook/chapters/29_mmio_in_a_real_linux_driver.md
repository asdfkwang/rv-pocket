# Chapter 29 — MMIO in a Real Linux Driver

> **Part VII — Linux Device Drivers**

## How does a resource become a register access?

Chapter 09 used a physical address directly in a bare-metal trace. Chapter 28 obtained a Linux mapping. Now follow the three quantities that are easily confused: the device resource's physical/bus address, the kernel's I/O mapping token, and the byte offset of a register within that resource.

Assume the teaching UART resource starts at physical `0x10000000` and spans `0x1000` bytes. A platform mapping helper supplies `void __iomem *base`. Its numeric representation need not equal `0x10000000`. Treat it as an I/O mapping to be used with the appropriate accessors, not ordinary C memory.

## Transmit one byte through the documented width

Chapter 09 specifies aligned 32-bit little-endian register access, with TX_DATA at offset zero and STATUS at offset four. The following fragment assumes probe already mapped/enabled the device, access is serialized, and this call is in a sleepable context:

```c
u32 status;
int ret;

ret = readl_poll_timeout(base + 0x04, status,
                         status & BIT(0), 10, 1000);
if (ret)
    return ret;
writel(0x41, base + 0x00);
```

This Linux-style fragment waits for the documented ready bit using a polling helper, then performs a 32-bit write carrying the byte value. The helper's delay and timeout arguments are in microseconds; actual scheduling affects the observation time. The kernel's GNU C environment permits byte-wise arithmetic on this void pointer; this is not a promise about portable ISO C.

At the register boundary, offset four selects STATUS regardless of the kernel mapping's numeric base. Using a `u32 *` and adding four would instead advance four elements, normally sixteen bytes. Using the wrong pointer-arithmetic unit can select another register while all values look plausibly aligned.

A raw dereference does not carry the full Linux MMIO contract. The accessor choice expresses width, endian interpretation, and architecture-appropriate I/O behavior. A different device requiring byte accesses or big-endian registers needs corresponding accessors. The teaching UART's contract, not the CPU register width, determines the operation.

## Ordered does not always mean completed

Some buses post writes: a CPU-visible write operation can finish before the peripheral has consumed it. A documented read from a suitable register on the same device/path may be needed to flush prior posted writes when the protocol requires arrival before the next step. That read must itself be safe and appropriate for the bus.

Do not use RX_DATA as a casual readback, because it consumes a byte. Do not assume a write-only command register returns the written value. And do not confuse flushing delivery of a command with waiting for the commanded operation to complete: a received reset command may still need time before reset-done status appears.

The distinction is visible in a three-boundary trace:

```text
CPU issues command -> interconnect delivers command -> device finishes operation
```

A barrier or accessor ordering guarantee addresses specified ordering relationships. A safe readback may establish delivery under the bus contract. A completion status or interrupt establishes a later device-specific boundary. Name which guarantee the next instruction relies on.

## Serialization still belongs to the driver

Suppose two callers independently poll TX-ready and both observe it set before either writes. The first write can consume the available slot, making the second invalid under the device protocol. The polling accessor did not make the entire check-and-submit sequence exclusive. The driver needs queueing or serialization that matches its execution contexts and hardware capacity.

Similarly, readl/writel do not fix a wrong W1C mask or an incorrect resource description. They implement accesses under their API contract; the register protocol remains the author's responsibility.

Chapter 30 replaces this polling path with notification and traces the interrupt handler's restricted execution context.

## Check

1. The mapped base differs numerically from the physical resource start. Where is STATUS accessed?
   - A) Through the mapping at byte offset `0x04`
   - B) By casting physical `0x10000004` to a normal pointer
   - C) By adding four u32 elements to an ordinary typed pointer
   - Answer: A
   - Explanation: The mapping and byte offset define the appropriate I/O access.

2. Which distinctions are necessary? Select all that apply.
   - A) Command delivery versus device completion
   - B) Safe status readback versus a consuming data read
   - C) CPU register width versus device access width
   - Answer: A, B, C
   - Explanation: These are independent interface properties; one cannot be inferred from another.

3. Draw the two-caller TX-ready race. Propose a serialization scheme and explain why holding a spinlock across a sleepable polling helper would violate its context requirements.

4. A command is posted and software immediately disables a prerequisite clock. Explain the missing guarantee and design a device-specific sequence that establishes command arrival and, if needed, completion before clock shutdown.

5. Research challenge: compare readl/writel, relaxed variants, and big-endian accessors in Linux documentation. State one concrete ordering or format assumption that would make substituting a different accessor incorrect.

## Limits

The fragment is not a complete serial driver; it omits framework integration, power management, and teardown. Its readiness and width rules belong to the fictional UART. Posted-write flushing and ordering details must be checked for the target bus and accessor family.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html) — inspect accessor widths, endian behavior, and posted writes.
- [Linux polling helpers](https://github.com/torvalds/linux/blob/master/include/linux/iopoll.h) — verify context and timeout semantics.

## Related

- [Chapter 28 — Probe: Meeting the Device](28_probe_meeting_the_device.md)
- [Chapter 30 — Interrupts in a Real Linux Driver](30_interrupts_in_a_real_linux_driver.md)
