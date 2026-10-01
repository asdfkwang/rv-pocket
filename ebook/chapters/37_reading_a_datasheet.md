# Chapter 37 — Reading a Datasheet

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A datasheet is the contract between hardware and software. It describes registers, timing, electrical characteristics, and operating conditions. Reading it well is the difference between a driver that works and a driver that fights the hardware. Most driver bugs are datasheet violations.

## Core Idea

A datasheet has three key sections: **register map** (what registers exist and what they do), **timing diagrams** (how long operations take), and **operating conditions** (voltage, temperature, clock). The register map is the most important for drivers. Each register has an address, a reset value, and a description of each bit field.

## Worked Example

A UART datasheet:

```text
Register map:
  0x00  DATA    R/W  Transmit/Receive data
  0x04  STATUS  R    Bit 0: TX ready, Bit 1: RX ready
  0x08  CONTROL R/W  Bit 0: enable TX, Bit 1: enable RX

Timing:
  TX ready: set within 1 clock cycle of write to DATA
  RX ready: set within 16 clock cycles of byte arrival
```

The driver reads STATUS to check TX ready, writes DATA to send, and reads DATA to receive. The timing tells the driver how long to wait.

## The Same Idea Elsewhere

- **Hardware:** the datasheet describes the actual silicon behavior. The driver must match it.
- **RISC-V:** the CPU datasheet describes the ISA and platform features.
- **OS:** the OS does not read datasheets — drivers do.
- **Linux/driver:** the driver author reads the datasheet and writes code that matches it.

## When It Fails

A driver polls STATUS in a tight loop without a timeout. The datasheet says the device may take up to 100 clock cycles to set a status bit. The device is slow, not broken. The driver hangs. The fix: add a timeout to the poll loop, based on the datasheet's maximum timing.

## Check

1. A driver reads a datasheet and finds a register at offset 0x04. What does this offset mean?
   - A) The register is 4 bytes wide
   - B) The register is at address base + 0x04
   - C) The register is the 4th register in the map
   - D) The register takes 4 clock cycles to access
   - Answer: B
   - Explanation: The offset is added to the base address to get the register's address.
   > Hint: What is the base address? What is the offset relative to?

2. Which of these are typically in a datasheet? Pick all that apply.
   - A) Register map
   - B) Timing diagrams
   - C) Operating conditions
   - D) Driver source code
   - Answer: A, B, C
   - Explanation: Datasheets describe hardware (registers, timing, conditions). Driver source code is not in a datasheet.
   > Hint: What does a datasheet describe? What is the driver's job?

3. A driver polls a status bit but it never sets. The datasheet says the bit may take up to 100 clock cycles. What should the driver do?
   - A) Poll forever
   - B) Add a timeout to the poll loop
   - C) Skip the poll and assume the bit is set
   - D) Write to the register to force the bit
   - Answer: B
   - Explanation: The datasheet gives a maximum time. The driver should poll with a timeout based on that time.
   > Hint: What does the datasheet say about timing? What is the maximum wait?

4. Explain why a driver author must read the datasheet — what happens if they guess the register map?

5. A driver works on one board but not another. Both use the same chip. What is the most likely cause, and what datasheet section would you check first?

## Limits

This chapter shows a simple datasheet. Real datasheets are hundreds of pages, with errata, application notes, and reference designs. The principle — the datasheet is the contract — is the same.

## Go Deeper

- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)
- [Linux Driver API](https://docs.kernel.org/driver-api/)

## Related

Chapter 36, Chapter 38
