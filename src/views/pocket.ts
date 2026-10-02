import type { AppState } from "../app-state";
import { renderDisplayScreen } from "./display";
import { UI, ui } from "../ui-locale";
import { escapeHtml as e } from "./html";

// The device body. When the episode has a pressable control, the A button is a real
// control rather than decoration, so it must not sit inside the inspect button.
export function renderPocketHardware(state: AppState, interactive = false): string {
  const pressable = interactive && (state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8);
  const directional = interactive && (state.active.id === 7 || state.active.id === 8);
  const led = (state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8) && state.active.machine.ledValue === 1;
  const button = pressable
    ? `<button id="pocket-button-a" class="pocket-button${state.ui.buttonHeld ? " pressed" : ""}" data-hold="a" aria-pressed="${state.ui.buttonHeld}" aria-label="${e(ui(UI.pocketHoldAria))}">A</button>`
    : `<span class="pocket-button" aria-hidden="true">A</span>`;
  return `<span class="device">
    <span class="device-top" aria-hidden="true"><span>RV POCKET</span><span class="power-light"></span></span>
    <span class="device-screen">${renderDisplayScreen(state)}</span>
    <span class="device-indicators" aria-hidden="true"><span><span class="status-dot uart-tx-light${state.ui.txActive ? " tx-pulse" : ""}"></span>TX</span><span><span class="status-dot"></span>RX</span>${state.active.id === 3 ? `<span><span class="status-dot timer-light${state.ui.timerLedActive ? " on" : ""}"></span>TIMER</span>` : ""}${state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8 ? `<span><span class="status-dot led-light${led ? " on" : ""}"></span>LED</span>` : ""}</span>
    <span class="device-controls"${pressable || directional ? "" : ' aria-hidden="true"'}>${directional ? `<span class="dpad-buttons" role="group" aria-label="${e(ui(UI.pocketMoveAria))}">${dpadKeys().map(({ direction, label, name }) => `<button class="dpad-key ${direction}" data-action="move-marker" data-direction="${direction}" aria-label="${e(ui(UI.pocketMoveDirection).replace("{dir}", name))}">${label}</button>`).join("")}</span>` : `<span class="dpad" aria-hidden="true">+</span>`}<span class="speaker" aria-hidden="true">||||||</span><span class="game-buttons"><span class="pocket-button" aria-hidden="true">B</span>${button}</span></span>
    <span class="device-bottom" aria-hidden="true">DEVELOPMENT UNIT <span>001</span></span>
  </span>`;
}

function dpadKeys() {
  return [
    { direction: "up", label: "↑", name: ui(UI.directionUp) },
    { direction: "left", label: "←", name: ui(UI.directionLeft) },
    { direction: "right", label: "→", name: ui(UI.directionRight) },
    { direction: "down", label: "↓", name: ui(UI.directionDown) },
  ];
}

export function renderPocket(state: AppState): string {
  const inspecting = state.active.id === 2 || state.active.id === 3;
  const hasButton = state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8;
  const input = state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 8 ? state.active.machine : null;
  return `<section class="pocket-inspect panel" aria-labelledby="pocket-heading"><span class="eyebrow">${e(ui(UI.pocketEyebrow))}</span><h1 id="pocket-heading">${e(ui(UI.pocketHeading))}</h1>${renderPocketHardware(state, true)}<p>${e(state.active.id >= 6 ? ui(UI.pocketScreenLive) : ui(UI.pocketPowerOn))}</p><p class="muted">${e(ui(UI.pocketUartNotePlain))}${inspecting ? ` ${e(ui(UI.pocketUartNote))}` : ""}</p>${hasButton ? `<p>${e(state.active.id === 8 ? ui(UI.pocketHoldDpad) : ui(UI.pocketHoldSimple))}</p>` : state.active.id === 7 ? `<p>${e(ui(UI.pocketDpadOnly))}</p>` : ""}<dl class="pocket-status"><div><dt>${e(ui(UI.pocketPower))}</dt><dd>${e(ui(UI.on))}</dd></div><div><dt>${e(ui(UI.pocketUartTx))}</dt><dd id="tx-status">${e(state.ui.txActive ? ui(UI.transmitting) : ui(UI.idle))}</dd></div><div><dt>${e(ui(UI.pocketUartRx))}</dt><dd>${e(ui(UI.idle))}</dd></div>${state.active.id === 3 ? `<div><dt>${e(ui(UI.pocketTimer))}</dt><dd id="pocket-timer-status">${e(state.ui.timerLedActive ? ui(UI.tick) : ui(UI.waiting))}</dd></div>` : ""}${input ? `<div><dt>${e(ui(UI.pocketButton))}</dt><dd id="pocket-button-status">${e(input.buttonValue ? ui(UI.pressed) : ui(UI.released))}</dd></div><div><dt>${e(ui(UI.pocketLed))}</dt><dd id="pocket-led-status">${e(input.ledValue ? ui(UI.on) : ui(UI.off))}</dd></div>` : ""}</dl>${state.active.id !== 0 ? `<button class="button primary" data-action="reset-target"${state.ui.buildPhase !== "idle" ? " disabled" : ""}>${e(ui(UI.reset))}</button>` : ""}<button class="text-button" data-action="view" data-view="pc">${e(ui(UI.pc))}</button><button class="text-button" data-action="view" data-view="station">${e(ui(UI.station))}</button></section>`;
}
