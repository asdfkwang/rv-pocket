import { t } from "./i18n";
import { chapter00, type OnboardingState } from "./chapters/chapter-00";
import { chapter01 } from "./chapters/chapter-01";
import { chapter02 } from "./chapters/chapter-02";
import { chapter03 } from "./chapters/chapter-03";
import { chapter04 } from "./chapters/chapter-04";
import { chapter05 } from "./chapters/chapter-05";
import { chapter06 } from "./chapters/chapter-06";
import { chapter07 } from "./chapters/chapter-07";
import { chapter08 } from "./chapters/chapter-08";
import { createInitialMovingState, isMovingMissionComplete, type MovingMissionState } from "./sim/moving";
import { createInitialFramebufferState, isFramebufferMissionComplete, type FramebufferMissionState, type RowBytes } from "./sim/framebuffer";
import { createInitialDisplayState, isDisplayMissionComplete, type DisplayMissionState } from "./sim/display";
import { formatByte, INITIAL_BYTE, type UartMissionState } from "./sim/uart";
import { formatAddress, INITIAL_STORE_ADDRESS, type MemoryMissionState } from "./sim/memory";
import { INITIAL_TIMEBASE_HZ, type TimerMissionState } from "./sim/timer";
import { createInitialInputState, isInputMissionComplete, type InputMissionState } from "./sim/input";
import { createInitialInterruptState, isInterruptMissionComplete, type InterruptMissionState } from "./sim/interrupt";
import type { DatasheetSectionId } from "./datasheet-content";
import type { ModuleId, ProgramPlacement } from "./chapters/types";

export type View = "station" | "pc" | "pocket" | "datasheet" | "book";

export function viewLabel(view: View): string {
  return { station: "STATION", pc: "PC", pocket: "RV POCKET", datasheet: "DATASHEET", book: "BOOK" }[view];
}
export type ChapterId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export interface Route { chapterId: ChapterId; view: View }
export type ActiveMission =
  | { id: 0; machine: OnboardingState }
  | { id: 1; machine: UartMissionState }
  | { id: 2; machine: MemoryMissionState }
  | { id: 3; machine: TimerMissionState }
  | { id: 4; machine: InputMissionState }
  | { id: 5; machine: InterruptMissionState }
  | { id: 6; machine: DisplayMissionState }
  | { id: 7; machine: FramebufferMissionState }
  | { id: 8; machine: MovingMissionState };
export interface UiState {
  quizAnswers: Record<string, string>;
  feedback: string;
  introDismissed: boolean;
  tourStep: number | null;
  draftByte: string;
  draftStoreAddress: string;
  draftTimebase: string;
  draftBlocks: ProgramPlacement;
  draftInterrupts: boolean;
  draftRowBytes: RowBytes;
  irqReplayElapsedMs: number;
  buildPhase: "idle" | "building" | "flashing" | "booting";
  buildLog: string[];
  txActive: boolean;
  timerLedActive: boolean;
  coverOpen: boolean;
  coverModule: ModuleId;
  // Transient: the player is holding the A button right now.
  buttonHeld: boolean;
  datasheetSection: DatasheetSectionId;
}
export interface AppState {
  active: ActiveMission;
  view: View;
  ui: UiState;
}

export const chapters = [chapter00, chapter01, chapter02, chapter03, chapter04, chapter05, chapter06, chapter07, chapter08] as const;
export const views: readonly View[] = ["station", "pc", "pocket", "datasheet", "book"];

export function createAppState(route: Route): AppState {
  const active: ActiveMission = route.chapterId === 0 ? { id: 0, machine: chapter00.createInitialState() }
    : route.chapterId === 1 ? { id: 1, machine: chapter01.createInitialState() }
    : route.chapterId === 2 ? { id: 2, machine: chapter02.createInitialState() }
    : route.chapterId === 3 ? { id: 3, machine: chapter03.createInitialState() }
    : route.chapterId === 4 ? { id: 4, machine: createInitialInputState() }
    : route.chapterId === 5 ? { id: 5, machine: createInitialInterruptState() }
    : route.chapterId === 6 ? { id: 6, machine: createInitialDisplayState() }
    : route.chapterId === 7 ? { id: 7, machine: createInitialFramebufferState() }
    : { id: 8, machine: createInitialMovingState() };
  return {
    active,
    view: route.view,
    ui: {
      quizAnswers: {}, feedback: "", introDismissed: false, tourStep: null,
      draftByte: formatByte(INITIAL_BYTE), buildPhase: "idle", buildLog: [], txActive: false,
      draftStoreAddress: formatAddress(INITIAL_STORE_ADDRESS), draftTimebase: String(INITIAL_TIMEBASE_HZ),
      // The editor opens on what is actually installed, so the player adds to it.
      draftBlocks: active.id === 4 ? { body: [...active.machine.installedBlocks] }
        : active.id === 6 ? { setup: [...active.machine.installedBlocks] }
        : active.id === 8 ? { handler: [...active.machine.installedProgram.handler], "main-input": [...active.machine.installedProgram.mainInput] } : {},
      draftInterrupts: false, irqReplayElapsedMs: 0,
      draftRowBytes: 32,
      timerLedActive: false, coverOpen: false, buttonHeld: false,
      coverModule: chapters[route.chapterId].cover?.selected ?? "ram",
      datasheetSection: chapters[route.chapterId].computer.datasheetSection ?? "memory-map",
    },
  };
}

export function switchToInterruptDraft(state: AppState): AppState {
  if (state.active.id !== 5 || state.ui.draftInterrupts) return state;
  return { ...state, ui: { ...state.ui, draftInterrupts: true, draftBlocks: { setup: [], wait: [], handler: [] } } };
}

export function navigate(state: AppState, route: Route): AppState {
  return state.active.id === route.chapterId
    ? { ...state, view: route.view }
    : createAppState(route);
}

export function resetMission(state: AppState): AppState {
  return createAppState({ chapterId: state.active.id, view: state.view });
}

export function currentChapter(state: AppState) {
  return chapters[state.active.id];
}

export function missionComplete(state: AppState): boolean {
  switch (state.active.id) {
    case 0: return chapter00.successCondition(state.active.machine);
    case 1: return chapter01.successCondition(state.active.machine);
    case 2: return chapter02.successCondition(state.active.machine);
    case 3: return chapter03.successCondition(state.active.machine);
    case 4: return isInputMissionComplete(state.active.machine);
    case 5: return isInterruptMissionComplete(state.active.machine);
    case 6: return isDisplayMissionComplete(state.active.machine);
    case 7: return isFramebufferMissionComplete(state.active.machine);
    case 8: return isMovingMissionComplete(state.active.machine);
  }
}

export function parseRoute(hash: string): { route: Route; notice: string } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const rawChapter = params.get("episode") ?? params.get("chapter");
  const validChapter = rawChapter === null || chapters.some((chapter) => rawChapter === String(chapter.id) || rawChapter === String(chapter.id).padStart(2, "0"));
  const chapterId = (validChapter ? Number(rawChapter ?? 0) : 0) as ChapterId;
  const rawView = params.get("view");
  const mappedView = rawView === "workbench" ? "station"
    : rawView === "computer" || rawView === "terminal" ? "pc"
    : rawView === "manual" || rawView === "ebook" ? "book"
    : rawView;
  const view = views.find((candidate) => candidate === mappedView) ?? "station";
  return {
    route: { chapterId, view },
    notice: validChapter ? "" : t("routeNoticeUnavailable"),
  };
}

export function routeHash(route: Route): string {
  return `#episode=${String(route.chapterId).padStart(2, "0")}&view=${route.view}`;
}
