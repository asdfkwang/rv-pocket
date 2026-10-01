# Chapter 06 — Loads, Stores, and Pointers

> **Part II — Speaking RISC-V**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Every variable access is a load or store: read a value from memory into a register, or write a register back. Pointers are just addresses held in registers. When a program reads the wrong bytes, the bug is almost always here — wrong size, wrong offset, or a pointer that was never valid.

## Core Idea

A load reads memory at an address into a register; a store writes a register to memory. The address comes from a base register plus an immediate offset. The instruction name says how many bytes move: `lb` (byte), `lh` (halfword), `lw` (word), `ld` (doubleword) — and `sb`, `sh`, `sw`, `sd` for stores.

## Worked Example

```text
x10 = 0x1000          (base address)
x11 = 4               (offset)
lw x12, 4(x10)        → reads 4 bytes at 0x1004 into x12
sw x12, 8(x10)        → writes x12 to 0x1008
```

The address is computed first (base + offset), then the memory operation happens. The offset is a constant baked into the instruction; the base is whatever the register holds at runtime.

## The Same Idea Elsewhere

- **Hardware:** the memory subsystem serves the computed address; caches may hold a copy (Chapter 19).
- **RISC-V:** load/store instructions are the only way to touch memory — arithmetic works on registers only.
- **OS:** the OS decides which addresses a process may access; a bad pointer faults before hardware ever sees it (Chapter 20).
- **Linux/driver:** `__iomem` pointers use special accessors (`readl`/`writel`) instead of plain loads/stores, because device registers are not normal memory.

## When It Fails

A driver reads a 32-bit status register with `readl` but the hardware is big-endian while the CPU is little-endian. The value arrives byte-swapped and every bit test fails. The pointer was fine; the width and byte order were not. Always check the register width and the platform's byte order before writing bit tests.

## Check

1. `x10 = 0x2000`. What address does `lw x12, 0x10(x10)` read from?
   - A) `0x2010`
   - B) `0x2000`
   - C) `0x2100`
   - D) `0x30`
   - Answer: A
   - Explanation: Base + offset: `0x2000 + 0x10 = 0x2010`. The offset is added to the base register, not used alone.
   > Hint: The address is computed before the read. What two numbers get added?

2. Which of these move exactly 4 bytes? Pick all that apply.
   - A) `lw`
   - B) `lb`
   - C) `sw`
   - D) `ld`
   - Answer: A, C
   - Explanation: `lw`/`sw` are word (4-byte) operations. `lb` moves one byte; `ld` moves 8 bytes on RV64.
   > Hint: l=load, s=store; the letter after is the width: b=byte, h=halfword, w=word, d=doubleword.

3. A pointer in `x10` holds `0xDEADBEEF`. What happens when the CPU executes `lw x12, 0(x10)`?
   - A) It reads 4 bytes from address `0xDEADBEEF`
   - B) It writes `0xDEADBEEF` to memory
   - C) It adds `0xDEADBEEF` to `x12`
   - D) It traps immediately because the address is invalid
   - Answer: A
   - Explanation: A pointer is just an address in a register. `lw` reads from that address. Whether the address is valid is a separate question (the OS may fault later), but the instruction's intent is a read.
   > Hint: What does `lw` do with the address in its base register?

4. Look up the RISC-V load/store encoding and explain why the offset is a 12-bit signed immediate — what range of offsets can a single instruction reach, and how do you access something farther away?

5. A struct has fields at offsets 0, 4, and 8. A driver reads offset 0 with `readl` and gets the right value, but offset 4 always reads as 0 even though the register exists. List the two most likely causes and the one read that distinguishes them.

## Limits

This chapter assumes aligned access. RISC-V allows unaligned loads/stores in many configurations, but device registers often do not — an unaligned access to MMIO can trap or return garbage. Compressed instructions (2-byte) also change instruction sizes, which matters for PC arithmetic in Chapter 07.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)

## Related

Chapter 05, Chapter 07
