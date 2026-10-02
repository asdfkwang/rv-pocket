import type { ProgramPlacement } from "../chapters/types";
import { BUTTON_A_BIT } from "../platform";
import { runProgram, SOLUTION_BLOCKS as POLLING_BLOCKS } from "./input";

// An observation rate for the prototype, not a simulated CPU clock.
export const POLLING_READS_PER_SECOND = 60_000;
export const INTERRUPT_TICK_MS = 100;
export const IDLE_VERIFICATION_MS = 1_000;

export interface InterruptProgram {
  kind: "interrupt";
  setup: readonly string[];
  wait: readonly string[];
  handler: readonly string[];
}

export type InstalledButtonProgram = { kind: "polling" } | InterruptProgram;
export const INTERRUPT_SOLUTION: InterruptProgram = {
  kind: "interrupt", setup: ["enable"], wait: ["wait"], handler: ["read", "update", "ack"],
};

export interface IrqEvent {
  buttonValue: number;
  steps: readonly string[];
  buttonReads: number;
  irqCount: number;
}

export interface InterruptMissionState {
  installedProgram: InstalledButtonProgram;
  buttonValue: number;
  ledValue: number;
  buttonReads: number;
  irqCount: number;
  cpuState: "RUNNING" | "WAITING";
  pendingIrq: boolean;
  hasPressedWithResponse: boolean;
  hasReleasedWithResponse: boolean;
  idleVerifiedMs: number;
  lastEvent: IrqEvent | null;
  flashCount: number;
}

export function interruptProgramFromDraft(draft: ProgramPlacement): InterruptProgram {
  return { kind: "interrupt", setup: [...(draft.setup ?? [])], wait: [...(draft.wait ?? [])], handler: [...(draft.handler ?? [])] };
}

export function isInterruptSolution(program: InstalledButtonProgram): boolean {
  return program.kind === "interrupt"
    && program.setup.join(",") === "enable"
    && program.wait.join(",") === "wait"
    && program.handler.join(",") === "read,update,ack";
}

export function createInitialInterruptState(): InterruptMissionState {
  return {
    installedProgram: { kind: "polling" }, buttonValue: 0, ledValue: 0,
    buttonReads: 0, irqCount: 0, cpuState: "RUNNING", pendingIrq: false,
    hasPressedWithResponse: false, hasReleasedWithResponse: false,
    idleVerifiedMs: 0, lastEvent: null, flashCount: 0,
  };
}

export function rebootInterruptTarget(state: Readonly<InterruptMissionState>): InterruptMissionState {
  const program = state.installedProgram;
  return {
    ...createInitialInterruptState(), installedProgram: program, flashCount: state.flashCount,
    cpuState: program.kind === "interrupt" && program.wait.includes("wait") ? "WAITING" : "RUNNING",
  };
}

export function flashInterruptProgram(state: Readonly<InterruptMissionState>, program: InstalledButtonProgram): InterruptMissionState {
  const installedProgram = program.kind === "polling" ? { kind: "polling" } as const
    : interruptProgramFromDraft({ setup: program.setup, wait: program.wait, handler: program.handler });
  return rebootInterruptTarget({ ...state, installedProgram, flashCount: state.flashCount + 1 });
}

// Runtime entry/exit and controller wiring are supplied. The learner controls only
// a register read, an LED update, and acknowledgement, without a C interpreter.
function runHandler(state: Readonly<InterruptMissionState>, recordEvent: boolean): InterruptMissionState {
  const program = state.installedProgram;
  if (program.kind !== "interrupt") return { ...state };
  let register = 0;
  let ledValue = state.ledValue;
  let buttonReads = state.buttonReads;
  let pendingIrq = state.pendingIrq;
  const steps = [state.buttonValue ? "BUTTON PRESS" : "BUTTON RELEASE", "IRQ", "CPU WAKE / RUNNING"];
  for (const block of program.handler) {
    if (block === "read") {
      register = state.buttonValue;
      buttonReads++;
      steps.push("BUTTON READ");
    } else if (block === "update") {
      ledValue = register & BUTTON_A_BIT ? 1 : 0;
      steps.push(ledValue ? "LED ON" : "LED OFF");
    } else if (block === "ack") {
      pendingIrq = false;
      steps.push("ACK");
    }
  }
  const cpuState = !pendingIrq && program.wait.includes("wait") ? "WAITING" : "RUNNING";
  steps.push(pendingIrq ? "IRQ STILL PENDING / RUNNING" : `CPU ${cpuState}`);
  const irqCount = state.irqCount + 1;
  return {
    ...state, ledValue, buttonReads, pendingIrq, cpuState, irqCount, idleVerifiedMs: 0,
    hasPressedWithResponse: state.hasPressedWithResponse || (state.buttonValue === 1 && ledValue === 1),
    hasReleasedWithResponse: state.hasReleasedWithResponse || (state.hasPressedWithResponse && state.buttonValue === 0 && ledValue === 0),
    lastEvent: recordEvent ? { buttonValue: state.buttonValue, steps, buttonReads, irqCount } : state.lastEvent,
  };
}

export function setInterruptButton(state: Readonly<InterruptMissionState>, buttonValue: number): InterruptMissionState {
  if (state.buttonValue === buttonValue) return { ...state };
  const next = { ...state, buttonValue, idleVerifiedMs: 0, hasReleasedWithResponse: false };
  const program = state.installedProgram;
  if (program.kind === "polling") {
    return { ...next, ledValue: runProgram(POLLING_BLOCKS, buttonValue).led, buttonReads: state.buttonReads + 1 };
  }
  if (!program.setup.includes("enable")) {
    return { ...next, lastEvent: { buttonValue, steps: [buttonValue ? "BUTTON PRESS" : "BUTTON RELEASE", "IRQ DISABLED"], buttonReads: state.buttonReads, irqCount: state.irqCount } };
  }
  return runHandler({ ...next, pendingIrq: true, cpuState: "RUNNING" }, true);
}

// Busy reads are aggregated; an unacknowledged source is serviced once per tick.
// A replay never drives this state, so rapid press/release cannot lose an edge.
export function tickInterrupt(state: Readonly<InterruptMissionState>, elapsedMs: number): InterruptMissionState {
  if (elapsedMs <= 0 || !Number.isFinite(elapsedMs)) return { ...state };
  if (state.installedProgram.kind === "polling") {
    return { ...state, buttonReads: state.buttonReads + Math.floor(POLLING_READS_PER_SECOND * elapsedMs / 1_000), ledValue: runProgram(POLLING_BLOCKS, state.buttonValue).led };
  }
  if (state.pendingIrq) {
    let next: InterruptMissionState = { ...state };
    for (let tick = 0; tick < Math.floor(elapsedMs / INTERRUPT_TICK_MS); tick++) next = runHandler(next, false);
    return next;
  }
  const verifying = isInterruptSolution(state.installedProgram) && state.cpuState === "WAITING"
    && state.buttonValue === 0 && state.ledValue === 0 && state.hasPressedWithResponse && state.hasReleasedWithResponse;
  return { ...state, idleVerifiedMs: verifying ? Math.min(IDLE_VERIFICATION_MS, state.idleVerifiedMs + elapsedMs) : 0 };
}

export const isInterruptMissionComplete = (state: Readonly<InterruptMissionState>): boolean =>
  isInterruptSolution(state.installedProgram) && state.cpuState === "WAITING" && !state.pendingIrq
  && state.buttonValue === 0 && state.ledValue === 0 && state.hasPressedWithResponse && state.hasReleasedWithResponse
  && state.idleVerifiedMs >= IDLE_VERIFICATION_MS;
