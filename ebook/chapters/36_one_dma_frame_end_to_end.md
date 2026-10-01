# Chapter 36 — One DMA Frame, End to End

> **Part VIII — A Complete System**

## When does a frame become safe to display or reuse?

A display controller can read pixels from memory repeatedly while generating output. This DMA path combines Chapter 03's representation rules with Chapters 22–23's address, visibility, ordering, and ownership rules. A correct base address alone does not establish that a frame is correctly formatted or safe to modify.

Use a fictional controller with a documented format of four bytes per pixel: red, green, blue, and unused padding, in that byte order. It displays three pixels per row and two rows. Each row starts 16 bytes after the previous row, so the stride is 16 despite only 12 visible pixel bytes per row. Allocate 32 bytes for this example's two complete row slots.

## Compute the byte the device actually reads

Let the device-visible frame base be `0x40002000`. For pixel coordinates x and y, the byte offset is `y * stride + x * bytes_per_pixel`. The first pixel is x = 0, y = 0.

```text
row 0: offsets 00..03 pixel 0, 04..07 pixel 1, 08..0B pixel 2, 0C..0F padding
row 1: offsets 10..13 pixel 0, 14..17 pixel 1, 18..1B pixel 2, 1C..1F padding
```

Pixel x = 2, y = 1 begins at offset `16 + 2*4 = 24 = 0x18`, or DMA address `0x40002018`. Using width times pixel size as the stride would start row 1 at offset 12 and interpret padding as its first pixel. That is a layout error, not necessarily a cache error.

A red pixel with R = 255, G = 0, B = 0 has bytes `FF 00 00 00`. A little-endian 32-bit CPU load of those bytes returns `0x000000FF`. Writing `0x00FF0000` because it looks like a conventional RGB integer would instead create bytes `00 00 FF 00` and display blue under this controller's format.

## Publish one completed frame

The CPU renders into a buffer it owns. It arranges the mapping and visibility required for device reads, programs the correct format/stride/address according to the controller protocol, and requests presentation. The device may latch a new address only at a defined display boundary rather than immediately when the CPU writes a register.

For continuous scanout, one frame-end interrupt does not automatically mean the controller will never read that buffer again. It may start scanning the same buffer for the next refresh. Reuse requires a documented retirement condition: for example, a new buffer is latched and all reads from the old buffer have ended.

This differs from a one-shot copy engine whose transfer completion may end all accesses for that submitted operation. The word DMA does not specify the lifetime; the device protocol does.

## Double buffering needs a handoff, not just two allocations

Use front buffer A for scanout and back buffer B for rendering. The CPU finishes B, establishes visibility, and queues a switch at the controller's supported boundary. It leaves A untouched until the presentation/completion protocol confirms that A is retired.

```text
render B while device scans A
publish B and request boundary-aligned switch
device latches B; finish all accesses to A as specified
A becomes available for the next render; B remains device-owned
```

If the CPU swaps its software pointers before hardware latches B and starts rendering into A, the old scanout can observe mixed content. Two buffers alone did not prevent tearing because their ownership transition was wrong. If rendering outruns available retired buffers, the application must wait, drop work, or follow an explicit buffering policy.

## Classify the symptom before choosing a fix

Consistently swapped colors suggest a format disagreement. Rows shifted by a repeated amount suggest stride or layout. An old whole frame suggests publication, completion, or selection issues. Mixed horizontal regions can suggest tearing, but that observation alone does not prove a unique cause.

Use a small distinctive test pattern, inspect the expected bytes at known offsets, verify the DMA address and mapping, and record presentation/retirement events. Chapter 39 uses this evidence method to avoid fixes that merely change timing.

## Check

1. Where does pixel x = 2, y = 1 begin in the example?
   - A) DMA address `0x40002014`
   - B) DMA address `0x40002018`
   - C) DMA address `0x4000200C`
   - Answer: B
   - Explanation: The offset is one 16-byte row plus two four-byte pixels.

2. Which conditions matter before reusing the old front buffer? Select all that apply.
   - A) Hardware has completed the relevant old-buffer accesses.
   - B) The software merely has two allocated buffers.
   - C) The documented retirement/ownership transition occurred.
   - Answer: A, C
   - Explanation: Buffer count alone does not synchronize scanout with rendering.

3. Write the exact two-row byte layout for red, green, and blue pixels in row 0 and the reverse in row 1. Include padding. Predict what the controller sees if stride is mistakenly programmed as 12.

4. Draw a timeline showing tearing despite double buffering when software reuses A before hardware latches B. Identify the event needed to authorize reuse.

5. Research challenge: inspect a Linux DRM/KMS page-flip or buffer synchronization contract. Identify which event or fence your chosen path uses for safe reuse, and distinguish rendering completion from presentation and retirement.

## Limits

The controller and pixel format are fictional. Real displays add tiling, planes, modifiers, scaling, color management, fences, and subsystem-specific buffer ownership. Follow the actual DRM/device contract rather than converting the example into a universal scanout recipe.

## Go Deeper

- [Linux DRM/KMS](https://docs.kernel.org/gpu/drm-kms.html) — inspect presentation and framebuffer interfaces.
- [Linux DMA buffer sharing](https://docs.kernel.org/driver-api/dma-buf.html) — distinguish shared storage from synchronization and lifetime.

## Related

- [Chapter 35 — One Button Press, End to End](35_one_button_press_end_to_end.md)
- [Chapter 37 — Reading a Datasheet](37_reading_a_datasheet.md)
