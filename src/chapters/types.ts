export type WorkbenchObjectId = "pocket" | "computer" | "manual" | "uart-cable";
export type ComputerPanelId = "terminal" | "uart-task";

export interface ManualSection {
  id: string;
  title: string;
  blocks: readonly { kind: "text" | "ascii"; body: string }[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: readonly { id: string; label: string }[];
  answerId: string;
  explanation: string;
}

export interface Chapter<State> {
  id: number;
  slug: string;
  title: string;
  mission: {
    summary: string;
    initialObservation: string;
    successMessage: string;
  };
  workbench: { objects: readonly WorkbenchObjectId[] };
  computer: { panels: readonly ComputerPanelId[] };
  manual: readonly ManualSection[];
  quiz: readonly QuizQuestion[];
  createInitialState: () => State;
  successCondition: (state: Readonly<State>) => boolean;
}
