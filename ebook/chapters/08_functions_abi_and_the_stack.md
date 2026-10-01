# Chapter 08 — Functions, ABI, and the Stack

> **Part II — Speaking RISC-V**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Functions are how software reuses logic. But a function call is a contract: who passes arguments, who saves registers, who cleans up. When a function returns garbage or the stack grows until it crashes, the contract was broken — by the caller, the callee, or the compiler's assumptions.

## Core Idea

A function call does three things: pass arguments (in registers `a0`–`a7`), save the return address (in `ra`), and jump to the function. The function may call other functions, so it must save `ra` and any registers it promises to preserve on a **stack** — a region of memory pointed to by `sp`. The **ABI** (Application Binary Interface) is the written contract for all of this.

## Worked Example

Caller wants to add 3 and 4:

```text
# caller
addi a0, x0, 3        # argument 1
addi a1, x0, 4        # argument 2
jal  ra, add          # call add(3, 4); ra = return address
# a0 now holds 7

# add:
add  a0, a0, a1       # a0 = a0 + a1 = 7
jalr x0, 0(ra)        # return to caller
```

The caller puts arguments in `a0`/`a1`, the callee returns the result in `a0`. Neither side needs to know the other's internals — the ABI makes them compatible.

## The Same Idea Elsewhere

- **Hardware:** the stack is just memory; `sp` is a register pointing to the top. Push = decrement `sp` then store; pop = load then increment `sp`.
- **RISC-V:** the ABI defines which registers are caller-saved (`t0`–`t6`, `a0`–`a7`) and callee-saved (`s0`–`s11`, `ra`, `sp`). The hardware enforces none of this — it is a software convention.
- **OS:** each thread gets its own stack. A stack overflow is the stack growing into unmapped memory — the OS faults and kills the process.
- **Linux/driver:** kernel functions follow the same ABI but with additional rules (no floating point in kernel, limited stack size). Violating these causes subtle corruption.

## When It Fails

A function saves `ra` on the stack, calls another function (which overwrites `ra`), then returns using the saved value — but the saved value was never restored after the inner call. The return goes to the wrong address. The bug is not the call; it is the missing restore. The ABI says callee-saved registers must be preserved — the function broke its promise.

## Check

1. A function is called with arguments in `a0` and `a1`. Where should the caller expect the return value?
   - A) `a0`
   - B) `ra`
   - C) `sp`
   - D) `t0`
   - Answer: A
   - Explanation: The ABI defines `a0`–`a7` as argument registers and `a0` as the primary return value register. `ra` holds the return address, not the result.
   > Hint: Arguments go in a0–a7. Which one doubles as the return value?

2. Which registers must a function preserve (restore before returning) if it uses them? Pick all that apply.
   - A) `t0`
   - B) `s0`
   - C) `a0`
   - D) `ra`
   - Answer: B, D
   - Explanation: `s0`–`s11` and `ra` are callee-saved — the function must restore them. `t0` and `a0` are caller-saved — the caller must save them if it cares.
   > Hint: "Callee-saved" means the function (callee) promises to restore. Which registers carry that promise?

3. A function's stack frame is 32 bytes. It saves `ra` and `s0` on the stack. How many bytes does it allocate, and in what order?
   - A) 32 bytes; `ra` at offset 0, `s0` at offset 4
   - B) 32 bytes; `s0` at offset 0, `ra` at offset 4
   - C) 8 bytes; `ra` then `s0`
   - D) 64 bytes; `ra` and `s0` at the top
   - Answer: A
   - Explanation: The frame is 32 bytes (the allocated size). `ra` is saved first (at the lower address, offset 0), then `s0` (offset 4). The order is a convention; the size is what was allocated.
   > Hint: The frame size is given. How many registers are saved, and how big is each?

4. Explain why the kernel cannot use the same stack size as a user program — what is the kernel stack size on Linux, and what happens if a kernel function recurses too deeply?

5. A function returns a struct by value. The caller allocates space for the struct and passes a pointer in `a0`. The callee writes the struct to that pointer and returns the pointer in `a0`. Explain why this works even though `a0` was an argument — who owns the struct's memory?

## Limits

This chapter shows the simplest case: arguments in registers, a simple stack frame. Real functions may pass arguments on the stack (more than 8), return structs by hidden pointer, or use frame pointers for debugging. The ABI is a contract, not a law of nature — but breaking it breaks interoperability.

## Go Deeper

- [RISC-V psABI](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)
- [Linux Kernel Coding Style](https://docs.kernel.org/process/coding-style.html)

## Related

Chapter 07, Chapter 09
