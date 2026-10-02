import { describe, expect, test } from "bun:test";
import { DISPLAY_WIDTH, FB_BASE } from "./framebuffer";
import { createInitialMovingState, flashMovingProgram, isMovingMissionComplete, isMovingSolution, moveMovingMarker, MOVING_SOLUTION, movingProgramFromDraft, rebootMovingTarget, setMovingButton, tickMoving, type MovingProgram } from "./moving";

const installed = (program: MovingProgram = MOVING_SOLUTION) => flashMovingProgram(createInitialMovingState(), program);

describe("short interrupt handlers and main events", () => {
  test("initial animation advances at ten frames per second while main is idle", () => {
    const state = createInitialMovingState();
    expect(state.cpuAt).toBe("main");
    expect(state.currentStep).toBe("WAIT FOR EVENT");
    expect(state.cells[FB_BASE + 4 * DISPLAY_WIDTH + 8]).toBe(1);
    expect(state.cells[FB_BASE + 2 * DISPLAY_WIDTH + 4]).toBe(2);
    const beforeFrame = tickMoving(state, 99);
    expect(beforeFrame.frameCount).toBe(0);
    const oneFrame = tickMoving(beforeFrame, 1);
    expect(oneFrame.frameCount).toBe(1);
    expect(oneFrame.autoX).toBe(5);
    expect(tickMoving(oneFrame, 900).frameCount).toBe(10);
    expect(oneFrame.currentStep).toBe("WAIT FOR EVENT");
  });

  test("the inherited handler waits for release and preserves the last hardware frame", () => {
    const running = tickMoving(createInitialMovingState(), 200);
    const pressed = setMovingButton(running, 1);
    expect(pressed.cpuAt).toBe("button_irq_handler");
    expect(pressed.currentStep).toBe("WAIT FOR RELEASE");
    expect(pressed.buttonReads).toBe(1);
    expect(pressed.irqCount).toBe(1);
    expect(pressed.pendingIrq).toBe(true);
    const blocked = tickMoving(pressed, 2_000);
    expect(blocked.frameCount).toBe(running.frameCount);
    expect(blocked.cells).toEqual(running.cells);
    expect(blocked.autoX).toBe(running.autoX);
    expect(blocked.pendingTimer).toBe(true);
    expect(blocked.irqCount).toBe(1);
    expect(blocked.heldProgressMs).toBe(0);
    expect(isMovingMissionComplete(blocked)).toBe(false);
  });

  test("release finishes the old handler and coalesces all blocked timer ticks to one frame", () => {
    const blocked = tickMoving(setMovingButton(createInitialMovingState(), 1), 2_000);
    const released = setMovingButton(blocked, 0);
    expect(released.frameCount).toBe(1);
    expect(released.autoX).toBe(3);
    expect(released.direction).toBe(-1);
    expect(released.pendingTimer).toBe(false);
    expect(released.pendingIrq).toBe(false);
    expect(released.irqCount).toBe(2);
    expect(released.buttonReads).toBe(2);
    expect(released.cpuAt).toBe("main");
    expect(released.currentStep).toBe("WAIT FOR EVENT");
    expect(tickMoving(released, 99).frameCount).toBe(1);
    expect(tickMoving(released, 100).frameCount).toBe(2);
  });

  test("DPAD events during the blocked handler queue coordinate snapshots in order", () => {
    let state = setMovingButton(createInitialMovingState(), 1);
    const previousCells = state.cells;
    state = moveMovingMarker(state, 1, 0);
    state = moveMovingMarker(state, 1, -1);
    expect([state.markerX, state.markerY]).toEqual([8, 4]);
    expect(state.cells).toEqual(previousCells);
    expect(state.pendingInputs.map((event) => [event.x, event.y])).toEqual([[9, 4], [10, 3]]);
    state = setMovingButton(state, 0);
    expect([state.markerX, state.markerY]).toEqual([10, 3]);
    expect(state.pendingInputs).toEqual([]);
    expect(state.mainInputs).toEqual([]);
    expect(state.irqCount).toBe(4);
    expect(state.dpadHandled).toBe(false);
  });

  test("the short handler records and acknowledges, then main applies each input immediately", () => {
    const pressed = setMovingButton(installed(), 1);
    expect(pressed.direction).toBe(-1);
    expect(pressed.buttonValue).toBe(1);
    expect(pressed.ledValue).toBe(1);
    expect(pressed.pendingIrq).toBe(false);
    expect(pressed.handlerEvent).toBeNull();
    expect(pressed.mainInputs).toEqual([]);
    expect(pressed.cpuAt).toBe("main");
    expect(pressed.currentStep).toBe("WAIT FOR EVENT");
    const moved = moveMovingMarker(pressed, 1, 0);
    expect([moved.markerX, moved.markerY]).toEqual([9, 4]);
    expect(moved.cells[FB_BASE + 4 * DISPLAY_WIDTH + 9]).toBe(1);
    expect(moved.cells[FB_BASE + 4 * DISPLAY_WIDTH + 8]).toBe(0);
    expect(moved.frameCount).toBe(0);
    expect(moved.direction).toBe(-1);
    expect(moved.dpadHandled).toBe(true);
    const released = setMovingButton(moved, 0);
    expect(released.direction).toBe(-1);
    expect(released.ledValue).toBe(0);
    expect(released.irqCount).toBe(3);
    expect(released.buttonReads).toBe(3);
  });

  test("hold evidence requires 1000 continuous milliseconds and a main-handled DPAD input", () => {
    let state = setMovingButton(installed(), 1);
    state = tickMoving(state, 999);
    expect(state.frameCount).toBe(9);
    expect(state.heldProgressMs).toBe(999);
    expect(isMovingMissionComplete(state)).toBe(false);
    state = moveMovingMarker(state, 1, 0);
    expect(isMovingMissionComplete(state)).toBe(false);
    state = tickMoving(state, 1);
    expect(state.frameCount).toBe(10);
    expect(state.heldProgressMs).toBe(1_000);
    expect(isMovingMissionComplete(state)).toBe(true);
    state = setMovingButton(state, 0);
    expect(state.heldProgressMs).toBe(1_000);
    expect(isMovingMissionComplete(state)).toBe(true);
    const holdOnly = tickMoving(setMovingButton(installed(), 1), 1_000);
    expect(isMovingMissionComplete(holdOnly)).toBe(false);
    expect(isMovingMissionComplete(moveMovingMarker(holdOnly, 0, 1))).toBe(true);
  });

  test("small elapsed chunks count continuous hold time independent of the frame phase", () => {
    let state = setMovingButton(tickMoving(installed(), 99), 1);
    state = tickMoving(state, 1);
    expect(state.heldProgressMs).toBe(1);
    expect(state.frameCount).toBe(1);
    for (let i = 0; i < 19; i++) state = tickMoving(state, 50);
    expect(state.heldProgressMs).toBe(951);
    state = tickMoving(state, 49);
    expect(state.heldProgressMs).toBe(1_000);
    expect(isMovingMissionComplete(moveMovingMarker(state, 1, 0))).toBe(true);
  });

  test("an early release resets incomplete hold evidence", () => {
    let state = tickMoving(setMovingButton(moveMovingMarker(installed(), 1, 0), 1), 900);
    state = setMovingButton(state, 0);
    expect(state.heldProgressMs).toBe(0);
    state = tickMoving(setMovingButton(state, 1), 100);
    expect(state.heldProgressMs).toBe(100);
    expect(isMovingMissionComplete(state)).toBe(false);
    expect(isMovingMissionComplete(tickMoving(state, 900))).toBe(true);
  });

  test("duplicate A states create no extra events and each rapid press reverses exactly once", () => {
    let state = installed();
    for (let i = 0; i < 5; i++) {
      const directionBefore = state.direction;
      state = setMovingButton(state, 1);
      expect(state.direction).toBe(directionBefore === 1 ? -1 : 1);
      const pressed = state;
      state = setMovingButton(state, 1);
      expect(state).toEqual(pressed);
      state = setMovingButton(state, 0);
      expect(state.direction).toBe(pressed.direction);
      expect(setMovingButton(state, 0)).toEqual(state);
    }
    expect(state.irqCount).toBe(10);
    expect(state.buttonReads).toBe(10);
    expect(state.pendingInputs).toEqual([]);
  });

  test("missing READ, RECORD, APPLY or recording before READ leaves input unapplied", () => {
    for (const program of [
      { handler: ["record", "ack"], mainInput: ["apply"] },
      { handler: ["read", "ack"], mainInput: ["apply"] },
      { handler: ["read", "record", "ack"], mainInput: [] },
      { handler: ["record", "read", "ack"], mainInput: ["apply"] },
    ]) {
      let state = setMovingButton(installed(program), 1);
      state = moveMovingMarker(state, 1, 0);
      state = tickMoving(state, 1_000);
      expect(state.direction).toBe(1);
      expect([state.markerX, state.markerY]).toEqual([8, 4]);
      expect(state.dpadHandled).toBe(false);
      expect(state.heldProgressMs).toBe(0);
      expect(isMovingMissionComplete(state)).toBe(false);
      expect(state.cpuAt).toBe("main");
    }
  });

  test("missing ACK blocks main and retries once per logical 100ms tick", () => {
    const program = { handler: ["read", "record"], mainInput: ["apply"] };
    const pressed = setMovingButton(installed(program), 1);
    expect(pressed.currentStep).toBe("ACK MISSING / IRQ PENDING");
    expect(pressed.direction).toBe(1);
    expect(pressed.irqCount).toBe(1);
    expect(pressed.pendingIrq).toBe(true);
    const beforeRetry = tickMoving(pressed, 99);
    expect(beforeRetry.irqCount).toBe(1);
    const retried = tickMoving(beforeRetry, 1);
    expect(retried.irqCount).toBe(2);
    const storm = tickMoving(retried, 900);
    expect(storm.irqCount).toBe(11);
    expect(storm.buttonReads).toBe(11);
    expect(storm.mainInputs).toHaveLength(1);
    expect(storm.frameCount).toBe(0);
    expect(storm.pendingTimer).toBe(true);
    expect(storm.history.length).toBeLessThanOrEqual(12);
    expect(isMovingMissionComplete(storm)).toBe(false);
    const released = setMovingButton(storm, 0);
    expect(released.irqCount).toBe(11);
    expect(released.pendingInputs).toHaveLength(1);
    expect(released.pendingIrq).toBe(true);
  });

  test("handler APPLY may work without the wait but fails the intended main placement", () => {
    const program = { handler: ["read", "apply", "ack"], mainInput: [] };
    let state = setMovingButton(installed(program), 1);
    expect(state.direction).toBe(-1);
    expect(state.pendingIrq).toBe(false);
    state = moveMovingMarker(state, 1, 0);
    expect(state.markerX).toBe(9);
    expect(state.dpadHandled).toBe(false);
    state = tickMoving(state, 1_000);
    expect(state.frameCount).toBe(10);
    expect(isMovingMissionComplete(state)).toBe(false);
    const retrying = tickMoving(setMovingButton(installed({ handler: ["read", "apply"], mainInput: [] }), 1), 1_000);
    expect(retrying.direction).toBe(-1);
    expect(retrying.irqCount).toBe(11);
  });

  test("exact block order and placement are required without inventing an early-ACK malfunction", () => {
    const earlyAck = { handler: ["read", "ack", "record"], mainInput: ["apply"] };
    let state = setMovingButton(installed(earlyAck), 1);
    state = moveMovingMarker(state, 1, 0);
    expect(state.direction).toBe(-1);
    expect(state.markerX).toBe(9);
    expect(isMovingMissionComplete(tickMoving(state, 1_000))).toBe(false);
    expect(isMovingSolution(earlyAck)).toBe(false);
    expect(isMovingSolution(MOVING_SOLUTION)).toBe(true);
  });

  test("all six handler orders complete only for READ → RECORD → ACK", () => {
    const blocks = ["read", "record", "ack"];
    for (const first of blocks) {
      for (const second of blocks.filter((block) => block !== first)) {
        const third = blocks.find((block) => block !== first && block !== second)!;
        const program = { handler: [first, second, third], mainInput: ["apply"] };
        const state = tickMoving(setMovingButton(moveMovingMarker(installed(program), 1, 0), 1), 1_000);
        expect(isMovingMissionComplete(state)).toBe(program.handler.join(",") === "read,record,ack");
      }
    }
  });

  test("DPAD clamps boundaries and a main-handled boundary event still earns evidence", () => {
    let state = moveMovingMarker(installed(), -100, 100);
    expect([state.markerX, state.markerY]).toEqual([0, 7]);
    state = moveMovingMarker(state, -1, 0);
    expect([state.markerX, state.markerY]).toEqual([0, 7]);
    expect(state.dpadHandled).toBe(true);
    expect(state.irqCount).toBe(2);
    state = moveMovingMarker(state, 100, -100);
    expect([state.markerX, state.markerY]).toEqual([15, 0]);
    for (const invalid of [NaN, Infinity, -Infinity]) {
      expect(moveMovingMarker(state, invalid, 0)).toEqual(state);
      expect(moveMovingMarker(state, 0, invalid)).toEqual(state);
    }
  });

  test("autonomous movement stays in bounds and redraws without stale pixels", () => {
    let state = installed();
    for (let i = 0; i < 40; i++) {
      const before = state;
      state = tickMoving(state, 100);
      expect(state.autoX).toBeGreaterThanOrEqual(0);
      expect(state.autoX).toBeLessThan(DISPLAY_WIDTH);
      expect(state.cells[FB_BASE + before.autoY * DISPLAY_WIDTH + before.autoX]).toBe(0);
      expect(state.cells[FB_BASE + state.autoY * DISPLAY_WIDTH + state.autoX]).toBe(2);
      expect(state.cells[FB_BASE + state.markerY * DISPLAY_WIDTH + state.markerX]).toBe(1);
    }
    expect(state.frameCount).toBe(40);
    expect(state.history).toHaveLength(12);
  });

  test("reboot preserves copied firmware but clears queues, history, hold, frame and observations", () => {
    const complete = tickMoving(setMovingButton(moveMovingMarker(installed(), 1, 0), 1), 1_000);
    expect(isMovingMissionComplete(complete)).toBe(true);
    const reset = rebootMovingTarget(complete);
    expect(reset.installedProgram).toEqual(MOVING_SOLUTION);
    expect(reset.flashCount).toBe(complete.flashCount);
    expect(reset.frameCount).toBe(0);
    expect(reset.history).toEqual([]);
    expect(reset.heldProgressMs).toBe(0);
    expect(reset.dpadHandled).toBe(false);
    expect(reset.buttonValue).toBe(0);
    expect(reset.ledValue).toBe(0);
    expect(reset.pendingTimer).toBe(false);
    expect(reset.pendingIrq).toBe(false);
    expect(reset.handlerEvent).toBeNull();
    expect(reset.pendingInputs).toEqual([]);
    expect(reset.mainInputs).toEqual([]);
    expect(isMovingMissionComplete(reset)).toBe(false);
    const blocked = moveMovingMarker(tickMoving(setMovingButton(createInitialMovingState(), 1), 1_000), 1, 0);
    expect(rebootMovingTarget(blocked)).toEqual(createInitialMovingState());
  });

  test("reflash replaces the old blocked execution and isolates source arrays", () => {
    const blocked = moveMovingMarker(tickMoving(setMovingButton(createInitialMovingState(), 1), 1_000), 1, 0);
    const handler = ["read", "record", "ack"];
    const mainInput = ["apply"];
    const repaired = flashMovingProgram(blocked, { handler, mainInput });
    handler.pop();
    mainInput.pop();
    expect(repaired.installedProgram).toEqual(MOVING_SOLUTION);
    expect(repaired.flashCount).toBe(1);
    expect(repaired.pendingInputs).toEqual([]);
    expect(repaired.pendingTimer).toBe(false);
    expect(repaired.buttonValue).toBe(0);
    expect(tickMoving(repaired, 100).frameCount).toBe(1);
    expect(blocked.currentStep).toBe("WAIT FOR RELEASE");
    const replacement = flashMovingProgram(repaired, { handler: [], mainInput: [] });
    expect(replacement.flashCount).toBe(2);
    expect(replacement.history).toEqual([]);
  });

  test("draft conversion uses named slots and copies placements", () => {
    const draft = { handler: ["read", "record", "ack"], "main-input": ["apply"] };
    const program = movingProgramFromDraft(draft);
    draft.handler.pop();
    draft["main-input"].pop();
    expect(program).toEqual(MOVING_SOLUTION);
    expect(movingProgramFromDraft({})).toEqual({ handler: [], mainInput: [] });
  });

  test("transitions and invalid ticks leave earlier snapshots unchanged", () => {
    const state = installed();
    const before = structuredClone(state);
    const pressed = setMovingButton(state, 1);
    const pressedBefore = structuredClone(pressed);
    tickMoving(pressed, 1_000);
    moveMovingMarker(pressed, 1, 0);
    setMovingButton(pressed, 0);
    rebootMovingTarget(pressed);
    expect(state).toEqual(before);
    expect(pressed).toEqual(pressedBefore);
    for (const invalid of [0, -1, NaN, Infinity]) expect(tickMoving(state, invalid)).toEqual(before);
  });
});
