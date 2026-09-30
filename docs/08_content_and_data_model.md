# Content and Data Model

## Canonical Chapter contract

This is the only Chapter schema in the documentation. Use the name `Chapter<State>` consistently; the earlier `ChapterDefinition` sketches are superseded. When implemented, its TypeScript home will be `src/chapters/types.ts`. That file does not exist yet.

The contract covers the actual needs of Chapters 00 and 01. Add an object, panel, or content form when a later mission needs it; do not prebuild a generic content engine.

```ts
export type WorkbenchObjectId =
  | "pocket"
  | "computer"
  | "manual"
  | "uart-cable";

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
```

Definitions are plain TypeScript objects with two small functions, not serialized JSON. There is no parser, plugin registry, or universal action language to implement.

## Field semantics and lifecycle

- `id` is the game chapter number (`1` displays as Chapter 01); `slug` is a stable readable identifier. IDs and slugs are unique. Neither uses a Study Module number.
- `mission` owns the initial repair objective, observed malfunction, and completion message. Views display these before offering explanations.
- `workbench` and `computer` select the shared objects and panels that exist for this chapter. Their IDs map to explicit view code, not arbitrary executable content.
- `manual` contains the reference sections. `quiz` is rendered inside the Manual view, not on a separate required screen. Question/choice IDs are unique within their containing list and `answerId` must match a choice.
- `createInitialState()` replaces the old `initialState: unknown` sketch. It returns fresh mutable mission state, including fresh nested arrays/objects if present, on chapter entry or Reset. Do not share a mutable initial-state object between attempts.
- `successCondition` is a pure predicate on the active mission state. Reevaluate it after simulation actions; do not maintain a separate completion flag that can drift from hardware state.
- Navigation state and quiz-answer UI state are separate from machine state. View changes preserve the active attempt; chapter entry and Reset clear its transient state, including quiz answers. See [navigation behavior](02_ui_ux.md#state-and-navigation-behavior).

Chapter 00 uses the same shape with interface-help Manual content, an empty quiz, and no simulated hardware requirement. Its transient state can record the Start action as onboarding completion. Later chapters initialize earlier repairs as already working, so each mission can be entered directly.

## Chapter 01 state and completion

The [mission script](03_chapter_roadmap.md#chapter-01--is-anyone-there) owns the prose and quiz content. Its smallest machine state is:

```ts
export interface UartMissionState {
  uartConnected: boolean;
  terminalOutput: string;
}

export const createInitialUartState = (): UartMissionState => ({
  uartConnected: false,
  terminalOutput: "",
});

export const isUartMissionComplete = (
  state: Readonly<UartMissionState>,
): boolean => state.uartConnected && state.terminalOutput.includes("A");
```

The Chapter 01 definition has type `Chapter<UartMissionState>`, uses these functions for `createInitialState` and `successCondition`, includes all four Workbench objects, and enables `terminal` and `uart-task` panels. It contains one short Manual section and the three questions from the mission script.

Only received board UART data belongs in `terminalOutput`; UI hints, errors, and host-local echo must not enter it. Connecting the cable changes only `uartConnected`. Running the supplied diagnostic with the valid UART choice appends `A` only when connected. A missing cable or wrong choice gives explanatory UI feedback without satisfying completion.

The guided choice itself is view interaction state, not a CPU register or program. No PC, RAM array, CSR, or instruction engine belongs in this chapter's state. The [technical architecture](05_technical_architecture.md#content-state-and-simulation-boundaries) owns the action/simulation boundary.
