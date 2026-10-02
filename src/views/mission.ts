import { chapters, currentChapter, missionComplete, type AppState } from "../app-state";
import { formatAddress, formatWord, WATCHED_RAM_ADDRESS } from "../sim/memory";
import { formatInterval } from "../sim/timer";
import { serialDisplay } from "../sim/uart";
import { escapeHtml as e } from "./html";
import { displayStatus } from "./display";

export function renderMissionStatus(state: AppState): string {
  if (state.active.id === 0) return "";
  const chapter = currentChapter(state);
  const complete = missionComplete(state);
  const expected = state.active.id === 1 ? "EXPECTED OUTPUT: A"
    : state.active.id === 2 ? `EXPECTED: A STORE AT ${formatAddress(WATCHED_RAM_ADDRESS)}`
    : state.active.id === 3 ? "EXPECTED INTERVAL: 1.000 s"
    : state.active.id === 4 ? "EXPECTED: BUTTON PRESS → LED ON"
    : state.active.id === 8 ? "EXPECTED: INPUT + ANIMATION KEEP RUNNING"
    : state.active.id === 7 ? "EXPECTED: CENTER + FOUR CORNERS"
    : state.active.id === 6 ? "EXPECTED: DISPLAY TEST PATTERN"
    : "EXPECTED: WAIT BETWEEN BUTTON INTERRUPTS";
  const label = state.active.id === 1 ? "RECEIVED"
    : state.active.id === 2 ? `RAM ${formatAddress(WATCHED_RAM_ADDRESS)}`
    : state.active.id === 3 ? "OBSERVED INTERVAL"
    : state.active.id === 4 ? "LED"
    : state.active.id >= 6 ? "DISPLAY" : "CPU STATE";
  const received = state.active.id === 1 ? serialDisplay(state.active.machine.terminalOutput)
    : state.active.id === 2 ? formatWord(state.active.machine.cells[WATCHED_RAM_ADDRESS] ?? 0)
    : state.active.id === 3 ? formatInterval(state.active.machine.observedIntervalMs)
    : state.active.id === 5 ? state.active.machine.cpuState
    : state.active.id === 8 ? `FRAME ${state.active.machine.frameCount}`
    : state.active.id === 7 ? `${state.active.machine.observedTargets.length}/5 VERIFIED`
    : state.active.id === 6 ? displayStatus(state)
    : state.active.machine.ledValue ? "ON" : "OFF";
  return `<section class="mission-strip" aria-label="Episode objective"><div><span class="eyebrow">${String(chapter.id).padStart(2, "0")} / ${e(chapter.title.toUpperCase())}</span><strong>${expected}</strong></div><div><span class="eyebrow">${label}</span><strong id="mission-observed" class="received-byte${complete ? " pass" : ""}${state.active.id === 3 ? " interval" : ""}">${e(received)}</strong></div></section>`;
}

export function renderSuccess(state: AppState): string {
  if (state.active.id === 0 || !missionComplete(state)) return "";
  const chapter = currentChapter(state);
  const next = chapter.next;
  const available = next?.id !== undefined && chapters.some((candidate) => candidate.id === next.id);
  const nextRepair = !next ? "" : `<p>Next repair: ${next.id === undefined ? "" : `Episode ${String(next.id).padStart(2, "0")} — `}${e(next.title)}.</p>${available ? `<button class="button secondary" data-action="next-episode" data-episode="${next.id}">Start Episode ${String(next.id).padStart(2, "0")} →</button>` : ""}`;
  return `<section class="success-banner" aria-label="Repair complete"><span class="success-check" aria-hidden="true">✓</span><div><h2>${e(chapter.mission.successMessage)}</h2>${state.active.id === 3 ? `<pre class="diagnostics-complete">BASIC DIAGNOSTICS COMPLETE\n\nUART     OK\nMEMORY   OK\nTIMER    OK</pre><p>Next: the Pocket's buttons — One Press, Endless Move.</p>` : nextRepair}</div></section>`;
}
