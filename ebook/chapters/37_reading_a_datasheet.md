# Chapter 37 — Reading a Datasheet

> **Part VIII — A Complete System**

## How do you turn a datasheet into an executable protocol?

The earlier chapters supplied small device contracts explicitly. A real driver author must extract those contracts from register tables, timing diagrams, reset sequences, integration notes, and errata. Reading only register names leaves the most important ordering and lifetime rules undiscovered.

Begin with an operation you want to perform, such as "capture 256 bytes into memory." Collect the preconditions, command sequence, completion evidence, and recovery procedure for that operation. Every ambiguous unit or access type is a question to resolve before writing code.

## Practice on a small specification

The following is an invented capture-engine excerpt for this chapter, separate from the UART. Registers are aligned 32-bit little-endian MMIO. Its clock must be enabled and reset deasserted before access. It writes incoming data into a DMA buffer.

| Offset | Register | Access and meaning |
| --- | --- | --- |
| `0x00` | ADDRESS | RW, 32-bit DMA address, must be 16-byte aligned |
| `0x04` | LENGTH | RW, byte count, nonzero multiple of four, maximum 4096 |
| `0x08` | COMMAND | write-only, bit 0 starts when idle |
| `0x0C` | STATUS | RO, bit 0 busy; zero after reset completes |
| `0x10` | EVENTS | W1C, bit 0 done, bit 1 error |
| `0x14` | ID | RO, expected `0x52565031` |

Additional rules: ADDRESS and LENGTH must not change while busy. START clears no old event bits. DONE is asserted only after all writes for that transfer are complete and the device will no longer access that buffer. On error or timeout, the documented abort/reset procedure is required before reclaiming the mapping. Reset requires at most 100 enabled device-clock cycles at the specified operating conditions.

These sentences carry as much driver logic as the table. In particular, an old DONE bit can be mistaken for a new completion unless software clears it at the right time.

## Derive a valid 256-byte capture

Assume a 32-bit DMA mask is supported, the mapping for a 256-byte receive buffer returns `0x40002000`, and setup has enabled a stable 50 MHz device clock. The address satisfies 16-byte alignment and the length is a legal multiple of four.

The driver establishes idle state, acknowledges stale event bits with the documented W1C mask, programs ADDRESS and LENGTH, and submits START with the required I/O ordering. It then leaves the buffer device-owned until DONE or a handled failure. After DONE, it performs the DMA API's transition to CPU access before inspecting the bytes.

```text
address check: 0x40002000 & 0xF = 0
length check: 256 % 4 = 0, and 0 < 256 <= 4096
length register value: 0x100, measured in bytes
reset maximum at 50 MHz: 100 / 50,000,000 s = 2 microseconds
```

The reset timing calculation assumes the required clock is actually running. A CPU delay of two microseconds cannot make progress happen in a clock-gated device. Software timeout policy also needs to account for observation latency and documented timing margins; the calculated hardware interval is not a universal polling-loop duration.

## Review a plausible wrong implementation

A driver writes LENGTH = 64 because it divides 256 by the four-byte bus width. But the register counts bytes, so the engine captures only 64 bytes. A second bug writes zero to EVENTS to clear old DONE; W1C semantics leave it set. The next wait then reports completion before the new capture finishes.

Both bugs can occur with the correct base address, correct readl/writel width, and a successful probe. The unit and access semantics were wrong. Fix the protocol rather than adding a longer arbitrary delay that merely hides the stale-completion race.

ID can help test that the selected region resembles the expected device, but one correct ID read does not certify clock stability, interrupt wiring, DMA accessibility, or silicon revision-specific behavior. Evidence has a scope.

## Keep a contract ledger

For each operation, record where the specification defines addresses and units, legal access widths, reserved-bit handling, prerequisites, completion, concurrent access, and recovery. Attach revision/errata references. When a statement is absent, mark it unresolved instead of inventing a guarantee from an example program.

Chapter 38 applies the same ledger in reverse: read an existing driver's code and recover the protocol it is trying to implement.

## Check

1. What LENGTH value requests 256 bytes on this engine?
   - A) 64
   - B) `0x100`
   - C) `0x1000`
   - Answer: B
   - Explanation: LENGTH counts bytes, independently of the MMIO bus access width.

2. Which requests violate the excerpt? Select all that apply.
   - A) ADDRESS = `0x40002008`
   - B) LENGTH = 258
   - C) Updating LENGTH while STATUS.busy is set
   - Answer: A, B, C
   - Explanation: They respectively violate alignment, count granularity, and active-transfer update rules.

3. Show a false-success timeline caused by leaving an old DONE event set. Explain why the correct W1C acknowledgement must be associated with the submission protocol rather than performed at an arbitrary later time.

4. The clock is 25 MHz instead of 50 MHz. Recompute the maximum reset interval, then explain why even that result cannot prove a reset completed if the clock enable or reset wiring is wrong.

5. Research challenge: select a real datasheet and reproduce a contract ledger for one operation. Include one erratum or explicitly document that you checked for errata. Distinguish what the document guarantees from assumptions made by a sample driver.

## Limits

The excerpt is fictional and intentionally complete only for the reasoning exercise. Real device integration can depend on power domains, bus ordering, reset sequencing, and external signaling. Never transfer this engine's W1C, alignment, or completion rules to another device by analogy alone.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html) — translate access requirements into the appropriate kernel operations.
- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html) — pair a device's transfer contract with buffer visibility and lifetime.
- [Linux Devicetree bindings](https://github.com/torvalds/linux/tree/master/Documentation/devicetree/bindings) — compare hardware integration properties with the datasheet ledger.

## Related

- [Chapter 36 — One DMA Frame, End to End](36_one_dma_frame_end_to_end.md)
- [Chapter 38 — Reading a Linux Driver](38_reading_a_linux_driver.md)
