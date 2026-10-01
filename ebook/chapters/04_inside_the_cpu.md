# Chapter 04 — Inside the CPU

> **Part I — A Computer That Can Run Code**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Everything a computer does is some register changing, then the next instruction running. If you can say "which register holds what, and where does the PC go next," you can follow any program — including into interrupt handlers, context switches, and crashes (Chapters 12–13).

## Core Idea

The CPU's visible state is small: 32 general registers (`x0`–`x31`) plus the program counter (`PC`), which holds the address of the current instruction. Each instruction reads some state, writes some state, and normally moves the PC to the next instruction. Two special rules: `x0` always reads as zero no matter what you write, and the PC goes somewhere else only when an instruction (branch, jump) or an event (trap) says so.

## Worked Example

Start state: `x5 = 10`, `x6 = 20`, `PC = 0x8000`.

```text
add x7, x5, x6     → x7 = 30, PC = 0x8004
add x0, x5, x6     → x0 = 0 (still!), PC = 0x8008
```

Track it: the first instruction reads two registers and writes a third. The second computes 30 and throws it away — `x0` discards every write. The PC marches by 4 each time because these instructions are 4 bytes long and neither one jumps.

## The Same Idea Elsewhere

- **Hardware:** a register file, an ALU, and fetch logic implement exactly this state machine in silicon.
- **RISC-V:** `x0`–`x31`, the PC, and fetch-decode-execute are the whole contract software relies on; everything else is implementation detail.
- **OS:** a context switch is just saving this state (registers + PC) for one task and loading another's — the trick behind processes (Chapter 16).
- **Linux/driver:** trap entry code is where an event (interrupt, fault, system call in Chapter 13) freezes this state so C code can inspect it.

## When It Fails

A loop counter in `x7` mysteriously resets to 30 every iteration. The loop body calls a helper that also uses `x7` as a scratch register and never restores it. Both sides are "correct" alone — the bug is two owners sharing one register with no agreement. Calling conventions (Chapter 08) exist precisely to settle who saves what.

## Check

1. With `x5 = 10`, `x6 = 20`, `PC = 0x8000`, the CPU runs `add x7, x5, x6`. Which statements are true? Pick all that apply.
   - A) Afterwards `x7` holds 30
   - B) Afterwards the PC holds `0x8004`
   - C) Afterwards `x5` still holds 10
   - D) Afterwards `x0` holds 30
   - Answer: A, B, C
   - Explanation: `add` reads its sources without changing them and writes only the destination (A, C). Normal instructions advance the PC by 4 (B). `x0` discards all writes and stays 0, so D is false.
   > Hint: Ask of each register: was it written by this instruction?

2. A branch is taken to address `0x9000` while the PC is `0x8000`. What does the PC hold next?
   - A) `0x9000`
   - B) `0x8004`
   - C) `0x9004`
   - D) `0x0000`
   - Answer: A
   - Explanation: A taken branch *replaces* the PC with its target. "PC + 4" is only the default for instructions that fall through.
   > Hint: PC+4 is the default, not the law. What is a branch for?

3. `add x0, x5, x6` computes 30 and `x0` still reads 0. Why does RISC-V waste an entire register on permanent zero — what does it buy the instruction set?
   - A) Nothing; it is reserved for future CPUs
   - B) It gives common operations (move, clear, compare-against-zero) for free without extra instructions
   - C) It makes the register file 32 entries instead of 31
   - D) It holds the return address of function calls
   - Answer: B
   - Explanation: With a zero register, `add x5, x6, x0` is a move and `add x0, x0, x0` is a no-op — no dedicated opcodes needed. D describes `ra` (`x1`, Chapter 08).
   > Hint: Try to build "copy x6 into x5" using only `add`.

4. An OS must save some registers at every context switch but may skip others. Look up caller-saved vs callee-saved registers and explain who is responsible for each set — and what breaks if both sides assume the other saved `x7`.

5. The CPU has no idea what a PID is, yet processes stay isolated from each other. Using privilege levels and the MMU, explain where the isolation actually lives — which state the CPU *does* hold that makes separation possible.

## Limits

This chapter shows the simple model: every instruction is 4 bytes and the PC always advances by 4 unless told otherwise. Real RISC-V has 2-byte compressed instructions, and traps can redirect the PC to handler addresses. Pipelining and out-of-order execution are hidden underneath — software observes the ISA contract, not the machinery.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V psABI](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)
- [Linux Scheduler](https://docs.kernel.org/scheduler/)

## Related

Chapter 03, Chapter 05
