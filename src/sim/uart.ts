export interface UartMissionState {
  uartConnected: boolean;
  terminalOutput: string;
}

export type OutputDevice = "cpu" | "ram" | "uart";

export const createInitialUartState = (): UartMissionState => ({
  uartConnected: false,
  terminalOutput: "",
});

export const isUartMissionComplete = (state: Readonly<UartMissionState>): boolean =>
  state.uartConnected && state.terminalOutput.includes("A");

export function setUartConnection(state: Readonly<UartMissionState>, connected: boolean): UartMissionState {
  return { ...state, uartConnected: connected };
}

export function runDiagnostic(state: Readonly<UartMissionState>, device: OutputDevice | "") {
  let feedback: string;
  if (!device) {
    feedback = "Choose an output device first. Which part can send a character to the computer?";
  } else if (device === "cpu") {
    feedback = "The CPU runs the diagnostic instructions, but it needs a peripheral to transmit serial data. Try another output device.";
  } else if (device === "ram") {
    feedback = "RAM stores data. It does not transmit it to the computer. Try another output device.";
  } else if (!state.uartConnected) {
    feedback = "UART was asked to transmit, but the cable is disconnected. Connect it in Workbench, then run the diagnostic again.";
  } else {
    return {
      state: { ...state, terminalOutput: state.terminalOutput + "A" },
      feedback: "Received A from RV Pocket. The UART diagnostic path works; the screen can wait.",
    };
  }
  return { state: { ...state }, feedback };
}
