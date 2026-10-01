# Chapter 06 — Loads, Stores, and Pointers

> **Part II — Speaking RISC-V**

## Turn a pointer expression into a memory operation

You can now trace arithmetic registers and interpret stored bytes. To connect them, a load copies a value from memory into a register; a store copies low-order register bits into memory. The essential questions are the effective address, access width, byte order, and result extension.

Base integer loads and stores compute their address from a base register plus a signed immediate byte offset. In `lw x12, 4(x10)`, x10 supplies the base, 4 is the immediate, and x12 receives the loaded value. There is no offset register in that instruction. A register holding 4 elsewhere is irrelevant unless a separate instruction uses it.

## Follow a complete load, change, and store

Assume the following readable and writable RAM, little-endian order, and x10 = `0x1000`:

```text
address: 1000 1001 1002 1003 | 1004 1005 1006 1007
bytes:    00   00   00   00 |   FE   FF   FF   FF
```

Execute:

```text
lw   x12, 4(x10)
addi x12, x12, 3
sw   x12, 0(x10)
```

The load computes `0x1000 + 4 = 0x1004`, fetches four bytes, and reconstructs `0xFFFFFFFE`. On RV64, lw sign-extends that 32-bit pattern to `0xFFFFFFFFFFFFFFFE`, or -2. Adding 3 yields 1. The store writes the low 32 bits of x12 to addresses `0x1000` through `0x1003`, producing `01 00 00 00`. The source bytes at `0x1004` remain unchanged.

If we replace lw with lwu, the first result becomes positive `0x00000000FFFFFFFE`. Adding 3 produces `0x0000000100000001`. The final sw still stores `01 00 00 00`, because it discards the high 32 bits. Identical final memory does not prove identical intermediate register values.

## Choose the width deliberately

| Width | Signed load | Unsigned load on RV64 | Store |
| --- | --- | --- | --- |
| 1 byte | `lb` | `lbu` | `sb` |
| 2 bytes | `lh` | `lhu` | `sh` |
| 4 bytes | `lw` | `lwu` | `sw` |
| 8 bytes | `ld` | same full-width pattern | `sd` |

Stores do not have signed and unsigned variants because they select low-order bits without interpreting them as a mathematical sign. Width still matters: sw changes four addressed bytes even when the register contains only the value 1.

For a C array of 32-bit elements, element i begins `4*i` bytes beyond the base. A pointer increment expressed in C scales by element size; an instruction's immediate byte offset does not. To index with a variable i, compute the scaled offset in a register, add it to the base, then load from that resulting address.

```text
slli x11, x11, 2       # x11 initially holds i; now holds 4*i
add  x13, x10, x11     # x13 = base + 4*i
lw   x12, 0(x13)
```

The shift is multiplication by four for this address calculation, assuming the chosen index and arithmetic do not overflow the usable range. Array bounds are not checked by these instructions. Software must establish that the selected object and access are valid.

## An address is not evidence of permission

Seeing `0xDEADBEEF` in a register tells you neither what is mapped there nor whether a load succeeds. A word access at that address is misaligned, but its handling depends on the execution environment. Permissions, translation, and whether the target is RAM or a device also matter.

Similarly, a correct pointer does not establish a correct access width. Reading a byte-sized device register with a word load can request an operation the device does not support. Chapter 09 introduces address decoding and Chapter 10 the register contract. For ordinary RAM, the next chapter shows how branches choose which accesses occur and how many times.

## Check

1. In the worked example, what remains at `0x1004` after the store?
   - A) `01 00 00 00`
   - B) `FE FF FF FF`
   - C) The bytes are erased by the load.
   - Answer: B
   - Explanation: The store targets base + 0; reading base + 4 does not alter ordinary RAM.

2. Which can differ between lw and lwu on RV64? Select all that apply for the same valid address.
   - A) The high 32 bits of the result
   - B) A subsequent 64-bit comparison's outcome
   - C) The number of bytes requested
   - Answer: A, B
   - Explanation: Both fetch four bytes. Their extension rules can change the register value and later calculations.

3. Trace the three instructions again with source bytes `FD FF FF 7F`. Show every 64-bit register result and every destination byte. Repeat with lwu and explain whether any result changes.

4. A four-byte array begins at `0x2000`, contains 16 elements, and is indexed by an untrusted integer. Derive the address for element 15 and specify the checks needed before accessing an arbitrary index. Distinguish bounds from alignment.

5. Research challenge: verify the immediate range and encoding of lw and sw. Show an instruction sequence for accessing base + 4096 without pretending that 4096 fits directly in their immediate field.

## Limits

Examples assume ordinary accessible RAM, no concurrent modifications, and a base integer execution model. Atomic memory operations are additional instructions, so base loads and stores are not the only memory operations in the full RISC-V family. Compiler pointer and aliasing rules remain relevant to C source.

## Go Deeper

- [RV64 loads and stores](https://docs.riscv.org/reference/isa/unpriv/rv64.html) — verify lw, lwu, and full-width behavior.
- [Base integer instruction formats](https://docs.riscv.org/reference/isa/unpriv/rv32.html) — compare load and store immediate layouts.

## Related

- [Chapter 05 — Instructions and the RISC-V ISA](05_instructions_and_the_risc_v_isa.md)
- [Chapter 07 — Branches, Jumps, and Control Flow](07_branches_jumps_and_control_flow.md)
