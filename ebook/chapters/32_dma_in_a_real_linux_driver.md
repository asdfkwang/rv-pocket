# Chapter 32 — DMA in a Real Linux Driver

> **Part VII — Linux Device Drivers**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

DMA (Chapter 22) lets a device transfer data without the CPU. In Linux, a driver uses the DMA API to map buffers for device access. The API handles address translation, cache coherency, and mapping lifetime. Using it wrong causes data corruption, crashes, and security vulnerabilities.

## Core Idea

A driver maps a buffer with `dma_map_single` (for a single buffer) or `dma_map_sg` (for scatter-gather). The API returns a DMA address that the device can use. The driver programs the DMA engine with this address. When the transfer is done, the driver unmaps with `dma_unmap_single` or `dma_unmap_sg`. The API handles cache coherency at map and unmap time.

## Worked Example

```c
// Map a buffer for DMA
dma_addr_t dma_handle = dma_map_single(dev, buf, len, DMA_TO_DEVICE);
if (dma_mapping_error(dev, dma_handle)) {
    // handle error
}

// Program the DMA engine
writel(dma_handle, uart->base + UART_DMA_ADDR);
writel(len, uart->base + UART_DMA_LEN);
writel(UART_DMA_START, uart->base + UART_DMA_CONTROL);

// ... later, after the interrupt ...
dma_unmap_single(dev, dma_handle, len, DMA_TO_DEVICE);
```

The driver never touches the DMA address directly — it passes it to the device.

## The Same Idea Elsewhere

- **Hardware:** the DMA engine reads and writes memory directly. It uses physical (bus) addresses.
- **RISC-V:** the CPU programs the DMA engine via MMIO (Chapter 09).
- **OS:** the kernel provides the DMA API that handles mapping and coherency.
- **Linux/driver:** the driver uses the DMA API to safely share buffers with devices.

## When It Fails

A driver maps a buffer, starts DMA, and immediately unmaps. The DMA engine is still reading the buffer. The driver frees the buffer. The DMA engine writes to freed memory. The fix: unmap only after the transfer is complete (after the interrupt).

## Check

1. A driver maps a buffer with `dma_map_single`. What address does it get?
   - A) A kernel virtual address
   - B) A user-space virtual address
   - C) A DMA (bus) address
   - D) A physical address
   - Answer: C
   - Explanation: `dma_map_single` returns a DMA address — the address the device uses. It may or may not equal the physical address (IOMMU).
   > Hint: What address does the device understand? What does the API return?

2. Which of these are true about the DMA API? Pick all that apply.
   - A) It handles cache coherency
   - B) It translates addresses for the device
   - C) It can be used on any pointer
   - D) It manages mapping lifetime
   - Answer: A, B, D
   - Explanation: The DMA API handles coherency (A), translates addresses (B), and manages lifetime (D). It must be used on appropriate buffers (C is false).
   > Hint: What does the API do for you? What must you still do?

3. A driver unmaps a DMA buffer before the transfer completes. What is the most likely outcome?
   - A) The transfer succeeds
   - B) The DMA engine writes to freed memory
   - C) The kernel panics immediately
   - D) The device stops working
   - Answer: B
   - Explanation: If the buffer is freed while DMA is in progress, the engine may write to freed memory. This causes corruption or crashes.
   > Hint: What is the DMA engine doing when the buffer is freed? Where does it write?

4. Explain the difference between `dma_map_single` and `dma_map_sg` — when would you use each?

5. A driver uses `dma_map_single` for a buffer, starts DMA, and the transfer completes. The driver reads the buffer but sees stale data. What is the most likely cause?

## Limits

This chapter shows simple DMA mapping. Real drivers use scatter-gather lists, DMA rings, and IOMMU. The principle — map, transfer, unmap — is the same.

## Go Deeper

- [Linux DMA API](https://docs.kernel.org/core-api/dma-api.html)
- [Linux Driver API (DMA)](https://docs.kernel.org/driver-api/dma.html)

## Related

Chapter 31, Chapter 33
