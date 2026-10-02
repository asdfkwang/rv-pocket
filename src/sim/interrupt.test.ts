import { describe, expect, test } from "bun:test";
import { createInitialInterruptState, flashInterruptProgram, IDLE_VERIFICATION_MS, INTERRUPT_SOLUTION, isInterruptMissionComplete, POLLING_READS_PER_SECOND, rebootInterruptTarget, setInterruptButton, tickInterrupt, type InterruptProgram } from "./interrupt";

const installed = (program: InterruptProgram = INTERRUPT_SOLUTION) => flashInterruptProgram(createInitialInterruptState(), program);
const pressAndRelease = (program: InterruptProgram = INTERRUPT_SOLUTION) => setInterruptButton(setInterruptButton(installed(program), 1), 0);

describe("Stop Asking", () => {
  test("EP04's installed program still works and keeps reading without input", () => {
    const idle = tickInterrupt(createInitialInterruptState(), 3_000);
    expect(idle.buttonReads).toBe(POLLING_READS_PER_SECOND * 3);
    expect(idle.irqCount).toBe(0);
    expect(idle.cpuState).toBe("RUNNING");
    const press = setInterruptButton(idle, 1);
    expect(press.ledValue).toBe(1);
    expect(tickInterrupt(press, 100).buttonReads).toBe(press.buttonReads + 6_000);
    expect(setInterruptButton(press, 0).ledValue).toBe(0);
    expect(isInterruptMissionComplete(idle)).toBe(false);
  });

  test("installing interrupts resets counters and waits without reads", () => {
    const state = flashInterruptProgram(tickInterrupt(createInitialInterruptState(), 3_000), INTERRUPT_SOLUTION);
    const idle = tickInterrupt(state, 3_000);
    expect(idle.buttonReads).toBe(0);
    expect(idle.irqCount).toBe(0);
    expect(idle.cpuState).toBe("WAITING");
    expect(idle.flashCount).toBe(1);
    expect(isInterruptMissionComplete(idle)).toBe(false);
  });

  test("each press/release reads once, responds immediately, and acknowledges", () => {
    const press = setInterruptButton(installed(), 1);
    expect(press.buttonReads).toBe(1);
    expect(press.irqCount).toBe(1);
    expect(press.ledValue).toBe(1);
    expect(press.pendingIrq).toBe(false);
    expect(press.cpuState).toBe("WAITING");
    expect(press.lastEvent?.steps).toEqual(["BUTTON PRESS", "IRQ", "CPU WAKE / RUNNING", "BUTTON READ", "LED ON", "ACK", "CPU WAITING"]);
    const release = setInterruptButton(press, 0);
    expect(release.buttonReads).toBe(2);
    expect(release.irqCount).toBe(2);
    expect(release.ledValue).toBe(0);
    expect(release.lastEvent?.steps).toContain("LED OFF");
    expect(isInterruptMissionComplete(release)).toBe(false);
    expect(isInterruptMissionComplete(tickInterrupt(release, IDLE_VERIFICATION_MS - 1))).toBe(false);
    expect(isInterruptMissionComplete(tickInterrupt(release, IDLE_VERIFICATION_MS))).toBe(true);
  });

  test("holding and duplicate input do not cause extra IRQs or reads", () => {
    const press = setInterruptButton(installed(), 1);
    const held = tickInterrupt(setInterruptButton(press, 1), 10_000);
    expect(held.buttonReads).toBe(1);
    expect(held.irqCount).toBe(1);
    expect(held.ledValue).toBe(1);
    expect(isInterruptMissionComplete(held)).toBe(false);
    const idle = tickInterrupt(setInterruptButton(held, 0), 10_000);
    expect(setInterruptButton(idle, 0)).toEqual(idle);
    expect(idle.buttonReads).toBe(2);
    expect(idle.irqCount).toBe(2);
  });

  test("rapid alternating edges are handled independently of any replay", () => {
    let state = installed();
    for (let i = 0; i < 5; i++) {
      state = setInterruptButton(state, 1);
      expect(state.ledValue).toBe(1);
      state = setInterruptButton(state, 0);
      expect(state.ledValue).toBe(0);
    }
    expect(state.buttonReads).toBe(10);
    expect(state.irqCount).toBe(10);
    expect(state.lastEvent?.buttonValue).toBe(0);
    expect(state.lastEvent?.irqCount).toBe(10);
    expect(isInterruptMissionComplete(tickInterrupt(state, 1_000))).toBe(true);
  });

  test("missing ENABLE leaves input unserviced", () => {
    const press = setInterruptButton(installed({ ...INTERRUPT_SOLUTION, setup: [] }), 1);
    expect(press.buttonValue).toBe(1);
    expect(press.ledValue).toBe(0);
    expect(press.buttonReads).toBe(0);
    expect(press.irqCount).toBe(0);
    expect(press.lastEvent?.steps).toContain("IRQ DISABLED");
    expect(isInterruptMissionComplete(tickInterrupt(setInterruptButton(press, 0), 1_000))).toBe(false);
  });

  test("missing WAIT leaves a running CPU even when IRQs are acknowledged", () => {
    const release = pressAndRelease({ ...INTERRUPT_SOLUTION, wait: [] });
    expect(release.ledValue).toBe(0);
    expect(release.irqCount).toBe(2);
    expect(release.pendingIrq).toBe(false);
    expect(tickInterrupt(release, 1_000).cpuState).toBe("RUNNING");
    expect(isInterruptMissionComplete(tickInterrupt(release, 1_000))).toBe(false);
  });

  test("missing READ or reading after UPDATE uses zero for the update", () => {
    for (const handler of [["update", "ack"], ["update", "read", "ack"]]) {
      const press = setInterruptButton(installed({ ...INTERRUPT_SOLUTION, handler }), 1);
      expect(press.ledValue).toBe(0);
      expect(press.buttonReads).toBe(Number(handler.includes("read")));
      expect(isInterruptMissionComplete(tickInterrupt(setInterruptButton(press, 0), 1_000))).toBe(false);
    }
  });

  test("missing UPDATE reads and acknowledges without changing the LED", () => {
    const press = setInterruptButton(installed({ ...INTERRUPT_SOLUTION, handler: ["read", "ack"] }), 1);
    expect(press.buttonReads).toBe(1);
    expect(press.irqCount).toBe(1);
    expect(press.pendingIrq).toBe(false);
    expect(press.ledValue).toBe(0);
    expect(isInterruptMissionComplete(tickInterrupt(setInterruptButton(press, 0), 1_000))).toBe(false);
  });

  test("missing ACK leaves a pending source and repeatedly runs the handler", () => {
    const press = setInterruptButton(installed({ ...INTERRUPT_SOLUTION, handler: ["read", "update"] }), 1);
    const storm = tickInterrupt(press, 1_000);
    expect(storm.cpuState).toBe("RUNNING");
    expect(storm.pendingIrq).toBe(true);
    expect(storm.buttonReads).toBe(11);
    expect(storm.irqCount).toBe(11);
    expect(storm.lastEvent).toEqual(press.lastEvent);
    expect(storm.lastEvent?.steps).not.toContain("ACK");
    expect(storm.lastEvent?.steps).toContain("IRQ STILL PENDING / RUNNING");
    expect(isInterruptMissionComplete(tickInterrupt(setInterruptButton(storm, 0), 1_000))).toBe(false);
  });

  test("service order is part of the exercise without inventing early-ACK failure", () => {
    const release = pressAndRelease({ ...INTERRUPT_SOLUTION, handler: ["read", "ack", "update"] });
    expect(release.ledValue).toBe(0);
    expect(release.pendingIrq).toBe(false);
    expect(isInterruptMissionComplete(tickInterrupt(release, 1_000))).toBe(false);
  });

  test("another event interrupts the idle verification interval", () => {
    let state = tickInterrupt(pressAndRelease(), 900);
    state = setInterruptButton(setInterruptButton(state, 1), 0);
    expect(isInterruptMissionComplete(tickInterrupt(state, 100))).toBe(false);
    expect(isInterruptMissionComplete(tickInterrupt(state, 1_000))).toBe(true);
  });

  test("reset preserves the installed program and clears evidence, pending, and trace", () => {
    const good = tickInterrupt(pressAndRelease(), 1_000);
    expect(isInterruptMissionComplete(good)).toBe(true);
    const reset = rebootInterruptTarget(good);
    expect(reset.installedProgram).toEqual(INTERRUPT_SOLUTION);
    expect(reset.buttonReads).toBe(0);
    expect(reset.irqCount).toBe(0);
    expect(reset.cpuState).toBe("WAITING");
    expect(reset.lastEvent).toBeNull();
    expect(isInterruptMissionComplete(reset)).toBe(false);
    const storm = setInterruptButton(installed({ ...INTERRUPT_SOLUTION, handler: [] }), 1);
    expect(rebootInterruptTarget(storm).pendingIrq).toBe(false);
  });

  test("a later flash clears success and copies the draft", () => {
    const good = tickInterrupt(pressAndRelease(), 1_000);
    const handler = ["read", "update"];
    const wrong = flashInterruptProgram(good, { ...INTERRUPT_SOLUTION, handler });
    handler.push("ack");
    expect(wrong.installedProgram.kind === "interrupt" && wrong.installedProgram.handler).toEqual(["read", "update"]);
    expect(wrong.lastEvent).toBeNull();
    expect(wrong.hasPressedWithResponse).toBe(false);
    expect(isInterruptMissionComplete(wrong)).toBe(false);
    const polling = flashInterruptProgram(good, { kind: "polling" });
    expect(polling.cpuState).toBe("RUNNING");
    expect(tickInterrupt(polling, 100).buttonReads).toBe(6_000);
  });
});
