export type WorkbenchObjectId = "pocket" | "computer" | "datasheet" | "book" | "uart-cable";
import type { DatasheetSectionId } from "../datasheet-content";

export type ComputerPanelId = "editor" | "terminal";

// The hardware blocks the Pocket's cover can show. UART output is not one of them:
// the PC's serial terminal already shows it, the way Episode 01 does.
export type ModuleId = "cpu" | "ram";

export interface GuidedSource {
  fileName: string;
  lines: readonly { before: string; field?: "byte" | "store-address" | "target-ticks"; after?: string }[];
}

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
  next?: { id?: number; title: string };
  cover?: { modules: readonly ModuleId[]; selected: ModuleId };
  workbench: { objects: readonly WorkbenchObjectId[] };
  computer: { panels: readonly ComputerPanelId[]; source?: GuidedSource; editorHint?: string; datasheetSection?: DatasheetSectionId };
  manual: readonly ManualSection[];
  quiz: readonly QuizQuestion[];
  createInitialState: () => State;
  successCondition: (state: Readonly<State>) => boolean;
}
