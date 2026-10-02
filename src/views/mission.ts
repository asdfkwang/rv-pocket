import { chapters, currentChapter, missionComplete, type AppState } from "../app-state";
import { chapterNextTitle, chapterTitle } from "../chapters/locale";
import { UI, ui } from "../ui-locale";
import { t } from "../i18n";
import { formatAddress, formatWord, WATCHED_RAM_ADDRESS } from "../sim/memory";
import { formatInterval } from "../sim/timer";
import { serialDisplay } from "../sim/uart";
import { escapeHtml as e } from "./html";
import { displayStatus } from "./display";

export function renderMissionStatus(state: AppState): string {
  if (state.active.id === 0) return "";
  const chapter = currentChapter(state);
  const complete = missionComplete(state);
  const expected = state.active.id === 1 ? ui(UI.expectedOutputA)
    : state.active.id === 2 ? ui(UI.expectedStore).replace("{addr}", formatAddress(WATCHED_RAM_ADDRESS))
    : state.active.id === 3 ? ui(UI.expectedInterval)
    : state.active.id === 4 ? ui(UI.expectedButtonLeds)
    : state.active.id === 8 ? ui(UI.expectedMoving)
    : state.active.id === 7 ? ui(UI.expectedCorners)
    : state.active.id === 6 ? ui(UI.expectedDisplay)
    : ui(UI.expectedIrq);
  const label = state.active.id === 1 ? ui(UI.labelReceived)
    : state.active.id === 2 ? `RAM ${formatAddress(WATCHED_RAM_ADDRESS)}`
    : state.active.id === 3 ? ui(UI.labelObserved)
    : state.active.id === 4 ? ui(UI.labelLed)
    : state.active.id >= 6 ? ui(UI.labelDisplay) : ui(UI.labelCpuState);
  const received = state.active.id === 1 ? serialDisplay(state.active.machine.terminalOutput)
    : state.active.id === 2 ? formatWord(state.active.machine.cells[WATCHED_RAM_ADDRESS] ?? 0)
    : state.active.id === 3 ? formatInterval(state.active.machine.observedIntervalMs)
    : state.active.id === 5 ? state.active.machine.cpuState
    : state.active.id === 8 ? ui(UI.frameFmt).replace("{n}", String(state.active.machine.frameCount))
    : state.active.id === 7 ? ui(UI.verifiedFmt).replace("{n}", String(state.active.machine.observedTargets.length))
    : state.active.id === 6 ? displayStatus(state)
    : state.active.machine.ledValue ? ui(UI.on) : ui(UI.off);
  return `<section class="mission-strip" aria-label="${e(ui(UI.ariaObjective))}"><div><span class="eyebrow">${String(chapter.id).padStart(2, "0")} / ${e(chapterTitle(chapter).toUpperCase())}</span><strong>${expected}</strong></div><div><span class="eyebrow">${label}</span><strong id="mission-observed" class="received-byte${complete ? " pass" : ""}${state.active.id === 3 ? " interval" : ""}">${e(received)}</strong></div></section>`;
}

export function renderSuccess(state: AppState): string {
  if (state.active.id === 0 || !missionComplete(state)) return "";
  const chapter = currentChapter(state);
  const next = chapter.next;
  const available = next?.id !== undefined && chapters.some((candidate) => candidate.id === next.id);
  const nextTitle = chapterNextTitle(chapter, next?.title ?? "");
  const nextRepair = !next ? "" : `<p>${e(t("successNextLabel"))}${next.id === undefined ? "" : ` ${e(t("episodeFmt", { n: String(next.id).padStart(2, "0") }))} — `}${e(nextTitle)}.</p>${available ? `<button class="button secondary" data-action="next-episode" data-episode="${next.id}">${e(t("startEpisodeNum", { n: String(next.id).padStart(2, "0") }))} →</button>` : ""}`;
  return `<section class="success-banner" aria-label="${e(t("successRepairComplete"))}"><span class="success-check" aria-hidden="true">✓</span><div><h2>${e(chapter.mission.successMessage)}</h2>${state.active.id === 3 ? `<pre class="diagnostics-complete">${e(ui(UI.diagnosticsComplete))}</pre><p>${e(t("successNextEpisode"))}</p>` : nextRepair}</div></section>`;
}
