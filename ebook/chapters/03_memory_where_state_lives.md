# Chapter 03 — Memory: Where State Lives

> **Part I — A Computer That Can Run Code**

## Where does a variable live?

Chapter 02 separated a value from the address that selects it. Now consider a program storing the 32-bit integer `0x12345678`. Our machine addresses memory one byte at a time. A four-byte value therefore occupies four consecutive locations, not one location containing an indivisible printed number.

We will use ordinary readable and writable RAM at addresses beginning with `0x1000`. An address labels a byte even when no C variable has been assigned to it. The compiler's decisions about variables and layout determine how software uses the locations; the memory hardware does not know variable names.

## Write a value, then reconstruct it

In little-endian order, the least significant byte goes at the lowest address. "Little" refers to numerical significance, not to the smallest byte value. The bytes of `0x12345678`, from least to most significant, are `78`, `56`, `34`, and `12` in hexadecimal.

| Address | Stored byte | Contribution to a 32-bit read at `0x1000` |
| --- | --- | --- |
| `0x1000` | `0x78` | `0x78 × 1` |
| `0x1001` | `0x56` | `0x56 × 256` |
| `0x1002` | `0x34` | `0x34 × 65536` |
| `0x1003` | `0x12` | `0x12 × 16777216` |

Adding the contributions reconstructs `0x12345678`. Reading only the byte at `0x1002` instead returns `0x34`. Both observations describe the same memory. The operation specifies the starting address and the number of bytes to combine.

Big-endian interpretation of those same four bytes would produce `0x78563412`. A byte-by-byte copy preserves the stored sequence and does not by itself convert one interpretation to another. This explains why a file format or network protocol must specify order rather than merely say "a 32-bit number."

## A partial write changes a larger value

Now write `0xAA` to the single byte at `0x1001`. The sequence becomes:

```text
address   1000 1001 1002 1003
before     78   56   34   12
 after     78   AA   34   12
```

A later little-endian four-byte read at `0x1000` returns `0x1234AA78`. The byte write did not know that a larger integer overlapped it. Two pointers can refer to overlapping storage, so an operation through one may change a value later observed through the other.

This is a machine-level example. Whether a particular pair of typed C pointers may legally alias is a separate language question. We first establish what the bytes do, then respect the language's rules when expressing the operation in C.

## Width and extension are separate steps

The CPU's working registers on RV64 hold 64 bits. A one-byte read must therefore specify how to form a register-sized result. If memory contains `0xF0`, an unsigned byte read produces `0x00000000000000F0`; a signed byte read produces `0xFFFFFFFFFFFFFFF0`. Both fetched exactly one byte. The difference occurred when the CPU extended the result, using Chapter 02's rules.

Chapter 06 will name these operations `lbu` and `lb`. You do not need to decode assembly here: first determine which bytes are fetched, then combine them, then extend the result. Keeping those steps distinct prevents a sign-extension bug from being misdiagnosed as a wrong-address bug.

A four-byte read is naturally aligned when its address is a multiple of four. `0x1000` qualifies; `0x1001` does not. Alignment tells us a relationship between an address and access width. It does not alone establish whether an access succeeds: memory attributes, permissions, and the platform's handling of misaligned accesses also matter.

## Diagnose a representation mismatch

A display receives bytes `11 22 33 00`. The producer calls them a pixel with blue `11`, green `22`, red `33`. The consumer instead interprets the first byte as red. The visible color changes even though every byte arrived correctly. To fix this, compare both sides' format definitions: component positions, bytes per pixel, and row stride, the byte distance between successive rows.

"Endianness" is not a complete diagnosis. A disagreement about component order can exist independently of how a CPU loads an integer. Write out a distinctive test pixel and the expected byte sequence at each boundary. The CPU chapter next explains how an instruction asks memory these precise questions.

## Check

1. After replacing the byte at `0x1001` with `0xAA`, what does the four-byte little-endian read at `0x1000` produce?
   - A) `0x1234AA78`
   - B) `0xAA345678`
   - C) `0x7856AA12`
   - Answer: A
   - Explanation: The byte at address base + 1 supplies result bits 15:8.

2. Select all correct statements about reading `0xF0` from accessible RAM.
   - A) Signed and unsigned byte reads fetch the same stored byte.
   - B) Sign extension changes that byte in memory.
   - C) The register result can differ even when address and width match.
   - Answer: A, C
   - Explanation: Extension constructs the destination register value; it does not rewrite the source memory.

3. Starting from the original four bytes, perform a two-byte little-endian write of `0xBEEF` at `0x1002`. Show all four bytes and the new 32-bit value. Explain why changing byte order does not change the number of locations written.

4. A format defines red, green, blue, and padding as four consecutive bytes. A program stores the integer `0x00332211` on our machine. Determine the displayed components. Design a byte sequence that makes an accidental red/blue swap unmistakable.

5. Research challenge: find the execution-environment rules for misaligned loads in the RISC-V specification. Explain why "odd address" is insufficient to predict a fault for an arbitrary load. Separate a byte access, a word access, and a device access.

## Limits

All worked byte operations use ordinary RAM with valid access permissions. MMIO can have read side effects and width restrictions; virtual memory can reject an otherwise aligned access. The byte diagrams describe architectural values, not bus transaction counts or timing.

## Go Deeper

- [RISC-V loads, stores, and alignment](https://docs.riscv.org/reference/isa/unpriv/rv32.html) — examine the execution-environment qualifications on misalignment.
- [Linux unaligned memory access](https://docs.kernel.org/core-api/unaligned-memory-access.html) — compare machine layout with safe C access patterns.

## Related

- [Chapter 02 — Bits, Bytes, Numbers, and Addresses](02_bits_bytes_numbers_and_addresses.md)
- [Chapter 04 — Inside the CPU](04_inside_the_cpu.md)
