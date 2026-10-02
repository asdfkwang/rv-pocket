import type { Chapter } from "./types";
import { createInitialUartState, isUartMissionComplete, UART_TX_ADDRESS, type UartMissionState } from "../sim/uart";

export const chapter01: Chapter<UartMissionState> = {
  id: 1,
  slug: "wrong-byte",
  title: "Wrong Byte",
  mission: {
    summary: "Make the serial terminal receive A.",
    initialObservation: "Your parents' Pocket powers on. Their last boot.S is still open on the development PC. A character arrives over the UART cable: B. The expected output is A.",
    successMessage: "UART PASS — A received.",
  },
  next: { id: 2, title: "Wrong Destination" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor", "terminal"],
    editorHint: "Only the highlighted byte can be changed.",
    datasheetSection: "uart",
    source: {
      fileName: "boot.S",
      lines: [
        { before: "_start:" },
        { before: `    li   t0, ${UART_TX_ADDRESS}`, after: "  # UART" },
        { before: "    li   t1, ", field: "byte", after: "  # editable" },
        { before: "    sw   t1, 0(t0)" },
      ],
    },
  },
  manual: [],
  quiz: [],
  createInitialState: createInitialUartState,
  successCondition: isUartMissionComplete,
};
