import type { ProgramPlacement } from "../chapters/types";
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, FB_BASE } from "./framebuffer";

export interface MovingProgram {
  handler: readonly string[];
  mainInput: readonly string[];
}

export const MOVING_SOLUTION: MovingProgram = {
  handler: ["read", "record", "ack"], mainInput: ["apply"],
};

interface MovingInput {
  id: number;
  kind: "button" | "dpad";
  buttonValue: number;
  x: number;
  y: number;
}

export interface MovingMissionState {
  installedProgram: MovingProgram;
  buttonValue: number;
  ledValue: number;
  markerX: number;
  markerY: number;
  autoX: number;
  autoY: number;
  direction: 1 | -1;
  frameCount: number;
  cells: Record<number, number>;
  cpuAt: string;
  currentStep: string;
  pendingTimer: boolean;
  pendingIrq: boolean;
  irqCount: number;
  buttonReads: number;
  heldProgressMs: number;
  dpadHandled: boolean;
  flashCount: number;
  history: string[];
  pendingInputs: MovingInput[];
  mainInputs: MovingInput[];
  handlerEvent: MovingInput | null;
  readEvent: MovingInput | null;
  handlerIndex: number;
  nextInputId: number;
  lastAppliedInputId: number;
  requestedX: number;
  requestedY: number;
  timerElapsedMs: number;
}

export function movingProgramFromDraft(draft: ProgramPlacement): MovingProgram {
  return { handler: [...(draft.handler ?? [])], mainInput: [...(draft["main-input"] ?? [])] };
}

export function isMovingSolution(program: MovingProgram): boolean {
  return program.handler.join(",") === "read,record,ack" && program.mainInput.join(",") === "apply";
}

function drawScreen(state: MovingMissionState) {
  const cells: Record<number, number> = {};
  for (let offset = 0; offset < DISPLAY_WIDTH * DISPLAY_HEIGHT; offset++) cells[FB_BASE + offset] = 0;
  cells[FB_BASE + state.autoY * DISPLAY_WIDTH + state.autoX] = 2;
  cells[FB_BASE + state.markerY * DISPLAY_WIDTH + state.markerX] = 1;
  state.cells = cells;
}

function recordHistory(state: MovingMissionState, event: string) {
  state.history.push(`${event} / frame ${state.frameCount} / auto (${state.autoX},${state.autoY}) / marker (${state.markerX},${state.markerY}) / CPU ${state.cpuAt}: ${state.currentStep}`);
  state.history = state.history.slice(-12);
}

function freshMovingTarget(program: MovingProgram, flashCount: number): MovingMissionState {
  const state: MovingMissionState = {
    installedProgram: { handler: [...program.handler], mainInput: [...program.mainInput] },
    buttonValue: 0, ledValue: 0, markerX: 8, markerY: 4, autoX: 4, autoY: 2, direction: 1,
    frameCount: 0, cells: {}, cpuAt: "main", currentStep: "WAIT FOR EVENT",
    pendingTimer: false, pendingIrq: false, irqCount: 0, buttonReads: 0,
    heldProgressMs: 0, dpadHandled: false, flashCount, history: [],
    pendingInputs: [], mainInputs: [], handlerEvent: null, readEvent: null,
    handlerIndex: 0, nextInputId: 1, lastAppliedInputId: 0,
    requestedX: 8, requestedY: 4, timerElapsedMs: 0,
  };
  drawScreen(state);
  return state;
}

export function createInitialMovingState(): MovingMissionState {
  return freshMovingTarget({ handler: ["read", "wait-release", "apply", "ack"], mainInput: [] }, 0);
}

export function flashMovingProgram(state: Readonly<MovingMissionState>, program: MovingProgram): MovingMissionState {
  return freshMovingTarget(program, state.flashCount + 1);
}

export function rebootMovingTarget(state: Readonly<MovingMissionState>): MovingMissionState {
  return freshMovingTarget(state.installedProgram, state.flashCount);
}

function copyState(state: Readonly<MovingMissionState>): MovingMissionState {
  return {
    ...state, cells: { ...state.cells }, history: [...state.history],
    pendingInputs: state.pendingInputs.map((event) => ({ ...event })),
    mainInputs: state.mainInputs.map((event) => ({ ...event })),
    handlerEvent: state.handlerEvent ? { ...state.handlerEvent } : null,
    readEvent: state.readEvent ? { ...state.readEvent } : null,
  };
}

function applyInput(state: MovingMissionState, event: MovingInput, inMain: boolean) {
  if (event.id <= state.lastAppliedInputId) return;
  state.lastAppliedInputId = event.id;
  state.ledValue = event.buttonValue;
  if (event.kind === "button") {
    if (event.buttonValue === 1) state.direction = state.direction === 1 ? -1 : 1;
  } else {
    state.markerX = event.x;
    state.markerY = event.y;
    if (inMain) state.dpadHandled = true;
  }
  drawScreen(state);
  recordHistory(state, event.kind === "button" ? `APPLY A ${event.buttonValue ? "PRESS" : "RELEASE"}` : "APPLY DPAD");
}

function serviceTimer(state: MovingMissionState) {
  state.cpuAt = "main";
  state.currentStep = "UPDATE FRAME";
  const nextX = state.autoX + state.direction;
  if (nextX < 0 || nextX >= DISPLAY_WIDTH) state.direction = state.direction === 1 ? -1 : 1;
  state.autoX += state.direction;
  state.frameCount++;
  state.pendingTimer = false;
  drawScreen(state);
  recordHistory(state, "TIMER FRAME");
  state.currentStep = "WAIT FOR EVENT";
}

// Runtime snapshots inputs and supplies IRQ entry/return. Only these chapter
// blocks run here; waiting inside a handler prevents main from servicing events.
function runHandler(state: MovingMissionState): boolean {
  const event = state.handlerEvent!;
  state.cpuAt = "button_irq_handler";
  while (state.handlerIndex < state.installedProgram.handler.length) {
    const block = state.installedProgram.handler[state.handlerIndex];
    if (block === "read") {
      state.readEvent = { ...event };
      state.buttonReads++;
      state.currentStep = "READ BUTTON";
      recordHistory(state, event.kind === "button" ? `READ A ${event.buttonValue}` : "READ DPAD");
    } else if (block === "wait-release") {
      state.currentStep = "WAIT FOR RELEASE";
      if (state.buttonValue === 1) {
        recordHistory(state, "HANDLER WAIT");
        return false;
      }
    } else if (block === "record") {
      state.currentStep = "RECORD INPUT";
      if (state.readEvent) {
        if (!state.mainInputs.some((input) => input.id === event.id)) state.mainInputs.push({ ...state.readEvent });
        recordHistory(state, "INPUT RECORDED");
      } else recordHistory(state, "RECORD IGNORED / READ MISSING");
    } else if (block === "apply") {
      state.currentStep = "APPLY INPUT IN HANDLER";
      if (state.readEvent) applyInput(state, state.readEvent, false);
      else recordHistory(state, "APPLY IGNORED / READ MISSING");
    } else if (block === "ack") {
      state.pendingIrq = false;
      state.currentStep = "ACK IRQ";
      recordHistory(state, "IRQ ACKNOWLEDGED");
    }
    state.handlerIndex++;
  }
  if (state.pendingIrq) {
    state.currentStep = "ACK MISSING / IRQ PENDING";
    recordHistory(state, "MAIN BLOCKED");
    return false;
  }
  state.handlerEvent = null;
  state.readEvent = null;
  state.handlerIndex = 0;
  state.cpuAt = "main";
  state.currentStep = "WAIT FOR EVENT";
  recordHistory(state, "HANDLER RETURN");
  return true;
}

function serviceMainInputs(state: MovingMissionState) {
  while (state.mainInputs.length) {
    const event = state.mainInputs.shift()!;
    state.cpuAt = "main";
    state.currentStep = "APPLY INPUT";
    if (!state.installedProgram.mainInput.includes("apply")) recordHistory(state, "MAIN INPUT IGNORED / APPLY MISSING");
    for (const block of state.installedProgram.mainInput) if (block === "apply") applyInput(state, event, true);
  }
  state.cpuAt = "main";
  state.currentStep = "WAIT FOR EVENT";
}

// Each loop consumes one queued input or pauses, so a pending IRQ cannot recurse
// or starve the browser. Retrying it is exclusively tickMoving's responsibility.
function serviceRuntime(state: MovingMissionState) {
  for (;;) {
    if (!state.handlerEvent && state.pendingInputs.length) {
      state.handlerEvent = state.pendingInputs.shift()!;
      state.handlerIndex = 0;
      state.readEvent = null;
      state.pendingIrq = true;
      state.irqCount++;
      state.cpuAt = "button_irq_handler";
      state.currentStep = "IRQ ENTRY";
      recordHistory(state, "HANDLER ENTER");
    }
    if (state.handlerEvent && !runHandler(state)) return;
    serviceMainInputs(state);
    if (state.pendingTimer) serviceTimer(state);
    if (!state.pendingInputs.length) return;
  }
}

export function setMovingButton(state: Readonly<MovingMissionState>, pressed: number): MovingMissionState {
  const buttonValue = pressed ? 1 : 0;
  if (state.buttonValue === buttonValue) return copyState(state);
  const next = copyState(state);
  next.buttonValue = buttonValue;
  if (next.heldProgressMs < 1_000) next.heldProgressMs = 0;
  next.pendingInputs.push({ id: next.nextInputId++, kind: "button", buttonValue, x: next.requestedX, y: next.requestedY });
  serviceRuntime(next);
  return next;
}

export function moveMovingMarker(state: Readonly<MovingMissionState>, dx: number, dy: number): MovingMissionState {
  const next = copyState(state);
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return next;
  next.requestedX = Math.max(0, Math.min(DISPLAY_WIDTH - 1, next.requestedX + Math.trunc(dx)));
  next.requestedY = Math.max(0, Math.min(DISPLAY_HEIGHT - 1, next.requestedY + Math.trunc(dy)));
  next.pendingInputs.push({ id: next.nextInputId++, kind: "dpad", buttonValue: next.buttonValue, x: next.requestedX, y: next.requestedY });
  serviceRuntime(next);
  return next;
}

export function tickMoving(state: Readonly<MovingMissionState>, elapsedMs: number): MovingMissionState {
  const next = copyState(state);
  if (elapsedMs <= 0 || !Number.isFinite(elapsedMs)) return next;
  const totalMs = next.timerElapsedMs + elapsedMs;
  const ticks = Math.floor(totalMs / 100);
  next.timerElapsedMs = totalMs % 100;
  for (let tick = 0; tick < ticks; tick++) {
    next.pendingTimer = true;
    if (next.handlerEvent) {
      if (next.handlerIndex >= next.installedProgram.handler.length && next.pendingIrq) {
        next.handlerIndex = 0;
        next.readEvent = null;
        next.irqCount++;
        recordHistory(next, "PENDING IRQ RETRY");
        serviceRuntime(next);
      }
    } else serviceRuntime(next);
  }
  if (isMovingSolution(next.installedProgram) && next.buttonValue === 1 && !next.handlerEvent)
    next.heldProgressMs = Math.min(1_000, next.heldProgressMs + elapsedMs);
  return next;
}

export const isMovingMissionComplete = (state: Readonly<MovingMissionState>): boolean =>
  isMovingSolution(state.installedProgram) && state.heldProgressMs >= 1_000 && state.dpadHandled;
