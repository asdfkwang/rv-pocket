# Chapter 10 — Device Registers

> **Part III — CPU Meets Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A device is controlled by writing values to its registers and reading status from them. Every driver is mostly register manipulation. When a device does nothing or behaves erratically, the cause is usually a wrong value in a register — wrong bit, wrong offset, or wrong timing.

## Core Idea

A device has a set of registers at fixed offsets from its base address. Each register has a documented meaning: some are **control** (write to configure), some are **status** (read to check state), some are **data** (read/write to transfer). Registers may have **bit fields** — individual bits or groups of bits with separate meanings.

## Worked Example

A simplified UART:

```text
Base: 0x10000000
+0x00  DATA    (read: received byte; write: byte to transmit)
+0x04  STATUS  (bit 0: TX ready; bit 1: RX ready)
+0x08  CONTROL (bit 0: enable TX; bit 1: enable RX; bits 31:16: baud divisor)
```

To send `A` (0x41):

```text
1. Read STATUS until bit 0 is set (TX ready)
2. Write 0x41 to DATA
```

To receive:

```text
1. Read STATUS until bit 1 is set (RX ready)
2. Read DATA to get the byte
```

## The Same Idea Elsewhere

- **Hardware:** each register is a small storage element wired to the device's logic. Writing CONTROL bit 0 enables the transmitter circuit.
- **RISC-V:** the CPU accesses registers with normal load/store instructions (MMIO, Chapter 09). The ISA does not define device registers — they are platform-specific.
- **OS:** the OS does not touch device registers directly; it lets drivers do so after verifying the driver has the right to the device.
- **Linux/driver:** drivers use `readl`/`writel` (or `readb`/`writeb` for 8-bit registers) to access `__iomem` pointers. These functions handle byte ordering and barrier requirements.

## When It Fails

A driver writes `0x01` to CONTROL to enable TX, but the device also has a "reset" bit at position 3. The driver's initialization code writes `0x09` (enable TX + reset), which resets the device every time it enables TX. The device works once, then resets on every subsequent enable. The bug is not the enable — it is the unintended reset bit.

## Check

1. A UART STATUS register has bit 0 = TX ready, bit 1 = RX ready. The value read is `0x03`. What can you conclude?
   - A) TX is ready but RX is not
   - B) RX is ready but TX is not
   - C) Both TX and RX are ready
   - D) The UART is disabled
   - Answer: C
   - Explanation: `0x03` = binary `11` — both bit 0 and bit 1 are set, so both conditions hold.
   > Hint: Convert to binary. Which bits are 1?

2. Which of these are common register access patterns? Pick all that apply.
   - A) Read-modify-write to update specific bits
   - B) Write-only registers that acknowledge commands
   - C) Read-only status registers
   - D) Registers that can only be written once per boot
   - Answer: A, B, C
   - Explanation: Read-modify-write is how you update bits without disturbing others. Write-only command registers and read-only status registers are common. D is rare — most registers can be written multiple times.
   > Hint: Which of these is unusual? Most registers are written many times.

3. A driver writes `0x00000001` to a CONTROL register to enable a feature. The register has bit 0 = enable, bits 31:16 = divisor. The feature does not work. Reading back the register shows `0x00010001`. What happened?
   - A) The write was ignored
   - B) The divisor field was set to 1 by mistake
   - C) The enable bit was cleared by hardware
   - D) The register is read-only
   - Answer: B
   - Explanation: `0x00010001` has bits 16 set — the divisor field is 1, not 0. The driver probably wrote `0x00010001` instead of `0x00000001`, or a previous write set the divisor.
   > Hint: Compare what was written with what was read. Where do they differ?

4. Explain why `readl`/`writel` exist instead of plain dereference on `__iomem` pointers — what could go wrong with a plain read on a real system?

5. A device has a "busy" bit in its STATUS register. A driver polls it in a tight loop but the bit never clears. List three possible causes and the one additional register read that would distinguish them.

## Limits

This chapter shows simple read/write registers. Real devices have DMA (Chapter 22), interrupts (Chapter 12), and multi-byte register sequences. Some registers have side effects on read (clear-on-read) or write (trigger-on-write). Always read the device manual — the register map is the contract.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Driver Model](https://docs.kernel.org/driver-api/driver-model/)

## Related

Chapter 09, Chapter 11
