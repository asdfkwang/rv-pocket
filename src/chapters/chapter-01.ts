import type { Chapter } from "./types";
import { createInitialUartState, isUartMissionComplete, type UartMissionState } from "../sim/uart";

export const chapter01: Chapter<UartMissionState> = {
  id: 1,
  slug: "is-anyone-there",
  title: "Is Anyone There?",
  mission: {
    summary: "Get the machine's first UART response.",
    initialObservation: "The power indicator is on. The screen is black. The computer has received nothing. Find another way to hear from RV Pocket.",
    successMessage: "UART response received. The machine is alive.",
  },
  workbench: { objects: ["pocket", "computer", "manual", "uart-cable"] },
  computer: { panels: ["terminal", "uart-task"] },
  manual: [{
    id: "first-contact",
    title: "Listening to a silent machine",
    blocks: [
      { kind: "text", body: "A black screen is not the whole story. RV Pocket has a CPU that executes instructions, RAM that stores data, and a separate UART peripheral that handles serial communication." },
      { kind: "text", body: "A small diagnostic is already available on the board. It asks the output device to send one character. Select UART and use the supplied value 65 ('A'); no program or number conversion is needed." },
      { kind: "ascii", body: "RV Pocket                 Computer\n[ UART ] ----- cable ----> [ terminal ]" },
      { kind: "text", body: "The UART cable carries the board's response to the computer. Connect it in POCKET, then run the diagnostic in PC. Connecting the cable by itself does not send a character." },
      { kind: "text", body: "Receiving A proves this diagnostic path works. It does not mean the screen or every other part has been repaired." },
    ],
  }],
  quiz: [
    {
      id: "transmitter",
      prompt: "Which part handles serial transmission after software requests it?",
      choices: [{ id: "cpu", label: "CPU" }, { id: "ram", label: "RAM" }, { id: "uart", label: "UART" }],
      answerId: "uart",
      explanation: "UART handles serial transmission. The CPU runs the instructions that request it; RAM stores data.",
    },
    {
      id: "silent-screen",
      prompt: "Does a silent built-in screen alone prove the CPU is dead?",
      choices: [{ id: "yes", label: "Yes. A working CPU must light the screen." }, { id: "no", label: "No. Another output path may still work." }],
      answerId: "no",
      explanation: "No. The display is only one output path. A UART response gives you another way to observe the machine.",
    },
    {
      id: "cable",
      prompt: "UART is asked to transmit, but the cable is disconnected. Why does the terminal receive nothing?",
      choices: [{ id: "path", label: "The path to the computer is disconnected." }, { id: "ram", label: "RAM must display the character first." }, { id: "screen", label: "UART requires a working screen." }],
      answerId: "path",
      explanation: "The cable carries serial data to the computer. Without that connection, the terminal cannot receive the board's response.",
    },
  ],
  createInitialState: createInitialUartState,
  successCondition: isUartMissionComplete,
};
