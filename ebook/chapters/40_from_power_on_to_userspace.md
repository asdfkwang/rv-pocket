# Chapter 40 — From Power-On to Userspace

> **Part VIII — A Complete System**

## What has to succeed before userspace can print one byte?

Chapter 01 began with a running application's write. We can now explain the prerequisites that made that request possible: working instruction execution and memory, a valid boot handoff, privileged kernel state, device discovery, drivers, a runnable process, and a configured output path.

Use a conceptual RV64 system booting Linux in S-mode with machine firmware services. The kernel image begins at physical `0x80200000`, a 2 MB-aligned location. A device tree occupies `[0x88000000, 0x88008000)`. Assume both regions lie in working RAM, satisfy the actual image/reservation contract, and do not overlap other live boot artifacts. These addresses illustrate bookkeeping, not a universal board layout.

## Make each handoff explicit

| Stage | Required input | Established result | Useful evidence |
| --- | --- | --- | --- |
| Reset/early firmware | platform reset state | enough execution and memory to continue | early entry marker or debugger |
| Loader/firmware handoff | valid images and live description | kernel entry under its register/mode contract | entry PC, a0/a1, memory contents |
| Early kernel | valid handoff and accessible memory | kernel mappings, stacks, traps, allocators | early progress markers, fault metadata |
| Device discovery | firmware description and available drivers | resources matched and initialized | populated devices, probe outcomes |
| Root filesystem | working storage path or suitable early userspace | filesystem containing executable init | mount result and executable presence |
| Initial userspace | executable and runtime requirements | first userspace process can run | exec success, process/scheduling evidence |
| Output service | configured device/subsystem and user setup | bytes accepted and eventually transmitted | syscall result, queue/device/line observations |

A successful row does not prove the next one. Firmware output can work before the kernel's normal console driver exists. A mounted root filesystem can lack the requested init executable. A running init can fail to start a login service even though the kernel is healthy.

## Follow the first process into its write

Assume the root filesystem contains a usable statically linked init program, avoiding a dynamic-interpreter dependency in this first trace. The kernel establishes its userspace mapping and initial execution state, then transfers to it under the architecture's return/entry rules. Scheduling gives its thread CPU time.

The program opens an appropriate output resource and obtains a descriptor. It supplies an accessible buffer containing `0x41`, requests one byte, and enters the kernel through the system-call convention. The kernel dispatches the operation through the chosen object, and the device path eventually transmits the byte according to the queue and hardware protocol.

```text
image and boot state
  -> running kernel with resources
  -> mapped userspace program and execution state
  -> descriptor-associated operation
  -> queued byte and device submission
  -> physical output and receiver observation
```

This is the same byte from Chapter 01, now with the hidden prerequisites exposed. The CPU need not know what a login prompt is. The kernel need not know what the letter means to the human. Each layer must satisfy a narrower contract that allows the next layer's interpretation.

## Resolve a root-device dependency loop

Suppose the root filesystem lives on storage whose driver is available only as a module stored on that same filesystem. The kernel cannot load the module until it can read the filesystem, but cannot read it without the driver. A suitable design makes the needed driver available earlier, for example built into the kernel or supplied in an initramfs along with the userspace needed to load it.

This is a dependency problem, not a reason to change the UART address because no login prompt appears. The output symptom is far downstream. The last confirmed stage and the first failed dependency locate the useful investigation.

Dynamic executables introduce another prerequisite: the interpreter and libraries expected by the executable format must be available. A file named init existing on disk is therefore not enough to prove it can execute. Permissions, format, architecture, and runtime dependencies all belong to that boundary.

## Diagnose a silent system in stages

If firmware prints but no kernel output appears, inspect entry and early console evidence before assuming the kernel never executed. If the kernel reaches device discovery but root mounting fails, inspect the storage-description/driver/filesystem path. If init runs but no login appears, inspect userspace service and console configuration.

For each hypothesis, name a test and the decision it enables. A boot log is valuable, but absence of a message can mean either the stage did not run or its logging path failed. Alternate observations can distinguish those cases. Record the boot artifacts, configuration, hardware description, and source revision so the investigation can be repeated.

## Check

1. The kernel mounts root successfully, but the configured init is a dynamic executable whose interpreter is absent. Which boundary needs investigation?
   - A) Executable loading/runtime requirements
   - B) The reset address must be wrong.
   - C) UART baud rate necessarily caused the failure.
   - Answer: A
   - Explanation: Earlier progress narrows the problem; a present executable can still lack a required interpreter.

2. Which facts do not alone prove a login prompt will appear? Select all that apply.
   - A) Firmware output works.
   - B) A device driver probed successfully.
   - C) The kernel started an initial userspace process.
   - Answer: A, B, C
   - Explanation: Console routing and userspace service behavior remain later boundaries.

3. Draw a boot dependency graph for a root filesystem on a device requiring a driver module. Show how an initramfs or built-in driver breaks the cycle, including the supporting filesystems and executable dependencies.

4. Trace one byte from an init program's buffer to a receiver. Label virtual, physical, and device-facing state where relevant, and mark every point where acceptance differs from completion. State which mechanisms are optional for your chosen device path.

5. Capstone research: select a real RISC-V platform, firmware revision, kernel revision, hardware description, and userspace image. Produce a boot-to-output ledger containing each handoff, its documented preconditions, and a testable observation. Identify one failure you can explain at each of three different boundaries without relying on episode behavior.

## Limits

Real boot chains vary in firmware, security policy, EFI/ACPI or device-tree use, early userspace, and console setup. The example deliberately fixes one path so its dependencies can be traced. The method transfers by replacing each assumed contract with the chosen platform's documented one.

## Go Deeper

- [RISC-V Linux boot requirements](https://docs.kernel.org/arch/riscv/boot.html) — verify the early handoff and mapping requirements.
- [Linux initramfs documentation](https://docs.kernel.org/filesystems/ramfs-rootfs-initramfs.html) — follow early userspace and root-filesystem responsibilities.
- [Linux init debugging guidance](https://docs.kernel.org/admin-guide/init.html) — inspect why an initial executable may fail to run.
- [Linux serial driver API](https://docs.kernel.org/driver-api/serial/driver.html) — connect the final output path to its device-facing contract.

## Related

- [Chapter 39 — Bugs Across Layers](39_bugs_across_layers.md)
