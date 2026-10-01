# Chapter 07 — Branches, Jumps, and Control Flow

> **Part II — Speaking RISC-V**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Without branches, a program is a straight line. Loops, if-statements, and function calls are all the CPU deciding "where does the PC go next?" When a loop runs forever or a function never returns, the bug is in this decision.

## Core Idea

Normally the PC advances by 4 (one instruction). A **branch** compares two registers and, if the condition holds, replaces the PC with a target address. A **jump** (`jal`) unconditionally changes the PC and saves the return address in a register. A loop is just a branch that goes backward.

## Worked Example

```text
0x8000: addi x5, x0, 3      # x5 = 3 (counter)
0x8004: addi x6, x6, 10     # x6 += 10 (loop body)
0x8008: addi x5, x5, -1     # x5 -= 1
0x800c: bne  x5, x0, 0x8004 # if x5 != 0, go back to 0x8004
0x8010: ...                 # loop done
```

Trace: x5 starts at 3. Each pass adds 10 to x6 and decrements x5. After 3 passes x5 is 0, the branch is not taken, and execution falls through to `0x8010`. The loop ran exactly 3 times.

## The Same Idea Elsewhere

- **Hardware:** the branch unit compares registers and computes the target; the fetch path redirects.
- **RISC-V:** `beq`, `bne`, `blt`, `bge` (and unsigned variants) are conditional branches; `jal` is a jump with a link register.
- **OS:** the scheduler uses a timer interrupt (a forced PC change) to switch tasks — control flow the program never chose.
- **Linux/driver:** `goto` in error-handling paths is the C version of a branch; understanding the assembly helps read stack traces.

## When It Fails

A loop condition uses `blt` (signed less-than) but the counter is unsigned. At some large value the signed comparison says "negative" and the loop exits early or never. The fix is `bltu`. The bug is not the logic — it is the type of comparison matching the type of the data.

## Check

1. At `0x800c`, `bne x5, x0, 0x8004` is executed with `x5 = 0`. What is the next PC?
   - A) `0x8004`
   - B) `0x8010`
   - C) `0x800c`
   - D) `0x0000`
   - Answer: B
   - Explanation: `bne` branches only if the registers differ. `x5 = 0` equals `x0`, so the branch is not taken and the PC advances to the next instruction at `0x8010`.
   > Hint: bne = branch if NOT equal. Is x5 equal to x0?

2. Which of these are unconditional control-flow changes? Pick all that apply.
   - A) `beq`
   - B) `jal`
   - C) `bne`
   - D) `jalr`
   - Answer: B, D
   - Explanation: `jal` and `jalr` always change the PC. `beq` and `bne` are conditional — they only branch when their condition holds.
   > Hint: "jal" has no condition field. What does the 'l' stand for?

3. A function calls another function with `jal ra, target`. What does `ra` hold when the target starts executing?
   - A) The address of the call instruction
   - B) The address of the instruction after the call
   - C) The address of the function's first instruction
   - D) Zero
   - Answer: B
   - Explanation: `jal` saves PC+4 (the return address) in `ra` before jumping. The called function can return with `jalr x0, 0(ra)` to resume after the call.
   > Hint: The caller needs to know where to resume. What address is that?

4. Explain why a compiler might turn a `while` loop into a backward branch at the end rather than a forward branch at the beginning — what does this save on the common path?

5. A driver's probe function has 5 error-handling `goto` labels. Trace the control flow for the case where the 3rd allocation fails: which labels run, which are skipped, and what state has been allocated at that point?

## Limits

This chapter shows simple branches and jumps. Real CPUs predict branches (speculative execution), and RISC-V has compressed instructions that change instruction sizes. The ISA contract — what the PC does — is exact; the machinery that implements it is not.

## Go Deeper

- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Linux Kernel Coding Style (goto)](https://docs.kernel.org/process/coding-style.html)

## Related

Chapter 06, Chapter 08
