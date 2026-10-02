import type { AppState } from "../app-state";
import { renderDisplayScreen } from "./display";

// The device body. When the episode has a pressable control, the A button is a real
// control rather than decoration, so it must not sit inside the inspect button.
export function renderPocketHardware(state: AppState, interactive = false): string {
  const pressable = interactive && (state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8);
  const directional = interactive && (state.active.id === 7 || state.active.id === 8);
  const led = (state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8) && state.active.machine.ledValue === 1;
  const button = pressable
    ? `<button id="pocket-button-a" class="pocket-button${state.ui.buttonHeld ? " pressed" : ""}" data-hold="a" aria-pressed="${state.ui.buttonHeld}" aria-label="A button, press and hold">A</button>`
    : `<span class="pocket-button" aria-hidden="true">A</span>`;
  return `<span class="device">
    <span class="device-top" aria-hidden="true"><span>RV POCKET</span><span class="power-light"></span></span>
    <span class="device-screen">${renderDisplayScreen(state)}</span>
    <span class="device-indicators" aria-hidden="true"><span><span class="status-dot uart-tx-light${state.ui.txActive ? " tx-pulse" : ""}"></span>TX</span><span><span class="status-dot"></span>RX</span>${state.active.id === 3 ? `<span><span class="status-dot timer-light${state.ui.timerLedActive ? " on" : ""}"></span>TIMER</span>` : ""}${state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8 ? `<span><span class="status-dot led-light${led ? " on" : ""}"></span>LED</span>` : ""}</span>
    <span class="device-controls"${pressable || directional ? "" : ' aria-hidden="true"'}>${directional ? `<span class="dpad-buttons" role="group" aria-label="Move marker">${[["up", "↑"], ["left", "←"], ["right", "→"], ["down", "↓"]].map(([direction, label]) => `<button class="dpad-key ${direction}" data-action="move-marker" data-direction="${direction}" aria-label="Move ${direction}">${label}</button>`).join("")}</span>` : `<span class="dpad" aria-hidden="true">+</span>`}<span class="speaker" aria-hidden="true">||||||</span><span class="game-buttons"><span class="pocket-button" aria-hidden="true">B</span>${button}</span></span>
    <span class="device-bottom" aria-hidden="true">DEVELOPMENT UNIT <span>001</span></span>
  </span>`;
}

export function renderPocket(state: AppState): string {
  const inspecting = state.active.id === 2 || state.active.id === 3;
  const hasButton = state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8;
  const input = state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8 ? state.active.machine : null;
  return `<section class="pocket-inspect panel" aria-labelledby="pocket-heading"><span class="eyebrow">TARGET MACHINE</span><h1 id="pocket-heading">RV Pocket.</h1>${renderPocketHardware(state, true)}<p>${state.active.id >= 6 ? "The screen shows the installed program. Inspect DISPLAY on STATION to see its startup." : "Power is on. The display stays black until its own repair."}</p><p class="muted">UART output goes to the development PC.${inspecting ? " Internal state is under OPEN COVER on STATION." : ""}</p>${hasButton ? `<p>${state.active.id === 8 ? "A reverses the automatic dot. Hold A and use the D-pad / arrow keys to test responsiveness." : "Press and hold the A button, then let go."}</p>` : state.active.id === 7 ? `<p>Move the marker with the D-pad or arrow keys.</p>` : ""}<dl class="pocket-status"><div><dt>POWER</dt><dd>ON</dd></div><div><dt>UART TX</dt><dd id="tx-status">${state.ui.txActive ? "transmitting" : "idle"}</dd></div><div><dt>UART RX</dt><dd>idle</dd></div>${state.active.id === 3 ? `<div><dt>TIMER</dt><dd id="pocket-timer-status">${state.ui.timerLedActive ? "tick" : "waiting"}</dd></div>` : ""}${input ? `<div><dt>BUTTON</dt><dd id="pocket-button-status">${input.buttonValue ? "pressed" : "released"}</dd></div><div><dt>LED</dt><dd id="pocket-led-status">${input.ledValue ? "on" : "off"}</dd></div>` : ""}</dl>${state.active.id !== 0 ? `<button class="button primary" data-action="reset-target"${state.ui.buildPhase !== "idle" ? " disabled" : ""}>RESET</button>` : ""}<button class="text-button" data-action="view" data-view="pc">PC ↗</button><button class="text-button" data-action="view" data-view="station">STATION ↗</button></section>`;
}
