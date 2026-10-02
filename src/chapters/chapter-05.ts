import type { Chapter } from "./types";
import { createInitialLoopState, isLoopMissionComplete, type LoopMissionState } from "../sim/loop";

export const chapter05: Chapter<LoopMissionState> = {
  id: 5,
  slug: "the-busy-loop",
  title: "The Busy Loop",
  mission: {
    summary: "Keep the LED working, and stop the loop from burning the CPU while nothing happens.",
    initialObservation: "The button program still works. But the cover tells a different story: the loop has run 180 times and read the button 180 times, and you have not touched anything. The heartbeat below the loop has run just as many times, because the loop never leaves. It is not broken. It is busy.",
    successMessage: "The loop waits for a change instead of asking again.",
  },
  next: { title: "Black Screen First" },
  cover: { modules: ["cpu", "ram"], selected: "cpu" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor", "terminal"],
    editorHint: "The loop must still notice a press. Put the block that keeps it from asking when nothing changed at the top, before the read.",
    datasheetSection: "gpio",
    program: {
      fileName: "loop.c",
      skeleton: [
        "int main(void)",
        "{",
        "    while (1) {",
        "",
        "        /* place the blocks here */",
        "",
        "        heartbeat++;   /* the second job */",
        "    }",
        "}",
      ],
      blocks: [
        { id: "wait", lines: ["if (!button_changed()) continue;   /* skip the rest of this pass */"] },
        { id: "read", lines: ["uint32_t button = read32(BUTTON_REG);"] },
        { id: "if", lines: ["if (button & BUTTON_A) {"] },
        { id: "led-on", lines: ["    write32(LED_REG, 1);"] },
        { id: "else", lines: ["} else {"] },
        { id: "led-off", lines: ["    write32(LED_REG, 0);"] },
      ],
      solution: ["wait", "read", "if", "led-on", "else", "led-off"],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialLoopState, successCondition: isLoopMissionComplete,
};
