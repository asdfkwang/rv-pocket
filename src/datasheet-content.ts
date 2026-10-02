import { UART_TX_ADDRESS } from "./sim/uart";
import { formatAddress, RAM_START, RAM_END, WORKAREA_START, WORKAREA_END } from "./sim/memory";
import { TIMER_ADDRESS } from "./sim/timer";

// RV Pocket's fictional hardware reference, separate from the study book.
export const DATASHEET_SECTIONS = [
  {
    id: "memory-map",
    title: "Memory Map",
    summary: "The CPU uses addresses to reach RAM and peripherals. RAM stores data; a device register has the behavior defined by its device.",
    columns: ["Region", "Address range", "Purpose"],
    rows: [
      ["RAM", `${formatAddress(RAM_START)}–${formatAddress(RAM_END - 1)}`, "8 KiB diagnostic memory window"],
      ["MEMTEST WORKAREA", `${formatAddress(WORKAREA_START)}–${formatAddress(WORKAREA_END - 1)}`, "Reserved diagnostic workspace inside RAM"],
      ["UART DATA", UART_TX_ADDRESS, "A write requests serial transmission"],
      ["TIMER", TIMER_ADDRESS, "Counter and clock source"],
    ],
    notes: [
      "The memory test must avoid its own work area. The range 0x00001A00–0x00001FFF is outside that reserved area.",
      "TEST RANGE uses an excluded END: START 0x00001A00, END 0x00002000 checks 1536 bytes. A program also uses RAM; a test that writes over its own data can produce false failures.",
      "These addresses belong to the RV Pocket teaching platform. They are not addresses specified by the RISC-V ISA.",
    ],
  },
  {
    id: "uart",
    title: "UART",
    summary: "Writing a value to the UART data register transmits that value outside the Pocket.",
    columns: ["Register", "Address", "Access", "Behavior"],
    rows: [["DATA", UART_TX_ADDRESS, "Write / 32-bit store", "Transmit the low 8 bits as one byte"]],
    notes: [
      "The supplied boot code uses sw t1, 0(t0). The DATA register sends bits [7:0]; the upper bits are ignored.",
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
    id: "timer",
    title: "Timer",
    summary: `The timer at ${TIMER_ADDRESS} increases its counter once per clock tick. The diagnostic waits for 10,000,000 ticks before sending each serial tick. Its intended interval is one second.`,
    columns: ["Clock source", "Target ticks", "Delay"],
    rows: [["5 MHz", "10,000,000", "2.000 s"], ["10 MHz", "10,000,000", "1.000 s"], ["20 MHz", "10,000,000", "0.500 s"]],
    notes: [
      "10 MHz means 10,000,000 counter ticks per second. Changing the clock source changes how long the same tick target takes.",
      "Build & Flash applies the edited clock source and restarts the timer diagnostic. Changing the dropdown alone does not change the running counter.",
      "Observe at least two serial ticks to measure their interval. The timer LED pulses with each tick.",
    ],
  },
] as const;

export type DatasheetSectionId = typeof DATASHEET_SECTIONS[number]["id"];
