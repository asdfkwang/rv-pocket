# Chapter 25 — SBI and the Boundary Below Linux

> **Part VI — How Linux Finds Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Linux runs in S-mode, but some operations require M-mode: setting timers, starting secondary CPUs, resetting the system. The **SBI** (Supervisor Binary Interface) is the API that lets S-mode software call M-mode firmware. It is the boundary between the OS and the firmware below it.

## Core Idea

SBI defines a set of calls (like system calls, but to firmware). Linux makes an SBI call by placing arguments in registers and executing `ecall`. The firmware (in M-mode) handles the call and returns the result. SBI calls include: set timer, console putchar, CPU start, system reset, and IPI (inter-processor interrupt).

## Worked Example

Linux wants to set a timer:

```text
1. Linux places the timer value in a0, function ID in a7
2. Linux executes ecall
3. Firmware (M-mode) programs the timer
4. Firmware returns success in a0
5. Linux continues
```

The timer interrupt later fires, and Linux's scheduler runs. Linux never touched the timer CSR directly — it asked the firmware.

## The Same Idea Elsewhere

- **Hardware:** the CPU provides the `ecall` mechanism (Chapter 13) and privilege levels (Chapter 14) that make SBI possible.
- **RISC-V:** the privileged spec defines the trap mechanism. The SBI specification defines the calling convention.
- **OS:** Linux uses SBI for timer, console, and SMP operations. Without SBI, Linux would need to run in M-mode.
- **Linux/driver:** drivers do not use SBI directly — they go through the kernel. But understanding SBI helps read early boot logs.

## When It Fails

Linux makes an SBI call but the firmware does not implement that function. The call returns an error. Linux panics because it cannot set the timer. The bug is not Linux — it is the firmware's incomplete SBI implementation. The fix: update the firmware or use a different SBI function.

## Check

1. Linux (S-mode) wants to reset the system. How does it do it?
   - A) Execute a reset instruction
   - B) Make an SBI call to the firmware
   - C) Write to a reset register
   - D) Reboot the CPU
   - Answer: B
   - Explanation: Reset requires M-mode. Linux makes an SBI call; the firmware performs the reset.
   > Hint: What privilege level is required for reset? How does S-mode ask M-mode?

2. Which of these are typical SBI functions? Pick all that apply.
   - A) Set timer
   - B) Console output
   - C) Allocate memory
   - D) Start a secondary CPU
   - Answer: A, B, D
   - Explanation: SBI provides timer, console, and SMP functions. Memory allocation is the OS's job, not firmware's.
   > Hint: What does the OS need from firmware? What does the OS do itself?

3. An SBI call returns an error. What does Linux do?
   - A) Ignore the error and continue
   - B) Panic — the operation is essential
   - C) Retry the call forever
   - D) Switch to a different firmware
   - Answer: B
   - Explanation: SBI calls are essential (timer, console). If they fail, Linux cannot continue. It panics.
   > Hint: What happens if Linux cannot set a timer? Can it run without one?

4. Explain why SBI exists — why does Linux not just run in M-mode and do everything itself?

5. A board boots Linux but the console is silent. The firmware's SBI console function is implemented. What are two possible causes, and what test would distinguish them?

## Limits

This chapter shows the basic SBI calls. The full SBI specification includes timer, IPI, RFENCE (remote fence), and power management. OpenSBI is the reference implementation. The principle — a calling convention between privilege levels — is universal.

## Go Deeper

- [RISC-V SBI Specification](https://github.com/riscv-non-isa/riscv-sbi-doc)
- [OpenSBI](https://github.com/riscv-software-src/opensbi)

## Related

Chapter 24, Chapter 26
