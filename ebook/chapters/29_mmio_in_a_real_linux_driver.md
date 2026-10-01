# Chapter 29 — MMIO in a Real Linux Driver

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Device registers are accessed through MMIO (Chapter 09). In Linux, device registers are mapped into the kernel's address space with `ioremap` and accessed with `readl`/`writel`. These functions are not plain dereferences — they handle byte ordering, barriers, and architecture-specific requirements.

## Core Idea

A driver maps device registers with `devm_platform_ioremap_resource` (which returns an `__iomem` pointer). It then reads and writes with `readl`/`writel` (or `readb`/`writeb` for 8-bit registers). These functions ensure correct access: they prevent compiler reordering, handle byte ordering, and issue any required barriers.

## Worked Example

```c
void __iomem *base = devm_platform_ioremap_resource(pdev, 0);

// Write to CONTROL register (offset 0x08)
writel(0x01, base + 0x08);

// Read STATUS register (offset 0x04)
u32 status = readl(base + 0x04);
```

The `writel` writes 4 bytes to the mapped address. The `readl` reads 4 bytes. Both are memory barriers — the compiler will not reorder them.

## The Same Idea Elsewhere

- **Hardware:** the device registers are at fixed offsets from the base address. The driver writes to configure and reads to check status.
- **RISC-V:** the CPU accesses registers with normal load/store instructions. The `readl`/`writel` functions compile to these.
- **OS:** the kernel provides the `ioremap` mechanism and the `readl`/`writel` accessors.
- **Linux/driver:** the driver uses these functions to access device registers safely.

## When It Fails

A driver dereferences an `__iomem` pointer directly (`*base = 0x01`). On some architectures, this works. On others, it fails — the compiler may reorder the write, or the byte order may be wrong. The bug is architecture-dependent and may not show up on the development machine. The fix: always use `readl`/`writel`.

## Check

1. A driver has an `__iomem` pointer to a device register. How should it write to the register?
   - A) `*base = value`
   - B) `writel(value, base)`
   - C) `memcpy(base, &value, 4)`
   - D) `base[0] = value`
   - Answer: B
   - Explanation: `writel` is the correct accessor for `__iomem` pointers. It handles byte ordering and barriers. Direct dereference may work on some architectures but is not portable.
   > Hint: What does `writel` do that a plain write does not?

2. Which of these are true about `readl`/`writel`? Pick all that apply.
   - A) They are memory barriers
   - B) They handle byte ordering
   - C) They can be used on any pointer
   - D) They prevent compiler reordering
   - Answer: A, B, D
   - Explanation: `readl`/`writel` are barriers (A), handle byte ordering (B), and prevent compiler reordering (D). They must only be used on `__iomem` pointers (C is false).
   > Hint: What could go wrong with a plain write? What do these functions prevent?

3. A driver uses `writel` to write to a control register. The write appears to succeed but the device does not respond. What is the most likely cause?
   - A) The `writel` function is broken
   - B) The driver wrote to the wrong offset
   - C) The device is not powered
   - D) The kernel does not support MMIO
   - Answer: B
   - Explanation: `writel` is reliable. The most likely cause is a wrong offset — the driver wrote to the wrong register.
   > Hint: What does `writel` do? What could the driver get wrong?

4. Explain why `readl`/`writel` exist instead of plain dereference — what architecture-specific problems do they solve?

5. A driver writes to a control register with `writel` but the device does not change state. List three possible causes and the one register read that would distinguish them.

## Limits

This chapter shows 32-bit register access. Real devices may have 64-bit registers (`readq`/`writeq`), 8-bit registers (`readb`/`writeb`), or register sequences with side effects. Always read the device manual for the correct access width and semantics.

## Go Deeper

- [Linux Device I/O](https://docs.kernel.org/driver-api/device-io.html)
- [Linux MMIO](https://docs.kernel.org/driver-api/mmio.html)

## Related

Chapter 28, Chapter 30
