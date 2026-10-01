# Chapter 08 — Functions, ABI, and the Stack

> **Part II — Speaking RISC-V**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

An ABI is a software contract that defines how different functions and binaries share registers and the stack. This concept does not end at one layer. This chapter starts from the smallest example and connects how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

An ABI is a software contract that defines how different functions and binaries share registers and the stack.

A function call needs more than a jump: rules for arguments, return values, saved registers, and stack frames. Understand the ISA and the ABI separately.

On a first reading, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check the exact specifications in `Go Deeper` at the end.

## Small Example

```text
a0=2, a1=3
jal ra,add_two
add_two: add a0,a0,a1; ret
→ a0=5
```

Tracing this small example on paper yourself matters more than memorizing a long definition. Mark the moment a value changes and the moment control passes to another layer.

## Follow the System

### At the Hardware

The CPU has no notion of functions; it provides only jumps, registers, and memory.

### In RISC-V

The psABI defines the roles and save rules for ra, sp, a0-a7, s*, and t*.

### Why the OS Cares

Traps and syscalls change privilege state on top of a normal function call, but share the same register-saving problem.

### In Linux / Driver

The Linux kernel stack and architecture entry code are areas where ABI and saved-state understanding is required.

## Trace It

1. **Hardware:** The CPU has no notion of functions; it provides only jumps, registers, and memory.
2. **RISC-V:** The psABI defines the roles and save rules for ra, sp, a0-a7, s*, and t*.
3. **OS:** Traps and syscalls change privilege state on top of a normal function call, but share the same register-saving problem.
4. **Linux / Driver:** The Linux kernel stack and architecture entry code are areas where ABI and saved-state understanding is required.
5. Finally, mark directly what changes along the path above: value, address, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is designed to be harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Find the caller-saved and callee-saved register lists in the psABI and explain why each group is needed.
2. Give an example of the conditions under which a leaf function can run without a stack frame.
3. Research how a build that omits the frame pointer can make stack traces harder.
4. Find one rule or API directly related to **Functions, ABI, and the Stack** in the official documentation, and explain one condition or exception that the simplified model in this chapter omits.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V psABI](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)
- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [Upstream Linux source](https://github.com/torvalds/linux)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- An ABI is a software contract that defines how different functions and binaries share registers and the stack.
- You may meet the same concept again under different names in hardware and OS/Linux.
- Do not guess at unknown details; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 07, Chapter 09
