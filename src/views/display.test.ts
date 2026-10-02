import { expect, test } from "bun:test";
import { createAppState, missionComplete, navigate, resetMission } from "../app-state";
import { flashDisplayProgram, rebootDisplayTarget, tickDisplay } from "../sim/display";
import { renderPc, renderEditor } from "./pc";
import { renderInspectionPanel } from "./inspection";
import { renderSuccess } from "./mission";

test("EP06 drafts stay separate from installed startup across views and reset", () => {
  let state = createAppState({ chapterId: 6, view: "pc" });
  if (state.active.id !== 6) throw new Error("Expected display");
  const installed = state.active.machine;
  state.ui.draftBlocks.setup = ["power", "wait-ready", "test", "enable"];
  for (const view of ["book", "datasheet", "station", "pocket", "pc"] as const) {
    state = navigate(state, { chapterId: 6, view });
    expect(state.active.machine).toBe(installed);
  }
  expect(renderPc(state)).toContain("LIVE POCKET");
  expect(renderPc(state)).toContain("TEST MODE ignored");
  if (state.active.id !== 6) throw new Error("Expected display");
  state.active.machine = rebootDisplayTarget(state.active.machine);
  expect(state.ui.draftBlocks.setup).toEqual(["power", "wait-ready", "test", "enable"]);
  state = resetMission(state);
  expect(state.ui.draftBlocks.setup).toEqual(["power", "test", "enable"]);
});

test("EP06 shows actual placement order and succeeds without opening references", () => {
  const state = createAppState({ chapterId: 6, view: "pc" });
  if (state.active.id !== 6) throw new Error("Expected display");
  state.ui.draftBlocks.setup = ["enable", "test", "wait-ready", "power"];
  const source = renderEditor(state, true).split('<div class="block-palette"')[0]!;
  expect(source.indexOf("start_button_led_irqs()")).toBeLessThan(source.indexOf("display_enable()"));
  expect(source).toContain("while (1) cpu_wait()");
  expect(source.indexOf("display_enable()")).toBeLessThan(source.indexOf("display_power_on()"));
  state.active.machine = tickDisplay(flashDisplayProgram(state.active.machine, ["power", "wait-ready", "test", "enable"]), 500);
  expect(missionComplete(state)).toBe(true);
  expect(renderPc(state)).toContain('display-pixel on');
  expect(renderSuccess(state)).toContain("First light");
  state.ui.coverOpen = true;
  expect(renderInspectionPanel(state)).toContain('data-module="display"');
  expect(renderInspectionPanel(state)).toContain("OUTPUT ENABLED");
});
