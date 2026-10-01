# Chapter 03 — Memory: Where State Lives

> **Part I — A Computer That Can Run Code**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Every variable, every pixel, every queued byte sits at some address as some bytes. When a screen shows wrong colors or a driver reads garbage, the bytes are almost always fine — they are just being read with the wrong size, order, or address.

## Core Idea

Memory is a row of bytes, each with its own address. Loads and stores move bytes between memory and registers. Three things decide what value you actually get: **which address**, **how many bytes** (width), and **in which order** (endianness: little-endian stores the small end first).

## Worked Example

Four bytes in memory:

```text
0x1000: 0x78   0x1001: 0x56   0x1002: 0x34   0x1003: 0x12
```

Read them back different ways (little-endian machine):

```text
lbu @0x1002        → 0x34            (one byte, zero-extended)
lw  @0x1000        → 0x12345678     (four bytes, small end first)
lb  @0x1000        → 0x78            (0x78 is positive, sign bit 0)
```

Same four bytes, three different answers — all correct, because each read asked a different question.

## The Same Idea Elsewhere

- **Hardware:** the memory controller serves physical bytes; caches (Chapter 19) may serve an older copy of them.
- **RISC-V:** `lb/lbu/lh/lhu/lw/lwu/ld` name the width; the `u` versions zero-extend, the plain ones sign-extend.
- **OS:** the OS hands out memory in page-sized chunks and builds each process its own address space (Chapter 20).
- **Linux/driver:** kernel pointers, userspace pointers, DMA addresses, and `__iomem` pointers all *look* like addresses but must never be mixed — each may only be used with its own access functions.

## When It Fails

A framebuffer shows red and blue swapped. The bytes in RAM are exactly what the artist drew. The bug: software writes pixels as `0xRRGGBB` but the display reads little-endian words, so the first byte on screen is `BB`, not `RR`. Nobody corrupted anything — writer and reader disagreed about order.

## Check

1. Memory holds `0x1000: 78 56 34 12` (little-endian). What does `lw @0x1000` return?
   - A) `0x12345678`
   - B) `0x78563412`
   - C) `0x78`
   - D) `0x12`
   - Answer: A
   - Explanation: Little-endian puts the small end first: byte 0x78 is the lowest 8 bits, so the word reads `0x12345678`. B is the big-endian reading; C and D read single bytes.
   > Hint: The byte at the lowest address becomes the lowest digits of the word.

2. About the same four bytes, which statements are true? Pick all that apply.
   - A) `lbu @0x1002` returns `0x34`
   - B) `lb @0x1000` returns `0x78`
   - C) `0x1001` is an odd address, so a word read starting there is unaligned
   - D) Reading one byte at a time and combining them by hand always gives the same result as `lw`, regardless of endianness
   - Answer: A, B, C
   - Explanation: A reads the single byte `0x34`. B: `0x78` has sign bit 0, so sign-extension leaves `0x78`. C is a plain fact about the address (`0x1001` is odd). D is false — hand-combining must follow the machine's byte order, or it reconstructs the wrong word.
   > Hint: For D, try it: does "first byte read × 16777216" assume big end or little end?

3. Byte `0xF0` is read once with `lb` and once with `lbu` on RV64. What comes back each time?
   - A) `lb` → `0xFFFFFFFFFFFFFFF0`, `lbu` → `0xF0`
   - B) `lb` → `0xF0`, `lbu` → `0xF0`
   - C) `lb` → `0x10`, `lbu` → `0xF0`
   - D) Both trap on a negative byte
   - Answer: A
   - Explanation: `0xF0` has its top bit set, so it is negative as a signed byte (−16). `lb` sign-extends the 1-bits all the way up; `lbu` pads with zeros. No trap — reading a byte is always legal.
   > Hint: Top bit 1 means negative. Sign extension copies that 1 leftwards, all the way.

4. Look up the Linux Device I/O documentation and explain in your own words why an `__iomem` pointer must never be dereferenced like normal RAM — what could actually go wrong on real hardware?

5. A test pattern of red-green-blue squares shows up blue-green-red. The RAM contents match the artist's file byte for byte. Write down the two most likely causes and, for each, the single read that would confirm or kill it.

## Limits

This chapter pretends every address behaves like RAM. Device registers can have side effects on read (clear-on-read status bits), and some addresses forbid some widths. Caches add a second copy of the truth (Chapter 19), and virtual memory renames every address (Chapter 20).

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux Memory Management](https://docs.kernel.org/mm/)

## Related

Chapter 02, Chapter 04
