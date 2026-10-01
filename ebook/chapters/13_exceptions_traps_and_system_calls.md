# Chapter 13 — Exceptions, Traps, and System Calls

> **Part III — CPU Meets Hardware**

## Why did execution leave the instruction stream?

Chapter 12 followed a hardware notification. RISC-V uses the broader term trap for a control transfer caused by an interrupt or an exception. An interrupt is asynchronous with respect to the interrupted instruction stream. An exception is associated with executing a particular instruction, such as an illegal instruction, a failed memory access, or an environment call.

A system call uses an intentional exception to request a kernel service. The instruction `ecall` does not itself mean "write a byte." Its meaning depends on the current privilege level and the software calling convention. The trap handler interprets the request and decides what happens next.

## The entry record is a starting point

Assume a supervisor-mode OS and a user-mode program, with the relevant user traps delegated to the supervisor. Chapter 14 explains those privilege levels and delegation. In direct trap-vector mode, entry uses stvec's configured base. Hardware updates sepc with the return/fault instruction address, scause with the reason, and relevant status fields. stval may contain additional information such as a faulting address, according to the exception's rules.

These CSRs, control and status registers, are not the general-purpose registers used for arithmetic. Entry assembly still needs to preserve general registers and establish an appropriate stack before running ordinary kernel code.

Consider a user program at `0x4000` requesting a Linux service. Its wrapper places a system-call number in a7 and arguments in a0 onward, then executes ecall. For a user environment-call exception, the synchronous exception code is 8. Delegation in this example routes it to the supervisor rather than the machine-mode firmware.

```text
before entry: user PC=4000; a7=request number; a0...=arguments
hardware:     sepc=4000; scause=8; enter supervisor trap vector
software:     save registers; validate request; run service
software:     saved a0=result; sepc=4004 for this completed ecall
exit:         restore registers; sret resumes user code at 4004
```

The ecall instruction is four bytes, so advancing this saved PC by four skips the completed request. This is a handler decision. A generic trap handler must not increment every saved PC by four regardless of cause.

## Retrying is different from skipping

Suppose a load at `0x5000` references a valid part of a process's address space whose page is not currently installed. If the OS can supply the page, it repairs the mapping and returns with sepc still `0x5000`. The load executes again and can now complete. Advancing to `0x5004` would skip the load and leave its destination without the intended result.

If the access violates policy, the OS may instead signal or terminate the process. Kernel faults are also context-dependent: a fault during an authorized user-memory copy can have a defined recovery path, whereas an unexpected kernel pointer fault may indicate a serious bug. "Kernel fault" does not automatically imply one universal outcome.

For an asynchronous interrupt, the saved PC identifies where the interrupted computation should resume. No instruction is skipped merely because a device needed attention. Thus one entry mechanism supports three different return policies: continue after a completed request, retry a repaired faulting instruction, or resume after asynchronous service.

## Let the specification identify the cause

An intuitive high-level error is not always a hardware exception. With the relevant RISC-V integer division support present, division by zero has defined quotient/remainder results rather than raising a divide-by-zero trap. Unsupported instruction encoding is a different issue and can produce an illegal-instruction exception.

Debugging begins with the recorded cause, saved PC, instruction bytes, and relevant address information. A handler printing only "trap" throws away the evidence needed to distinguish a bad pointer, unsupported instruction, and deliberate system call.

The next chapter explains why the handler has authority the requesting application lacks, and which state prevents a user program from simply granting itself that authority.

## Check

1. An OS repairs a recoverable page fault from a load at `0x5000`. Where should it normally resume that operation?
   - A) `0x5000`
   - B) Always `0x5004`
   - C) The address of the loaded data
   - Answer: A
   - Explanation: Retrying the load obtains the value; skipping it leaves the computation incomplete.

2. Which facts are correct? Select all that apply.
   - A) ecall identifies a Linux service without any register convention.
   - B) scause distinguishes the recorded trap reason.
   - C) Software must preserve general registers needed by the interrupted computation.
   - Answer: B, C
   - Explanation: Software conventions give meaning to ecall arguments; trap metadata is not a full register save.

3. Create a table comparing a user ecall, a recoverable load page fault, and an external interrupt. Include the origin, saved PC meaning, handler action, and return-PC policy.

4. A handler unconditionally adds four to sepc. Produce two distinct failing scenarios, one involving retry and another involving instruction length or asynchronous interruption. Explain the missing information in the handler's rule.

5. Research challenge: verify integer divide-by-zero behavior in the unprivileged ISA and user ecall's exception code in the privileged ISA. Explain how to distinguish an unsupported divide instruction from a supported divide with a zero operand using trap evidence.

## Limits

The example selects S-mode direct-vector entry and explicit delegation. Other configurations enter M-mode or use vectored interrupt entry. The system-call register convention is an OS ABI, and complete Linux entry code handles more state than this conceptual trace.

## Go Deeper

- [RISC-V supervisor trap registers](https://docs.riscv.org/reference/isa/priv/supervisor.html) — verify sepc, scause, stval, and stvec.
- [RISC-V integer division](https://docs.riscv.org/reference/isa/unpriv/m-st-ext.html) — check exceptional arithmetic results.
- [Linux RISC-V entry code](https://github.com/torvalds/linux/blob/master/arch/riscv/kernel/entry.S) — locate software register saving and restoration.

## Related

- [Chapter 12 — Interrupts: Hardware Wants Attention](12_interrupts_hardware_wants_attention.md)
- [Chapter 14 — Privilege: M, S, and U](14_privilege_m_s_and_u.md)
