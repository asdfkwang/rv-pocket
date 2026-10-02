import { BOOTROM_BASE, BOOTROM_SIZE, RAM_BASE, RAM_SIZE, UART1_BASE, formatAddress } from "../platform";
export { formatAddress } from "../platform";

export const WATCHED_RAM_ADDRESS = 0x00002000;
export const INITIAL_STORE_ADDRESS = UART1_BASE;

export interface MemoryMissionState {
  uartConnected: boolean;
  installedAddress: number;
  // Only the cells the player has opened the cover to look at. No full RAM array exists.
  cells: Record<number, number>;
  programValue: number;
  lastStore: { address: number; value: number; flashCount: number } | null;
  lastUartTx: { byte: number; execution: number } | null;
  terminalOutput: string;
  flashCount: number;
  executionCount: number;
}

export function parseAddress(input: string): number | null {
  const text = input.trim();
  return /^0x[0-9a-f]{1,8}$/i.test(text) ? Number.parseInt(text.slice(2), 16) : null;
}

export function readStoreAddress(input: string): { address: number | null; error: string } {
  const address = parseAddress(input);
  if (address === null) return { address: null, error: "Enter a 32-bit hex address, for example 0x00002000." };
  if (address % 4 !== 0) return { address: null, error: "A 32-bit store needs a four-byte-aligned address." };
  if ((address >= RAM_BASE && address <= RAM_BASE + RAM_SIZE - 4) || address === UART1_BASE) {
    return { address, error: "" };
  }
  return { address: null, error: address >= BOOTROM_BASE && address < BOOTROM_BASE + BOOTROM_SIZE
    ? "Boot ROM is read-only. Store the value in RAM."
    : "This supplied program supports RAM and UART1 DATA writes. Other device writes are outside this repair." };
}

export function formatWord(value: number): string {
  return `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

// A word holds its lowest byte at the lowest address, so a 32-bit value reads back
// in byte order as the reverse of its hex digits.
export function formatWordBytes(value: number): string {
  return [0, 1, 2, 3].map((index) => ((value >>> (index * 8)) & 0xff).toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

// A new value every flash, so the player watches where the program's constant land
// rather than typing a value to match. Zero is avoided: it would look like an empty cell.
function pickProgramValue(flashCount: number): number {
  let value = Math.imul(flashCount + 1, 0x9e3779b1) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 0x85ebca6b) >>> 0;
  value = (value ^ (value >>> 13)) >>> 0;
  return value === 0 ? 0x12345678 : value;
}

export function rebootMemoryTarget(state: Readonly<MemoryMissionState>): MemoryMissionState {
  const address = state.installedAddress;
  const uartWrite = address === UART1_BASE;
  const executionCount = state.executionCount + 1;
  const byte = state.programValue & 0xff;
  return {
    ...state,
    cells: { ...state.cells, [address]: state.programValue },
    lastStore: { address, value: state.programValue, flashCount: state.flashCount },
    lastUartTx: uartWrite ? { byte, execution: executionCount } : state.lastUartTx,
    terminalOutput: uartWrite ? String.fromCharCode(byte) : "",
    executionCount,
  };
}

export function createInitialMemoryState(): MemoryMissionState {
  return rebootMemoryTarget({
    uartConnected: true, installedAddress: INITIAL_STORE_ADDRESS, cells: {},
    programValue: 0, lastStore: null, lastUartTx: null, terminalOutput: "",
    flashCount: 0, executionCount: 0,
  });
}

export function flashMemoryFirmware(state: Readonly<MemoryMissionState>, address: number): MemoryMissionState {
  if (readStoreAddress(formatAddress(address)).address === null) throw new RangeError("Unsupported store address.");
  const flashCount = state.flashCount + 1;
  return { ...state, installedAddress: address, flashCount, programValue: pickProgramValue(flashCount) };
}

// The repair is the destination, not the value: this run's store must land on the target.
export const isMemoryMissionComplete = (state: Readonly<MemoryMissionState>): boolean =>
  state.lastStore?.address === WATCHED_RAM_ADDRESS
  && state.cells[WATCHED_RAM_ADDRESS] === state.programValue
  && state.lastStore.value === state.programValue
  && state.lastStore.flashCount === state.flashCount;
