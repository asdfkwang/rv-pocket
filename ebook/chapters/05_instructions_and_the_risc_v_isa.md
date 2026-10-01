# Chapter 05 — Instructions and the RISC-V ISA

> **Part II — Speaking RISC-V**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The same C program compiled for a laptop and for a RISC-V board produces completely different binaries — yet the RISC-V binary runs identically on a tiny microcontroller core and a big out-of-order core. That portability is not luck; it is the ISA contract at work. When a program crashes with "illegal instruction" on one board but runs fine on another, that contract is exactly what broke.

## Core Idea

An **ISA** (instruction set architecture) is a contract between software and hardware: it names the instructions and registers and fixes the exact result each instruction must produce. Any CPU claiming the name must produce the same register and memory results for the same binary, no matter how different its insides (pipeline depth, caches, speed).

RISC-V splits the contract into a small mandatory **base** (RV64I: 64-bit integer instructions every member implements) plus optional **extension** letters — M for multiply/divide, C for 2-byte compressed instructions, and others. Software must know which letters its CPU speaks.

## Worked Example

Start state: `x5 = 0`, `x6 = 0`, `PC = 0x8000`. (`x0` always reads as zero, Chapter 04.)

```text
0x8000: addi x5, x0, 10    → x5 = 0 + 10 = 10, PC = 0x8004
0x8004: addi x6, x0, 20    → x6 = 0 + 20 = 20, PC = 0x8008
0x8008: add x7, x5, x6     → x7 = 10 + 20 = 30, PC = 0x800C
```

Track it: `addi` adds a constant baked into the instruction to a register. The first two instructions manufacture 10 and 20 out of nothing but `x0`. The third combines two registers into a third. Every instruction here is 4 bytes long, so the PC marches by 4.

## The Same Idea Elsewhere

- **Hardware:** the decoder turns each 32-bit pattern into control signals, and two cores may decode the same bits with wildly different circuits yet commit identical register results.
- **RISC-V:** RV64I is mandatory while letters like M and C are optional — portable code either avoids them or checks the core speaks them.
- **OS:** the kernel executes the same base instructions but also uses extra privileged instructions and runs with memory mapped differently (the full story in Chapters 14 and 20).
- **Linux/driver:** `-march` tells the compiler which extension letters it may emit, so a binary built for `rv64gc` can trap with illegal-instruction on a core that only speaks `rv64i`.

## When It Fails

A program using multiplication runs on the lab board but dies with "illegal instruction" on a smaller core. The tempting fix is to blame the toolchain and rebuild things at random — but the binary is fine; it speaks letter M and the small core never learned it. Match `-march` to the weakest core you ship on, or avoid the extension.

## Check

1. On RV64, the CPU runs `addi x5, x0, -1`. What does `x5` hold afterwards?
   - A) `0x0000000000000001`
   - B) `0xFFFFFFFFFFFFFFFF`
   - C) `0x00000000FFFFFFFF`
   - D) `0`, because adding to `x0` poisons the result
   - Answer: B
   - Explanation: The 12-bit immediate `-1` is sign-extended to 64 one-bits (two's complement, Chapter 02), and `x0` contributes 0. C is the 32-bit truncation; D misunderstands `x0`, which reads as zero but never corrupts the sum.
   > Hint: How wide is a register on RV64, and what does sign extension do to twelve 1-bits?

2. Two very different RV64I CPUs — one simple, one wide and out-of-order — run the same binary to completion with no traps. Which of these must match? Pick all that apply.
   - A) The final values in the `x` registers
   - B) The final bytes the program stored to memory
   - C) The number of clock cycles the run took
   - D) The contents of each core's caches
   - Answer: A, B
   - Explanation: The ISA contract fixes architectural results — registers and memory (A, B). Timing and microarchitectural state like caches are deliberately outside the contract, so C and D may differ freely.
   > Hint: Which of these could a program itself observe without a stopwatch or a probe?

3. A binary containing `mul` runs on a CPU built without the M extension. What happens?
   - A) The CPU computes the product anyway, just more slowly
   - B) The CPU raises an illegal-instruction trap
   - C) `x7` keeps its old value and execution continues silently
   - D) The assembler rewrites `mul` into shifts and adds at run time
   - Answer: B
   - Explanation: With no M circuits the decoder cannot honor the contract for that bit pattern, so the CPU takes the defined escape hatch: a forced jump to a handler (a trap, Chapter 13). A is wishful thinking, C would silently corrupt results, and D confuses build time with run time — nothing rewrites already-built machine code.
   > Hint: What is the one legal thing hardware can do with a bit pattern it does not implement?

4. A CPU with the C extension executes a 2-byte instruction at `0x8000` and falls through. What does the PC hold next?
   - A) `0x8002`
   - B) `0x8004`
   - C) `0x8000`
   - D) `0x8001`
   - Answer: A
   - Explanation: The PC advances by the length of the instruction that just ran. Chapter 04's "+4" assumed 4-byte instructions; a 2-byte instruction at `0x8000` ends at `0x8002`. D is never a code address — instructions stay 2-byte aligned.
   > Hint: PC + 4 is the common case, not the rule. How long was this instruction?

5. Open the RISC-V unprivileged ISA specification: what is the numeric range of an `addi` immediate, and why can `addi x6, x6, 1` still produce 2048 when `x6` already holds 2047? Show both instructions' arithmetic.

## Limits

This chapter treats each ISA letter as all-or-nothing. Real cores implement extensions with version skew, immediates have fixed bit widths with sign rules, and the privileged architecture adds instructions user code never sees (Chapters 13–14). The specification in Go Deeper is the final word.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [RISC-V psABI](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)

## Related

Chapter 04, Chapter 06
