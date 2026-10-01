import type { AppState } from "../app-state";

export function renderStation(): string {
  return `<div class="station">
    <div class="back-row"></div>
    <section class="device-panel panel" aria-labelledby="device-heading">
      <span class="eyebrow">RV POCKET / DEVELOPMENT UNIT 001</span>
      <h2 id="device-heading">The machine.</h2>
      <span class="device" aria-hidden="true">
        <span class="device-top"><span>RV POCKET</span><span class="power-light"></span></span>
        <span class="device-screen"></span>
        <span class="device-controls"><span class="dpad"></span><span class="speaker">||||||</span><span class="game-buttons"><span>B</span><span>A</span></span></span>
        <span class="device-bottom">DEVELOPMENT UNIT <span>001</span></span>
      </span>
      <p class="device-caption">Power is on. The screen stays dark.</p>
      <div class="connection-strip">
        <div><span class="eyebrow">UART CABLE</span><p class="connection-label"><span class="status-dot connected"></span>Connected</p></div>
      </div>
    </section>
    <div class="station-buttons">
      <button id="open-ebook" class="station-button" data-action="view" data-view="ebook"><span class="station-mark" aria-hidden="true">M</span><strong>EBOOK</strong></button>
      <button id="open-terminal" class="station-button" data-action="view" data-view="terminal"><span class="station-mark" aria-hidden="true">&gt;_</span><strong>TERMINAL</strong></button>
    </div>
  </div>`;
}
