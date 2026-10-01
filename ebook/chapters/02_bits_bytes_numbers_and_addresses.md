# Chapter 02 — Bits, Bytes, Numbers, and Addresses

> **Part I — A Computer That Can Run Code**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The same bit pattern can be interpreted differently as a number, an address, a character, or a bit field. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

The same bit pattern can be interpreted differently as a number, an address, a character, or a bit field.

Hex expresses 4 bits per digit, which makes registers and addresses easy to read. Signed/unsigned interpretation and address arithmetic are the basic tools for every chapter that follows.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
0b01000001 = 0x41 = 65 = 'A'
base 0x1000 + offset 0x34 = 0x1034
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

Address and data bits flow over the bus, and the address width determines the addressable space.

### In RISC-V

RV64 registers are 64 bits wide, and loads/stores distinguish byte, halfword, word, and doubleword sizes.

### Why the OS Cares

The OS manages virtual addresses and physical addresses as numbers with different meanings.

### In Linux / Driver

In Linux drivers, register masks, resource addresses, and IRQ numbers are frequently expressed with hex and bit masks.

## Trace It

1. **Hardware:** Address and data bits flow over the bus, and the address width determines the addressable space.
2. **RISC-V:** RV64 registers are 64 bits wide, and loads/stores distinguish byte, halfword, word, and doubleword sizes.
3. **OS:** The OS manages virtual addresses and physical addresses as numbers with different meanings.
4. **Linux / Driver:** In Linux drivers, register masks, resource addresses, and IRQ numbers are frequently expressed with hex and bit masks.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Compute 0x80000005 both as a 32-bit unsigned value and as a signed two's complement value.
2. Compute the new hex value after clearing only bit 2 of 0xA5, and show your steps.
3. Look up address-cells/size-cells and explain how the DT cells 0x0 0x10000000 0x0 0x1000 are interpreted.
4. Find one rule or API directly related to **Bits, Bytes, Numbers, and Addresses** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- The same bit pattern can be interpreted differently as a number, an address, a character, or a bit field.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 01, Chapter 03
