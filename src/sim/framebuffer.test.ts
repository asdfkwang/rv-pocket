import { describe, expect, test } from "bun:test";
import { createInitialFramebufferState, DISPLAY_HEIGHT, DISPLAY_WIDTH, FB_BASE, flashFramebufferProgram, isFramebufferMissionComplete, moveFramebufferMarker, rebootFramebufferTarget, ROW_BYTES_CHOICES, setFramebufferPosition, type FramebufferMissionState, type RowBytes } from "./framebuffer";

const installed = (rowBytes: RowBytes = 16) => flashFramebufferProgram(createInitialFramebufferState(), rowBytes);
const visitTargets = (state: FramebufferMissionState) => {
  let next = state;
  for (const [x, y] of [[8, 4], [0, 0], [15, 0], [0, 7], [15, 7]]) next = setFramebufferPosition(next, x!, y!);
  return next;
};

describe("framebuffer row stride", () => {
  test("the inherited 32-byte stride writes the first marker outside the scan window", () => {
    const state = createInitialFramebufferState();
    expect(state.installedRowBytes).toBe(32);
    expect([state.x, state.y]).toEqual([3, 5]);
    expect(state.lastWrite).toEqual({ address: 0x30a3, value: 1 });
    expect(state.cells[0x30a3]).toBe(1);
    expect(state.actualPixel).toBeNull();
    expect(state.observedTargets).toEqual([]);
    expect(state.flashCount).toBe(0);
    expect(isFramebufferMissionComplete(state)).toBe(false);
  });

  test("the three program strides map the same request using the fixed 16-byte scanout", () => {
    const cases = [
      { stride: 8 as const, address: FB_BASE + 43, pixel: { x: 11, y: 2 } },
      { stride: 16 as const, address: FB_BASE + 83, pixel: { x: 3, y: 5 } },
      { stride: 32 as const, address: FB_BASE + 163, pixel: null },
    ];
    expect(ROW_BYTES_CHOICES).toEqual([8, 16, 32]);
    for (const { stride, address, pixel } of cases) {
      const state = installed(stride);
      expect(state.lastWrite.address).toBe(address);
      expect(state.actualPixel).toEqual(pixel);
      expect(state.cells[address]).toBe(1);
    }
  });

  test("all 128 requests use the selected stride and decode against the scan window", () => {
    for (const stride of ROW_BYTES_CHOICES) {
      let state = installed(stride);
      for (let y = 0; y < DISPLAY_HEIGHT; y++) {
        for (let x = 0; x < DISPLAY_WIDTH; x++) {
          state = setFramebufferPosition(state, x, y);
          const offset = y * stride + x;
          expect(state.lastWrite.address).toBe(FB_BASE + offset);
          expect(state.actualPixel).toEqual(offset < DISPLAY_WIDTH * DISPLAY_HEIGHT
            ? { x: offset % DISPLAY_WIDTH, y: Math.floor(offset / DISPLAY_WIDTH) } : null);
        }
      }
    }
  });

  test("each request clears the old visible marker before writing exactly one byte", () => {
    const state = installed();
    const moved = setFramebufferPosition(state, 10, 6);
    expect(state.cells[FB_BASE + 83]).toBe(1);
    expect(moved.cells[FB_BASE + 83]).toBe(0);
    expect(moved.cells[FB_BASE + 106]).toBe(1);
    expect(Object.entries(moved.cells).filter(([address, value]) => Number(address) < FB_BASE + 128 && value === 1)).toHaveLength(1);
    expect(Object.keys(moved.cells)).toHaveLength(128);
  });

  test("off-screen writes remain in RAM while later visible requests clear only scanout", () => {
    let state = createInitialFramebufferState();
    state = setFramebufferPosition(state, 15, 7);
    const outsideAddress = FB_BASE + 7 * 32 + 15;
    expect(state.actualPixel).toBeNull();
    expect(state.lastWrite.address).toBe(outsideAddress);
    expect(state.cells[FB_BASE + 163]).toBe(1);
    expect(state.cells[outsideAddress]).toBe(1);
    state = setFramebufferPosition(state, 0, 0);
    expect(state.actualPixel).toEqual({ x: 0, y: 0 });
    expect(state.cells[FB_BASE]).toBe(1);
    expect(state.cells[FB_BASE + 163]).toBe(1);
    expect(state.cells[outsideAddress]).toBe(1);
    expect(state.observedTargets).toEqual([]);
  });

  test("positions and directional moves clamp to the screen and normalize finite fractions", () => {
    let state = setFramebufferPosition(installed(), -50, 100);
    expect([state.x, state.y]).toEqual([0, 7]);
    state = moveFramebufferMarker(state, 100, -100);
    expect([state.x, state.y]).toEqual([15, 0]);
    state = setFramebufferPosition(state, 3.9, 5.1);
    expect([state.x, state.y]).toEqual([3, 5]);
    state = moveFramebufferMarker(state, -1, 1);
    expect([state.x, state.y]).toEqual([2, 6]);
    expect(state.actualPixel).toEqual({ x: 2, y: 6 });
  });

  test("nonfinite positions and moves are ignored without writes or target evidence", () => {
    const state = installed();
    for (const invalid of [NaN, Infinity, -Infinity]) {
      expect(setFramebufferPosition(state, invalid, 4)).toEqual(state);
      expect(setFramebufferPosition(state, 8, invalid)).toEqual(state);
      expect(moveFramebufferMarker(state, invalid, 0)).toEqual(state);
      expect(moveFramebufferMarker(state, 0, invalid)).toEqual(state);
    }
    expect(state.observedTargets).toEqual([]);
  });

  test("the center and all corners must be observed correctly, in any order", () => {
    let state = installed();
    const targets = [[15, 7], [0, 7], [15, 0], [0, 0], [8, 4]] as const;
    for (const [index, [x, y]] of targets.entries()) {
      state = setFramebufferPosition(state, x, y);
      expect(state.actualPixel).toEqual({ x, y });
      expect(state.observedTargets).toHaveLength(index + 1);
      expect(isFramebufferMissionComplete(state)).toBe(index === targets.length - 1);
    }
    const repeated = setFramebufferPosition(state, 8, 4);
    expect(repeated.observedTargets).toEqual(state.observedTargets);
    expect(isFramebufferMissionComplete(setFramebufferPosition(repeated, 2, 3))).toBe(true);
  });

  test("wrong strides cannot collect targets even where the first row happens to match", () => {
    for (const stride of [8, 32] as const) {
      const state = visitTargets(installed(stride));
      expect(state.observedTargets).toEqual([]);
      expect(isFramebufferMissionComplete(state)).toBe(false);
      expect(isFramebufferMissionComplete({ ...state, observedTargets: ["8,4", "0,0", "15,0", "0,7", "15,7"] })).toBe(false);
    }
  });

  test("RESET preserves the installed stride and flash count but restarts the test", () => {
    const good = visitTargets(installed());
    const reset = rebootFramebufferTarget(good);
    expect(reset.installedRowBytes).toBe(16);
    expect(reset.flashCount).toBe(good.flashCount);
    expect([reset.x, reset.y]).toEqual([3, 5]);
    expect(reset.actualPixel).toEqual({ x: 3, y: 5 });
    expect(reset.observedTargets).toEqual([]);
    expect(reset.cells).toEqual(installed().cells);
    expect(isFramebufferMissionComplete(reset)).toBe(false);
    const wrong = rebootFramebufferTarget(setFramebufferPosition(createInitialFramebufferState(), 15, 7));
    expect(wrong.installedRowBytes).toBe(32);
    expect(wrong.cells[FB_BASE + 239]).toBeUndefined();
    expect(wrong.lastWrite.address).toBe(FB_BASE + 163);
  });

  test("flashing clears RAM and success, restarts (3,5), and increments flash count", () => {
    const wrong = setFramebufferPosition(createInitialFramebufferState(), 15, 7);
    const repaired = flashFramebufferProgram(wrong, 16);
    expect(repaired.cells[FB_BASE + 163]).toBeUndefined();
    expect(repaired.cells[FB_BASE + 239]).toBeUndefined();
    expect(repaired.flashCount).toBe(1);
    expect([repaired.x, repaired.y]).toEqual([3, 5]);
    expect(repaired.observedTargets).toEqual([]);
    const completed = visitTargets(repaired);
    expect(isFramebufferMissionComplete(completed)).toBe(true);
    const regression = flashFramebufferProgram(completed, 8);
    expect(regression.flashCount).toBe(2);
    expect(regression.observedTargets).toEqual([]);
    expect(regression.actualPixel).toEqual({ x: 11, y: 2 });
    expect(isFramebufferMissionComplete(regression)).toBe(false);
  });

  test("state transitions leave prior cells, writes, and target evidence untouched", () => {
    const state = installed();
    const before = structuredClone(state);
    const moved = setFramebufferPosition(state, 0, 0);
    const further = moveFramebufferMarker(moved, 15, 7);
    flashFramebufferProgram(state, 32);
    rebootFramebufferTarget(state);
    expect(state).toEqual(before);
    expect(moved.observedTargets).toEqual(["0,0"]);
    expect(moved.cells[FB_BASE]).toBe(1);
    expect(further.observedTargets).toEqual(["0,0", "15,7"]);
    expect(further.cells[FB_BASE]).toBe(0);
  });
});
