# Chapter 25 — SBI and the Boundary Below Linux

> **Part VI — How Linux Finds Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

SBI is the standard service interface between an S-mode OS and M-mode firmware. This concept does not end at one layer. This chapter starts from the smallest example and traces how the same idea reappears in the CPU, the operating system, and the Linux driver.

## Core Idea

SBI is the standard service interface between an S-mode OS and M-mode firmware.

It lets the OS request machine-level services such as timer, IPI, remote fence, and reset without knowing platform-specific registers directly. OpenSBI is the representative implementation.

On the first read, do not memorize every exception. Focus only on **who holds which state, and which event changes that state**. Check exact details in `Go Deeper` at the end.

## Small Example

```text
Linux S-mode
→ SBI ecall: set timer
→ OpenSBI M-mode
→ platform timer programmed
→ return
```

Tracing this small example on paper matters more than memorizing long definitions. Mark the moments when values change and when control passes to another layer.

## Follow the System

### At the Hardware

Machine-level timer/IPI/reset controls may be inaccessible from S-mode or vendor-specific.

### In RISC-V

An ecall plus extension and function IDs make up an SBI invocation.

### Why the OS Cares

The OS delegates machine-specific control to firmware and keeps a portable S-mode kernel.

### In Linux / Driver

The Linux RISC-V timer, IPI, and reset paths meet the SBI layer.

## Trace It

1. **Hardware:** Machine-level timer/IPI/reset controls may be inaccessible from S-mode or vendor-specific.
2. **RISC-V:** An ecall plus extension and function IDs make up an SBI invocation.
3. **OS:** The OS delegates machine-specific control to firmware and keeps a portable S-mode kernel.
4. **Linux / Driver:** The Linux RISC-V timer, IPI, and reset paths meet the SBI layer.
5. Finally, mark what changes along the path above: values, addresses, PC, task state, registers, or buffer ownership.

## Check

> **Open book / open web.** The Check section is not a memorization test. It is deliberately harder than the main text, and you may search the specification, docs.kernel.org, and upstream source.

1. Compare the caller/callee privilege relationship of a syscall versus an SBI call.
2. Find the discovery feature of the SBI base extension in the official specification.
3. Using the OpenSBI README, explain why calling OpenSBI just a bootloader is inaccurate.
4. Find one rule or API directly related to **SBI and the Boundary Below Linux** in the official documentation, and explain one condition or exception that this chapter's simplified model omits.
5. Suppose this chapter's concept causes a problem on a real Linux system. Choose the relevant boundaries among **hardware → RISC-V → OS → Linux/driver → userspace** and design what state to observe and which tools to use.

## Go Deeper

- [RISC-V SBI Specification](https://github.com/riscv-non-isa/riscv-sbi-doc)
- [OpenSBI](https://github.com/riscv-software-src/opensbi)
- [RISC-V Privileged Architecture](https://docs.riscv.org/reference/isa/priv/priv-index.html)

External documents do not replace this text. Understand the small model first, then go to the original sources when you need exact bit definitions, ABIs, APIs, or corner cases.

## Key Takeaways

- SBI is the standard service interface between an S-mode OS and M-mode firmware.
- You may meet the same concept again under different names in hardware and in the OS/Linux.
- Do not guess unknown details; look them up in the official specifications and upstream documentation.

## Nearby Chapters

Chapter 24, Chapter 26
