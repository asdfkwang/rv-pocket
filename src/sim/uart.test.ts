import { describe, expect, test } from "bun:test";
import { createInitialUartState, flashFirmware, formatByte, isUartMissionComplete, parseByte, rebootTarget, serialDisplay } from "./uart";

describe("Wrong Byte", () => {
  test("starts with a connected UART and an inherited B", () => {
    const state = createInitialUartState();
    expect(state.uartConnected).toBe(true);
    expect(state.firmwareByte).toBe(0x42);
    expect(state.terminalOutput).toBe("B");
    expect(isUartMissionComplete(state)).toBe(false);
  });

  test("installing the byte does not produce a serial character until boot", () => {
    const original = createInitialUartState();
    const flashed = flashFirmware(original, 0x41);
    expect(original.firmwareByte).toBe(0x42);
    expect(flashed.terminalOutput).toBe("B");
    expect(isUartMissionComplete(flashed)).toBe(false);
    const booted = rebootTarget(flashed);
    expect(booted.terminalOutput).toBe("A");
    expect(booted.flashCount).toBe(1);
    expect(booted.transmissionCount).toBe(2);
    expect(isUartMissionComplete(booted)).toBe(true);
  });

  test("another valid byte boots but fails the objective", () => {
    const state = rebootTarget(flashFirmware(createInitialUartState(), 0x43));
    expect(state.terminalOutput).toBe("C");
    expect(isUartMissionComplete(state)).toBe(false);
  });

  test("reset retransmits the installed byte without reflashing", () => {
    const fixed = rebootTarget(flashFirmware(createInitialUartState(), 0x41));
    const reset = rebootTarget(fixed);
    expect(reset.terminalOutput).toBe("A");
    expect(reset.flashCount).toBe(fixed.flashCount);
    expect(reset.transmissionCount).toBe(fixed.transmissionCount + 1);
  });

  test("a later wrong flash replaces the successful observation", () => {
    const fixed = rebootTarget(flashFirmware(createInitialUartState(), 0x41));
    const wrong = rebootTarget(flashFirmware(fixed, 0x42));
    expect(wrong.terminalOutput).toBe("B");
    expect(isUartMissionComplete(wrong)).toBe(false);
  });

  test("completion needs an actual received A", () => {
    const disconnected = rebootTarget(flashFirmware({ ...createInitialUartState(), uartConnected: false }, 0x41));
    expect(disconnected.terminalOutput).toBe("");
    expect(isUartMissionComplete(disconnected)).toBe(false);
  });

  test("accepts only a hex byte, including both boundaries", () => {
    for (const [input, expected] of [["0x00", 0], ["0xff", 255], [" 0X41 ", 65], ["0xA", 10]] as const) {
      expect(parseByte(input)).toBe(expected);
    }
    for (const input of ["", "65", "A", "0x100", "-1", "0xGG", "0x41junk", "0x41;0x42"]) {
      expect(parseByte(input)).toBeNull();
    }
    for (const byte of [-1, 256, 1.5, NaN]) {
      expect(() => flashFirmware(createInitialUartState(), byte)).toThrow(RangeError);
    }
  });

  test("renders control bytes visibly without treating them as terminal commands", () => {
    expect(serialDisplay("A")).toBe("A");
    expect(serialDisplay("\0\n\x1b\xff")).toBe("\\x00\\x0A\\x1B\\xFF");
    expect(formatByte(0x41)).toBe("0x41");
  });
});
