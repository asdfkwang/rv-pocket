import { expect, test } from "bun:test";
import { createAppState, missionComplete, navigate, resetMission } from "../app-state";
import { editProgramBlock } from "../chapters/types";
import { chapter08 } from "../chapters/chapter-08";
import { flashMovingProgram, moveMovingMarker, movingProgramFromDraft, MOVING_SOLUTION, rebootMovingTarget, setMovingButton, tickMoving } from "../sim/moving";
import { renderEditor, renderPc } from "./pc";
import { renderInspectionPanel } from "./inspection";
import { renderSuccess } from "./mission";

test("moving APPLY INPUT between slots removes the previous placement", () => {
  const state = createAppState({ chapterId: 8, view: "pc" });
  const program = chapter08.computer.program!;
  expect(renderEditor(state, true)).toContain("MOVE HERE · APPLY INPUT");
  const previous = state.ui.draftBlocks;
  state.ui.draftBlocks = editProgramBlock(program, previous, "main-input", "apply", true);
  expect(previous.handler).toContain("apply");
  expect(state.ui.draftBlocks.handler).not.toContain("apply");
  expect(state.ui.draftBlocks["main-input"]).toEqual(["apply"]);
  state.ui.draftBlocks = editProgramBlock(program, state.ui.draftBlocks, "handler", "apply", true);
  expect(state.ui.draftBlocks["main-input"]).toEqual([]);
  expect(state.ui.draftBlocks.handler?.filter((id) => id === "apply").length).toBe(1);
  expect(editProgramBlock(program, state.ui.draftBlocks, "main-input", "read", true)).toBe(state.ui.draftBlocks);
});

test("EP08 shows the long handler and keeps the installed machine while drafting", () => {
  let state = createAppState({ chapterId: 8, view: "pc" });
  if (state.active.id !== 8) throw new Error("Expected moving");
  state.active.machine = tickMoving(setMovingButton(state.active.machine, 1), 1_000);
  const installed = state.active.machine;
  state.ui.draftBlocks = { handler: ["read", "record", "ack"], "main-input": ["apply"] };
  for (const view of ["book", "station", "datasheet", "pocket", "pc"] as const) {
    state = navigate(state, { chapterId: 8, view });
    expect(state.active.machine).toBe(installed);
  }
  expect(renderPc(state)).toContain("WAIT FOR RELEASE");
  expect(renderPc(state)).toContain("button_irq_handler");
  expect(renderPc(state)).toContain("PENDING");
  expect(missionComplete(state)).toBe(false);
  if (state.active.id !== 8) throw new Error("Expected moving");
  state.active.machine = rebootMovingTarget(state.active.machine);
  expect(state.active.machine.pendingTimer).toBe(false);
  expect(state.ui.draftBlocks.handler).toEqual(["read", "record", "ack"]);
  state = resetMission(state);
  expect(state.ui.draftBlocks.handler).toEqual(["read", "wait-release", "apply", "ack"]);
});

test("EP08 repaired flow stays playable after success and has no unavailable next link", () => {
  const state = createAppState({ chapterId: 8, view: "pc" });
  if (state.active.id !== 8) throw new Error("Expected moving");
  state.active.machine = flashMovingProgram(state.active.machine, MOVING_SOLUTION);
  state.active.machine = tickMoving(setMovingButton(state.active.machine, 1), 1_000);
  state.active.machine = moveMovingMarker(state.active.machine, -1, 0);
  expect(missionComplete(state)).toBe(true);
  expect(renderSuccess(state)).not.toContain("next-episode");
  state.active.machine = setMovingButton(state.active.machine, 0);
  const frames = state.active.machine.frameCount;
  state.active.machine = tickMoving(moveMovingMarker(state.active.machine, 1, 0), 500);
  expect(state.active.machine.frameCount).toBe(frames + 5);
  expect(missionComplete(state)).toBe(true);
  state.ui.coverOpen = true;
  state.ui.coverModule = "cpu";
  expect(renderInspectionPanel(state)).toContain("CURRENT EXECUTION / LIVE");
  state.ui.coverModule = "display";
  expect(renderInspectionPanel(state)).toContain("FRAMEBUFFER");
  expect(renderInspectionPanel(state)).not.toContain("CURRENT STEP");
  state.ui.coverModule = "ram";
  expect(renderInspectionPanel(state)).toContain("0x00003000");
  expect(movingProgramFromDraft({ handler: ["read", "record", "ack"], "main-input": ["apply"] })).toEqual(MOVING_SOLUTION);
});
