import type { Chapter } from "./types";
import { createInitialMovingState, isMovingMissionComplete, type MovingMissionState } from "../sim/moving";

export const chapter08: Chapter<MovingMissionState> = {
  id: 8, slug: "keep-moving", title: "Keep Moving",
  mission: {
    summary: "Keep the animation moving while A is held, and keep the D-pad responsive.",
    initialObservation: "The screen finally moves: a small dot bounces by itself, and the D-pad controls your marker. A reverses the dot's direction. Try holding A. Everything freezes until you let go. Interrupts brought the CPU here, but the handler waits for release before returning. Move input work into main so frame events can run too.",
    successMessage: "The Pocket keeps moving. Short handlers leave time for input and animation.",
  },
  cover: { modules: ["cpu", "display", "ram"], selected: "cpu" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor"], datasheetSection: "events",
    editorHint: "Remove WAIT FOR RELEASE. Record the input and acknowledge in the handler; move APPLY INPUT to MAIN / INPUT EVENT. A block can occupy one slot. Build & Flash, then hold A for one second and use the D-pad.",
    program: {
      fileName: "events.c", singleLocation: true,
      skeleton: [
        "int main(void)", "{",
        "    display_use_framebuffer(); // supplied setup",
        "    gpio_irq_enable(BUTTON_A | BUTTON_DPAD);",
        "    timer_every_ms(100);",
        "    while (1) {",
        "        Event event = event_wait(); // supplied safe wait",
        "        if (event.kind == INPUT) {", { slot: "main-input" }, "        }",
        "        if (event.kind == TIMER) step_animation();",
        "        draw_screen();", "    }", "}", "",
        "void button_irq_handler(void)", "{", { slot: "handler" }, "}",
      ],
      slots: [
        { id: "handler", label: "IRQ HANDLER", indent: "    ", blocks: ["read", "wait-release", "apply", "record", "ack"] },
        { id: "main-input", label: "MAIN / INPUT EVENT", indent: "            ", blocks: ["apply"] },
      ],
      blocks: [
        { id: "read", label: "READ BUTTON", lines: ["uint32_t buttons = read32(BUTTON_REG);"] },
        { id: "wait-release", label: "WAIT FOR RELEASE", lines: ["wait_for_button_release();"] },
        { id: "apply", label: "APPLY INPUT", lines: ["apply_input_event();"] },
        { id: "record", label: "RECORD INPUT EVENT", lines: ["record_input_event(buttons);"] },
        { id: "ack", label: "ACK IRQ", lines: ["gpio_irq_ack();"] },
      ],
      solution: ["read", "record", "ack", "apply"],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialMovingState, successCondition: isMovingMissionComplete,
};
