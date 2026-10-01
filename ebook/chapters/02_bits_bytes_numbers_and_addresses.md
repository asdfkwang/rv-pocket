# Chapter 02 — Bits, Bytes, Numbers, and Addresses

> **Part I — A Computer That Can Run Code**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

`0x41` can be the number 65, the letter `A`, a memory address, or "bit 6 and bit 0 set." The bits never change — only what you claim they mean. Half of all driver debugging is arguing about meaning: is this value a number, an address, or a set of flags?

## Core Idea

A bit pattern has no type. Meaning comes from context: the instruction that reads it, the register that holds it, the manual that defines it. Hexadecimal exists for one reason: each hex digit is exactly 4 bits, so `0x...` lets you see the bits.

Two tools for this chapter: **two's complement** (how negative numbers are stored: flip all bits, add one) and **address arithmetic** (base + offset = location).

## Worked Example

One byte, four readings of `0b01000001`:

```text
as unsigned number: 64 + 1 = 65
as signed number:   still 65 (top bit is 0, so positive)
as character:       'A'
as flags:           bit 6 set, bit 0 set
```

And one address calculation:

```text
UART base 0x10000000 + DATA offset 0x00 = 0x10000000
UART base 0x10000000 + STATUS offset 0x04 = 0x10000004
```

Same addition you learned in school. The only new part is what lives at the result.

## The Same Idea Elsewhere

- **Hardware:** address and data bits share the bus; the width of the address (32 vs 64 bits) decides how much memory can ever be named.
- **RISC-V:** RV64 registers hold 64 bits; load/store instructions name the size they move (byte, halfword, word, doubleword).
- **OS:** the OS juggles two meanings of "address" at once — the virtual address a program sees and the physical address the bus uses (full story in Chapter 20).
- **Linux/driver:** register masks (`0x... & 0x04`), resource addresses, and IRQ numbers in drivers are all hex bit patterns with documented meanings.

## When It Fails

A driver checks "is bit 2 set?" with `value & 0x04` and it works for months — until a refactor changes the check to `value & 4`, still fine, then to `value == 4`, which breaks whenever any other bit is also set. The bug is not the operator. The bug is forgetting that a flag is one bit inside a pattern, not the whole number.

## Check

1. What is `0x41` as an unsigned 8-bit number?
   - A) 65
   - B) 41
   - C) 81
   - D) -65
   - Answer: A
   - Explanation: `0x41` = 4×16 + 1 = 65. B reads hex digits as decimal, C doubles wrong, D confuses the value with a signed reading (top bit is 0, so it is positive anyway).
   > Hint: Multiply each digit by its place: 16s and 1s.

2. `0xA5` is `0b10100101`. Which statements about clearing only bit 2 are true? Pick all that apply.
   - A) `0xA5 & 0xFB` clears exactly bit 2
   - B) The result is `0xA1`
   - C) `0xA5 ^ 0x04` always clears bit 2
   - D) After the operation, bit 7 and bit 5 are still set
   - Answer: A, B, D
   - Explanation: `0xFB` is `11111011`, so AND keeps everything except bit 2: `10100001` = `0xA1`. XOR *toggles* — it clears bit 2 only if it was set, so C is not "always." Bits 7 and 5 were set and no operation touches them.
   > Hint: Write both numbers in binary, stacked. AND keeps 1s where the mask has 1s.

3. A UART lives at base `0x10000000` and its DATA register is at offset `0x00`, STATUS at `0x04`. What address do you read for STATUS?
   - A) `0x10000004`
   - B) `0x10000040`
   - C) `0x10000000`
   - D) `0x14000000`
   - Answer: A
   - Explanation: Base + offset, plain addition: `0x10000000 + 0x04 = 0x10000004`. The other options shift digits or drop the offset.
   > Hint: It is ordinary addition. Line the digits up.

4. Read `0x80000005` as a 32-bit value two ways: unsigned, and signed two's complement. Show both results and where they differ.
   - Answer: open
   > Hint: Unsigned first (powers of 16), then flip-and-add-one for the signed reading.

5. A device tree says a device has cells `0x0 0x10000000 0x0 0x1000`. Look up `address-cells`/`size-cells` and explain what address range this describes — and what breaks if software treats the whole line as one flat number.

## Limits

This chapter treats hex as pure notation. Real manuals mix hex with named bit fields, shifted values, and write-1-to-clear semantics where "set bit 2" means writing a 1 to clear, not to set. Always read the field description, not just the address.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)

## Related

Chapter 01, Chapter 03
