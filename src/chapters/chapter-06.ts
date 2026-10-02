import type { Chapter } from "./types";
import { createInitialDisplayState, isDisplayMissionComplete, type DisplayMissionState } from "../sim/display";

export const chapter06: Chapter<DisplayMissionState> = {
  id: 6, slug: "first-light", title: "First Light",
  mission: {
    summary: "Bring the display to life. Make its test pattern appear.",
    initialObservation: "The A button still lights the LED, but the screen is black. The installed startup program switches on display power and immediately sends its settings. A device needs time to become ready. Inspect DISPLAY under OPEN COVER, then repair the startup sequence on the PC.",
    successMessage: "First light. The display is ready, configured, and showing its test pattern.",
  },
  next: { id: 7, title: "Wrong Place" },
  cover: { modules: ["display", "ram"], selected: "display" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor"], datasheetSection: "display",
    editorHint: "Remove and add blocks to change their order. Flash an experiment and compare the screen with the actual startup log. Editing leaves the installed program running.",
    program: {
      fileName: "display.c",
      skeleton: ["int main(void)", "{", "    start_button_led_irqs(); // supplied from Episode 05", "", { slot: "setup" }, "", "    while (1) cpu_wait();", "}"],
      slots: [{ id: "setup", label: "DISPLAY SETUP", indent: "    ", blocks: ["power", "wait-ready", "test", "enable"] }],
      blocks: [
        { id: "power", label: "POWER ON", lines: ["display_power_on();"] },
        { id: "wait-ready", label: "WAIT READY", lines: ["display_wait_ready();"] },
        { id: "test", label: "SELECT TEST MODE", lines: ["display_select_test_mode();"] },
        { id: "enable", label: "ENABLE DISPLAY", lines: ["display_enable();"] },
      ],
      solution: ["power", "wait-ready", "test", "enable"],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialDisplayState, successCondition: isDisplayMissionComplete,
};
