# Chapter 26 — Device Tree: Describing the Machine

> **Part VI — How Linux Finds Hardware**  
> **Rule:** Easy to read. Hard to solve. Deep when you want it.

## Why This Matters

The kernel is one binary that runs on many boards. Each board has different memory maps, different devices, different interrupt numbers. The **Device Tree** is a data structure that describes the hardware to the kernel. Without it, the kernel would need a different build for every board.

## Core Idea

A Device Tree is a tree of nodes. Each node describes a device or a bus. Nodes have properties (key-value pairs) that describe the device: registers (address ranges), interrupts, clocks, and compatible strings. The kernel reads the device tree at boot, matches drivers to devices via compatible strings, and initializes drivers with the described resources.

## Worked Example

```dts
/ {
    soc {
        uart0: serial@10000000 {
            compatible = "ns16550a";
            reg = <0x0 0x10000000 0x0 0x1000>;
            interrupts = <1>;
            clock-frequency = <11520000>;
        };
    };
};
```

The kernel finds the `serial@10000000` node, matches the `ns16550a` compatible string to a UART driver, and passes the register range and interrupt number to the driver's probe function.

## The Same Idea Elsewhere

- **Hardware:** the device tree is a description, not hardware. It is stored in memory (loaded by firmware) and read by the kernel.
- **RISC-V:** the device tree is the standard hardware description for RISC-V. Firmware creates it or passes a pre-built one.
- **OS:** the kernel parses the device tree at boot and creates platform devices from it.
- **Linux/driver:** a driver declares which compatible strings it supports. The kernel matches and calls probe.

## When It Fails

The device tree says the UART is at `0x10000000` but the hardware designer moved it to `0x20000000`. The kernel probes the driver with the wrong address. The driver reads garbage. The bug is not the driver — it is the device tree's inaccurate description. The fix: correct the device tree.

## Check

1. A device tree node has `compatible = "ns16550a"`. What does the kernel do with this?
   - A) Load the ns16550a driver and call its probe function
   - B) Ignore it — compatible strings are informational
   - C) Use it to set the device's clock frequency
   - D) Write it to the kernel log
   - Answer: A
   - Explanation: The compatible string is how the kernel matches a driver to a device. When a match is found, the driver's probe function is called.
   > Hint: How does the kernel know which driver to use for a device?

2. Which of these are device tree properties? Pick all that apply.
   - A) reg (register address range)
   - B) interrupts (interrupt number)
   - C) compatible (driver match string)
   - D) speed (device clock speed)
   - Answer: A, B, C
   - Explanation: reg, interrupts, and compatible are standard device tree properties. speed is not a standard property (clock-frequency is).
   > Hint: What does the kernel need to know about a device? Address, interrupt, and driver.

3. The kernel boots but a device is not initialized. The device tree node exists with the correct compatible string. What is the most likely cause?
   - A) The driver is not compiled into the kernel
   - B) The device tree is corrupted
   - C) The kernel does not support device trees
   - D) The device is not powered
   - Answer: A
   - Explanation: If the driver is not available, the kernel cannot match the compatible string. The device is described but no driver claims it.
   > Hint: The kernel has the description. What else does it need to initialize the device?

4. Explain why the device tree is a better approach than hard-coding hardware descriptions in the kernel — what problems does it solve?

5. A device tree describes a device at address 0x10000000 with size 0x1000. The driver probes successfully but reads garbage. List three possible causes and the one register read that would distinguish them.

## Limits

This chapter shows a simple device tree. Real device trees are large, with nested buses (PCIe, USB), power domains, and clock trees. The principle — describe hardware in data, match drivers by compatible string — is the same.

## Go Deeper

- [Devicetree Specification](https://devicetree-specification.readthedocs.io/)
- [Linux Devicetree](https://docs.kernel.org/devicetree/index.html)

## Related

Chapter 25, Chapter 27
