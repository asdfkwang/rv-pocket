import { currentChapter, missionComplete, type AppState } from "../app-state";
import { formatInterval } from "../sim/timer";
import { serialDisplay } from "../sim/uart";
import { escapeHtml as e } from "./html";

export function renderMissionStatus(state: AppState): string {
  if (state.active.id === 0) return "";
  const chapter = currentChapter(state);
  const complete = missionComplete(state);
  const expected = state.active.id === 1 ? "EXPECTED OUTPUT: A" : state.active.id === 2 ? "EXPECTED: RAM PASS" : "EXPECTED INTERVAL: 1.000 s";
  const label = state.active.id === 3 ? "OBSERVED INTERVAL" : "RECEIVED";
  const received = state.active.id === 1 ? serialDisplay(state.active.machine.terminalOutput)
    : state.active.id === 2 ? state.active.machine.passed ? "PASS" : "FAILED"
    : formatInterval(state.active.machine.observedIntervalMs);
  const statuses = [{ name: "UART", pass: state.active.id > 1 || complete }];
  if (state.active.id >= 2) statuses.push({ name: "RAM", pass: state.active.id === 3 || complete }, { name: "TIMER", pass: state.active.id === 3 && complete });
  return `<section class="mission-strip" aria-label="Episode objective"><div><span class="eyebrow">${String(chapter.id).padStart(2, "0")} / ${e(chapter.title.toUpperCase())}</span><strong>${expected}</strong></div><div><span class="eyebrow">${label}</span><strong class="received-byte${complete ? " pass" : ""}${state.active.id === 3 ? " interval" : ""}">${e(received)}</strong></div><div class="diagnostic-statuses">${statuses.map((status) => `<span class="repair-status${status.pass ? " pass" : ""}">${status.name} ${status.pass ? "PASS" : "?"}</span>`).join("")}</div></section>`;
}

export function renderSuccess(state: AppState): string {
  if (state.active.id === 0 || !missionComplete(state)) return "";
  const chapter = currentChapter(state);
  return `<section class="success-banner" aria-label="Repair complete"><span class="success-check" aria-hidden="true">✓</span><div><h2>${e(chapter.mission.successMessage)}</h2>${state.active.id === 3 ? `<pre class="diagnostics-complete">BASIC DIAGNOSTICS COMPLETE\n\nUART     OK\nMEMORY   OK\nTIMER    OK</pre><p>Next: display bring-up — Black Screen First.</p>` : `<p>Next repair: Episode ${String(chapter.next!.id).padStart(2, "0")} — ${e(chapter.next!.title)}.</p><button class="button secondary" data-action="next-episode" data-episode="${chapter.next!.id}">Start Episode ${String(chapter.next!.id).padStart(2, "0")} →</button>`}</div></section>`;
}
