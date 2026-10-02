import type { Chapter } from "./types";

export interface OnboardingState { started: boolean }

export const chapter00: Chapter<OnboardingState> = {
  id: 0,
  slug: "before-you-begin",
  title: "Before You Begin",
  mission: {
    summary: "Get to know what was left behind.",
    initialObservation: "Your parents' game studio has closed. On the old development desk: a broken pocket computer, its technical manual, and one unfinished story.",
    successMessage: "The bench is yours. Time for the first repair.",
  },
  workbench: { objects: ["pocket", "computer", "datasheet", "book"] },
  computer: { panels: [] },
  manual: [{
    id: "using-the-bench",
    title: "A place to start",
    blocks: [
      { kind: "text", body: "Two buttons. STATION is the workbench, EBOOK is the manual." },
      { kind: "text", body: "STATION is where you inspect the device, connect the cable, and run diagnostics. Each repair brings only the tools it needs." },
      { kind: "text", body: "EBOOK is your reference. When something does not make sense, look here for an explanation and a short check of your understanding." },
      { kind: "text", body: "There is no saved progress. When you are ready, choose Start Chapter 01." },
    ],
  }],
  quiz: [],
  createInitialState: () => ({ started: false }),
  successCondition: (state) => state.started,
};
