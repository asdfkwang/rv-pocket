import type { AppState } from "../app-state";

export function renderPocket(state: AppState): string {
  const connected = state.active.id === 1 && state.active.machine.uartConnected;
  return `<div class="pocket-screen">
    <div class="back-row"><button id="pocket-back" class="text-button" data-action="view" data-view="workbench">← Back</button></div>
    <figure class="device-figure">
      <span class="device" aria-hidden="true">
        <span class="device-top"><span>RV POCKET</span><span class="power-light"></span></span>
        <span class="device-screen"></span>
        <span class="device-controls"><span class="dpad"></span><span class="speaker">||||||</span><span class="game-buttons"><span>B</span><span>A</span></span></span>
        <span class="device-bottom">DEVELOPMENT UNIT <span>001</span></span>
      </span>
      <figcaption class="device-caption">Power is on. The screen stays dark.</figcaption>
    </figure>
    ${state.active.id === 1 ? `<div class="connection-strip">
      <div><span class="eyebrow">UART CABLE</span><p class="connection-label"><span class="status-dot ${connected ? "connected" : ""}"></span>${connected ? "Connected to computer" : "Disconnected"}</p></div>
      <button id="connect-cable" class="button secondary" data-action="cable">${connected ? "Disconnect cable" : "Connect cable"}</button>
    </div>` : ""}
  </div>`;
}
