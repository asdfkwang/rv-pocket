import type { AppState } from "../app-state";

// The device body. When the episode has a pressable control, the A button is a real
// control rather than decoration, so it must not sit inside the inspect button.
export function renderPocketHardware(state: AppState, interactive = false): string {
  const pressable = interactive && (state.active.id === 4 || state.active.id === 5);
  const led = (state.active.id === 4 || state.active.id === 5) && state.active.machine.ledValue === 1;
  const button = pressable
    ? `<button id="pocket-button-a" class="pocket-button${state.ui.buttonHeld ? " pressed" : ""}" data-hold="a" aria-pressed="${state.ui.buttonHeld}" aria-label="A button, press and hold">A</button>`
    : `<span class="pocket-button" aria-hidden="true">A</span>`;
  return `<span class="device">
    <span class="device-top" aria-hidden="true"><span>RV POCKET</span><span class="power-light"></span></span>
    <span class="device-screen" aria-hidden="true"></span>
    <span class="device-indicators" aria-hidden="true"><span><span class="status-dot uart-tx-light${state.ui.txActive ? " tx-pulse" : ""}"></span>TX</span><span><span class="status-dot"></span>RX</span>${state.active.id === 3 ? `<span><span class="status-dot timer-light${state.ui.timerLedActive ? " on" : ""}"></span>TIMER</span>` : ""}${state.active.id === 4 || state.active.id === 5 ? `<span><span class="status-dot led-light${led ? " on" : ""}"></span>LED</span>` : ""}</span>
    <span class="device-controls" aria-hidden="true"><span class="dpad">+</span><span class="speaker">||||||</span><span class="game-buttons"><span class="pocket-button">B</span>${button}</span></span>
    <span class="device-bottom" aria-hidden="true">DEVELOPMENT UNIT <span>001</span></span>
  </span>`;
}

export function renderPocket(state: AppState): string {
  const inspecting = state.active.id === 2 || state.active.id === 3;
  const hasButton = state.active.id === 4 || state.active.id === 5;
  const input = state.active.id === 4 || state.active.id === 5 ? state.active.machine : null;
  return `<section class="pocket-inspect panel" aria-labelledby="pocket-heading"><span class="eyebrow">TARGET MACHINE</span><h1 id="pocket-heading">RV Pocket.</h1>${renderPocketHardware(state, true)}<p>Power is on. The display stays black until its own repair.</p><p class="muted">UART output goes to the development PC.${inspecting ? " Internal state is under OPEN COVER on STATION." : ""}</p>${hasButton ? `<p>Press and hold the A button, then let go.</p>` : ""}<dl class="pocket-status"><div><dt>POWER</dt><dd>ON</dd></div><div><dt>UART TX</dt><dd id="tx-status">${state.ui.txActive ? "transmitting" : "idle"}</dd></div><div><dt>UART RX</dt><dd>idle</dd></div>${state.active.id === 3 ? `<div><dt>TIMER</dt><dd id="pocket-timer-status">${state.ui.timerLedActive ? "tick" : "waiting"}</dd></div>` : ""}${input ? `<div><dt>BUTTON</dt><dd id="pocket-button-status">${input.buttonValue ? "pressed" : "released"}</dd></div><div><dt>LED</dt><dd id="pocket-led-status">${input.ledValue ? "on" : "off"}</dd></div>` : ""}</dl>${state.active.id !== 0 ? `<button class="button primary" data-action="reset-target"${state.ui.buildPhase !== "idle" ? " disabled" : ""}>RESET</button>` : ""}<button class="text-button" data-action="view" data-view="pc">PC ↗</button><button class="text-button" data-action="view" data-view="station">STATION ↗</button></section>`;
}
