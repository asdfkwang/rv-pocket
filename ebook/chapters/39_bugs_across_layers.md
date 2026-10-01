# Chapter 39 — Bugs Across Layers

> **Part VIII — A Complete System**

## How do you find the boundary that broke?

A cross-layer symptom often admits several explanations. Wrong pixels can come from format, stride, addressing, visibility, lifetime, or the application's own drawing logic. Listing plausible causes is a start; debugging requires observations that separate them.

State the expected contract at each handoff, then locate the last observation that matches it and the first that does not. Keep observations distinct from interpretations. "The device read address X" requires different evidence from "software intended to program X."

## Work a repeated-row corruption to a cause

Reuse Chapter 36's frame: width 3, height 2, four bytes per pixel, stride 16. The DMA base is `0x40002000`. The CPU writes distinctive row data, and the allocation reserves four padding bytes after each row. The display's first row looks correct; the second begins with a padding-like pixel and the remaining pixels appear shifted.

Initial hypotheses include wrong stride, stale payload, and an incorrect base. Establish concrete evidence:

| Observation | What it supports | What it does not prove |
| --- | --- | --- |
| CPU buffer has the expected bytes at offsets 0–27 | producer layout is correct at observation time | device visibility or later immutability |
| Mapping/ownership trace is correct through presentation | tested publication/lifetime sequence is consistent | every register field is correct |
| Device base field reports `0x40002000` under its documented readback rules | selected base matches this test | stride matches |
| Device stride field reads 12 | row step differs from producer's 16 | the origin of the wrong value |

Now calculate the consequence rather than guessing. With stride 12, row 1 begins at offset `0x0C`, where the producer placed padding. Its next pixels come from offsets `0x10` and `0x14`, the first two real pixels of the intended second row. That prediction matches the observed pattern.

Follow the stride value backward to the producer of the register setting. Suppose the driver used `width * 4` instead of the supplied pitch. Correct that expression and validate that allocation bounds still cover the last addressed pixel. The root cause is a contract mismatch between buffer layout and device programming; the visible symptom occurs later at scanout.

## Choose a falsifying experiment

Change the padding to a conspicuous value while keeping visible pixels unchanged. Under the stride hypothesis, the first pixel of the second displayed row should track the padding value. Under a simple red/blue swap hypothesis, that positional dependence is not predicted. This experiment distinguishes explanations more effectively than inserting a delay and observing that the symptom sometimes changes.

Before instrumenting, check that the observation is safe. Reading a consuming FIFO, clearing an event, or changing timing can perturb the state being diagnosed. Prefer non-destructive status, recorded software metadata, and bounded trace buffers where appropriate. State the observation's limitations in the bug report.

## Separate a trigger from a cause

Suppose corruption appears only under heavy load. Load may enlarge the time window for a lifetime race or change when a stale copy is observed; it does not establish "CPU too slow" as the cause. Similarly, a different power supply is a clue about operating conditions, not proof of an electrical fault. Reproduce controlled changes and measure the relevant boundary.

A fix should restore the violated contract. A delay that hides early reuse does not prove the device has finished. A larger buffer that hides an out-of-range DMA write does not validate the programmed length. A broad cache flush that changes timing does not prove the missing guarantee was cache visibility.

## Preserve the reasoning in a regression case

For the stride failure, keep a tiny padded frame test with an unmistakable per-row pattern. Verify the expected register stride and the addresses of first/last pixels. For a lifetime failure, exercise delayed completion and timeout rather than testing only the fast successful path.

The report should include initial conditions, expected boundary behavior, actual observations, competing hypotheses, the discriminating test, and the corrected invariant. Chapter 40 applies this same method to the complete boot-to-userspace chain, where the missing output can be many stages after the actual error.

## Check

1. With base `0x40002000` and wrongly programmed stride 12, where does row 1 begin?
   - A) `0x4000200C`
   - B) `0x40002010`
   - C) `0x40002018`
   - Answer: A
   - Explanation: The controller advances by its programmed stride, regardless of the producer's intended layout.

2. Which observations alone prove that a device read the intended payload? Select all that apply.
   - A) A correct CPU-side buffer dump
   - B) A successful DMA mapping call
   - C) Neither of these alone proves device consumption
   - Answer: C
   - Explanation: The dump and mapping establish different prerequisites, not the final device-read history.

3. Predict the complete second row for the wrong-stride case using distinct values for padding and all three intended pixels. Design one changed input that distinguishes this from a component-order error.

4. A 1 ms delay makes corruption disappear. Construct two different underlying bugs consistent with that observation. For each, propose evidence that would distinguish a real repair from a timing workaround.

5. Research challenge: take one public kernel bug fix related to DMA, IRQ lifetime, or register access. At fixed before/after revisions, identify the violated contract and explain how the change restores it. Design a regression scenario that would fail for the old reasoning.

## Limits

The worked evidence is a constructed case with an explicitly known frame format and safe readback semantics. Real failures can have multiple interacting causes. A hypothesis is justified only to the extent that the available observations and controlled tests distinguish it from alternatives.

## Go Deeper

- [Linux DMA debugging](https://docs.kernel.org/core-api/dma-api.html#part-iii-debug-drivers-use-of-the-dma-api) — inspect what DMA API checking can and cannot establish.
- [Linux tracing documentation](https://docs.kernel.org/trace/) — choose evidence collection appropriate to the execution context.
- [Linux driver debugging guide](https://docs.kernel.org/driver-api/driver-model/driver.html) — relate driver state and lifecycle to the investigation.

## Related

- [Chapter 38 — Reading a Linux Driver](38_reading_a_linux_driver.md)
- [Chapter 40 — From Power-On to Userspace](40_from_power_on_to_userspace.md)
