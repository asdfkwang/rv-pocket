# Chapter 02 — Bits, Bytes, Numbers, and Addresses

> **Part I — A Computer That Can Run Code**

## One pattern, several meanings

Chapter 01 followed the byte `0x41`. This chapter explains how the same stored bits can represent a number, character, set of flags, or address. You should be able to compute each interpretation and identify which interpretation an operation requires.

A bit has two values, 0 and 1. A byte contains eight bits. For an unsigned byte, bit 0 has weight 1, bit 1 weight 2, and bit 7 weight 128. Number bits from the right, starting at zero. Consequently `01000001` represents `64 + 1 = 65`. ASCII associates that value with `A`; the bits do not carry the label "character."

Hexadecimal abbreviates the same pattern. Each digit represents four bits, so `0x41` separates into `0100` and `0001`. Its numeric value is `4 × 16 + 1`. The prefix `0x` specifies notation; it is not part of the stored value. Decimal `65`, hexadecimal `0x41`, and binary `0b01000001` describe the same unsigned integer.

## Width changes the question

Eight bits have 256 patterns. Unsigned interpretation assigns them 0 through 255. Two's-complement signed interpretation instead assigns patterns whose top bit is 1 to negative values: subtract 256 from the unsigned interpretation. Thus `0xF0` means either 240 or `240 - 256 = -16`.

The width is essential. As a 16-bit pattern, `0x00F0` means positive 240. To preserve negative 16 when widening an 8-bit signed value, repeat its sign bit into the new positions, obtaining `0xFFF0`. Zero extension fills the new positions with zero and preserves the unsigned value instead.

For an n-bit signed value with the top bit set, the general rule is `unsigned_value - 2^n`. Inverting all bits within that width and adding one computes the magnitude of a negative number. Neither rule requires a special physical "negative bit" separate from the stored pattern.

```text
8-bit pattern   unsigned   signed   widened to 16 bits preserving signed value
01111111          127       127      007F
10000000          128      -128      FF80
11110000          240       -16      FFF0
```

Arithmetic has a width too. Keeping only eight result bits makes `255 + 1` become zero. That hardware fact does not make every overflowing C expression valid: unsigned C arithmetic wraps, while signed overflow has different language rules. Keep the language contract separate from the chosen machine operation.

## Flags ask about positions, not whole numbers

Suppose a status byte is `0xA5 = 10100101`. We want to clear bit 2 while preserving everything else. A mask has ones where an operation should keep or select bits.

```text
value       10100101   A5
keep mask   11111011   FB
AND result  10100001   A1
```

AND (`&`) gives 1 only where both input bits are 1. OR (`|`) gives 1 where either is 1. XOR (`^`) gives 1 where the bits differ. Therefore OR with `0x04` sets bit 2, AND with `0xFB` clears it in an eight-bit value, and XOR with `0x04` toggles it. Toggling twice restores the original value; clearing twice leaves it cleared.

To test whether bit 2 is set, use `(value & 0x04) != 0`. Testing `value == 0x04` instead asks whether bit 2 is the *only* set bit. At `0xA5` the first test succeeds and the second fails. The distinction will matter when several hardware events share one status register.

## Addresses are numbers used to select locations

An address identifies a location; the value stored there is a separate number. Suppose a device occupies a range beginning at `0x10000000`. Its documentation places STATUS four bytes from the beginning. Then its address is `0x10000000 + 0x04 = 0x10000004`. The value read from that address could be `0xA5`; adding four to the address does not add four to the value.

An offset is measured in units specified by the interface. These device offsets are bytes. In C, adding one to a `uint32_t *` advances by one element, normally four bytes, whereas adding one to a byte pointer advances one byte. Later we will translate these operations into instruction-level byte offsets.

We now have enough notation to inspect memory without treating a printed hexadecimal number as self-explanatory. Chapter 03 adds the missing question: which bytes belong to one value, and in what order?

## Check

1. Which operation clears bit 2 in an eight-bit value even when it was already zero?
   - A) XOR with `0x04`
   - B) AND with `0xFB`
   - C) OR with `0x04`
   - Answer: B
   - Explanation: AND forces that position to zero and preserves the other seven. XOR toggles and OR sets.

2. For the eight-bit pattern `0xF0`, select all correct statements.
   - A) Its unsigned value is 240.
   - B) Its signed value is -16.
   - C) Signed widening to 16 bits produces `0x00F0`.
   - Answer: A, B
   - Explanation: Preserving the signed value requires `0xFFF0`; zero extension preserves 240.

3. Interpret `0x80000005` as both an unsigned and signed 32-bit integer. Then widen each interpretation to 64 bits without changing its value. Show the two resulting patterns.
   > Hint: The signed result is the unsigned result minus `2^32`.

4. A configuration byte contains a three-bit field in bits 6:4. Derive an expression that replaces that field with 5 while preserving every other bit. Demonstrate why merely OR-ing in `5 << 4` fails for at least one starting value.

5. Research challenge: a device-tree parent specifies two address cells and two size cells. Consult the Devicetree specification and decode `reg = <0x0 0x10000000 0x0 0x1000>`. Give the half-open address interval and explain which additional parent information can affect address translation.

## Limits

These bitwise examples operate on explicitly sized unsigned values. C promotions and signed shifts require their own language rules. Device registers may attach actions to writes, so a bit manipulation valid for RAM is not automatically a valid register update; Chapter 10 develops that distinction.

## Go Deeper

- [Devicetree Specification: basic types and standard properties](https://devicetree-specification.readthedocs.io/en/stable/devicetree-basics.html) — inspect cells, `reg`, and `ranges` for the research problem.
- [RISC-V integer instructions](https://docs.riscv.org/reference/isa/unpriv/rv32.html) — compare fixed-width logical operations with the notation used here.

## Related

- [Chapter 01 — The Computer as a System](01_the_computer_as_a_system.md)
- [Chapter 03 — Memory: Where State Lives](03_memory_where_state_lives.md)
