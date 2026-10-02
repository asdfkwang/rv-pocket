import type { Chapter } from "./types";
import { createInitialTimerState, isTimerMissionComplete, TIMER_ADDRESS, type TimerMissionState } from "../sim/timer";

export const chapter03: Chapter<TimerMissionState> = {
  id: 3,
  slug: "wrong-clock",
  title: "Wrong Clock",
  mission: {
    summary: "Make the Pocket's timer diagnostic send one tick every second.",
    initialObservation: "UART and RAM are reliable. The next diagnostic should report every second, but the serial ticks and the Pocket's timer LED are too slow. Does the program's timebase agree with the timer frequency in DATASHEET?",
    successMessage: "TIMER PASS — one tick every second.",
  },
  next: { title: "One Press, Endless Move" },
  cover: { modules: ["cpu", "ram"], selected: "ram" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor", "terminal"],
    editorHint: "The diagnostic converts one second into ticks using PROGRAM TIMEBASE below. Match that setting to the hardware timer frequency.",
    datasheetSection: "timer",
    source: {
      fileName: "timer.S",
      lines: [
        { before: `    li   t0, ${TIMER_ADDRESS}`, after: "  # MTIME" },
        { before: "    li   t1, ", field: "target-ticks", after: "  # ticks for one second" },
        { before: "" },
        { before: "timer_loop:" },
        { before: "    ...", after: "  # supplied diagnostic" },
      ],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialTimerState, successCondition: isTimerMissionComplete,
};
