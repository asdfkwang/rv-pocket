# Chapter 25 — SBI and the Boundary Below Linux

> **Part VI — How Linux Finds Hardware**

## Why does the kernel still call firmware?

Chapter 24 handed normal execution to Linux, but machine-level control does not necessarily disappear. The Supervisor Binary Interface, SBI, defines services that supervisor software can request from its execution environment. A common arrangement implements them in M-mode firmware such as OpenSBI. The interface also permits other implementation environments.

The useful boundary is responsibility: Linux should not need a different machine-register sequence for every platform operation exposed through SBI. It requests a defined service and receives a defined result. The interface does not replace normal device drivers or make every hardware operation a firmware call.

## Separate an SBI call from a system call

Chapter 13 used user-mode ecall to enter the OS. An SBI ecall originates from the supervisor side and uses the SBI calling convention. For modern SBI extensions, a7 holds the extension identifier, a6 the function identifier, and a0–a5 the arguments. Returned a0 carries an error code and a1 a value where defined. Legacy extension conventions differ and should not be silently mixed with the modern form.

A user application cannot obtain supervisor SBI authority by placing an SBI extension number in a7 before its own ecall. Originating privilege and trap routing determine who interprets the request. The same instruction spelling can participate in different software interfaces.

## Probe a capability, then use its contract

Suppose an RV64 supervisor wants a timer service. It can use the SBI Base extension's probe function to ask whether the TIME extension is available. The identifiers in the current standard interface are:

```text
probe extension:
    a7 = 0x10          # Base extension
    a6 = 3             # probe_extension function
    a0 = 0x54494D45    # TIME extension identifier
    ecall
    returned a0 = error; a1 = availability value
```

A successful probe with a nonzero availability value means the extension is available. Software must still follow that extension's arguments and error rules. It cannot infer support for unrelated extensions from a firmware version string alone.

For the RV64 TIME set_timer function, a0 supplies the absolute timer value, a6 is zero, and a7 identifies TIME. Assume current time is 1000 ticks and the requested deadline is 1500. The call programs the requested timer event; returning successfully does not mean time has reached 1500 or that the supervisor handler has already run.

```text
S-mode: request deadline 1500
execution environment: arrange timer facility, return status
time advances to deadline: timer condition becomes pending
delivery rules permit service: supervisor handles the timer event
```

This connects directly to Chapter 11's distinction between deadline, pending event, and service time. A system with the relevant architectural timer extension may use a direct supervisor timer facility instead; not every timer operation on every RISC-V Linux system must be an SBI call.

## Errors describe a boundary, not a recovery policy

If an SBI function reports an unsupported operation or invalid parameter, the kernel must interpret the result according to the service. Recovery might use another supported mechanism, disable a capability, report failure, or stop a path that cannot safely continue. "Retry until success" is not a general policy.

System reset and hart-state management are other service categories. A reset request's successful behavior is not necessarily a normal return to the next instruction. Read each function's contract rather than assuming all SBI calls behave like ordinary data-returning functions.

Console diagnosis also needs separation. Firmware output, an early kernel console, and a normal UART driver can use different paths. Seeing firmware text establishes one path worked at that time; it does not establish Linux selected and initialized its own console. Device discovery is the next chapter's subject.

## Check

1. An application issues a U-mode ecall with a7 containing an SBI extension ID. What is the correct interpretation?
   - A) This alone grants access to the SBI service.
   - B) The originating mode and OS syscall path still govern the request.
   - C) It bypasses trap routing.
   - Answer: B
   - Explanation: Register values do not change privilege or select an arbitrary handler outside the established trap path.

2. Which statements about the timer example are correct? Select all that apply.
   - A) Probe success can establish TIME availability.
   - B) Setting deadline 1500 proves the timer handler already ran.
   - C) A deadline event and its eventual service are separate.
   - Answer: A, C
   - Explanation: A successful setup request is not completion of the future event.

3. Trace the registers across Base probing and TIME setup. Identify which result must be checked before using the returned value and which inputs must be reloaded for the next call.

4. Design a boot diagnostic that distinguishes firmware console output from Linux early and normal console output. Explain why a functioning SBI implementation alone cannot prove the normal UART driver's configuration is correct.

5. Research challenge: inspect the SBI specification version in use. Compare the RV32 and RV64 TIME argument layouts, and identify one legacy-call convention that must not be inferred from the modern error/value pair.

## Limits

The example uses standard modern SBI identifiers on RV64 and a common supervisor/firmware arrangement. Available extensions, virtualization, direct architectural facilities, and service-specific non-returning behavior require the selected environment's contract.

## Go Deeper

- [RISC-V SBI specification](https://github.com/riscv-non-isa/riscv-sbi-doc) — inspect Base probing, TIME, and service-specific return behavior.
- [OpenSBI](https://github.com/riscv-software-src/opensbi) — distinguish the interface specification from one firmware implementation.

## Related

- [Chapter 24 — Reset, Firmware, and Boot](24_reset_firmware_and_boot.md)
- [Chapter 26 — Device Tree: Describing the Machine](26_device_tree_describing_the_machine.md)
