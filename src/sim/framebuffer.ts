export const FB_BASE = 0x3000;
export const DISPLAY_WIDTH = 16;
export const DISPLAY_HEIGHT = 8;
export const ROW_BYTES_CHOICES = [8, 16, 32] as const;
export type RowBytes = typeof ROW_BYTES_CHOICES[number];

export interface FramebufferMissionState {
  installedRowBytes: RowBytes;
  x: number;
  y: number;
  cells: Record<number, number>;
  lastWrite: { address: number; value: number };
  actualPixel: { x: number; y: number } | null;
  observedTargets: string[];
  flashCount: number;
}

const TARGETS = ["8,4", "0,0", "15,0", "0,7", "15,7"];

function drawMarker(state: Readonly<FramebufferMissionState>, x: number, y: number): FramebufferMissionState {
  const cells = { ...state.cells };
  const visibleBytes = DISPLAY_WIDTH * DISPLAY_HEIGHT;
  for (let offset = 0; offset < visibleBytes; offset++) cells[FB_BASE + offset] = 0;
  const address = FB_BASE + y * state.installedRowBytes + x;
  cells[address] = 1;
  const offset = address - FB_BASE;
  const actualPixel = offset >= 0 && offset < visibleBytes
    ? { x: offset % DISPLAY_WIDTH, y: Math.floor(offset / DISPLAY_WIDTH) }
    : null;
  const target = `${x},${y}`;
  const observedTargets = [...state.observedTargets];
  if (state.installedRowBytes === DISPLAY_WIDTH && actualPixel?.x === x && actualPixel.y === y
    && TARGETS.includes(target) && !observedTargets.includes(target)) observedTargets.push(target);
  return { ...state, x, y, cells, lastWrite: { address, value: 1 }, actualPixel, observedTargets };
}

function freshFramebufferTarget(installedRowBytes: RowBytes, flashCount: number): FramebufferMissionState {
  return drawMarker({
    installedRowBytes, x: 3, y: 5, cells: {}, lastWrite: { address: FB_BASE, value: 0 },
    actualPixel: null, observedTargets: [], flashCount,
  }, 3, 5);
}

export function createInitialFramebufferState(): FramebufferMissionState {
  return freshFramebufferTarget(32, 0);
}

export function setFramebufferPosition(state: Readonly<FramebufferMissionState>, x: number, y: number): FramebufferMissionState {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { ...state };
  const boundedX = Math.min(DISPLAY_WIDTH - 1, Math.max(0, Math.trunc(x)));
  const boundedY = Math.min(DISPLAY_HEIGHT - 1, Math.max(0, Math.trunc(y)));
  return drawMarker(state, boundedX, boundedY);
}

export function moveFramebufferMarker(state: Readonly<FramebufferMissionState>, dx: number, dy: number): FramebufferMissionState {
  return setFramebufferPosition(state, state.x + dx, state.y + dy);
}

export function flashFramebufferProgram(state: Readonly<FramebufferMissionState>, rowBytes: RowBytes): FramebufferMissionState {
  return freshFramebufferTarget(rowBytes, state.flashCount + 1);
}

export function rebootFramebufferTarget(state: Readonly<FramebufferMissionState>): FramebufferMissionState {
  return freshFramebufferTarget(state.installedRowBytes, state.flashCount);
}

export const isFramebufferMissionComplete = (state: Readonly<FramebufferMissionState>): boolean =>
  state.installedRowBytes === DISPLAY_WIDTH && TARGETS.every((target) => state.observedTargets.includes(target));
