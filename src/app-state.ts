import { chapter00, type OnboardingState } from "./chapters/chapter-00";
import { chapter01 } from "./chapters/chapter-01";
import type { UartMissionState } from "./sim/uart";

export type View = "station" | "terminal" | "ebook";
export type ChapterId = 0 | 1;
export interface Route { chapterId: ChapterId; view: View }
export type ActiveMission =
  | { id: 0; machine: OnboardingState }
  | { id: 1; machine: UartMissionState };
export interface UiState {
  quizAnswers: Record<string, string>;
  feedback: string;
  introDismissed: boolean;
  tourStep: number | null;
}
export interface AppState {
  active: ActiveMission;
  view: View;
  ui: UiState;
}

export const chapters = [chapter00, chapter01] as const;
export const views: readonly View[] = ["station", "terminal", "ebook"];

export function createAppState(route: Route): AppState {
  return {
    active: route.chapterId === 0
      ? { id: 0, machine: chapter00.createInitialState() }
      : { id: 1, machine: chapter01.createInitialState() },
    view: route.view,
    ui: { quizAnswers: {}, feedback: "", introDismissed: false, tourStep: null },
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
  return state.active.id === 0 ? chapter00 : chapter01;
}

export function missionComplete(state: AppState): boolean {
  return state.active.id === 0
    ? chapter00.successCondition(state.active.machine)
    : chapter01.successCondition(state.active.machine);
}

export function parseRoute(hash: string): { route: Route; notice: string } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const rawChapter = params.get("episode") ?? params.get("chapter");
  const validChapter = rawChapter === null || ["0", "00", "1", "01"].includes(rawChapter);
  const chapterId = rawChapter === "1" || rawChapter === "01" ? 1 : 0;
  const rawView = params.get("view");
  const mappedView = rawView === "workbench" || rawView === "computer" || rawView === "pocket" ? "station"
    : rawView === "manual" ? "ebook"
    : rawView;
  const view = views.find((candidate) => candidate === mappedView) ?? "station";
  return {
    route: { chapterId, view },
    notice: validChapter ? "" : "That episode is not available yet. You are back at the Prologue.",
  };
}

export function routeHash(route: Route): string {
  return `#episode=${String(route.chapterId).padStart(2, "0")}&view=${route.view}`;
}
