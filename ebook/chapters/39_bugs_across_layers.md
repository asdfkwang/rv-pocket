# Chapter 39 — Bugs Across Layers

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

Real bugs do not stay in one layer. A symptom in userspace may be caused by a driver bug, a hardware errata, or a misconfigured device tree. Debugging across layers is the skill that separates "I fixed the symptom" from "I fixed the bug." The key is to find the layer where the model breaks.

## Core Idea

Every layer has a contract: the datasheet describes the hardware, the driver matches the datasheet, the kernel provides the framework, the application uses the API. A bug is a contract violation. To debug, find the layer where the contract breaks: does the hardware match the datasheet? Does the driver match the datasheet? Does the driver match the kernel API? Does the application match the driver API?

## Worked Example

A display shows wrong colors:

```text
1. Check application: are the pixel values correct? Yes.
2. Check driver: does it write the correct values to the framebuffer? Yes.
3. Check hardware: does the display controller read the correct addresses? Yes.
4. Check datasheet: does the display expect the same pixel format? No — it expects BGR, not RGB.
```

The bug is a contract violation between the driver and the hardware: the driver writes RGB, the display expects BGR. The fix: swap the color channels in the driver.

## The Same Idea Elsewhere

- **Hardware:** the hardware follows the datasheet (or the errata).
- **RISC-V:** the CPU follows the ISA.
- **OS:** the kernel follows its own APIs.
- **Linux/driver:** the driver follows the datasheet and the kernel API.

## When It Fails

A driver works on one board but not another. The driver assumes a fixed clock frequency. The other board has a different clock. The driver reads the wrong timing and programs the device incorrectly. The fix: read the clock frequency from the device tree, not a hard-coded constant.

## Check

1. A display shows wrong colors. The application writes correct pixel values. What is the next step?
   - A) Check the driver
   - B) Check the hardware
   - C) Check the datasheet
   - D) Check the device tree
   - Answer: A
   - Explanation: The application is correct. The next layer is the driver. Check if the driver writes the correct values to the framebuffer.
   > Hint: Where is the next layer? What does the driver do with the pixel values?

2. Which of these are contract violations? Pick all that apply.
   - A) The driver writes to the wrong register offset
   - B) The application uses the wrong API
   - C) The hardware does not match the datasheet
   - D) The kernel does not match the CPU
   - Answer: A, B, C
   - Explanation: A is a driver-datasheet violation, B is an application-driver violation, C is a hardware-datasheet violation. D is not a typical violation — the kernel is ported to match the CPU.
   > Hint: What are the contracts? Which layer violates which?

3. A driver works on one board but not another. Both use the same chip. What is the most likely cause?
   - A) The driver is not compiled into the kernel
   - B) The driver assumes a fixed clock frequency
   - C) The kernel does not support device trees
   - D) The device is not described in the device tree
   - Answer: B
   - Explanation: Different boards may have different clocks. A hard-coded clock frequency works on one board but not another.
   > Hint: What is different between boards? What does the driver assume?

4. Explain how to debug a cross-layer bug — what is the systematic approach to finding the layer where the contract breaks?

5. A driver works in the lab but fails in the field. The field has a different power supply. What is the most likely cause, and what would you check first?

## Limits

This chapter shows a simple cross-layer bug. Real bugs involve timing, concurrency, and hardware errata. The principle — find the layer where the contract breaks — is the same.

## Go Deeper

- [Linux Kernel Debugging](https://docs.kernel.org/admin-guide/bug-hunting.html)
- [Linux Device Drivers, Book](https://lwn.net/Kernel/LDD3/)

## Related

Chapter 38, Chapter 40
