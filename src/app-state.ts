import { t } from "./i18n";
import { chapter00, type OnboardingState } from "./chapters/chapter-00";
import { chapter01 } from "./chapters/chapter-01";
import { chapter02 } from "./chapters/chapter-02";
import { chapter03 } from "./chapters/chapter-03";
import { formatByte, INITIAL_BYTE, type UartMissionState } from "./sim/uart";
import { formatAddress, RAM_START, RAM_END, type MemoryMissionState } from "./sim/memory";
import type { TimerMissionState } from "./sim/timer";
import type { DatasheetSectionId } from "./datasheet-content";

export type View = "station" | "pc" | "pocket" | "datasheet" | "book";

export function viewLabel(view: View): string {
  return { station: "STATION", pc: "PC", pocket: "RV POCKET", datasheet: "DATASHEET", book: "BOOK" }[view];
}
export type ChapterId = 0 | 1 | 2 | 3;
export interface Route { chapterId: ChapterId; view: View }
export type ActiveMission =
  | { id: 0; machine: OnboardingState }
  | { id: 1; machine: UartMissionState }
  | { id: 2; machine: MemoryMissionState }
  | { id: 3; machine: TimerMissionState };
export interface UiState {
  quizAnswers: Record<string, string>;
  feedback: string;
  introDismissed: boolean;
  tourStep: number | null;
  draftByte: string;
  draftRangeStart: string;
  draftRangeEnd: string;
  draftClock: string;
  buildPhase: "idle" | "building" | "flashing" | "booting";
  buildLog: string[];
  txActive: boolean;
  timerLedActive: boolean;
  datasheetSection: DatasheetSectionId;
}
export interface AppState {
  active: ActiveMission;
  view: View;
  ui: UiState;
}

export const chapters = [chapter00, chapter01, chapter02, chapter03] as const;
export const views: readonly View[] = ["station", "pc", "pocket", "datasheet", "book"];

export function createAppState(route: Route): AppState {
  const active: ActiveMission = route.chapterId === 0 ? { id: 0, machine: chapter00.createInitialState() }
    : route.chapterId === 1 ? { id: 1, machine: chapter01.createInitialState() }
    : route.chapterId === 2 ? { id: 2, machine: chapter02.createInitialState() }
    : { id: 3, machine: chapter03.createInitialState() };
  return {
    active,
    view: route.view,
    ui: {
      quizAnswers: {}, feedback: "", introDismissed: false, tourStep: null,
      draftByte: formatByte(INITIAL_BYTE), buildPhase: "idle", buildLog: [], txActive: false,
      draftRangeStart: formatAddress(RAM_START), draftRangeEnd: formatAddress(RAM_END), draftClock: "5",
      timerLedActive: false,
      datasheetSection: chapters[route.chapterId].computer.datasheetSection ?? "memory-map",
    },
  };
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
  }
}

export function parseRoute(hash: string): { route: Route; notice: string } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const rawChapter = params.get("episode") ?? params.get("chapter");
  const validChapter = rawChapter === null || ["0", "00", "1", "01", "2", "02", "3", "03"].includes(rawChapter);
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
