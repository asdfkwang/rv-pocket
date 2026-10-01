# Chapter 24 — Reset, Firmware, and Boot

> **Part VI — How Linux Finds Hardware**

## Who prepares the machine before the kernel?

The previous chapters assumed a running CPU, usable memory, and configured trap handling. At reset, those assumptions have to be established. Firmware is early software that brings the platform into a state suitable for the next stage. The exact reset address and sequence are platform-defined; the RISC-V ISA alone does not specify one universal board boot path.

A boot ROM may select storage, authenticate or load another image, and transfer control to writable firmware. Further stages may initialize DRAM, select a kernel, and supply platform information. Some of these steps can be combined. To debug boot, record the actual chain rather than assigning a mandatory job to each familiar firmware name.

## Track ownership across a concrete handoff

Use a conceptual RV64 Linux boot in which firmware has usable DRAM, loads a kernel image at an appropriate physical address, and prepares a flattened device tree. The handoff contract includes the boot hart identifier in a0 and the device-tree physical address in a1 for the documented entry path. A hart is a hardware thread of execution, not a Linux process.

```text
reset entry
  -> early firmware establishes essential platform state
  -> loader places kernel and description in non-overlapping RAM regions
  -> firmware enters the kernel under the documented register/mode contract
  -> kernel establishes its own stacks, traps, mappings, and allocators
  -> kernel discovers devices and starts userspace
```

Suppose the description occupies `[0x88000000, 0x88008000)`. The kernel's entry a1 points to `0x88000000`. If the loader places another image over that interval after preparing it, a correct-looking a1 still points to corrupted data. Handoff correctness depends on object lifetime and contents as well as register values.

Likewise, a kernel loaded at an address must satisfy the architecture's image alignment and reserved-memory requirements. The page-table and stack setup cannot safely overwrite memory still needed by firmware, the description, or another boot artifact. Draw a physical-memory map at handoff with every live region.

## The first kernel instruction is another boundary

The documented RISC-V kernel entry requirements include the expected translation and interrupt state for the chosen boot method. A loader must not guess them from another architecture or from a kernel already running under virtual memory. For the conventional documented entry, satp is zero and supervisor interrupts are disabled; consult the current boot requirements for the full contract.

A jump into the image proves only that control was transferred. The next instruction fetch, early stack access, or mapping transition can fail before an ordinary console exists. A blank screen therefore does not uniquely mean the jump failed. Early serial output, a debugger, or another hardware observation may be required to locate the last confirmed stage.

## Debug from the last reliable observation

Suppose firmware prints "loading kernel" and then becomes silent. That message precedes several possible boundaries: storage read completion, image validation/decompression, memory placement, and entry transfer. Instrumenting a marker immediately before the transfer distinguishes loading failures from later failures. A marker at a known kernel entry point narrows the boundary again.

Do not infer that DRAM is fully correct from one firmware print: firmware may execute from ROM and use only a small memory region. Similarly, a working firmware UART configuration does not guarantee the kernel's chosen console path is configured. Chapter 40 separates these milestones in a complete boot investigation.

Chapter 25 now examines the firmware services that remain available after Linux starts. Firmware is not always finished merely because the kernel has taken over the normal instruction stream.

## Check

1. The loader passes a correct device-tree pointer, then overwrites the pointed-to bytes. Which handoff condition has failed?
   - A) The lifetime/content of the handed-off object
   - B) Only the printed pointer notation
   - C) The requirement that every RISC-V board use one reset address
   - Answer: A
   - Explanation: A correct address does not establish that the referenced object remains valid.

2. Which are platform or boot-contract questions? Select all that apply.
   - A) The reset entry location
   - B) Required kernel-entry register state
   - C) Whether a particular boot stage initialized DRAM
   - Answer: A, B, C
   - Explanation: The actual platform and selected entry protocol establish these facts.

3. Draw a physical-memory layout containing a kernel image, device tree, initramfs, firmware-reserved region, and early stack. Identify two overlap failures and when each would become visible.

4. Firmware's final print appears, but the kernel console does not. Propose a sequence of observations distinguishing image loading, entry transfer, early memory access, and console configuration. Do not assume one test distinguishes every cause.

5. Research challenge: read the RISC-V Linux boot requirements and record the version examined. Extract the alignment, register, translation, and interrupt conditions for a chosen entry method, then compare them with a specific firmware handoff.

## Limits

The chain is conceptual; real systems use different loaders, firmware, and security policies. The kernel handoff must follow the selected protocol, including EFI-specific behavior if applicable. Example RAM addresses illustrate non-overlap, not a universal board layout.

## Go Deeper

- [RISC-V Linux boot requirements](https://docs.kernel.org/arch/riscv/boot.html) — use the actual entry contract for the handoff exercise.
- [OpenSBI firmware documentation](https://github.com/riscv-software-src/opensbi/tree/master/docs/firmware) — compare firmware integration and payload arrangements.

## Related

- [Chapter 23 — Cache Coherency, DMA, and Memory Ordering](23_cache_coherency_dma_and_memory_ordering.md)
- [Chapter 25 — SBI and the Boundary Below Linux](25_sbi_and_the_boundary_below_linux.md)
