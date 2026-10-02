import { describe, expect, test } from "bun:test";
import { createInitialInputState, flashInputProgram, isInputMissionComplete, pollInput, runProgram, SOLUTION_BLOCKS } from "./input";

describe("Button to LED", () => {
  test("starts with a program that reads the button and never writes the LED", () => {
    const state = createInitialInputState();
    expect(state.installedBlocks).toEqual(["read", "if"]);
    expect(state.buttonValue).toBe(0);
    expect(state.ledValue).toBe(0);
    expect(pollInput(state, 1).ledValue).toBe(0);
    expect(isInputMissionComplete(state)).toBe(false);
  });

  test("the solution follows the button in both directions", () => {
    const installed = flashInputProgram(createInitialInputState(), SOLUTION_BLOCKS);
    const pressed = pollInput(installed, 1);
    expect(pressed.ledValue).toBe(1);
    const released = pollInput(pressed, 0);
    expect(released.ledValue).toBe(0);
    expect(isInputMissionComplete(released)).toBe(true);
  });

  test("a correct program still needs the player to press and release", () => {
    const installed = flashInputProgram(createInitialInputState(), SOLUTION_BLOCKS);
    expect(isInputMissionComplete(installed)).toBe(false);
    expect(isInputMissionComplete(pollInput(installed, 1))).toBe(false);
  });

  test("reading after the test uses a value the program never loaded", () => {
    expect(runProgram(["if", "read", "led-on", "else", "led-off"], 1).led).toBe(0);
    expect(runProgram(SOLUTION_BLOCKS, 1).led).toBe(1);
  });

  test("swapping the two writes inverts the LED", () => {
    const swapped = flashInputProgram(createInitialInputState(), ["read", "if", "led-off", "else", "led-on"]);
    expect(pollInput(swapped, 1).ledValue).toBe(0);
    expect(pollInput(swapped, 0).ledValue).toBe(1);
    expect(isInputMissionComplete(pollInput(swapped, 0))).toBe(false);
  });

  test("a later wrong flash clears an earlier success", () => {
    const installed = flashInputProgram(createInitialInputState(), SOLUTION_BLOCKS);
    const good = pollInput(pollInput(installed, 1), 0);
    expect(isInputMissionComplete(good)).toBe(true);
    const wrong = flashInputProgram(good, ["read", "if", "led-on", "else", "led-off"]);
    expect(wrong.hasPressedWithResponse).toBe(false);
    expect(isInputMissionComplete(wrong)).toBe(false);
  });

  test("only the bit decides the branch, not the whole word", () => {
    expect(runProgram(SOLUTION_BLOCKS, 1).led).toBe(1);
    expect(runProgram(SOLUTION_BLOCKS, 2).led).toBe(0);
    expect(runProgram(SOLUTION_BLOCKS, 0x01000000).led).toBe(0);
  });
});
