import { expect, test } from "bun:test";
import { createAppState, missionComplete, navigate, resetMission } from "../app-state";
import { flashFramebufferProgram, rebootFramebufferTarget, setFramebufferPosition } from "../sim/framebuffer";
import { renderPc, renderEditor } from "./pc";
import { renderInspectionPanel } from "./inspection";
import { renderPocketHardware } from "./pocket";
import { renderSuccess } from "./mission";

test("EP07 exposes byte math and a real off-screen RAM store", () => {
  const state = createAppState({ chapterId: 7, view: "pc" });
  const pc = renderPc(state);
  expect(pc).toContain('id="row-bytes"');
  expect(pc).toContain("5 × 32 = 160");
  expect(pc).toContain("0x000030A3");
  expect(pc).toContain("OUTSIDE DISPLAY");
  expect(pc.match(/data-action="test-pixel"/g)?.length).toBe(128);
  state.ui.coverOpen = true;
  state.ui.coverModule = "ram";
  expect(renderInspectionPanel(state)).toContain("0x000030A3  01 ← LAST WRITE");
  expect(renderPocketHardware(state, true)).toContain('data-direction="left"');
});

test("EP07 stride draft does not move output; coordinate tests use installed stride", () => {
  let state = createAppState({ chapterId: 7, view: "pc" });
  if (state.active.id !== 7) throw new Error("Expected framebuffer");
  state.ui.draftRowBytes = 16;
  expect(renderEditor(state, false)).toContain('source-preview-row-bytes" class="byte-preview">16');
  state.active.machine = setFramebufferPosition(state.active.machine, 3, 2);
  expect(state.active.machine.actualPixel).toEqual({ x: 3, y: 4 });
  const installed = state.active.machine;
  for (const view of ["book", "datasheet", "station", "pocket", "pc"] as const) {
    state = navigate(state, { chapterId: 7, view });
    expect(state.active.machine).toBe(installed);
    expect(state.ui.draftRowBytes).toBe(16);
  }
  if (state.active.id !== 7) throw new Error("Expected framebuffer");
  state.active.machine = rebootFramebufferTarget(state.active.machine);
  expect(state.active.machine.installedRowBytes).toBe(32);
  expect(state.ui.draftRowBytes).toBe(16);
  state = resetMission(state);
  expect(state.ui.draftRowBytes).toBe(32);
});

test("EP07 center and corner trials earn success without references", () => {
  const state = createAppState({ chapterId: 7, view: "pc" });
  if (state.active.id !== 7) throw new Error("Expected framebuffer");
  state.active.machine = flashFramebufferProgram(state.active.machine, 16);
  for (const [x, y] of [[15, 7], [0, 0], [8, 4], [0, 7], [15, 0]]) state.active.machine = setFramebufferPosition(state.active.machine, x!, y!);
  expect(missionComplete(state)).toBe(true);
  expect(renderPc(state)).toContain("VERIFIED 5/5");
  expect(renderSuccess(state)).toContain("Every row is in place");
});
