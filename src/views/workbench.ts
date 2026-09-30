import { currentChapter, type AppState } from "../app-state";
import { escapeHtml as e } from "./html";

export function renderWorkbench(state: AppState): string {
  const objects = currentChapter(state).workbench.objects;
  const connected = state.active.id === 1 && state.active.machine.uartConnected;
  const repair = state.active.id === 1;
  return `<div class="workbench-grid">
    <section class="bench-surface" aria-labelledby="bench-heading">
      <div class="panel-heading"><h2 id="bench-heading">The repair bench</h2><span class="eyebrow">RV-01 / PROTOTYPE</span></div>
      ${objects.includes("pocket") ? `<button id="inspect-pocket" class="pocket-inspect" data-action="inspect" aria-label="Inspect RV Pocket">
        <span class="device" aria-hidden="true">
          <span class="device-top"><span>RV POCKET</span><span class="power-light"></span></span>
          <span class="device-screen"></span>
          <span class="device-controls"><span class="dpad"></span><span class="speaker">||||||</span><span class="game-buttons"><span>B</span><span>A</span></span></span>
          <span class="device-bottom">DEVELOPMENT UNIT <span>001</span></span>
        </span>
        <span class="inspect-label">Inspect device <span aria-hidden="true">↗</span></span>
      </button>` : ""}
      <p class="device-caption">Power is on. The screen stays dark.</p>
      ${objects.includes("uart-cable") ? `<div class="connection-strip">
        <div><span class="eyebrow">UART CABLE</span><p class="connection-label"><span class="status-dot ${connected ? "connected" : ""}"></span>${connected ? "Connected to computer" : "Disconnected"}</p></div>
        <button id="connect-cable" class="button secondary" data-action="cable">${connected ? "Disconnect cable" : "Connect cable"}</button>
      </div>` : `<div class="bench-label"><span>PROPERTY OF THE OLD STUDIO</span><span>HANDLE WITH CURIOSITY</span></div>`}
    </section>
    <aside class="bench-notes" aria-labelledby="notes-heading">
      <span class="eyebrow">FIELD NOTES / ${repair ? "01" : "00"}</span>
      <h2 id="notes-heading">${repair ? "Silence is a clue." : "Every repair starts here."}</h2>
      <p>${repair ? "The screen tells you very little. Look for another way to hear from the machine." : "The studio is gone. The machine is still here. Perhaps its story is not quite finished."}</p>
      <ol class="bench-steps"><li><span>01</span><div><strong>Inspect</strong><p>Find out what the machine is doing.</p></div></li><li><span>02</span><div><strong>Look it up</strong><p>The Manual is here when you need a clue.</p></div></li><li><span>03</span><div><strong>Try a repair</strong><p>Use the Computer. Watch what changes.</p></div></li></ol>
      ${state.ui.inspected ? `<div class="inspection-note"><span class="eyebrow">INSPECTION</span><p>${e(repair ? "The power indicator is on, but the display gives no response. A small connector on the edge is marked UART." : "A worn prototype from the old studio. Its screen stays dark. The computer and manual are beside it, ready for your first repair.")}</p></div>` : ""}
    </aside>
  </div>
  <div class="tool-grid">
    ${objects.includes("computer") ? `<button id="open-computer" class="tool-card" data-action="view" data-view="computer"><span class="tool-mark" aria-hidden="true">&gt;_</span><span><strong>Development computer</strong><span>${repair ? "Run the diagnostic and listen for a response." : "Your place to run repairs and see what happens."}</span></span><span class="tool-arrow" aria-hidden="true">↗</span></button>` : ""}
    ${objects.includes("manual") ? `<button id="open-manual" class="tool-card" data-action="view" data-view="manual"><span class="tool-mark manual-mark" aria-hidden="true">M</span><span><strong>The old manual</strong><span>${repair ? "Find a clue. Learn how to hear from RV Pocket." : "A short guide to finding your way around."}</span></span><span class="tool-arrow" aria-hidden="true">↗</span></button>` : ""}
  </div>`;
}
