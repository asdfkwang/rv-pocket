# Chapter 36 — One DMA Frame, End to End

> **Part VIII — A Complete System**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

A display frame is a large block of data that must be transferred quickly and regularly. DMA (Chapter 22) makes this possible. Tracing one frame end to end shows how the CPU, driver, DMA engine, and display controller work together — and where the bottlenecks are.

## Core Idea

A frame is a buffer of pixel data. The CPU (or GPU) writes the frame to memory. The driver maps the buffer for DMA and programs the display controller. The display controller reads the buffer via DMA and sends pixels to the display. An interrupt signals frame completion. The process repeats for the next frame.

## Worked Example

```text
1. CPU writes frame to buffer (in page cache)
2. Driver: flush cache, map buffer for DMA
3. Driver: program display controller with DMA address
4. Display controller: read buffer via DMA, send pixels
5. Display controller: raise interrupt (frame done)
6. Driver: unmap buffer, wake waiting thread
7. CPU: write next frame
```

Each step is a handoff. The frame travels from CPU memory to the display without the CPU copying every pixel.

## The Same Idea Elsewhere

- **Hardware:** the display controller is a bus master that reads memory via DMA.
- **RISC-V:** the CPU programs the display controller via MMIO (Chapter 09).
- **OS:** the kernel provides the DMA API and the framebuffer subsystem.
- **Linux/driver:** the display driver manages the frame buffer and DMA transfers.

## When It Fails

A frame is partially displayed — the top half is the new frame, the bottom half is the old frame. The driver started DMA before the CPU finished writing the frame. The fix: use double buffering — write to one buffer while DMA reads the other.

## Check

1. A display driver maps a frame buffer for DMA. What address does it give to the display controller?
   - A) A kernel virtual address
   - B) A user-space virtual address
   - C) A DMA (bus) address
   - D) A physical address
   - Answer: C
   - Explanation: The display controller uses DMA addresses. The driver maps the buffer and gets a DMA address.
   > Hint: What address does the device understand? What does the DMA API return?

2. Which of these are part of the frame transfer path? Pick all that apply.
   - A) CPU writes frame to buffer
   - B) Driver maps buffer for DMA
   - C) Display controller reads buffer via DMA
   - D) Page cache schedules the transfer
   - Answer: A, B, C
   - Explanation: The CPU (A), driver (B), and display controller (C) are all part of the path. The page cache (D) is for storage, not display.
   > Hint: What layers does a frame cross? What is not involved?

3. A frame is partially displayed. The top half is new, the bottom half is old. What is the most likely cause?
   - A) The display controller is broken
   - B) DMA started before the CPU finished writing the frame
   - C) The buffer is too small
   - D) The interrupt is not configured
   - Answer: B
   - Explanation: If DMA starts before the CPU finishes writing, the display controller reads a mix of old and new data. The fix is double buffering.
   > Hint: What is the race? When does DMA read? When does the CPU write?

4. Explain why double buffering solves the partial frame problem — what are the two buffers, and how do they alternate?

5. A display driver uses DMA for frame transfer. The display shows garbage. List three possible causes and the one register read that would distinguish them.

## Limits

This chapter shows a simple frame transfer. Real displays have multiple layers, vsync, and complex timing. The principle — CPU writes, DMA transfers, controller displays — is the same.

## Go Deeper

- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Framebuffer](https://docs.kernel.org/fb/)

## Related

Chapter 35, Chapter 37
