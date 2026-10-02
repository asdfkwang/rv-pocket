import type { Chapter } from "./types";
import { createInitialTimerState, isTimerMissionComplete, TIMER_ADDRESS, type TimerMissionState } from "../sim/timer";

export const chapter03: Chapter<TimerMissionState> = {
  id: 3,
  slug: "wrong-clock",
  title: "Wrong Clock",
  mission: {
    summary: "Make the Pocket's timer diagnostic send one tick every second.",
    initialObservation: "UART and RAM are reliable. The next diagnostic should report every second, but the serial ticks and the Pocket's timer LED are too slow. Compare the clock setting with the delay you actually observe.",
    successMessage: "TIMER PASS — one tick every second.",
  },
  next: { title: "Black Screen First" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor", "terminal", "timer", "target"],
    editorHint: "The target stays at 10,000,000 ticks. Change only the clock source below.",
    datasheetSection: "timer",
    source: {
      fileName: "timer.S",
      lines: [
        { before: `    li   t0, ${TIMER_ADDRESS}`, after: "  # TIMER" },
        { before: "    li   t1, 10000000", after: "  # target ticks" },
        { before: "" },
        { before: "timer_loop:" },
        { before: "    ...", after: "  # supplied diagnostic" },
      ],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialTimerState, successCondition: isTimerMissionComplete,
};
