import type { AppState } from "../app-state";

export function renderPocketHardware(state: AppState): string {
  return `<span class="device" aria-hidden="true">
    <span class="device-top"><span>RV POCKET</span><span class="power-light"></span></span>
    <span class="device-screen"></span>
    <span class="device-indicators"><span><span class="status-dot uart-tx-light${state.ui.txActive ? " tx-pulse" : ""}"></span>TX</span><span><span class="status-dot"></span>RX</span>${state.active.id === 3 ? `<span><span class="status-dot timer-light${state.ui.timerLedActive ? " on" : ""}"></span>TIMER</span>` : ""}</span>
    <span class="device-controls"><span class="dpad">+</span><span class="speaker">||||||</span><span class="game-buttons"><span>B</span><span>A</span></span></span>
    <span class="device-bottom">DEVELOPMENT UNIT <span>001</span></span>
  </span>`;
}

export function renderPocket(state: AppState): string {
  const inspecting = state.active.id === 2 || state.active.id === 3;
  return `<section class="pocket-inspect panel" aria-labelledby="pocket-heading"><span class="eyebrow">TARGET MACHINE</span><h1 id="pocket-heading">RV Pocket.</h1>${renderPocketHardware(state)}<p>Power is on. The display stays black until its own repair.</p><p class="muted">UART output goes to the development PC.${inspecting ? " Internal state is under OPEN COVER on STATION." : ""}</p><dl class="pocket-status"><div><dt>POWER</dt><dd>ON</dd></div><div><dt>UART TX</dt><dd id="tx-status">${state.ui.txActive ? "transmitting" : "idle"}</dd></div><div><dt>UART RX</dt><dd>idle</dd></div>${state.active.id === 3 ? `<div><dt>TIMER</dt><dd id="pocket-timer-status">${state.ui.timerLedActive ? "tick" : "waiting"}</dd></div>` : ""}</dl>${state.active.id !== 0 ? `<button class="button primary" data-action="reset-target"${state.ui.buildPhase !== "idle" ? " disabled" : ""}>RESET</button>` : ""}<button class="text-button" data-action="view" data-view="pc">PC ↗</button><button class="text-button" data-action="view" data-view="station">STATION ↗</button></section>`;
}
