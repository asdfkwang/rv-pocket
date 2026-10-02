import type { Chapter } from "./types";
import { createInitialInterruptState, isInterruptMissionComplete, type InterruptMissionState } from "../sim/interrupt";

export const chapter05: Chapter<InterruptMissionState> = {
  id: 5,
  slug: "stop-asking",
  title: "Stop Asking",
  mission: {
    summary: "Keep the LED working. Make the CPU stop checking the button when nothing happens.",
    initialObservation: "The button program from Episode 04 works: press A and the LED turns on; let go and it turns off. But open the cover on CPU. BUTTON READS keeps climbing even when you touch nothing. The CPU keeps asking the same address the same question. Let the button interrupt the CPU when it needs attention.",
    successMessage: "The button calls. The CPU handles it, acknowledges the IRQ, and waits again.",
  },
  next: { id: 6, title: "First Light" },
  cover: { modules: ["cpu", "ram"], selected: "cpu" },
  workbench: { objects: ["pocket", "computer", "datasheet", "book", "uart-cable"] },
  computer: {
    panels: ["editor", "terminal"],
    editorHint: "Replace polling with an interrupt. Enable button IRQs, wait in main, and read → update → acknowledge in the handler. Build & Flash installs your draft.",
    datasheetSection: "gpio",
    program: {
      fileName: "button.c",
      skeleton: ["int main(void)", "{", { slot: "setup" }, "", "    while (1) {", { slot: "wait" }, "    }", "}", "", "void button_irq_handler(void)", "{", { slot: "handler" }, "}"],
      slots: [
        { id: "setup", label: "SETUP", indent: "    ", blocks: ["enable"] },
        { id: "wait", label: "WAIT", indent: "        ", blocks: ["wait"] },
        { id: "handler", label: "HANDLER", indent: "    ", blocks: ["read", "update", "ack"] },
      ],
      blocks: [
        { id: "enable", label: "ENABLE BUTTON IRQ", lines: ["gpio_irq_enable(BUTTON_A);"] },
        { id: "wait", label: "WAIT FOR INTERRUPT", lines: ["cpu_wait();"] },
        { id: "read", label: "READ BUTTON", lines: ["uint32_t button = read32(BUTTON_REG);"] },
        { id: "update", label: "UPDATE LED", lines: ["if (button & BUTTON_A)", "    write32(LED_REG, 1);", "else", "    write32(LED_REG, 0);"] },
        { id: "ack", label: "ACKNOWLEDGE IRQ", lines: ["gpio_irq_ack();"] },
      ],
      solution: ["enable", "wait", "read", "update", "ack"],
    },
  },
  manual: [], quiz: [], createInitialState: createInitialInterruptState, successCondition: isInterruptMissionComplete,
};
