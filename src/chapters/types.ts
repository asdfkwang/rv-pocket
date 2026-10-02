export type WorkbenchObjectId = "pocket" | "computer" | "datasheet" | "book" | "uart-cable";
import type { DatasheetSectionId } from "../datasheet-content";

export type ComputerPanelId = "editor" | "terminal";

// The hardware blocks the Pocket's cover can show. UART output is not one of them:
// the PC's serial terminal already shows it, the way Episode 01 does.
export type ModuleId = "cpu" | "ram" | "display";

export interface GuidedSource {
  fileName: string;
  lines: readonly { before: string; field?: "byte" | "store-address" | "target-ticks" | "row-bytes"; after?: string }[];
}

// A program is assembled from blocks rather than typed. The skeleton is fixed and the
// player chooses the order, so the repair is the order without a C parser.
export interface GuidedProgram {
  fileName: string;
  singleLocation?: boolean;
  skeleton: readonly (string | { slot: string })[];
  slots: readonly { id: string; label: string; indent: string; blocks: readonly string[] }[];
  blocks: readonly { id: string; label?: string; lines: readonly string[] }[];
  solution: readonly string[];
}

export type ProgramPlacement = Record<string, readonly string[]>;

export function editProgramBlock(program: GuidedProgram, placement: ProgramPlacement, slotId: string, blockId: string, add: boolean): ProgramPlacement {
  const slot = program.slots.find((candidate) => candidate.id === slotId);
  if (!slot?.blocks.includes(blockId)) return placement;
  const next = { ...placement };
  if (add && program.singleLocation) {
    for (const key of Object.keys(next)) next[key] = (next[key] ?? []).filter((id) => id !== blockId);
  }
  const chosen = next[slotId] ?? [];
  next[slotId] = add ? chosen.includes(blockId) ? chosen : [...chosen, blockId] : chosen.filter((id) => id !== blockId);
  return next;
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
  computer: { panels: readonly ComputerPanelId[]; source?: GuidedSource; program?: GuidedProgram; editorHint?: string; datasheetSection?: DatasheetSectionId };
  manual: readonly ManualSection[];
  quiz: readonly QuizQuestion[];
  createInitialState: () => State;
  successCondition: (state: Readonly<State>) => boolean;
}
