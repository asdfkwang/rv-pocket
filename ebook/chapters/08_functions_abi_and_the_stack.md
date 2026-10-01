# Chapter 08 — Functions, ABI, and the Stack

> **Part II — Speaking RISC-V**

## Why does a function need a stack?

Chapter 07 showed that a call records one return address in ra. A nested call overwrites it. This chapter follows that failure and repairs it, then explains which values each function must preserve. Assume RV64, eight-byte saves, and the standard integer ABI with a stack pointer aligned to 16 bytes.

Suppose main calls outer at `0x8000`. The call records `0x8004` in ra. outer then calls inner, which records a different return address in the same register. inner can return correctly to outer, but outer has lost its route back to main. A return instruction cannot infer the old address from the source program.

The solution is to save the earlier address in memory before making the nested call. A stack reserves space for each active invocation, so recursive or nested functions do not overwrite each other's saved state. The stack pointer sp, also called x2, marks the current frame boundary; allocating space moves it toward lower addresses.

## A complete nested-call trace

main calls outer with a0 = 3, sp = `0x9000`, and s0 = 99. outer computes `inner(3) + 3`; inner doubles its argument. Addresses below identify four-byte instructions, with `ret` expanded explicitly.

```text
8000: jal  ra, outer
8004: ...                       # main resumes with a0 = 9

8100: addi sp, sp, -16           # outer
8104: sd   ra, 8(sp)
8108: sd   s0, 0(sp)
810C: addi s0, a0, 0             # retain original argument
8110: jal  ra, inner
8114: add  a0, a0, s0
8118: ld   s0, 0(sp)
811C: ld   ra, 8(sp)
8120: addi sp, sp, 16
8124: jalr x0, 0(ra)

8200: add  a0, a0, a0            # inner
8204: jalr x0, 0(ra)
```

After outer allocates its frame, sp is `0x8FF0`. Saving ra puts `0x8004` at `0x8FF8`; saving s0 puts 99 at `0x8FF0`. These are eight-byte values stored little-endian. outer may now use s0 to retain 3, provided it restores the previous 99 before returning.

| Boundary | sp | ra | s0 | a0 |
| --- | --- | --- | --- | --- |
| outer entry | `9000` | `8004` | 99 | 3 |
| before calling inner | `8FF0` | `8004` | 3 | 3 |
| inner entry | `8FF0` | `8114` | 3 | 3 |
| inner returns | `8FF0` | `8114` | 3 | 6 |
| outer adds original argument | `8FF0` | `8114` | 3 | 9 |
| outer restores and returns | `9000` | `8004` | 99 | 9 |

The saved memory copy, not ra itself, protected the return to main. If outer omits the load at `0x811C`, its final return uses `0x8114` and re-enters its own post-call code. If it omits restoring s0, it returns to the right address but violates main's expectation that s0 still contains 99.

## Who promises to preserve what?

The ABI, or application binary interface, lets separately compiled functions cooperate. For the standard integer convention, a0–a7 carry arguments and a0/a1 carry eligible return values. Temporary registers t0–t6 and argument registers are caller-saved: a caller needing their old values after a call must preserve them itself. Saved registers s0–s11 and sp must have their required incoming values restored by a returning callee.

**ra is caller-saved, not callee-saved.** outer saves it because outer is a caller of inner and needs its own return address later. A leaf function making no calls often does not need to save ra at all. inner also avoids a frame because it needs no additional preserved storage.

The distinction concerns values needed across an ordinary function call. An interrupt may arrive between arbitrary instructions, where temporary registers hold live values. Its entry/exit code must preserve the interrupted computation under a different contract; it cannot blindly save only the ordinary callee-saved set.

## A frame is a lifetime, not just a diagram

Each invocation owns its reserved frame until it releases that space. Returning a pointer to a local object in that frame does not extend the object's lifetime. Later calls can reuse those addresses. Memory retaining old bytes does not make a pointer to an expired C object valid.

Stack depth consumes finite memory. Recursion is not intrinsically wrong, but depth and per-call storage determine space demand. Kernel stacks are deliberately limited and their size depends on architecture and configuration; do not substitute a universal size into a safety argument.

With calls understood, we can follow ordinary software paths. The next part adds devices, whose registers obey contracts beyond the RAM rules used for these stack saves.

## Check

1. If outer omits only its restore of ra, where does its final jalr jump?
   - A) `0x8004`
   - B) `0x8114`
   - C) `0x8200`
   - Answer: B
   - Explanation: Calling inner replaced ra with 0x8114; only the saved stack copy still holds 0x8004.

2. Which statements are correct? Select all that apply.
   - A) outer must restore the s0 value it received.
   - B) ra is classified as callee-saved by the integer ABI.
   - C) inner can return without allocating a stack frame in this example.
   - Answer: A, C
   - Explanation: ra is caller-saved. The leaf inner does not overwrite it or need local storage.

3. Extend inner so that it calls another function before doubling its original argument. Design a correctly aligned frame and show every value that must survive the new call. Do not assume argument registers remain unchanged.

4. Suppose outer is recursively called three times with a 16-byte frame each. Draw the frame addresses from sp = `0x9000` and show why each invocation needs its own saved ra even though all execute the same code.

5. Research challenge: use the psABI to determine how a sufficiently large structure is returned by reference. Identify who allocates its storage and whether the callee must return the hidden destination pointer in a0. Cite the rule rather than inferring it from one compiler example.

## Limits

This trace uses the standard RV64 integer calling convention and no floating-point or vector arguments. Tail calls, optimized frames, unwind metadata, and extension calling conventions can change the generated code. The ownership and preservation obligations still have to be satisfied.

## Go Deeper

- [RISC-V psABI: register and procedure conventions](https://riscv-non-isa.github.io/riscv-elf-psabi-doc/) — verify ra, saved registers, stack alignment, and indirect results.
- [RISC-V control-transfer instructions](https://docs.riscv.org/reference/isa/unpriv/rv32.html) — compare the hardware link operation with the software stack discipline.

## Related

- [Chapter 07 — Branches, Jumps, and Control Flow](07_branches_jumps_and_control_flow.md)
- [Chapter 09 — How Devices Become Addresses](09_how_devices_become_addresses.md)
