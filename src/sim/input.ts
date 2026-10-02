import { BUTTON_A_BIT } from "../platform";

export const SOLUTION_BLOCKS = ["read", "if", "led-on", "else", "led-off"];

export interface InputMissionState {
  // The blocks currently installed on the Pocket. A draft lives in UI state until Build & Flash.
  installedBlocks: readonly string[];
  buttonValue: number;
  ledValue: number;
  hasPressedWithResponse: boolean;
  flashCount: number;
}

// Walk the assembled blocks once, the way the while(1) body would run for one pass.
// The blocks between if and else are the true body, and those after else are the false
// body, so exactly one body runs. A block in the wrong place therefore misbehaves
// instead of being rejected: a read after if tests a value the program never loaded.
export function runProgram(blocks: readonly string[], buttonValue: number) {
  let register = 0;
  let read = false;
  let condition: boolean | null = null;
  let inElse = false;
  const trueBody: string[] = [];
  const falseBody: string[] = [];
  for (const block of blocks) {
    if (block === "read") { register = buttonValue; read = true; continue; }
    if (block === "if") { condition = Boolean(register & BUTTON_A_BIT); inElse = false; continue; }
    if (block === "else") { inElse = true; continue; }
    if (condition === null) continue;
    (inElse ? falseBody : trueBody).push(block);
  }
  const body = condition === null ? [] : condition ? trueBody : falseBody;
  let led = 0;
  for (const block of body) {
    if (block === "led-on") led = 1;
    else if (block === "led-off") led = 0;
  }
  return { led, read, sawIf: condition !== null };
}

export function createInitialInputState(): InputMissionState {
  // The inherited program reads the button but never writes the LED.
  return {
    installedBlocks: ["read", "if"],
    buttonValue: 0, ledValue: runProgram(["read", "if"], 0).led,
    hasPressedWithResponse: false, flashCount: 0,
  };
}

export function flashInputProgram(state: Readonly<InputMissionState>, blocks: readonly string[]): InputMissionState {
  return {
    ...state,
    installedBlocks: [...blocks],
    ledValue: runProgram(blocks, state.buttonValue).led,
    hasPressedWithResponse: false,
    flashCount: state.flashCount + 1,
  };
}

// One polling pass. Called when the button changes, which is what the loop would notice.
export function pollInput(state: Readonly<InputMissionState>, buttonValue: number): InputMissionState {
  const led = runProgram(state.installedBlocks, buttonValue).led;
  return {
    ...state,
    buttonValue,
    ledValue: led,
    hasPressedWithResponse: state.hasPressedWithResponse || (buttonValue === 1 && led === 1),
  };
}

export const isInputMissionComplete = (state: Readonly<InputMissionState>): boolean =>
  state.installedBlocks.join(",") === SOLUTION_BLOCKS.join(",")
  && state.hasPressedWithResponse
  && state.ledValue === 0;
