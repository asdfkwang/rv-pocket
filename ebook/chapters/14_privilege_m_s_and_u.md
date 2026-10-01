# Chapter 14 — Privilege: M, S, and U

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A user program must not be able to read another program's memory, access devices directly, or crash the system. **Privilege levels** enforce this: the CPU has modes, and each mode can do more than the one below. RISC-V has three: **M** (Machine, most privileged), **S** (Supervisor, the OS), and **U** (User, applications).

## Core Idea

The CPU tracks the current privilege level. Certain instructions and CSRs are only accessible in higher levels. A user program that tries to execute a privileged instruction triggers a trap. The OS runs in S-mode; firmware runs in M-mode; applications run in U-mode. The OS uses S-mode to protect itself from applications and to manage hardware access.

## Worked Example

A user program tries to read the `time` CSR:

```text
# User program (U-mode)
rdtime t0        # read timer
```

On a system where `time` is M-mode only, this instruction traps. The trap handler (in M-mode or S-mode) decides: emulate the read, kill the program, or allow it. On systems where `time` is accessible from U-mode, the read succeeds.

## The Same Idea Elsewhere

- **Hardware:** the privilege level is a CPU state bit. Each instruction and CSR has a minimum privilege level. The hardware enforces access.
- **RISC-V:** the privileged spec defines M/S/U modes, the `mstatus` CSR (which tracks current mode), and the trap mechanism for privilege violations.
- **OS:** the OS runs in S-mode. It uses S-mode to manage memory (MMU), schedule tasks, and handle system calls. M-mode is reserved for firmware.
- **Linux/driver:** Linux runs in S-mode. Drivers run in kernel space (S-mode, ring 0 equivalent). User programs run in U-mode. The boundary is enforced by the CPU.

## When It Fails

A driver tries to access a device register directly from user space. The CPU traps because the address is in a privileged region. The driver should have used a system call (like `mmap` or `ioctl`) to request access through the OS. The bug is not the access — it is bypassing the privilege boundary.

## Check

1. A user program (U-mode) tries to execute an M-mode instruction. What happens?
   - A) The instruction executes normally
   - B) The CPU traps and transfers control to a higher-privilege handler
   - C) The instruction is ignored
   - D) The CPU shuts down
   - Answer: B
   - Explanation: Privilege violations cause a trap. The handler (in M-mode or S-mode) decides what to do — usually kill the program.
   > Hint: What does the CPU do when software tries something it is not allowed to do?

2. Which of these are true about privilege levels? Pick all that apply.
   - A) M-mode is more privileged than S-mode
   - B) S-mode is more privileged than U-mode
   - C) User programs run in M-mode
   - D) The OS typically runs in S-mode
   - Answer: A, B, D
   - Explanation: The order is M > S > U. User programs run in U-mode, not M-mode. The OS runs in S-mode.
   > Hint: What does the 'S' in S-mode stand for? Who runs there?

3. Why does the OS run in S-mode rather than M-mode?
   - A) S-mode is faster than M-mode
   - B) M-mode is reserved for firmware; S-mode is for the OS
   - C) S-mode has more registers than M-mode
   - D) M-mode cannot access memory
   - Answer: B
   - Explanation: M-mode is the most privileged level, reserved for firmware (Chapter 24). The OS runs in S-mode, which is privileged enough to manage hardware but leaves M-mode for firmware.
   > Hint: What runs in M-mode? What is the OS's role relative to firmware?

4. Explain how a user program requests a privileged operation (like reading a file) — what instruction triggers the transition, and what happens on the other side?

5. A driver runs in S-mode and tries to access an M-mode CSR. What happens, and what should the driver do instead?

## Limits

This chapter shows three privilege levels. Some systems use only M and U (no S-mode). Virtualization adds another layer (Hypervisor mode). The principle — hardware-enforced privilege boundaries — is the foundation of system security.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [Linux Kernel Privilege](https://docs.kernel.org/arch/riscv/index.html)

## Related

Chapter 13, Chapter 15
