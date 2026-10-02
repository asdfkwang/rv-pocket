export const RAM_START = 0x00000000;
export const RAM_END = 0x00002000;
export const WORKAREA_START = 0x00001800;
export const WORKAREA_END = 0x00001a00;

export interface MemoryRange { start: number; end: number }

export interface MemoryMissionState {
  uartConnected: boolean;
  testStart: number;
  testEnd: number;
  installedStart: number;
  installedEnd: number;
  runCount: number;
  passed: boolean;
  errorAddresses: number[];
  bytesChecked: number;
  terminalOutput: string;
  flashCount: number;
  transmissionCount: number;
}

export function formatAddress(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}

export function parseAddress(input: string): number | null {
  const text = input.trim();
  return /^0x[0-9a-f]{1,8}$/i.test(text) ? Number.parseInt(text.slice(2), 16) : null;
}

export function readMemoryRange(startText: string, endText: string): { range: MemoryRange | null; error: string } {
  const start = parseAddress(startText);
  const end = parseAddress(endText);
  if (start === null || end === null) return { range: null, error: "Enter both addresses in hex, for example 0x00001A00." };
  if (start < RAM_START || end > RAM_END || start >= end) {
    return { range: null, error: "Use a non-empty range inside RAM: 0x00000000 ≤ START < END ≤ 0x00002000. END is excluded." };
  }
  return { range: { start, end }, error: "" };
}

export function runMemoryTest(state: Readonly<MemoryMissionState>, range: MemoryRange): MemoryMissionState {
  const overlapStart = Math.max(range.start, WORKAREA_START);
  const overlapEnd = Math.min(range.end, WORKAREA_END);
  const passed = overlapStart >= overlapEnd;
  const candidates = [[0x1834, 0x18a0], [0x1824, 0x1910], [0x1858, 0x197c], [0x186c, 0x18d4]][state.runCount % 4]!;
  const errorAddresses = passed ? [] : [...new Set(candidates.map((address) =>
    address >= overlapStart && address < overlapEnd ? address : overlapStart + ((address - WORKAREA_START) % (overlapEnd - overlapStart)),
  ))];
  const bytesChecked = range.end - range.start;
  const terminalOutput = passed
    ? `MEMTEST\n\nPASS\n${bytesChecked} bytes checked\n0 errors`
    : `MEMTEST\n\n${errorAddresses.map((address) => `FAIL @ ${formatAddress(address)}`).join("\n")}\n\nRun ${state.runCount + 1}`;
  return { ...state, testStart: range.start, testEnd: range.end, runCount: state.runCount + 1, passed, errorAddresses, bytesChecked, terminalOutput, transmissionCount: state.transmissionCount + 1 };
}

export function createInitialMemoryState(): MemoryMissionState {
  return runMemoryTest({
    uartConnected: true, testStart: RAM_START, testEnd: RAM_END,
    installedStart: RAM_START, installedEnd: RAM_END,
    runCount: 0, passed: false, errorAddresses: [], bytesChecked: 0,
    terminalOutput: "", flashCount: 0, transmissionCount: 0,
  }, { start: RAM_START, end: RAM_END });
}

export const isMemoryMissionComplete = (state: Readonly<MemoryMissionState>): boolean => state.passed && state.runCount > 0;

export function flashMemoryFirmware(state: Readonly<MemoryMissionState>, range: MemoryRange): MemoryMissionState {
  return runMemoryTest({ ...state, installedStart: range.start, installedEnd: range.end, flashCount: state.flashCount + 1 }, range);
}

export function rebootMemoryTarget(state: Readonly<MemoryMissionState>): MemoryMissionState {
  return runMemoryTest(state, { start: state.installedStart, end: state.installedEnd });
}
