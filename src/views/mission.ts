import { currentChapter, missionComplete, type AppState } from "../app-state";
import { formatAddress, formatWord, WATCHED_RAM_ADDRESS } from "../sim/memory";
import { formatInterval } from "../sim/timer";
import { serialDisplay } from "../sim/uart";
import { escapeHtml as e } from "./html";

export function renderMissionStatus(state: AppState): string {
  if (state.active.id === 0) return "";
  const chapter = currentChapter(state);
  const complete = missionComplete(state);
  const expected = state.active.id === 1 ? "EXPECTED OUTPUT: A"
    : state.active.id === 2 ? `EXPECTED: A STORE AT ${formatAddress(WATCHED_RAM_ADDRESS)}`
    : state.active.id === 3 ? "EXPECTED INTERVAL: 1.000 s"
    : state.active.id === 4 ? "EXPECTED: BUTTON PRESS → LED ON"
    : "EXPECTED: READS ONLY WHEN THE BUTTON CHANGES";
  const label = state.active.id === 1 ? "RECEIVED"
    : state.active.id === 2 ? `RAM ${formatAddress(WATCHED_RAM_ADDRESS)}`
    : state.active.id === 3 ? "OBSERVED INTERVAL"
    : state.active.id === 4 ? "LED"
    : "READS / PASSES";
  const received = state.active.id === 1 ? serialDisplay(state.active.machine.terminalOutput)
    : state.active.id === 2 ? formatWord(state.active.machine.cells[WATCHED_RAM_ADDRESS] ?? 0)
    : state.active.id === 3 ? formatInterval(state.active.machine.observedIntervalMs)
    : state.active.id === 5 ? `${state.active.machine.buttonReads.toLocaleString("en-US")} / ${state.active.machine.loopPasses.toLocaleString("en-US")}`
    : state.active.machine.ledValue ? "ON" : "OFF";
  return `<section class="mission-strip" aria-label="Episode objective"><div><span class="eyebrow">${String(chapter.id).padStart(2, "0")} / ${e(chapter.title.toUpperCase())}</span><strong>${expected}</strong></div><div><span class="eyebrow">${label}</span><strong class="received-byte${complete ? " pass" : ""}${state.active.id === 3 ? " interval" : ""}">${e(received)}</strong></div></section>`;
}

export function renderSuccess(state: AppState): string {
  if (state.active.id === 0 || !missionComplete(state)) return "";
  const chapter = currentChapter(state);
  return `<section class="success-banner" aria-label="Repair complete"><span class="success-check" aria-hidden="true">✓</span><div><h2>${e(chapter.mission.successMessage)}</h2>${state.active.id === 3 ? `<pre class="diagnostics-complete">BASIC DIAGNOSTICS COMPLETE\n\nUART     OK\nMEMORY   OK\nTIMER    OK</pre><p>Next: the Pocket's buttons — One Press, Endless Move.</p>` : `<p>Next repair: Episode ${String(chapter.next!.id).padStart(2, "0")} — ${e(chapter.next!.title)}.</p><button class="button secondary" data-action="next-episode" data-episode="${chapter.next!.id}">Start Episode ${String(chapter.next!.id).padStart(2, "0")} →</button>`}</div></section>`;
}
