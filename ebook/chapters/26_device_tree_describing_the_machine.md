# Chapter 26 — Device Tree: Describing the Machine

> **Part VI — How Linux Finds Hardware**

## How does Linux learn where hardware is?

The kernel cannot generally discover a simple memory-mapped peripheral by reading arbitrary addresses until something responds. Some buses support enumeration; many on-chip devices need a firmware-provided description. A device tree describes hardware nodes, resources, and relationships so software can instantiate suitable device objects.

The description is data, not code that initializes every device. A correct node does not enable a clock, clear a reset, or guarantee a driver exists. It supplies information that the kernel and drivers interpret through documented bindings.

## Decode one fictional node completely

This illustrative tree describes the teaching UART. Its invented compatible string requires a matching teaching driver and binding; it is not an existing Linux UART binding.

```dts
/ {
    #address-cells = <2>;
    #size-cells = <2>;
    soc {
        compatible = "simple-bus";
        #address-cells = <2>;
        #size-cells = <2>;
        ranges;
        uart@10000000 {
            compatible = "rvpocket,teaching-uart";
            reg = <0x0 0x10000000 0x0 0x1000>;
            status = "okay";
        };
    };
};
```

The parent's address/size cell counts determine how to split reg. Each cell is 32 bits. The first two cells form address `0x0000000010000000`; the next two form size `0x0000000000001000`. The half-open interval is `[0x10000000, 0x10001000)`. Its last included byte is `0x10000FFF`, matching Chapter 09.

The empty ranges property declares identity translation between this bus and its parent. On another bus, ranges can translate child addresses into different parent addresses. Therefore a child's reg value need not be a CPU physical address before parent translation. Omitting ranges is not universally equivalent to explicitly declaring identity translation.

The unit address after `@` identifies the node's address in the tree convention. It is not a replacement for reg. The compatible string identifies the programming model software can match; it is not merely a human-readable product name.

## From a node to a probe attempt

On the appropriate populated bus, Linux creates a device representation with translated resources. The bus's matching rules compare it with registered drivers. A match allows a probe attempt, where the driver acquires resources and initializes state. Matching is not the same as successful initialization.

```text
firmware description
    -> bus/device population
    -> compatible match with available driver
    -> probe receives resources
    -> initialization succeeds or reports a failure/defer condition
```

The teaching fragment omits interrupts, clocks, resets, and pins because their provider bindings must be specified before their cells can be interpreted. Adding an arbitrary `interrupts = <5>` would not be self-explanatory: the interrupt parent's #interrupt-cells and binding determine what the cells mean. Chapter 28 discusses resources and dependencies acquired during probe.

## Diagnose a described but inactive device

Suppose the node is present and enabled, but the device is unusable. Confirm that the relevant bus populated it, that a suitable driver is available and matched, and that probe ran successfully. If probe deferred because a clock provider was not ready, changing the MMIO address is unlikely to help.

Conversely, successful probe does not prove every description is correct. A wrong register size or interrupt route may remain latent until an operation accesses the missing region or waits for completion. Validate both the binding's structure and the board's actual wiring.

Schemas catch many malformed properties, but cannot prove that a physical wire goes to the declared pin or that the board designer used the expected clock. Treat the description as a claim to test against platform evidence.

The next chapter follows the matched driver as a set of callbacks and lifetimes rather than as a program with one main function.

## Check

1. What is the last byte of the example's resource range?
   - A) `0x10001000`
   - B) `0x10000FFF`
   - C) `0x10000004`
   - Answer: B
   - Explanation: The size is 0x1000 bytes; the half-open end is one past the final byte.

2. Which statements are correct? Select all that apply.
   - A) The parent defines how many cells encode the child's address and size.
   - B) A compatible match proves the hardware has finished initialization.
   - C) A bus can translate a child's address through ranges.
   - Answer: A, C
   - Explanation: Resource decoding and driver initialization are separate stages.

3. Change the parent to one address cell and one size cell. Rewrite reg for the same range and explain why retaining the original four cells changes its interpretation.

4. Design an investigation for a node present in the live tree but with no working device. Include population, matching, probe, dependency, and resource evidence without assuming the first plausible cause is proven.

5. Research challenge: select a real UART binding schema. Decode its interrupt, clock, and reset properties using the provider bindings. Compare its required register layout with the fictional map and explain why sharing the word UART is not enough for compatibility.

## Limits

The DTS is an explanatory fragment for fictional hardware, not a complete deployable board description. Linux also supports hardware discovery through other mechanisms, including ACPI and enumerable buses. Binding schemas and provider relationships determine real property meanings.

## Go Deeper

- [Devicetree basic structure and properties](https://devicetree-specification.readthedocs.io/en/stable/devicetree-basics.html) — inspect reg, ranges, and parent cell counts.
- [Linux Devicetree usage model](https://docs.kernel.org/devicetree/usage-model.html) — follow device population and matching.
- [Linux Devicetree bindings](https://github.com/torvalds/linux/tree/master/Documentation/devicetree/bindings) — choose a concrete schema for the research task.

## Related

- [Chapter 25 — SBI and the Boundary Below Linux](25_sbi_and_the_boundary_below_linux.md)
- [Chapter 27 — What a Linux Device Driver Is](27_what_a_linux_device_driver_is.md)
