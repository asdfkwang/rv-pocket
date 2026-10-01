# Chapter 14 — Privilege: M, S, and U

> **Part IV — Protection and the Operating System**

## What prevents an application from becoming the kernel?

Chapter 13 used a trap to enter privileged software. If applications could freely modify the handler address or turn off protection, this boundary would offer no isolation. Privilege levels make some operations available only to software already holding the required authority.

RISC-V names machine mode M, supervisor mode S, and user mode U. M is the most privileged of these levels. Implementations and execution environments differ in which additional modes they support. Our Linux-oriented machine uses firmware in M-mode, a kernel in S-mode, and applications in U-mode. This arrangement is a system design choice supported by the architecture, not a claim that every RISC-V system runs Linux.

## Follow an allowed request and a forbidden operation

A user program wants to print `A`. Writing the UART's physical address is not part of its ordinary accessible virtual address space. Instead, it issues a write system call. Hardware transfers to a trap entry configured by more privileged software. The kernel validates the descriptor, buffer, and permissions before requesting device work.

Contrast that with a U-mode attempt to write a supervisor control register. The instruction's privilege check rejects the operation with an illegal-instruction exception. The application does not become supervisor merely by knowing the CSR's number. Knowledge of an address or opcode is not authority to use it.

```text
allowed route:
U-mode request -> trap entry -> kernel validation -> authorized device operation

forbidden shortcut:
U-mode CSR write -> privilege check fails -> exception handling
```

The permitted route includes a policy decision. A system call is a request, not a guarantee that the requested action will be granted. The kernel can return an error without touching the device.

## Which layer controls which mechanism?

The supervisor manages the application's page tables and uses S-mode trap registers. Firmware retains machine-level facilities and can expose selected services through a defined interface. Machine software configures delegation so certain traps are handled directly by the supervisor. Delegation does not erase the distinction between modes or let a user select arbitrary entry code.

Memory isolation involves more than the current mode. Translation permissions, physical memory protection where configured, and device/interconnect access controls can also constrain accesses. Conversely, privileged kernel code can still contain an invalid pointer or an ordering bug. Privilege expands permitted operations; it does not establish their correctness.

A return-from-trap instruction uses saved status to restore the appropriate mode and continuation. It is not interchangeable with an ordinary function return, which jumps through a general register. Treating a user-to-kernel transition as merely a function call misses both the authority change and the special entry/exit responsibilities.

## Separate kernel services from firmware services

Suppose an S-mode driver needs a facility controlled by M-mode. Directly accessing a machine CSR may trap because supervisor privilege is insufficient. The solution depends on the platform contract: the kernel may use an SBI service, a delegated architectural facility, or a platform driver interface. Guessing a CSR access is not a substitute for discovering that contract.

Chapter 25 later follows an SBI call with concrete registers. For now, distinguish two requests: a user system call asks the OS for a service; an SBI call asks a lower-level execution environment for a service. Both can use ecall, but their originating modes, arguments, and handlers differ.

The next chapter builds OS policy on top of these mechanisms. Hardware can enforce a boundary; software still decides which process owns a file, which operations are permitted, and what a successful request means.

## Check

1. A U-mode instruction attempts an unauthorized supervisor CSR write. Which outcome matches the privilege boundary?
   - A) Knowing the CSR number grants access.
   - B) The operation raises an illegal-instruction exception.
   - C) It automatically becomes a successful system call.
   - Answer: B
   - Explanation: Privilege checks apply to the instruction; they do not reinterpret an unauthorized access as an approved request.

2. Select all correct statements about the chosen Linux-oriented arrangement.
   - A) Kernel S-mode is more privileged than application U-mode.
   - B) All RISC-V implementations must run this software arrangement.
   - C) A kernel service can reject a validly delivered request.
   - Answer: A, C
   - Explanation: Hardware delivery and OS authorization are separate, and the software arrangement is not universal.

3. Explain why preventing U-mode writes to trap-vector registers matters. Construct a failure of isolation if an application could replace the kernel's entry address with its own code and enter it privileged.

4. A driver sees an illegal-instruction trap on a CSR operation. Propose a diagnosis that distinguishes an unsupported CSR from insufficient privilege. Specify the evidence needed before choosing a firmware service as the replacement.

5. Research challenge: inspect machine-level delegation registers and supervisor return rules. Identify one case that can be delegated and explain why delegation is not a general permission for supervisor software to access machine CSRs.

## Limits

We omit hypervisor virtualization, detailed PMP configuration, and optional privilege extensions. Memory permissions are developed in Chapters 20–21. Whether a specific instruction or resource is accessible depends on the configured environment, not only its name.

## Go Deeper

- [RISC-V machine-level architecture](https://docs.riscv.org/reference/isa/priv/machine.html) — inspect privilege checks, delegation, and physical protection.
- [RISC-V SBI specification](https://github.com/riscv-non-isa/riscv-sbi-doc) — identify the supervisor-to-firmware interface distinct from user system calls.

## Related

- [Chapter 13 — Exceptions, Traps, and System Calls](13_exceptions_traps_and_system_calls.md)
- [Chapter 15 — What an Operating System Actually Does](15_what_an_operating_system_actually_does.md)
