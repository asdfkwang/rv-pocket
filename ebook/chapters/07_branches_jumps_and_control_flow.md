# Chapter 07 — Branches, Jumps, and Control Flow

> **Part II — Speaking RISC-V**

## How does a loop become repeated instructions?

Chapter 06 explained the effects of one memory operation. A program also needs to decide which operation happens next. A conditional branch compares registers and selects either its target or the sequential instruction. A jump selects a target unconditionally; a linking jump also records where a caller can resume.

Use the PC as another trace column. Labels such as `loop` name instruction addresses for the assembler. The processor receives an encoded displacement or register-based address, not the label's text.

## Sum three elements, one iteration at a time

Assume three 32-bit integers 3, 4, and 5 at `0x1000`, `0x1004`, and `0x1008`. All instructions shown are four bytes. Registers begin with x10 = `0x1000`, x11 = 3, and x12 = 0.

```text
8000: beq  x11, x0, done
8004: lw   x13, 0(x10)       # loop
8008: add  x12, x12, x13
800C: addi x10, x10, 4
8010: addi x11, x11, -1
8014: bne  x11, x0, loop
8018: ...                    # done
```

The initial beq skips the loop when the count is zero. At the bottom, bne returns to `0x8004` only if the remaining count is nonzero.

| After bottom branch | Loaded value | Sum x12 | Next address x10 | Count x11 | Next PC |
| --- | --- | --- | --- | --- | --- |
| first iteration | 3 | 3 | `0x1004` | 2 | `0x8004` |
| second iteration | 4 | 7 | `0x1008` | 1 | `0x8004` |
| third iteration | 5 | 12 | `0x100C` | 0 | `0x8018` |

x10 ends one element beyond the array, but that address is never loaded. Computing an address and accessing it are distinct events. If the initial zero-count check were absent, a zero-length input would still execute the body once and decrement zero to an enormous unsigned count. The entry condition establishes whether the loop's first access is valid.

## A branch chooses an interpretation too

`beq` and `bne` compare bit patterns for equality. Ordered comparisons need a signedness choice: `blt` compares signed integers, whereas `bltu` compares unsigned integers. On RV64 the pattern of all ones is less than zero when interpreted as -1, but greater than zero when interpreted as the largest unsigned value.

Choosing the wrong branch can therefore break a loop even when arithmetic and memory accesses individually work. Identify the invariant, a fact maintained across iterations. Here, after k completed iterations, the pointer is `base + 4*k`, the count is `3-k`, and the sum contains the first k values. The table is evidence that these facts hold for the example; the instruction effects explain why they continue to hold.

## Calls need a route back

`jal ra, target` writes the sequential return address into ra and transfers to target. ra is the ABI name of x1. A four-byte jal at `0x9000` therefore records `0x9004`. `jalr x0, 0(ra)` jumps through ra without retaining another link; the architecture clears the target's least significant bit. The usual `ret` pseudoinstruction expresses this return.

A jump does not create a protected history of calls. A second call writing ra replaces the first return address. That is the problem Chapter 08 will solve with a stack.

Control flow also determines cleanup. If an allocation fails, a jump to a cleanup label is correct only if that label releases resources actually acquired on the path taken. Drawing the executed path and listing live resources is the same method as tracing pointer and count in this loop.

## Check

1. At `0x8014`, x11 is zero. What is the next PC?
   - A) `0x8004`
   - B) `0x8018`
   - C) `0x8014`
   - Answer: B
   - Explanation: The bne condition is false, so this four-byte instruction falls through.

2. Which statements hold for the three-element trace? Select all that apply.
   - A) The last loaded address is `0x1008`.
   - B) x10 finishes at `0x100C`.
   - C) Reaching x10 = `0x100C` means that location was read.
   - Answer: A, B
   - Explanation: The pointer advances after each load, including the last, but the final branch prevents another load.

3. Trace an initial count of zero with and without the entry beq. Identify the first invalid assumption in the version without the guard, rather than waiting for an eventual crash.

4. Choose register values for which blt and bltu select different paths. Explain both interpretations using a fixed width and derive the branch outcomes.

5. Research challenge: find the branch displacement range and alignment in the ISA. Explain what an assembler or compiler can do when a conditional target is beyond that range, and account for both the taken and untaken paths of your replacement sequence.

## Limits

The example omits compressed encodings and assumes valid bounded input. Timing and branch prediction do not change the specified register/PC trace. Calling and cleanup conventions are software responsibilities, which the next chapter makes explicit.

## Go Deeper

- [RISC-V control-transfer instructions](https://docs.riscv.org/reference/isa/unpriv/rv32.html) — verify branch, jal, and jalr semantics.
- [RISC-V psABI](https://riscv-non-isa.github.io/riscv-elf-psabi-doc/) — distinguish ISA register numbers from their calling-convention names.

## Related

- [Chapter 06 — Loads, Stores, and Pointers](06_loads_stores_and_pointers.md)
- [Chapter 08 — Functions, ABI, and the Stack](08_functions_abi_and_the_stack.md)
