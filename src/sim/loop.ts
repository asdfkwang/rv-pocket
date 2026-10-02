import { BUTTON_A_BIT } from "../platform";

// The button-and-LED loop from Episode 04, plus the fix from Episode 05.
export const BUSY_BLOCKS = ["read", "if", "led-on", "else", "led-off"] as const;
export const SOLUTION_BLOCKS = ["wait", "read", "if", "led-on", "else", "led-off"] as const;

export const LOOP_PASSES_PER_SECOND = 60;

export interface LoopMissionState {
  // The blocks currently installed on the Pocket. A draft lives in UI state until Build & Flash.
  installedBlocks: readonly string[];
  buttonValue: number;
  ledValue: number;
  // The loop itself always turns. The counters below are what it costs.
  loopPasses: number;
  buttonReads: number;
  // The second job the loop is supposed to leave room for.
  heartbeat: number;
  hasPressedWithResponse: boolean;
  flashCount: number;
}

// Walk the assembled blocks once, the way the while(1) body runs for a single pass.
//
// The blocks between if and else are the true body and those after else are the false
// body, so exactly one body runs. A block in the wrong place misbehaves instead of
// being rejected: a read after if tests a value the program never loaded.
//
// `wait` is the Episode 05 fix. Placed before the read, it ends the pass while the
// button register still holds what it held last time, so an idle loop stops touching
// the register. Without it every pass re-reads a register that cannot have changed.
export function runLoop(blocks: readonly string[], buttonValue: number, previousButton: number) {
  const waits = blocks[0] === "wait";
  if (waits && buttonValue === previousButton) {
    return { led: -1, waited: true, read: false };
  }
  let register = 0;
  let condition: boolean | null = null;
  let inElse = false;
  const trueBody: string[] = [];
  const falseBody: string[] = [];
  for (const block of blocks) {
    if (block === "read" || block === "wait") { register = buttonValue; continue; }
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
  return { led, waited: false, read: blocks.includes("read") };
}

// One pass. A waiting pass costs the CPU nothing on the register, so it neither
// advances the read count nor reaches the second job.
export function pollLoop(state: Readonly<LoopMissionState>, buttonValue: number): LoopMissionState {
  const program = runLoop(state.installedBlocks, buttonValue, state.buttonValue);
  return {
    ...state,
    buttonValue,
    ledValue: program.led < 0 ? state.ledValue : program.led,
    loopPasses: state.loopPasses + 1,
    buttonReads: state.buttonReads + Number(program.read),
    heartbeat: state.heartbeat + Number(program.read),
    hasPressedWithResponse: state.hasPressedWithResponse || (buttonValue === 1 && program.led === 1),
  };
}

export function createInitialLoopState(): LoopMissionState {
  return {
    installedBlocks: [...BUSY_BLOCKS],
    buttonValue: 0, ledValue: 0,
    loopPasses: 0, buttonReads: 0, heartbeat: 0,
    hasPressedWithResponse: false, flashCount: 0,
  };
}

export function flashLoopProgram(state: Readonly<LoopMissionState>, blocks: readonly string[]): LoopMissionState {
  const program = runLoop(blocks, state.buttonValue, state.buttonValue);
  return {
    ...state,
    installedBlocks: [...blocks],
    ledValue: program.led < 0 ? state.ledValue : program.led,
    loopPasses: 0, buttonReads: 0, heartbeat: 0,
    hasPressedWithResponse: false,
    flashCount: state.flashCount + 1,
  };
}

// The loop runs on its own. Nothing about Episode 05 depends on the player pressing
// anything, which is the whole point: the cost shows up while the machine is idle.
export function tickLoop(state: Readonly<LoopMissionState>, passes: number): LoopMissionState {
  let next = state;
  for (let pass = 0; pass < passes; pass++) next = pollLoop(next, next.buttonValue);
  return next;
}

export const isLoopMissionComplete = (state: Readonly<LoopMissionState>): boolean =>
  state.installedBlocks.join(",") === SOLUTION_BLOCKS.join(",")
  && state.hasPressedWithResponse
  && state.ledValue === 0;
