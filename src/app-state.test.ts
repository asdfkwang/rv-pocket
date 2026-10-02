import { describe, expect, test } from "bun:test";
import { createAppState, missionComplete, navigate, parseRoute, resetMission, routeHash, type View } from "./app-state";
import { flashFirmware, rebootTarget } from "./sim/uart";

describe("episode navigation", () => {
  test("PC, datasheet, book, station and Pocket preserve the attempt", () => {
    let state = createAppState({ chapterId: 1, view: "pc" });
    state.ui.introDismissed = true;
    state.ui.draftByte = "0x41";
    state.ui.datasheetSection = "ascii";
    for (const view of ["datasheet", "book", "station", "pocket", "pc"] as const) {
      state = navigate(state, { chapterId: 1, view });
      expect(state.ui.draftByte).toBe("0x41");
      expect(state.active.id === 1 && state.active.machine.terminalOutput).toBe("B");
      expect(missionComplete(state)).toBe(false);
      expect(state.ui.introDismissed).toBe(true);
      expect(state.ui.datasheetSection).toBe("ascii");
    }
  });

  test("episode reset restores B, clears the build, and keeps the view", () => {
    const state = createAppState({ chapterId: 1, view: "pocket" });
    if (state.active.id !== 1) throw new Error("Expected Episode 01");
    state.active.machine = rebootTarget(flashFirmware(state.active.machine, 0x41));
    state.ui.draftByte = "0x41";
    state.ui.buildPhase = "flashing";
    state.ui.buildLog = ["FLASH..."];
    expect(missionComplete(state)).toBe(true);
    const reset = resetMission(state);
    expect(reset.view).toBe("pocket");
    expect(reset.active.id === 1 && reset.active.machine.terminalOutput).toBe("B");
    expect(reset.ui.draftByte).toBe("0x42");
    expect(reset.ui.buildPhase).toBe("idle");
    expect(reset.ui.buildLog).toEqual([]);
    expect(missionComplete(reset)).toBe(false);
  });

  test("changing episodes creates a fresh attempt", () => {
    const state = createAppState({ chapterId: 1, view: "pc" });
    state.ui.draftByte = "0x41";
    const prologue = navigate(state, { chapterId: 0, view: "pc" });
    const returned = navigate(prologue, { chapterId: 1, view: "pc" });
    expect(returned.ui.draftByte).toBe("0x42");
    expect(returned.active.id === 1 && returned.active.machine.terminalOutput).toBe("B");
  });

  test("canonical routes and old view links resolve to the new screens", () => {
    for (const view of ["station", "pc", "pocket", "datasheet", "book"] as const) {
      expect(parseRoute(routeHash({ chapterId: 1, view })).route).toEqual({ chapterId: 1, view });
    }
    for (const [legacy, view] of [["workbench", "station"], ["computer", "pc"], ["terminal", "pc"], ["manual", "book"], ["ebook", "book"]] as const) {
      expect(parseRoute(`#chapter=01&view=${legacy}`).route.view).toBe(view as View);
    }
    expect(parseRoute("#episode=04&view=station").route).toEqual({ chapterId: 4, view: "station" });
    expect(parseRoute("#episode=05&view=station").route).toEqual({ chapterId: 5, view: "station" });
    const unavailable = parseRoute("#episode=06&view=pc");
    expect(unavailable.route).toEqual({ chapterId: 0, view: "pc" });
    expect(unavailable.notice).not.toBe("");
  });
});
