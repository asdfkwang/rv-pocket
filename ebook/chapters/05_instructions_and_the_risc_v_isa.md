# Chapter 05 — Instructions and the RISC-V ISA

> **Part II — Speaking RISC-V**

## What makes a binary executable on a CPU?

Chapter 04 treated instructions as state transitions. An instruction set architecture, or ISA, specifies those transitions: which bit patterns are instructions, how operands are selected, and which results or exceptions follow. Assembly gives readable names to those encodings. The CPU executes the encoded bytes, not the source text or comments.

RISC-V is a family of related instruction sets. RV32I and RV64I are different base integer ISAs; RV64 is not mandatory for every RISC-V processor. This book uses RV64I for its basic examples. Optional extensions add capabilities, such as integer multiplication with M and compressed instructions with C. A binary's requirements must match what the execution environment supports.

Matching the ISA is necessary but not sufficient for an entire application to run. It may also require an ABI, operating-system services, libraries, and suitable hardware. A bare-metal program that writes a board-specific device address is not made portable merely by using base instructions.

## From an encoding to a result

Consider `addi x5, x0, 10`. `addi` adds a signed constant encoded in the instruction to a register. The destination is x5, the source x0, and the immediate constant is 10. In the base encoding it occupies four bytes and has this field layout:

```text
 immediate    source  funct3 destination opcode
000000001010   00000    000     00101    0010011
      10         x0              x5

instruction word: 0x00A00293
little-endian bytes: 93 02 A0 00
```

The layout tells the decoder where to find each field. The rule associated with the opcode and function field tells it to add, then write the result. Because x0 reads zero, the result is 10. The bytes in instruction memory do not change when the instruction runs.

Now execute three instructions:

```text
8000: addi x5, x0, 10     x5 = 10; next PC = 8004
8004: addi x6, x0, 20     x6 = 20; next PC = 8008
8008: add  x7, x5, x6     x7 = 30; next PC = 800C
```

`add` gets both inputs from registers; `addi` gets one from an instruction field. This distinction explains why an immediate has a range limit while register arithmetic can produce much larger results. The addi immediate is a signed 12-bit value, from -2048 through 2047. A register containing 2047 plus immediate 1 produces 2048 without violating that encoding limit.

## Width, extensions, and promises

On RV64, `addi x5, x0, -1` produces the 64-bit pattern `0xFFFFFFFFFFFFFFFF`. The immediate is sign-extended before addition. Integer additions retain the register-width result; base integer add instructions do not trap simply because the mathematical sum overflows that width.

If a binary uses an unsupported encoding, the execution environment may raise an illegal-instruction exception or provide emulation. A `mul` instruction requires multiplication support, which may come from M or the multiplication-only Zmmul extension. "No M" alone is therefore insufficient evidence that mul is unsupported. State the precise instruction requirements rather than guessing from one missing extension name.

Two conforming cores need not take the same number of cycles. For a deterministic sequence with the same initial state, supported instructions, and no external interference, the specified arithmetic results must agree. Timing, counters, device inputs, and concurrent memory activity require additional assumptions.

## Read assembly without confusing its conveniences

Assemblers offer pseudoinstructions that expand into real instructions. `li` means load an immediate, but loading an arbitrary 64-bit constant may require several instructions. `ret` commonly expands to a jump through the return-address register. A source listing therefore does not always reveal instruction count or byte length.

When debugging a binary, inspect its disassembly and the selected architecture options. Record which instructions actually appear, whether compressed encodings are used, and which execution environment supplies services. Chapter 06 uses the same distinction between notation and semantics to follow memory accesses.

## Check

1. With x6 = 2047, what happens after `addi x6, x6, 1` on RV64?
   - A) x6 becomes 2048.
   - B) The immediate is out of range.
   - C) Integer overflow necessarily traps.
   - Answer: A
   - Explanation: The encoded immediate is 1; the register result is not limited to a signed 12-bit value.

2. Which claims are justified? Select all that apply.
   - A) Identical ISA support guarantees identical execution time.
   - B) A board-specific device address is outside the base integer ISA contract.
   - C) A pseudoinstruction can expand to multiple instructions.
   - Answer: B, C
   - Explanation: The ISA specifies behavior, while timing, platform devices, and assembler expansions are separate questions.

3. Starting from `0x00A00293`, identify the destination field and change only it to select x6. Show the new word and its little-endian byte sequence.

4. Design a compatibility checklist for a binary using RV64 integer instructions, mul, compressed instructions, and Linux system calls. Explain why checking only the processor's XLEN is insufficient.

5. Research challenge: find the specification's result for signed integer division by zero when the relevant division extension is present. Contrast it with an unsupported divide instruction. Explain why a high-level language's division error does not by itself tell you the hardware trap cause.

## Limits

The example illustrates one base instruction format, not every encoding. Privilege, ABI, and device contracts appear separately later. We use four-byte instructions in hand traces unless a compressed instruction is explicitly identified.

## Go Deeper

- [RISC-V base integer instruction formats](https://docs.riscv.org/reference/isa/unpriv/rv32.html) — verify the addi fields and immediate interpretation.
- [RISC-V multiplication and division](https://docs.riscv.org/reference/isa/unpriv/m-st-ext.html) — compare M, Zmmul, and division corner cases.

## Related

- [Chapter 04 — Inside the CPU](04_inside_the_cpu.md)
- [Chapter 06 — Loads, Stores, and Pointers](06_loads_stores_and_pointers.md)
