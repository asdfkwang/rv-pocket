# Chapter 04 — Inside the CPU

> **Part I — A Computer That Can Run Code**

## What does executing an instruction change?

Memory now has concrete byte addresses. A CPU adds a small working set of registers and a rule for selecting the next instruction. The central question is: given an initial state and one instruction, what state is visible after it completes?

For the integer examples here, track 32 general-purpose registers named `x0` through `x31`, a program counter called PC, and the memory locations the code accesses. Each register holds 64 bits on RV64. The PC is the address used to select the current instruction. It is separate from the general-purpose registers.

These are the parts of architectural state needed for our first programs. Architectural means software can rely on their defined behavior. Privileged control registers, floating-point state, and other extensions add more state later. A pipeline or branch predictor can affect performance without appearing as another variable in this simple trace.

## Fetch, decode, execute, commit

Fetching obtains instruction bits from instruction memory at the PC. Decoding interprets those bits as an operation and operand names. Execution computes a result. Completion makes the specified result part of architectural state and selects the next PC. This is a conceptual order, not a promise that a real CPU uses four clock cycles or executes only one instruction at a time.

Use two four-byte integer instructions beginning at `0x8000`. Their assembly notation names the destination first, followed by two source registers. `add x7, x5, x6` means add the values in `x5` and `x6` and place the result in `x7`.

```text
initial: PC=8000, x5=10, x6=20, x7=99, x0=0
8000: add x7, x5, x6
8004: add x5, x7, x6
```

| Completed instruction | `x5` | `x6` | `x7` | Next PC |
| --- | --- | --- | --- | --- |
| none | 10 | 20 | 99 | `0x8000` |
| first add | 10 | 20 | 30 | `0x8004` |
| second add | 50 | 20 | 30 | `0x8008` |

The second instruction sees the first instruction's result. Memory at `0x1000` has not changed because neither instruction requests a memory write. Register names in the assembly are selectors, not numbers to be added: `x5` contributes 10 in the first row, not 5.

## Why registers and memory are different

Arithmetic operands are held close to the CPU's execution units. A load brings a value from memory into a register; a store copies a register value into memory. Thus a source expression such as `total = total + 1` may require a load, arithmetic, and a store if `total` resides in memory. A compiler may instead retain a value in a register across several operations when the language permits it.

Do not assume every source statement corresponds to one instruction or every source variable has one permanent register. To explain an instruction trace, use the compiled instructions and their current operands. To explain a C program, also account for the compiler and language rules.

RISC-V gives `x0` special behavior: reading it yields zero and writing it discards the result. Executing `add x0, x5, x6` therefore leaves `x0` at zero. That does not cancel the instruction or hold the PC still. A permanent zero operand lets other instructions express useful operations without adding a separate instruction for every special case.

## The next instruction is part of the result

Our adds advance PC by four because they are four-byte instructions and do not branch. Instruction length is not always four in RISC-V: the compressed extension includes two-byte instructions. Branches and jumps select a different next PC, while traps transfer control to a handler under separate rules.

For now, a sequential trace says which instruction completes first and what each completion changes. A sophisticated core may overlap work or speculate internally, but it must honor the architecture's required observable behavior. That distinction allows the same suitable binary to run on very different implementations.

If a computed total is wrong, record inputs and the first unexpected state transition. In the trace above, a final `x5 = 40` cannot be explained by the written instructions and initial values. Either the initial state, instruction sequence, or observation is different. Saying "the CPU added incorrectly" skips those testable possibilities.

Chapter 05 makes the instruction contract explicit; Chapters 06 and 07 extend this trace method to memory and control flow.

## Check

1. After the two instructions above, which values are correct? Select all that apply.
   - A) `x5 = 50`
   - B) `x7 = 30`
   - C) The original memory buffer must have changed.
   - Answer: A, B
   - Explanation: The second add consumes the updated x7. Neither instruction stores to memory.

2. A four-byte `add x0, x5, x6` starts at `0x8008`. Which state follows normal completion?
   - A) `x0 = x5 + x6`, PC unchanged
   - B) `x0 = 0`, PC = `0x800C`
   - C) `x0 = 0`, PC = `0x8008`
   - Answer: B
   - Explanation: Discarding the destination result does not suppress sequential control flow.

3. Reverse the order of the two original adds while keeping their operands and initial state. Trace every register update. Explain precisely which dependency makes the final result differ.

4. A debugger shows `x7 = 30` twice, separated by a function call. Is that sufficient evidence that x7 was preserved throughout the call? Give two instruction histories consistent with those observations.

5. Research challenge: find an instruction that has an observable effect even with destination x0. Explain why discarding a register result does not generally discard memory effects or exceptions. State which ISA instruction and rule you used.

## Limits

This is an architectural trace, not a pipeline simulator. It omits timing, caches, interrupts, and extension state. All shown instructions complete normally. Instruction fetch and data access can themselves fail; Chapter 13 explains how such failures change control flow.

## Go Deeper

- [RISC-V base integer ISA](https://docs.riscv.org/reference/isa/unpriv/rv32.html) — read the register-state definition and the rule for loads targeting x0.
- [RV64 integer ISA](https://docs.riscv.org/reference/isa/unpriv/rv64.html) — distinguish register width from operation width.

## Related

- [Chapter 03 — Memory: Where State Lives](03_memory_where_state_lives.md)
- [Chapter 05 — Instructions and the RISC-V ISA](05_instructions_and_the_risc_v_isa.md)
