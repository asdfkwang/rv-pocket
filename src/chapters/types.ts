export type WorkbenchObjectId = "pocket" | "computer" | "datasheet" | "book" | "uart-cable";
import type { DatasheetSectionId } from "../datasheet-content";

export type ComputerPanelId = "editor" | "terminal" | "memory-map" | "timer" | "target";

export interface GuidedSource {
  fileName: string;
  lines: readonly { before: string; field?: "byte" | "range-start" | "range-end"; after?: string }[];
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
  workbench: { objects: readonly WorkbenchObjectId[] };
  computer: { panels: readonly ComputerPanelId[]; source?: GuidedSource; editorHint?: string; datasheetSection?: DatasheetSectionId };
  manual: readonly ManualSection[];
  quiz: readonly QuizQuestion[];
  createInitialState: () => State;
  successCondition: (state: Readonly<State>) => boolean;
}
