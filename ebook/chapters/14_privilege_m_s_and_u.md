# Chapter 14 — Privilege: M, S, and U

> **Part IV — Protection and the Operating System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Privilege is the protection boundary enforced by the CPU that decides who may use CSRs, memory, devices, and system control. This concept does not stop at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and Linux drivers.

## Core Idea

Privilege is the protection boundary enforced by the CPU that decides who may use CSRs, memory, devices, and system control.

RISC-V M/S/U modes run firmware, the kernel, and applications at different privilege levels. Page permissions and trap delegation reinforce this boundary.

On a first reading, do not memorize every exception. Focus only on **who holds what state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
U-mode app
--ecall→ S-mode Linux
--SBI ecall→ M-mode firmware
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control crosses into another layer.

## Follow the System

### At the Hardware

The CPU checks the current privilege and permissions to allow an access or raise a trap.

### In RISC-V

Mstatus/sstatus, satp, delegation CSRs, and M/S/U modes define privileged execution.

### Why the OS Cares

The kernel manages page tables, the scheduler, and drivers at higher privilege than userspace.

### In Linux / Driver

RISC-V Linux normally runs in S-mode and uses SBI for machine services.

## Trace It

1. **Hardware:** The CPU checks the current privilege and permissions to allow an access or raise a trap.
2. **RISC-V:** Mstatus/sstatus, satp, delegation CSRs, and M/S/U modes define privileged execution.
3. **OS:** The kernel manages page tables, the scheduler, and drivers at higher privilege than userspace.
4. **Linux / Driver:** RISC-V Linux normally runs in S-mode and uses SBI for machine services.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search specifications, docs.kernel.org, and upstream sources.

1. Explain the hardware mechanism that prevents userspace from directly accessing arbitrary MMIO.
2. Investigate how exception delivery to an S-mode OS would change without trap delegation.
3. Hypothesize the security problem if U-mode could freely write satp.
4. Find one rule or API directly related to **Privilege: M, S, and U** in the official documentation, and explain one condition or exception omitted by this chapter's simplified model.
5. Assume this chapter's concept caused a problem on a real Linux system, pick the relevant boundaries from **hardware → RISC-V → OS → Linux/driver → userspace**, and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)
- [RISC-V SBI Specification](https://github.com/riscv-non-isa/riscv-sbi-doc)
- [OpenSBI](https://github.com/riscv-software-src/opensbi)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- Privilege is the protection boundary enforced by the CPU that decides who may use CSRs, memory, devices, and system control.
- You may meet the same concept again under different names in hardware and in OS/Linux.
- Do not guess at details you do not know; look them up and verify them in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 13, Chapter 15
