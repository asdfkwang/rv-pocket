import type { Chapter } from "./types";
import { createInitialMemoryState, isMemoryMissionComplete, type MemoryMissionState } from "../sim/memory";

export const chapter02: Chapter<MemoryMissionState> = {
  id: 2,
  slug: "false-memory-failure",
  title: "False Memory Failure",
  mission: {
    summary: "Find a RAM test range that passes without overwriting the diagnostic's own workspace.",
    initialObservation: "UART works now. Your parents' RAM diagnostic is next, but it reports different failure addresses every time it runs. Is the RAM broken, or is the test damaging its own data?",
    successMessage: "RAM PASS — the test no longer overwrites its workspace.",
  },
  next: { id: 3, title: "Wrong Clock" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor", "terminal", "memory-map", "target"],
    editorHint: "The diagnostic is supplied. Change only its test range below.",
    datasheetSection: "memory-map",
    source: {
      fileName: "memtest.S",
      lines: [
        { before: "    li   t0, ", field: "range-start", after: "  # start" },
        { before: "    li   t1, ", field: "range-end", after: "  # end (excluded)" },
        { before: "" },
        { before: "test_loop:" },
        { before: "    ...", after: "  # supplied diagnostic" },
      ],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialMemoryState, successCondition: isMemoryMissionComplete,
};
