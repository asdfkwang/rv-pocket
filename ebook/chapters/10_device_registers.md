# Chapter 10 — Device Registers

> **Part III — CPU Meets Hardware**

## Why is a register not ordinary storage?

Chapter 09 located the UART registers. Knowing the correct address is only the beginning: each register defines a protocol. A write can replace a stored value, start work, clear an event, or feed a FIFO. A read can observe status or consume information. Correct driver code follows that protocol even when the instructions resemble ordinary memory accesses.

Use the teaching UART map from Chapter 09. All accesses are aligned 32-bit operations. STATUS is read-only; RX_DATA consumes a byte. IRQ_STATUS contains latched event bits: bit 0 means a receive event, bit 1 an error event. Writing a one clears the corresponding latch; writing zero leaves it unchanged. These are W1C, or write-one-to-clear, semantics.

## A read can change the next read

Suppose the receive FIFO, a first-in first-out queue, contains bytes `41 42`. STATUS bit 1 is set. The first RX_DATA read returns `41` and removes it, leaving `42`. The second returns `42` and empties the FIFO. STATUS bit 1 then clears.

| Operation | Returned low byte | FIFO afterward | RX-ready |
| --- | --- | --- | --- |
| Read STATUS | status, not payload | `41 42` | 1 |
| Read RX_DATA | `41` | `42` | 1 |
| Read RX_DATA | `42` | empty | 0 |

A debugger that reads RX_DATA to "inspect" it has performed a receive operation. The driver may subsequently see no byte because the observation consumed it. Prefer documented non-destructive status when investigating live hardware.

## Read-modify-write has a hidden assumption

For an ordinary read/write CONTROL register, assume all fields in the example are software-owned and writing preserved fields is permitted. Starting from `0x00000100`, enabling bit 0 should retain the upper configuration field. Reading, OR-ing with 1, and writing `0x00000101` does that. Writing the constant 1 would discard the existing configuration.

Apply the same idea to IRQ_STATUS = `0x03`. You want to clear only bit 0. A tempting sequence reads 3, clears bit 0 in the CPU to get 2, then writes 2. The device interprets the written one in bit 1 as "clear the error event." Bit 0 remains set. The apparently careful update cleared the wrong event.

```text
initial IRQ_STATUS:             0011
correct acknowledgement write:  0001
resulting IRQ_STATUS:            0010
```

The correct W1C acknowledgement is the mask of events you intend to clear, not a new desired register value. Even writing the original value OR 1 would clear both currently set events. The meaning of a one at the device boundary matters more than the source expression's familiar shape.

## Events have timing as well as values

Suppose a receive event arrives after a driver reads IRQ_STATUS but before it acknowledges it. Whether that event remains pending depends on the device's latching and reassertion rules. W1C alone does not specify whether repeated occurrences of the same event are counted. A one-bit latch can collapse multiple events into one observation.

For the receive examples later, assume the UART reasserts the receive event if data remains after acknowledgement. The handler drains available bytes and acknowledges according to that contract. A real device may instead use level status, read-to-clear bits, or separate acknowledge registers. Its datasheet must settle the sequence.

Read-modify-write also needs concurrency control when multiple software paths can update CONTROL. Two paths can read the same old value, modify different bits, and overwrite each other's changes. Chapter 18 addresses the software race. A lock cannot turn a W1C register into an ordinary read/write register.

The next chapter asks how long software should wait for a status condition and what to do when it never arrives.

## Check

1. IRQ_STATUS is 3. What write clears only event bit 0 under this W1C contract?
   - A) 0
   - B) 1
   - C) 2
   - Answer: B
   - Explanation: Ones select latches to clear. Writing 2 would clear bit 1 instead.

2. Which observations can perturb the device? Select all that apply.
   - A) Reading RX_DATA
   - B) Writing IRQ_STATUS
   - C) Every STATUS read necessarily consumes a byte
   - Answer: A, B
   - Explanation: RX_DATA pops data and IRQ_STATUS acknowledges events; STATUS is non-destructive in this model.

3. CONTROL starts at `0x100`. Path A enables bit 0 while path B enables bit 2 using separate read-modify-write sequences. Construct an interleaving that loses one update and show all values.

4. A one-bit event latch is set twice before software services it. Explain why software cannot infer the event count from that bit alone. Identify an additional device mechanism that could preserve the missing information.

5. Research challenge: choose a real peripheral datasheet and identify one register with non-ordinary access semantics. Record its width, read behavior, write behavior, reset value, and a safe acknowledgement sequence. Do not reuse the fictional UART assumptions without evidence.

## Limits

The event reassertion rule and register ownership assumptions are explicit teaching contracts. Reserved bits, mixed access types within one register, atomic set/clear aliases, and silicon errata can require different update procedures on real devices.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html) — identify accessor guarantees and their limits.
- [Linux regmap interfaces](https://github.com/torvalds/linux/blob/master/include/linux/regmap.h) — inspect how register access policies are represented; the device documentation still defines the semantics.

## Related

- [Chapter 09 — How Devices Become Addresses](09_how_devices_become_addresses.md)
- [Chapter 11 — Polling, Time, and Timers](11_polling_time_and_timers.md)
