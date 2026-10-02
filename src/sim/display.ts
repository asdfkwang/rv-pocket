import { runProgram, SOLUTION_BLOCKS as BUTTON_PROGRAM } from "./input";

export const DISPLAY_READY_MS = 500;

export interface DisplayMissionState {
  installedBlocks: string[];
  powered: boolean;
  ready: boolean;
  elapsedPowerMs: number;
  mode: "NONE" | "TEST";
  outputEnabled: boolean;
  stepIndex: number;
  waiting: boolean;
  log: string[];
  buttonValue: number;
  ledValue: number;
  flashCount: number;
}

function freshDisplayTarget(blocks: readonly string[], flashCount: number): DisplayMissionState {
  return runInitialization({
    installedBlocks: [...blocks], powered: false, ready: false,
    elapsedPowerMs: 0, mode: "NONE", outputEnabled: false,
    stepIndex: 0, waiting: false, log: [],
    buttonValue: 0, ledValue: 0, flashCount,
  });
}

// This interprets only the display's four teaching blocks, not C source. A wait
// pauses the program while hardware readiness advances through tickDisplay.
function runInitialization(state: Readonly<DisplayMissionState>): DisplayMissionState {
  const next = { ...state, log: [...state.log] };
  while (next.stepIndex < next.installedBlocks.length) {
    const block = next.installedBlocks[next.stepIndex];
    if (block === "wait-ready" && !next.ready) {
      if (!next.waiting) next.log.push(next.powered
        ? "WAIT READY: initialization paused while the display starts."
        : "WAIT READY: display has no power; initialization cannot continue.");
      next.waiting = true;
      return next;
    }
    if (block === "power") {
      next.powered = true;
      next.ready = false;
      next.elapsedPowerMs = 0;
      next.mode = "NONE";
      next.outputEnabled = false;
      next.log.push("POWER ON: display startup takes 500 ms.");
    } else if (block === "wait-ready") {
      next.waiting = false;
      next.log.push("WAIT READY: ready; initialization continues.");
    } else if (block === "test") {
      if (next.ready) {
        next.mode = "TEST";
        next.log.push("TEST MODE: pattern selected.");
      } else {
        next.log.push("TEST MODE ignored: display is not ready.");
      }
    } else if (block === "enable") {
      if (!next.ready) {
        next.log.push("ENABLE OUTPUT ignored: display is not ready.");
      } else if (next.mode !== "TEST") {
        next.log.push("ENABLE OUTPUT ignored: TEST mode is not selected.");
      } else {
        next.outputEnabled = true;
        next.log.push("OUTPUT ENABLED: test pattern is visible.");
      }
    } else {
      next.log.push(`Unknown display block ignored: ${block}.`);
    }
    next.stepIndex++;
  }
  return next;
}

export function createInitialDisplayState(): DisplayMissionState {
  return freshDisplayTarget(["power", "test", "enable"], 0);
}

export function flashDisplayProgram(state: Readonly<DisplayMissionState>, blocks: readonly string[]): DisplayMissionState {
  return freshDisplayTarget(blocks, state.flashCount + 1);
}

export function rebootDisplayTarget(state: Readonly<DisplayMissionState>): DisplayMissionState {
  return freshDisplayTarget(state.installedBlocks, state.flashCount);
}

export function tickDisplay(state: Readonly<DisplayMissionState>, elapsedMs: number): DisplayMissionState {
  if (elapsedMs <= 0 || !Number.isFinite(elapsedMs) || !state.powered || state.ready) return { ...state };
  const next = { ...state, elapsedPowerMs: Math.min(DISPLAY_READY_MS, state.elapsedPowerMs + elapsedMs), log: [...state.log] };
  if (next.elapsedPowerMs === DISPLAY_READY_MS) {
    next.ready = true;
    next.log.push("DISPLAY READY: startup completed.");
    if (next.waiting) return runInitialization(next);
  }
  return next;
}

export function setDisplayButton(state: Readonly<DisplayMissionState>, pressed: number): DisplayMissionState {
  const buttonValue = pressed ? 1 : 0;
  return { ...state, buttonValue, ledValue: runProgram(BUTTON_PROGRAM, buttonValue).led };
}

export const isDisplayMissionComplete = (state: Readonly<DisplayMissionState>): boolean =>
  state.powered && state.ready && state.mode === "TEST" && state.outputEnabled;
