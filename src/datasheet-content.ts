import { UART_TX_ADDRESS } from "./sim/uart";
import { WATCHED_RAM_ADDRESS, INITIAL_STORE_ADDRESS, formatWord, formatWordBytes } from "./sim/memory";
import { BUTTON_ADDRESS, formatAddress, GPIO_IRQ, LED_ADDRESS, MTIMECMP_ADDRESS, PLATFORM_MEMORY_MAP, TIMER_FREQUENCY_HZ, UART1_IRQ } from "./platform";
import { TIMER_ADDRESS } from "./sim/timer";

// RV Pocket's Atlantis-inspired hardware reference, separate from the study book.
export const DATASHEET_SECTIONS = [
  {
    id: "events", title: "Input and Frame Events",
    summary: "A button IRQ notifies the CPU. A short handler records the input and returns; main applies the event and draws the next screen.",
    columns: ["Operation", "Responsibility"],
    rows: [
      ["READ BUTTON", "Snapshot the input for this handler invocation"],
      ["RECORD INPUT EVENT", "Queue the snapshot for main"],
      ["ACK IRQ", "Clear the source request; the handler still has to return"],
      ["APPLY INPUT", "In main: A-down reverses the automatic dot; D-pad moves the marker"],
      ["event_wait()", "Wait safely when the queue is empty; otherwise return the next event"],
      ["timer_every_ms(100)", "Request a frame event at 10 Hz"],
    ],
    notes: [
      "WAIT FOR RELEASE inside the handler holds the CPU there. Timer requests become pending, main cannot step the animation, and the display keeps scanning its last frame. ACK does not itself return from the handler.",
      "Runtime snapshots and queues press, release, and D-pad events, preserves context, and supplies the safe wait-and-dequeue operation. Controller setup, trap CSRs, synchronization primitives, and OS scheduling remain deferred.",
      "Press A once to reverse direction; holding it does not repeat the action. Release requests IRQ service but does not reverse direction again. D-pad clicks or arrow keys move one pixel per input.",
      "Frame service is an application rate of ten updates per second, independent of the 1 GHz MTIME frequency. Requests coalesce while main is blocked; returning does not replay a burst of missed frames.",
      "Missing ACK leaves the source pending. The prototype retries once per 100 ms tick, so a broken program remains observable without blocking the browser.",
    ],
  },
  {
    id: "display",
    title: "Display",
    summary: "The Pocket's teaching display has power, readiness, mode, and output state. Its test generator can light the screen before a framebuffer program is introduced.",
    columns: ["Helper", "Behavior"],
    rows: [
      ["display_power_on()", "Start device power-up / ready after 500 ms"],
      ["start_button_led_irqs()", "Start the supplied Episode 05 button service before display setup"],
      ["display_wait_ready()", "Wait for READY; without power it cannot finish"],
      ["display_select_test_mode()", "Select the internal test pattern once ready"],
      ["display_enable()", "Enable output once ready and configured"],
      ["FRAMEBUFFER", "0x00003000–0x0000307F / 16 × 8 pixels, 1 byte per pixel"],
      ["ROW STRIDE", "16 bytes / address = FB_BASE + y × ROW_BYTES + x"],
    ],
    notes: [
      "Episode 07 uses framebuffer mode, configured by the supplied runtime. clear_framebuffer() clears the 128 visible bytes before each marker write. Coordinates are test inputs for the installed program; they do not change the editor draft.",
      "Settings sent before READY are ignored, not queued. Waiting later does not replay an ignored command. OPEN COVER shows actual execution results.",
      "The supplied runtime handles display transport and readiness waiting. These helpers describe RV Pocket's teaching display, not an Atlantis display controller.",
      "Editing a startup sequence changes the draft only. Build & Flash installs it; RESET restarts the installed sequence.",
    ],
  },
  {
    id: "memory-map",
    title: "Memory Map",
    summary: "RV POCKET — RV32G. This SoC adopts the low-address layout of Tenstorrent Atlantis. The CPU uses this 32-bit physical address space to reach RAM, boot ROM, and memory-mapped peripherals.",
    columns: ["Block", "Address range", "Size", "Purpose"],
    rows: PLATFORM_MEMORY_MAP.map((region) => [region.block, `${formatAddress(region.base)}–${formatAddress(region.base + region.size - 1)}`, region.sizeLabel, region.purpose]),
    notes: [
      "RESET starts execution at 0x80000000 in the 8 KiB Boot ROM, then hands control to firmware and the program.",
      "RV Pocket uses RAM directly in the low address space. Atlantis's DDR_HI window above 4 GiB is omitted from this RV32G platform. PRCM and UART0/2/3/4 are outside this revision's map.",
      "Ranges in this table include both endpoints. Gaps between listed blocks are unassigned. Device addresses are a platform choice, not addresses prescribed by the RISC-V ISA.",
    ],
    detail: {
      title: "Episode 02 / Reading a RAM word",
      summary: "A store instruction can send its value to RAM or to a device register. The destination address decides which. The supplied program is observed at one word inside the 2 GiB region.",
      columns: ["Item", "Value", "Meaning"],
      rows: [
        ["TARGET WORD", formatAddress(WATCHED_RAM_ADDRESS), "The RAM word the program is expected to fill"],
        ["INHERITED DESTINATION", formatAddress(INITIAL_STORE_ADDRESS), "UART1 DATA, so the value is transmitted instead"],
        ["WORD SIZE", "4 bytes", "One store covers one 32-bit word"],
        ["BYTE ORDER", formatWordBytes(0x12345678), "Lowest address holds the low byte / little-endian"],
      ],
      notes: [
        "Serial output cannot show where a value went. A store to a device address transmits; a store to a RAM address changes memory. Only the RAM module under OPEN COVER shows where the value landed.",
        "The program builds a different value on every flash, so the repair is the destination, not the number. Read the target word after the program runs.",
        "The destination in store.S must be four-byte aligned. RAM addresses and the UART1 DATA address are supported by the supplied program; Boot ROM is read-only and other device writes are outside this repair.",
        "Editing the destination is a draft. Build & Flash installs it and boots the program; RESET reruns only the installed program.",
      ],
    },
  },
  {
    id: "uart",
    title: "UART1",
    summary: "UART1 is the 16550-compatible console at 0xD4110000–0xD411FFFF. Writing its transmit holding register sends a byte outside the Pocket.",
    columns: ["Register", "Address", "Access", "Behavior"],
    rows: [["THR / transmit", UART_TX_ADDRESS, "Write / 32-bit store", "DLAB = 0: transmit the low 8 bits"], ["RBR / receive", UART_TX_ADDRESS, "Read / 32-bit access", "DLAB = 0: read a received byte"]],
    notes: [
      "A store to this address transmits: the supplied boot code uses sw t1, 0(t0) with t0 = 0xD4110000. The DATA register sends bits [7:0]; the upper bits are ignored.",
      "Store the same value to a RAM address instead and the terminal receives nothing. The destination register decides between transmitting and storing.",
      `UART1 IRQ = ${UART1_IRQ}. Register spacing uses reg-shift = 2 (four-byte strides), and reg-io-width = 4 (32-bit accesses). UART initialization supplies DLAB = 0 for the console data register.`,
      "The UART cable connects the Pocket transmitter to the development PC's serial receiver. Serial settings: 115200 baud. Initialization is already supplied.",
      "A UART transmission does not initialize the Pocket's display.",
    ],
  },
  {
    id: "ascii",
    title: "ASCII",
    summary: "The serial terminal displays the received byte as a character. These are the two character codes used by boot.S.",
    columns: ["Character", "Hex byte", "Decimal"],
    rows: [["A", "0x41", "65"], ["B", "0x42", "66"]],
    notes: ["To send a different character, change the byte in boot.S and use Build & Flash. Reset reruns the firmware already installed on the Pocket."],
  },
  {
    id: "gpio",
    title: "GPIO",
    summary: "The GPIO block holds the Pocket's A button and its LED. Both are memory-mapped, so they are read and written like RAM.",
    columns: ["Register", "Address", "Access", "Behavior"],
    rows: [
      ["BUTTON", formatAddress(BUTTON_ADDRESS), "Read / 32-bit", "Bit 0 set while A is held / 0x00000001"],
      ["LED", formatAddress(LED_ADDRESS), "Write / 32-bit", "Bit 0 drives the LED / 1 on, 0 off"],
    ],
    notes: [
      "The Pocket's TTL GPIO sits in the gap between I2C4 and UART1. Atlantis's QEMU model has no GPIO, so these two registers are RV Pocket's own.",
      "One register can carry several states as separate bits, which is why the program tests a bit rather than the whole word.",
      "Both registers appear as rows in the RAM module under OPEN COVER in the button episodes, the same way MTIME does in Episode 03. They are not a module of their own. Later display episodes show framebuffer bytes in RAM.",
      `GPIO IRQ = ${GPIO_IRQ}. Episode 04's program polls the button register on every pass of its loop. Episode 05 replaces polling with BUTTON → IRQ → CPU: hardware asks for service instead of the CPU continually asking the button.`,
      "gpio_irq_enable(BUTTON_A) enables notification on both press and release. cpu_wait() waits without reading BUTTON_REG. In button_irq_handler(), read the current button value, update the LED, then call gpio_irq_ack() to clear the pending request. Without ACK the supplied model delivers the request again.",
      "Runtime supplies interrupt routing, context preservation, CSR setup, and trap entry/return. APLIC and IMSIC details are reserved for a later episode. These helpers are RV Pocket teaching interfaces, not register definitions for every GPIO device.",
      "Episode 08 adds D-pad input through the supplied snapshot/event runtime. Keep the handler short: read, record an input event, acknowledge, then return. Main applies input and animation. A valid idle wait does not prevent queued events from being processed.",
      "A read tells the CPU what the hardware is doing. A write tells the hardware what to do. Nothing else moves the LED.",
    ],
  },
  {
    id: "timer",
    title: "Timer",
    summary: `The ACLINT machine timer occupies 0xA2180000–0xA218FFFF. Its MTIME counter runs at ${TIMER_FREQUENCY_HZ.toLocaleString("en-US")} Hz (1 GHz): one timer tick is one nanosecond.`,
    columns: ["Register", "Address", "Width", "Behavior"],
    rows: [["MTIME", TIMER_ADDRESS, "64-bit", "Counter / 1,000,000,000 ticks per second"], ["MTIMECMP / hart 0", formatAddress(MTIMECMP_ADDRESS), "64-bit", "Machine timer interrupt compare"]],
    notes: [
      "1 second = 1,000,000,000 timer ticks. Delay in seconds = target ticks / 1,000,000,000. This is the timer frequency; it is not a CPU clock specification.",
      "MTIME is at ACLINT base + 0x0000. Hart 0's MTIMECMP is at base + 0x8000. The register is 64-bit; the RAM view in the prototype shows a 32-bit word of it, which is enough to see it advancing.",
      "Because MTIME is a memory-mapped register, it appears as a row in the RAM module under OPEN COVER, alongside the RAM words. It is not a separate module.",
      "Episode 03's PROGRAM TIMEBASE is the program's assumption about ticks per second. It calculates the target for a one-second wait. A 2 GHz assumption requests 2,000,000,000 ticks, which takes two seconds on the actual 1 GHz timer. The assumption itself stays on the PC; the cover only shows what the machine is doing.",
      "Build & Flash applies the edited program timebase and restarts the diagnostic. Editing the setting does not change the hardware timer's fixed frequency, and a firmware reset does not restart the counter.",
      "Observe at least two serial ticks to measure their interval. The timer LED pulses with each tick.",
    ],
  },
] as const;

export type DatasheetSectionId = typeof DATASHEET_SECTIONS[number]["id"];
