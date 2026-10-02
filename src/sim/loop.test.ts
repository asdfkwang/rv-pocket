import { describe, expect, test } from "bun:test";
import { BUSY_BLOCKS, createInitialLoopState, flashLoopProgram, isLoopMissionComplete, LOOP_PASSES_PER_SECOND, pollLoop, SOLUTION_BLOCKS, tickLoop } from "./loop";

describe("The Busy Loop", () => {
  test("the inherited loop keeps working, and keeps asking", () => {
    const idle = tickLoop(createInitialLoopState(), LOOP_PASSES_PER_SECOND * 3);
    expect(idle.loopPasses).toBe(180);
    // Every pass read the button even though it could not have changed.
    expect(idle.buttonReads).toBe(180);
    expect(idle.ledValue).toBe(0);
    const pressed = pollLoop(idle, 1);
    expect(pressed.ledValue).toBe(1);
    expect(pollLoop(pressed, 0).ledValue).toBe(0);
    expect(isLoopMissionComplete(idle)).toBe(false);
  });

  test("waiting before the read leaves the register alone while idle", () => {
    const fixed = flashLoopProgram(createInitialLoopState(), SOLUTION_BLOCKS);
    const idle = tickLoop(fixed, LOOP_PASSES_PER_SECOND * 3);
    expect(idle.loopPasses).toBe(180);
    expect(idle.buttonReads).toBe(0);
    expect(idle.heartbeat).toBe(0);
  });

  test("the fixed loop still answers a press and a release", () => {
    const fixed = flashLoopProgram(createInitialLoopState(), SOLUTION_BLOCKS);
    const idle = tickLoop(fixed, LOOP_PASSES_PER_SECOND);
    const pressed = pollLoop(idle, 1);
    expect(pressed.ledValue).toBe(1);
    expect(pressed.buttonReads).toBe(1);
    const released = pollLoop(pressed, 0);
    expect(released.ledValue).toBe(0);
    expect(released.buttonReads).toBe(2);
    expect(isLoopMissionComplete(released)).toBe(true);
  });

  test("the wait has to come before the read", () => {
    const last = flashLoopProgram(createInitialLoopState(), [...BUSY_BLOCKS, "wait"]);
    expect(tickLoop(last, 60).buttonReads).toBe(60);
  });

  test("a later wrong flash clears an earlier success", () => {
    const installed = flashLoopProgram(createInitialLoopState(), SOLUTION_BLOCKS);
    const good = pollLoop(pollLoop(installed, 1), 0);
    expect(isLoopMissionComplete(good)).toBe(true);
    const wrong = flashLoopProgram(good, BUSY_BLOCKS);
    expect(wrong.hasPressedWithResponse).toBe(false);
    expect(isLoopMissionComplete(wrong)).toBe(false);
  });

  test("the second job only advances when the loop does not wait", () => {
    const busy = tickLoop(createInitialLoopState(), 10);
    expect(busy.heartbeat).toBe(10);
    const fixed = flashLoopProgram(createInitialLoopState(), SOLUTION_BLOCKS);
    expect(tickLoop(fixed, 10).heartbeat).toBe(0);
    expect(pollLoop(fixed, 1).heartbeat).toBe(1);
  });
});
