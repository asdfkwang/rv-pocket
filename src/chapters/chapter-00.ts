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
  workbench: { objects: ["pocket", "computer", "manual"] },
  computer: { panels: [] },
  manual: [{
    id: "using-the-bench",
    title: "A place to start",
    blocks: [
      { kind: "text", body: "Workbench is your desk. Inspect RV Pocket, connect equipment, and open the tools you need." },
      { kind: "text", body: "Computer is where you run diagnostics and observe the machine's responses. Each repair brings only the tools it needs." },
      { kind: "text", body: "Manual is your reference. When something does not make sense, look here for an explanation and a short check of your understanding." },
      { kind: "text", body: "Switch views whenever you like; your current work stays put. Switching chapters or pressing Reset starts that chapter fresh. Reloading also starts fresh. There is no saved progress." },
      { kind: "text", body: "No lesson to pass and no checklist to unlock. When you are ready, choose Start Chapter 01." },
    ],
  }],
  quiz: [],
  createInitialState: () => ({ started: false }),
  successCondition: (state) => state.started,
};
