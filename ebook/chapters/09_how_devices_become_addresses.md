# Chapter 09 — How Devices Become Addresses

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The CPU has one address bus. RAM, UART, GPIO, and every other device all hang off it. The CPU says "read address 0x10000000" — something must decide whether that means RAM or a device register. That decision is address decoding, and getting it wrong means the CPU talks to the wrong hardware.

## Core Idea

The address space is divided into ranges. A range of addresses belongs to RAM; another range belongs to a device. The **interconnect** (the wiring between CPU and devices) decodes each address and routes the access to the right destination. This is called **Memory-Mapped I/O** (MMIO): device registers appear as addresses.

## Worked Example

```text
0x00000000..0x7FFFFFFF  → RAM (2 GB)
0x10000000..0x10000FFF  → UART (4 KB)
0x10001000..0x10001FFF  → GPIO (4 KB)
```

When the CPU executes `lw x12, 0x10000000`, the interconnect sees the address is in the UART range and routes the read to the UART's DATA register. The CPU used a normal load instruction — the routing is invisible to software.

## The Same Idea Elsewhere

- **Hardware:** the address decoder is combinational logic: compare the address bits against the range, assert the chip select for the matching device.
- **RISC-V:** the ISA says nothing about MMIO — it is a platform decision. The RISC-V privileged spec defines how to configure the memory map.
- **OS:** the OS owns the memory map. It programs the decoder (via firmware or platform registers) and decides which ranges are RAM and which are devices.
- **Linux/driver:** a driver receives a resource address (from Device Tree or ACPI) and maps it into the kernel's address space with `ioremap` before accessing it.

## When It Fails

A driver hard-codes `0x10000000` as the UART base. It works on the development board. On the next board revision the UART moved to `0x20000000` and the driver reads garbage — or worse, writes to an unrelated device. The address was never a constant; it was a property of the platform that should have been described externally.

## Check

1. The CPU executes `sw x12, 0x10000004`. The memory map says `0x10000000..0x10000FFF` is UART. What happens?
   - A) The write goes to RAM at offset 4
   - B) The write goes to the UART register at offset 4
   - C) The write is ignored because devices cannot be written
   - D) The CPU traps because the address is invalid
   - Answer: B
   - Explanation: The address falls in the UART range, so the interconnect routes it to the UART. Offset 4 within that range selects a specific register.
   > Hint: The address is in the UART range. What does the offset select?

2. Which of these are true about MMIO? Pick all that apply.
   - A) Device registers appear as addresses in the CPU's address space
   - B) The CPU uses special instructions to access devices
   - C) The interconnect routes accesses based on the address
   - D) Each device occupies a range of addresses
   - Answer: A, C, D
   - Explanation: MMIO means normal load/store instructions access devices — no special instructions. The interconnect decodes the address and routes to the right device.
   > Hint: "Memory-mapped" means devices look like memory. What does the CPU use to access them?

3. A platform has RAM at `0x00000000..0x3FFFFFFF` and a device at `0x40000000..0x4000FFFF`. What is the minimum number of address bits the decoder must examine to distinguish them?
   - A) 1 bit (bit 30)
   - B) 2 bits (bits 31:30)
   - C) 4 bits (bits 31:28)
   - D) 32 bits (the full address)
   - Answer: B
   - Explanation: RAM is `00...` and the device is `01...` in the top two bits. Bits 31:30 are `00` for RAM and `01` for the device — 2 bits suffice.
   > Hint: Write the start addresses in binary. Where do they first differ?

4. Explain why a driver must call `ioremap` before accessing a device register on Linux — what does `ioremap` do, and what happens if you access the physical address directly?

5. A board has two UARTs. UART0 is at `0x10000000` and UART1 is at `0x10001000`. A driver writes to `0x10001004` expecting to reach UART1's STATUS register. It reads back UART0's STATUS instead. What is the most likely cause, and how would you confirm it?

## Limits

This chapter assumes a simple memory map with fixed ranges. Real systems have PCIe devices that configure their own addresses at boot, IOMMUs that translate device addresses, and multiple levels of interconnects. The principle — address ranges select devices — is the same.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)
- [Linux Driver Model](https://docs.kernel.org/driver-api/driver-model/)

## Related

Chapter 08, Chapter 10
