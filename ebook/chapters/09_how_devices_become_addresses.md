# Chapter 09 — How Devices Become Addresses

> **Part III — CPU Meets Hardware**

## Why can a store make hardware do something?

So far, a store changed RAM. The same kind of CPU request can instead reach a device. Memory-mapped I/O, or MMIO, assigns parts of an address space to hardware interfaces. An address decoder uses the request's address to select the responding target; the target determines what the operation means.

A register here is a device's named interface location, not one of the CPU registers x0–x31. Some device registers retain configuration, others expose live status, and others behave like commands or queues. An address alone cannot tell you which behavior applies.

## Define the teaching platform

For this part of the book, assume bare-metal software with permission to access the following physical ranges. Bare-metal means no operating-system service stands between our code and the hardware. The UART map is fictional and deliberately differs from real UART standards.

| Physical range, inclusive | Target |
| --- | --- |
| `0x10000000`–`0x10000FFF` | Teaching UART |
| `0x80000000`–`0x8000FFFF` | RAM used for this example |

The UART uses aligned 32-bit little-endian register accesses:

| Offset | Name | Initial contract |
| --- | --- | --- |
| `0x00` | TX_DATA | Write low eight bits to transmitter when ready |
| `0x04` | STATUS | Read bit 0: TX ready; bit 1: RX data available |
| `0x08` | RX_DATA | Read and consume one received byte when available |
| `0x0C` | IRQ_ENABLE | Bit 0 enables receive-event notification |
| `0x10` | IRQ_STATUS | Latched events; write one to clear selected bits |
| `0x14` | CONTROL | Read/write configuration, bit 0 enables the device |

Later chapters specify the event protocol before using it. This table gives addresses and basic access meanings, not a production UART implementation.

## Follow a store through the decoder

Let x10 hold `0x10000000`, x12 hold `0x41`, and assume CONTROL enables the UART and STATUS bit 0 is set. Execute `sw x12, 0(x10)`.

The CPU forms the address `0x10000000` and issues a four-byte write containing `0x00000041`. The interconnect routes it to the UART range. The UART decodes offset zero and places the low byte in its transmit path. It may clear TX-ready until it can accept another byte. No RAM location at that address was updated: that physical address selects a different target.

Now change x10 to `0x80000000` and execute the same instruction. The selected target is RAM, where bytes `41 00 00 00` are stored. Identical instruction and data, different address, different effect. The ISA defines the request; the platform map and device specification define the target's response.

This is also why a readback is not universally a verification of a write. Reading a command register may be unsupported, return unrelated status, or have a side effect. Read a documented status register if you need to observe the requested operation.

## Mapping is not just pointer casting

The bare-metal trace uses physical addresses directly. Under an OS with virtual memory, the address used by a CPU instruction can first be translated. A numeric physical device address is not automatically a valid kernel pointer. Linux drivers obtain a resource and map it into an appropriate kernel I/O mapping, then use MMIO accessors such as readl and writel. Chapter 29 follows that path concretely.

The mapping's memory attributes matter too. Ordinary RAM may be cached or speculatively accessed; a device read may consume data. Treating a device region like ordinary cacheable memory can change the number and timing of operations the device observes. `volatile` in C alone does not establish the platform mapping or supply the kernel's I/O contract.

## Distinguish an address error from a device-state error

A silent UART after a write could mean the address selected the wrong peripheral, the device was disabled, or the transmitter was not ready. A STATUS observation can test readiness at the selected target, but it cannot by itself prove that the target is the intended UART. Compare the resource range, board description, documented identification registers if available, and relevant enable state.

Chapter 10 continues at the next boundary: even after selecting the correct device, what does each register access actually do?

## Check

1. With the given map, `sw x12, 0(x10)` and x10 = `0x10000000` targets what?
   - A) RAM holding a copy of a UART register
   - B) The UART TX_DATA interface
   - C) CPU register x0
   - Answer: B
   - Explanation: Address decoding selects the peripheral and then its offset-zero register.

2. Which facts must be known before the transmit write is valid? Select all that apply.
   - A) The register's supported width
   - B) The documented ready/enable conditions
   - C) That every write can be checked by reading the same address
   - Answer: A, B
   - Explanation: The last statement is not a general register guarantee.

3. A decoder accidentally ignores address bit 12 between two adjacent 4 KB UART windows. Show how UART0 at `0x10000000` and UART1 at `0x10001000` can alias. Propose a safe experiment using documented scratch state, and state what would make that experiment unsafe.

4. Write a trace distinguishing the CPU's effective address, a translated physical address, the selected device, and the device-relative offset. Explain which equality assumptions held only in the bare-metal example.

5. Research challenge: consult Linux Device I/O documentation. Explain why a cast of a physical address to a pointer is not equivalent to an I/O mapping, and distinguish mapping attributes from accessor ordering.

## Limits

This teaching interconnect has a simple physical decoder; real platforms add bridges, access-control checks, and potentially translated bus addresses. The fictional UART map must not be used as a register specification for a real 16550 or another board.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html) — compare resource addresses, I/O mappings, and accessor semantics.
- [Devicetree address translation](https://devicetree-specification.readthedocs.io/en/stable/devicetree-basics.html) — follow `reg` and `ranges` across a bus.

## Related

- [Chapter 08 — Functions, ABI, and the Stack](08_functions_abi_and_the_stack.md)
- [Chapter 10 — Device Registers](10_device_registers.md)
