export const UART_TX_ADDRESS = "0xD4110000";
export const INITIAL_BYTE = 0x42;
export const EXPECTED_BYTE = 0x41;

export interface UartMissionState {
  uartConnected: boolean;
  firmwareByte: number;
  terminalOutput: string;
  transmissionCount: number;
  flashCount: number;
}

export const createInitialUartState = (): UartMissionState => ({
  uartConnected: true,
  firmwareByte: INITIAL_BYTE,
  terminalOutput: String.fromCharCode(INITIAL_BYTE),
  transmissionCount: 1,
  flashCount: 0,
});

export const isUartMissionComplete = (state: Readonly<UartMissionState>): boolean =>
  state.uartConnected && state.firmwareByte === EXPECTED_BYTE
    && state.terminalOutput === String.fromCharCode(EXPECTED_BYTE);

export function parseByte(input: string): number | null {
  const text = input.trim();
  return /^0x[0-9a-f]{1,2}$/i.test(text) ? Number.parseInt(text.slice(2), 16) : null;
}

export function formatByte(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(2, "0")}`;
}

export function serialDisplay(output: string): string {
  return [...output].map((char) => {
    const byte = char.charCodeAt(0);
    return byte >= 0x20 && byte <= 0x7e ? char : `\\x${formatByte(byte).slice(2)}`;
  }).join("");
}

export function flashFirmware(state: Readonly<UartMissionState>, byte: number): UartMissionState {
  if (!Number.isInteger(byte) || byte < 0 || byte > 0xff) throw new RangeError("Expected one byte.");
  return { ...state, firmwareByte: byte, flashCount: state.flashCount + 1 };
}

export function rebootTarget(state: Readonly<UartMissionState>): UartMissionState {
  return {
    ...state,
    terminalOutput: state.uartConnected ? String.fromCharCode(state.firmwareByte) : "",
    transmissionCount: state.transmissionCount + 1,
  };
}
