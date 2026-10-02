import { describe, expect, test } from "bun:test";
import { createAppState, missionComplete, navigate, resetMission, switchToInterruptDraft } from "../app-state";
import { flashInterruptProgram, interruptProgramFromDraft, INTERRUPT_SOLUTION, rebootInterruptTarget, setInterruptButton, tickInterrupt } from "../sim/interrupt";
import { flashInputProgram, pollInput, SOLUTION_BLOCKS } from "../sim/input";
import { renderEditor, sourceStatus } from "./pc";
import { irqReplayStep, renderInspectionPanel, renderIrqReplay } from "./inspection";
import { renderSuccess } from "./mission";

// Source comparisons ignore palette buttons, which intentionally stay in palette order.
const sourceOnly = (html: string) => html.split('<div class="block-palette"')[0]!;

describe("interrupt editor and observations", () => {
  test("draft transition and editing preserve installed polling across views", () => {
    let state = createAppState({ chapterId: 5, view: "pc" });
    if (state.active.id !== 5) throw new Error("Expected EP05");
    state.active.machine = tickInterrupt(state.active.machine, 100);
    expect(renderEditor(state, true)).toContain("SWITCH TO INTERRUPTS");
    expect(renderEditor(state, true)).toContain("read32(BUTTON_REG)");
    expect(renderEditor(state, true)).not.toContain("button_irq_handler");
    const machine = state.active.machine;
    state = switchToInterruptDraft(state);
    state.ui.draftBlocks = { setup: ["enable"], wait: ["wait"], handler: ["ack", "update", "read"] };
    for (const view of ["station", "book", "datasheet", "pocket", "pc"] as const) {
      state = navigate(state, { chapterId: 5, view });
      expect(state.active.machine).toBe(machine);
      expect(state.ui.draftInterrupts).toBe(true);
      expect(state.ui.draftBlocks.handler).toEqual(["ack", "update", "read"]);
    }
    const source = sourceOnly(renderEditor(state, true));
    expect(source.indexOf("gpio_irq_ack()")).toBeLessThan(source.indexOf("if (button"));
    expect(source.indexOf("if (button")).toBeLessThan(source.indexOf("read32(BUTTON_REG)"));
    expect(sourceStatus(state)).toContain("READ → UPDATE → ACK");
    expect(machine.buttonReads).toBe(6_000);
    expect(machine.installedProgram.kind).toBe("polling");
  });

  test("EP04 renders the chosen sequence rather than the palette sequence", () => {
    const state = createAppState({ chapterId: 4, view: "pc" });
    state.ui.draftBlocks.body = ["if", "read", "led-on", "else", "led-off"];
    const source = sourceOnly(renderEditor(state, true));
    expect(source.indexOf("if (button")).toBeLessThan(source.indexOf("read32(BUTTON_REG)"));
    expect(source).toContain("        }<");
    expect(source).not.toContain("place the blocks here");
    expect(sourceStatus(state)).toContain("never turns the LED on");
  });

  test("each block is attached to its role and all five lines appear in a solved draft", () => {
    const state = switchToInterruptDraft(createAppState({ chapterId: 5, view: "pc" }));
    const empty = renderEditor(state, true);
    expect(empty).toContain('data-slot="setup" data-block="enable"');
    expect(empty).toContain('data-slot="wait" data-block="wait"');
    expect(empty).toContain('data-slot="handler" data-block="ack"');
    state.ui.draftBlocks = { setup: ["enable"], wait: ["wait"], handler: ["read", "update", "ack"] };
    const source = sourceOnly(renderEditor(state, true));
    expect(source).toContain("gpio_irq_enable(BUTTON_A)");
    expect(source).toContain("cpu_wait()");
    expect(source.indexOf("read32(BUTTON_REG)")).toBeLessThan(source.indexOf("write32(LED_REG, 1)"));
    expect(source.indexOf("write32(LED_REG, 0)")).toBeLessThan(source.indexOf("gpio_irq_ack()"));
    expect(sourceStatus(state)).toContain("Build & Flash");
    expect(source).not.toContain("/* HANDLER */");
  });

  test("replay records RUNNING while live state has already returned to WAITING", () => {
    const state = switchToInterruptDraft(createAppState({ chapterId: 5, view: "station" }));
    if (state.active.id !== 5) throw new Error("Expected EP05");
    state.ui.coverOpen = true;
    state.active.machine = setInterruptButton(flashInterruptProgram(state.active.machine, INTERRUPT_SOLUTION), 1);
    const snapshot = state.active.machine;
    state.ui.irqReplayElapsedMs = 400;
    expect(irqReplayStep(state)).toBe(2);
    const panel = renderInspectionPanel(state);
    expect(panel).toContain('id="cpu-state">WAITING');
    expect(panel).toContain('id="button-reads">1');
    expect(panel).toContain("CPU WAKE / RUNNING");
    expect(panel).toContain("CURRENT STATE / LIVE");
    expect(panel).toContain("LAST BUTTON EVENT / REPLAY");
    state.active.machine = setInterruptButton(state.active.machine, 0);
    state.ui.irqReplayElapsedMs = 0;
    expect(irqReplayStep(state)).toBe(0);
    expect(renderIrqReplay(state)).toContain("LED OFF");
    expect(renderIrqReplay(state)).not.toContain("LED ON");
    state.ui.irqReplayElapsedMs = 1_000;
    expect(irqReplayStep(state)).toBe(6);
    expect(snapshot.ledValue).toBe(1);
    expect(state.active.machine.buttonReads).toBe(2);
    expect(state.active.machine.ledValue).toBe(0);
  });

  test("target reset clears history while preserving an unflashed draft", () => {
    let state = switchToInterruptDraft(createAppState({ chapterId: 5, view: "pc" }));
    if (state.active.id !== 5) throw new Error("Expected EP05");
    state.ui.draftBlocks = { setup: ["enable"], wait: ["wait"], handler: ["read", "update", "ack"] };
    state.active.machine = setInterruptButton(flashInterruptProgram(state.active.machine, interruptProgramFromDraft(state.ui.draftBlocks)), 1);
    state.ui.draftBlocks.handler = ["read", "update"];
    state.active.machine = rebootInterruptTarget(state.active.machine);
    state.ui.irqReplayElapsedMs = 0;
    expect(state.ui.draftBlocks.handler).toEqual(["read", "update"]);
    expect(state.active.machine.installedProgram).toEqual(INTERRUPT_SOLUTION);
    expect(irqReplayStep(state)).toBe(-1);
    expect(renderIrqReplay(state)).toContain("No button event yet");
    state = resetMission(state);
    expect(state.view).toBe("pc");
    expect(state.ui.draftInterrupts).toBe(false);
    expect(state.active.id === 5 && state.active.machine.installedProgram.kind).toBe("polling");
    expect(renderEditor(state, true)).toContain("SWITCH TO INTERRUPTS");
  });

  test("EP04 links to EP05, and EP05 links to available EP06", () => {
    const input = createAppState({ chapterId: 4, view: "station" });
    if (input.active.id !== 4) throw new Error("Expected EP04");
    input.active.machine = pollInput(pollInput(flashInputProgram(input.active.machine, SOLUTION_BLOCKS), 1), 0);
    expect(renderSuccess(input)).toContain('data-episode="5"');
    const irq = createAppState({ chapterId: 5, view: "station" });
    if (irq.active.id !== 5) throw new Error("Expected EP05");
    irq.active.machine = tickInterrupt(setInterruptButton(setInterruptButton(flashInterruptProgram(irq.active.machine, INTERRUPT_SOLUTION), 1), 0), 1_000);
    expect(missionComplete(irq)).toBe(true);
    expect(irq.ui.coverOpen).toBe(false);
    expect(renderSuccess(irq)).toContain("Episode 06 — First Light");
    expect(renderSuccess(irq)).toContain('data-episode="6"');
    expect(renderSuccess(irq)).not.toContain("undefined");
  });
});
