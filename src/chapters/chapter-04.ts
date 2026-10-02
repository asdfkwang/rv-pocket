import type { Chapter } from "./types";
import { createInitialInputState, isInputMissionComplete, type InputMissionState } from "../sim/input";

export const chapter04: Chapter<InputMissionState> = {
  id: 4,
  slug: "button-to-led",
  title: "Button to LED",
  mission: {
    summary: "Press the A button and the LED turns on. Let go and it turns off.",
    initialObservation: "The diagnostics are reliable now, but nothing on the Pocket answers a touch. Press the A button on the station: the LED stays dark. Open the cover and read the button register — the hardware is answering, so the program is what is missing.",
    successMessage: "Button and LED are connected.",
  },
  next: { title: "One Press, Endless Move" },
  cover: { modules: ["ram"], selected: "ram" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor", "terminal"],
    editorHint: "Put the blocks in an order that reads the button, then decides, then writes the LED.",
    datasheetSection: "gpio",
    program: {
      fileName: "button.c",
      skeleton: ["int main(void)", "{", "    while (1) {", "", "        /* place the blocks here */", "", "    }", "}"],
      blocks: [
        { id: "read", lines: ["uint32_t button = read32(BUTTON_REG);"] },
        { id: "if", lines: ["if (button & BUTTON_A) {"] },
        { id: "led-on", lines: ["    write32(LED_REG, 1);"] },
        { id: "else", lines: ["} else {"] },
        { id: "led-off", lines: ["    write32(LED_REG, 0);"] },
      ],
      solution: ["read", "if", "led-on", "else", "led-off"],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialInputState, successCondition: isInputMissionComplete,
};
