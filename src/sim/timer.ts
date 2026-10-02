export const TIMER_ADDRESS = "0xA2180000";
export const TARGET_TICKS = 10_000_000;
export const EXPECTED_INTERVAL_MS = 1000;
export const CLOCK_RATES = [5, 10, 20] as const;
export type ClockRate = typeof CLOCK_RATES[number];

export interface TimerMissionState {
  uartConnected: boolean;
  clockMhz: ClockRate;
  tickCount: number;
  lastTickAt: number | null;
  observedIntervalMs: number | null;
  verified: boolean;
  terminalOutput: string;
  tickLines: string[];
  flashCount: number;
  transmissionCount: number;
}

export function parseClock(input: string): ClockRate | null {
  return CLOCK_RATES.find((rate) => String(rate) === input) ?? null;
}

export function timerIntervalMs(clockMhz: ClockRate): number {
  return TARGET_TICKS / (clockMhz * 1_000_000) * 1000;
}

export function formatInterval(ms: number | null): string {
  return ms === null ? "measuring…" : `${(ms / 1000).toFixed(3)} s`;
}

export function createInitialTimerState(): TimerMissionState {
  return { uartConnected: true, clockMhz: 5, tickCount: 0, lastTickAt: null, observedIntervalMs: null, verified: false, terminalOutput: "TIMER TEST\n\nWaiting for first tick…", tickLines: [], flashCount: 0, transmissionCount: 0 };
}

export function recordTimerTick(state: Readonly<TimerMissionState>, now: number): TimerMissionState {
  const observedIntervalMs = state.lastTickAt === null ? null : now - state.lastTickAt;
  const tickCount = state.tickCount + 1;
  const tickLines = [...state.tickLines, `tick ${tickCount}`].slice(-6);
  return {
    ...state, tickCount, lastTickAt: now, observedIntervalMs, tickLines,
    verified: state.verified || (state.clockMhz === 10 && observedIntervalMs !== null && Math.abs(observedIntervalMs - EXPECTED_INTERVAL_MS) <= 200),
    terminalOutput: `TIMER TEST\n\n${tickLines.join("\n")}\n\nINTERVAL: ${formatInterval(observedIntervalMs)}`,
    transmissionCount: state.transmissionCount + 1,
  };
}

export function rebootTimerTarget(state: Readonly<TimerMissionState>): TimerMissionState {
  return { ...state, tickCount: 0, lastTickAt: null, observedIntervalMs: null, verified: false, terminalOutput: "TIMER TEST\n\nWaiting for first tick…", tickLines: [] };
}

export function flashTimerFirmware(state: Readonly<TimerMissionState>, clockMhz: ClockRate): TimerMissionState {
  return rebootTimerTarget({ ...state, clockMhz, flashCount: state.flashCount + 1 });
}

export const isTimerMissionComplete = (state: Readonly<TimerMissionState>): boolean => state.clockMhz === 10 && state.verified;
