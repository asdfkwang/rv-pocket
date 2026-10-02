import { formatAddress, MTIME_ADDRESS, TIMER_FREQUENCY_HZ } from "../platform";

export const TIMER_ADDRESS = formatAddress(MTIME_ADDRESS);
export const EXPECTED_INTERVAL_MS = 1000;
export const TIMEBASE_RATES = [500_000_000, 1_000_000_000, 2_000_000_000] as const;
export type TimebaseRate = typeof TIMEBASE_RATES[number];
export const INITIAL_TIMEBASE_HZ: TimebaseRate = 2_000_000_000;

export interface TimerMissionState {
  uartConnected: boolean;
  timebaseHz: TimebaseRate;
  counterStartedAt: number | null;
  tickCount: number;
  lastTickAt: number | null;
  observedIntervalMs: number | null;
  verified: boolean;
  terminalOutput: string;
  tickLines: string[];
  flashCount: number;
  executionCount: number;
  transmissionCount: number;
}

export function parseTimebase(input: string): TimebaseRate | null {
  return TIMEBASE_RATES.find((rate) => String(rate) === input) ?? null;
}

export function formatFrequency(hz: number): string {
  return hz >= 1_000_000_000 ? `${hz / 1_000_000_000} GHz` : `${hz / 1_000_000} MHz`;
}

export function timerTargetTicks(timebaseHz: TimebaseRate): number {
  return timebaseHz * EXPECTED_INTERVAL_MS / 1000;
}

export function timerIntervalMs(timebaseHz: TimebaseRate): number {
  return timerTargetTicks(timebaseHz) / TIMER_FREQUENCY_HZ * 1000;
}

export function formatInterval(ms: number | null): string {
  return ms === null ? "measuring…" : `${(ms / 1000).toFixed(3)} s`;
}

// A 32-bit view of the counter. The real MTIME is 64-bit, but one word is enough
// to see it advancing, and it matches the width of every other cell in the RAM view.
export function mtimeCounter(state: Readonly<TimerMissionState>, now: number): number {
  if (state.counterStartedAt === null) return 0;
  return Math.floor(Math.max(0, now - state.counterStartedAt) * (TIMER_FREQUENCY_HZ / 1000)) >>> 0;
}

export function createInitialTimerState(): TimerMissionState {
  return { uartConnected: true, timebaseHz: INITIAL_TIMEBASE_HZ, counterStartedAt: null, tickCount: 0, lastTickAt: null, observedIntervalMs: null, verified: false, terminalOutput: "TIMER TEST\n\nWaiting for first tick…", tickLines: [], flashCount: 0, executionCount: 0, transmissionCount: 0 };
}

export function recordTimerTick(state: Readonly<TimerMissionState>, now: number): TimerMissionState {
  const observedIntervalMs = state.lastTickAt === null ? null : now - state.lastTickAt;
  const tickCount = state.tickCount + 1;
  const tickLines = [...state.tickLines, `tick ${tickCount}`].slice(-6);
  return {
    ...state, tickCount, lastTickAt: now, observedIntervalMs, tickLines,
    verified: state.verified || (state.timebaseHz === TIMER_FREQUENCY_HZ && observedIntervalMs !== null && Math.abs(observedIntervalMs - EXPECTED_INTERVAL_MS) <= 200),
    terminalOutput: `TIMER TEST\n\n${tickLines.join("\n")}\n\nINTERVAL: ${formatInterval(observedIntervalMs)}`,
    transmissionCount: state.transmissionCount + 1,
  };
}

export function rebootTimerTarget(state: Readonly<TimerMissionState>): TimerMissionState {
  return { ...state, tickCount: 0, lastTickAt: null, observedIntervalMs: null, verified: false, terminalOutput: "TIMER TEST\n\nWaiting for first tick…", tickLines: [], executionCount: state.executionCount + 1 };
}

export function flashTimerFirmware(state: Readonly<TimerMissionState>, timebaseHz: TimebaseRate): TimerMissionState {
  return { ...state, timebaseHz, verified: false, flashCount: state.flashCount + 1 };
}

export const isTimerMissionComplete = (state: Readonly<TimerMissionState>): boolean => state.timebaseHz === TIMER_FREQUENCY_HZ && state.verified;
