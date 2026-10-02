import { describe, expect, test } from "bun:test";
import { createInitialDisplayState, DISPLAY_READY_MS, flashDisplayProgram, isDisplayMissionComplete, rebootDisplayTarget, setDisplayButton, tickDisplay } from "./display";

const SOLUTION = ["power", "wait-ready", "test", "enable"];
const installed = (blocks: readonly string[] = SOLUTION) => flashDisplayProgram(createInitialDisplayState(), blocks);

describe("display initialization", () => {
  test("the inherited program writes too early and stays black after readiness", () => {
    const state = createInitialDisplayState();
    expect(state.installedBlocks).toEqual(["power", "test", "enable"]);
    expect(state.powered).toBe(true);
    expect(state.ready).toBe(false);
    expect(state.waiting).toBe(false);
    expect(state.stepIndex).toBe(3);
    expect(state.log).toContain("TEST MODE ignored: display is not ready.");
    expect(state.log).toContain("ENABLE OUTPUT ignored: display is not ready.");
    const ready = tickDisplay(state, DISPLAY_READY_MS);
    expect(ready.ready).toBe(true);
    expect(ready.mode).toBe("NONE");
    expect(ready.outputEnabled).toBe(false);
    expect(isDisplayMissionComplete(ready)).toBe(false);
  });

  test("WAIT READY pauses at 499 ms and resumes the correct order at 500 ms", () => {
    const state = installed();
    expect(state.waiting).toBe(true);
    expect(state.stepIndex).toBe(1);
    expect(state.mode).toBe("NONE");
    const waiting = tickDisplay(state, DISPLAY_READY_MS - 1);
    expect(waiting.elapsedPowerMs).toBe(499);
    expect(waiting.ready).toBe(false);
    expect(waiting.waiting).toBe(true);
    expect(waiting.stepIndex).toBe(1);
    expect(isDisplayMissionComplete(waiting)).toBe(false);
    const ready = tickDisplay(waiting, 1);
    expect(ready.elapsedPowerMs).toBe(500);
    expect(ready.ready).toBe(true);
    expect(ready.waiting).toBe(false);
    expect(ready.stepIndex).toBe(SOLUTION.length);
    expect(ready.mode).toBe("TEST");
    expect(ready.outputEnabled).toBe(true);
    expect(isDisplayMissionComplete(ready)).toBe(true);
    expect(ready.log.slice(-4)).toEqual([
      "DISPLAY READY: startup completed.",
      "WAIT READY: ready; initialization continues.",
      "TEST MODE: pattern selected.",
      "OUTPUT ENABLED: test pattern is visible.",
    ]);
  });

  test("readiness advances through accumulated ticks and excess time is bounded", () => {
    let state = installed();
    for (let i = 0; i < 4; i++) state = tickDisplay(state, 100);
    expect(state.elapsedPowerMs).toBe(400);
    expect(state.ready).toBe(false);
    state = tickDisplay(state, 1_000);
    expect(state.elapsedPowerMs).toBe(DISPLAY_READY_MS);
    expect(isDisplayMissionComplete(state)).toBe(true);
    const idle = tickDisplay(state, 10_000);
    expect(idle).toEqual(state);
    expect(idle.log.filter((line) => line.startsWith("DISPLAY READY"))).toHaveLength(1);
  });

  test("waiting before power blocks the later POWER block indefinitely", () => {
    const waiting = installed(["wait-ready", "power", "test", "enable"]);
    const later = tickDisplay(waiting, 10_000);
    expect(later.powered).toBe(false);
    expect(later.ready).toBe(false);
    expect(later.elapsedPowerMs).toBe(0);
    expect(later.waiting).toBe(true);
    expect(later.stepIndex).toBe(0);
    expect(later.log).toEqual(["WAIT READY: display has no power; initialization cannot continue."]);
    expect(isDisplayMissionComplete(later)).toBe(false);
  });

  test("each missing block has an observable failure and cannot complete", () => {
    const noPower = tickDisplay(installed(SOLUTION.filter((block) => block !== "power")), 1_000);
    expect(noPower.powered).toBe(false);
    expect(noPower.waiting).toBe(true);
    const noWait = tickDisplay(installed(SOLUTION.filter((block) => block !== "wait-ready")), 1_000);
    expect(noWait.ready).toBe(true);
    expect(noWait.mode).toBe("NONE");
    const noTest = tickDisplay(installed(SOLUTION.filter((block) => block !== "test")), 1_000);
    expect(noTest.ready).toBe(true);
    expect(noTest.log).toContain("ENABLE OUTPUT ignored: TEST mode is not selected.");
    const noEnable = tickDisplay(installed(SOLUTION.filter((block) => block !== "enable")), 1_000);
    expect(noEnable.mode).toBe("TEST");
    expect(noEnable.outputEnabled).toBe(false);
    for (const failure of [noPower, noWait, noTest, noEnable]) expect(isDisplayMissionComplete(failure)).toBe(false);
  });

  test("premature TEST or ENABLE is ignored rather than replayed after WAIT", () => {
    const testBeforeWait = tickDisplay(installed(["power", "test", "wait-ready", "enable"]), 500);
    expect(testBeforeWait.ready).toBe(true);
    expect(testBeforeWait.mode).toBe("NONE");
    expect(testBeforeWait.outputEnabled).toBe(false);
    const enableBeforeWait = tickDisplay(installed(["power", "enable", "wait-ready", "test"]), 500);
    expect(enableBeforeWait.mode).toBe("TEST");
    expect(enableBeforeWait.outputEnabled).toBe(false);
    const enableBeforeTest = tickDisplay(installed(["power", "wait-ready", "enable", "test"]), 500);
    expect(enableBeforeTest.mode).toBe("TEST");
    expect(enableBeforeTest.log).toContain("ENABLE OUTPUT ignored: TEST mode is not selected.");
    for (const failure of [testBeforeWait, enableBeforeWait, enableBeforeTest]) expect(isDisplayMissionComplete(failure)).toBe(false);
  });

  test("an empty installed program leaves the display unpowered", () => {
    const state = tickDisplay(installed([]), 1_000);
    expect(state.installedBlocks).toEqual([]);
    expect(state.powered).toBe(false);
    expect(state.waiting).toBe(false);
    expect(state.log).toEqual([]);
    expect(isDisplayMissionComplete(state)).toBe(false);
  });

  test("only POWER → WAIT READY → TEST → ENABLE succeeds across every block order", () => {
    let successfulOrders = 0;
    for (const first of SOLUTION) {
      for (const second of SOLUTION.filter((block) => block !== first)) {
        for (const third of SOLUTION.filter((block) => block !== first && block !== second)) {
          const fourth = SOLUTION.find((block) => block !== first && block !== second && block !== third)!;
          const order = [first, second, third, fourth];
          const state = tickDisplay(installed(order), 1_000);
          const correct = order.join(",") === SOLUTION.join(",");
          expect(isDisplayMissionComplete(state)).toBe(correct);
          if (isDisplayMissionComplete(state)) successfulOrders++;
        }
      }
    }
    expect(successfulOrders).toBe(1);
  });

  test("RESET preserves firmware and flash count but restarts readiness and history", () => {
    const good = setDisplayButton(tickDisplay(installed(), 500), 1);
    const reset = rebootDisplayTarget({ ...good, log: [...good.log, "old execution marker"] });
    expect(reset.installedBlocks).toEqual(SOLUTION);
    expect(reset.flashCount).toBe(good.flashCount);
    expect(reset.elapsedPowerMs).toBe(0);
    expect(reset.ready).toBe(false);
    expect(reset.waiting).toBe(true);
    expect(reset.mode).toBe("NONE");
    expect(reset.outputEnabled).toBe(false);
    expect(reset.buttonValue).toBe(0);
    expect(reset.ledValue).toBe(0);
    expect(reset.log).toEqual(installed().log);
    expect(isDisplayMissionComplete(reset)).toBe(false);
    expect(isDisplayMissionComplete(tickDisplay(reset, 500))).toBe(true);
    expect(rebootDisplayTarget(createInitialDisplayState()).installedBlocks).toEqual(["power", "test", "enable"]);
  });

  test("flashing copies the draft and clears an earlier successful display", () => {
    const good = tickDisplay(installed(), 500);
    const draft = ["power", "test", "enable"];
    const failed = flashDisplayProgram(good, draft);
    draft.push("wait-ready");
    expect(failed.installedBlocks).toEqual(["power", "test", "enable"]);
    expect(failed.flashCount).toBe(2);
    expect(failed.ready).toBe(false);
    expect(failed.outputEnabled).toBe(false);
    expect(isDisplayMissionComplete(tickDisplay(failed, 1_000))).toBe(false);
    expect(isDisplayMissionComplete(good)).toBe(true);
  });

  test("buttons retain working LED behavior during startup, failure, and success", () => {
    for (const state of [createInitialDisplayState(), installed(), tickDisplay(installed(), 500)]) {
      const pressed = setDisplayButton(state, 1);
      expect(pressed.buttonValue).toBe(1);
      expect(pressed.ledValue).toBe(1);
      expect(setDisplayButton(pressed, 1)).toEqual(pressed);
      const released = setDisplayButton(pressed, 0);
      expect(released.buttonValue).toBe(0);
      expect(released.ledValue).toBe(0);
      expect(released.log).toEqual(state.log);
      expect(released.ready).toBe(state.ready);
      expect(released.outputEnabled).toBe(state.outputEnabled);
    }
  });

  test("ticks and transitions do not mutate earlier states", () => {
    const state = installed();
    const before = structuredClone(state);
    const ready = tickDisplay(state, 500);
    const waiting = tickDisplay(state, 100);
    expect(state).toEqual(before);
    expect(waiting.ready).toBe(false);
    expect(ready.ready).toBe(true);
    for (const elapsed of [0, -1, NaN, Infinity]) expect(tickDisplay(state, elapsed)).toEqual(before);
  });
});
