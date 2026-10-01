# Content and Data Model

> Direction: the game unit is an **Episode** (plus a **Prologue** opening), and the Manual unit is a separate **Manual Chapter** with its own numbering. The two numberings have no 1:1 relationship. An episode will reference Manual Chapters through `recommendedManualChapters`, not by owning manual/quiz content directly.
>
> TODO: the runtime still implements `Chapter<State>` with embedded `manual`/`quiz`. Migrate the runtime (`Chapter` → `Episode`, `mission` → problem/objective/result, embedded manual/quiz → `recommendedManualChapters`) in a separate code migration. Do not mix the two migrations.

## Canonical Episode contract

This is the only Chapter schema in the documentation. Use the name `Chapter<State>` consistently; the earlier `ChapterDefinition` sketches are superseded. When implemented, its TypeScript home will be `src/chapters/types.ts`. That file does not exist yet.

The contract covers the actual needs of the Prologue and Episode 01. Add an object, panel, or content form when a later episode needs it; do not prebuild a generic content engine.

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

export type ManualChapterId = string;

export interface Episode<State> {
  id: number;
  slug: string;
  title: string;
  problem: string;
  objective: string;
  result: string;
  workbench: { objects: readonly WorkbenchObjectId[] };
  computer: { panels: readonly ComputerPanelId[] };
  recommendedManualChapters: readonly ManualChapterId[];
  createInitialState: () => State;
  successCondition: (state: Readonly<State>) => boolean;
}
```

Definitions are plain TypeScript objects with two small functions, not serialized JSON. There is no parser, plugin registry, or universal action language to implement.

## Field semantics and lifecycle

- `id` is the game episode number (`1` displays as Episode 01); `slug` is a stable readable identifier. IDs and slugs are unique. Neither uses a Study Module or Manual Chapter number.
- `problem` states the observed malfunction, `objective` the concrete repair goal, and `result` the observable outcome of a successful repair. Views display these before offering explanations.
- `workbench` and `computer` select the shared objects and panels that exist for this episode. Their IDs map to explicit view code, not arbitrary executable content.
- `recommendedManualChapters` lists the Manual Chapters that help with this episode. It is a recommendation, not a gate: a player can attempt the repair without opening them.
- `createInitialState()` replaces the old `initialState: unknown` sketch. It returns fresh mutable episode state, including fresh nested arrays/objects if present, on episode entry or Reset. Do not share a mutable initial-state object between attempts.
- `successCondition` is a pure predicate on the active episode state. Reevaluate it after simulation actions; do not maintain a separate completion flag that can drift from hardware state.
- Navigation state and quiz-answer UI state are separate from machine state. View changes preserve the active attempt; episode entry and Reset clear its transient state, including quiz answers. See [navigation behavior](02_ui_ux.md#state-and-navigation-behavior).

The Prologue uses the same shape with interface-help Manual content, an empty quiz, and no simulated hardware requirement. Its transient state can record the Start action as onboarding completion. Later episodes initialize earlier repairs as already working, so each repair can be entered directly.

## Episode 01 state and completion

The [episode script](03_episode_roadmap.md#episode-01--output-in-the-wrong-place) owns the prose and quiz content. Its smallest machine state is:

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

The Episode 01 definition has type `Episode<UartMissionState>`, uses these functions for `createInitialState` and `successCondition`, includes all four Workbench objects, and enables `terminal` and `uart-task` panels. It recommends the Manual Chapters covering the machine overview and serial communication, and keeps the three questions from the episode script.

Only received board UART data belongs in `terminalOutput`; UI hints, errors, and host-local echo must not enter it. Connecting the cable changes only `uartConnected`. Running the supplied diagnostic with the valid UART choice appends `A` only when connected. A missing cable or wrong choice gives explanatory UI feedback without satisfying completion.

The guided choice itself is view interaction state, not a CPU register or program. No PC, RAM array, CSR, or instruction engine belongs in this episode's state. The [technical architecture](05_technical_architecture.md#content-state-and-simulation-boundaries) owns the action/simulation boundary.
