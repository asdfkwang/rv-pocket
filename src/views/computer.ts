import { currentChapter, type AppState } from "../app-state";
import { escapeHtml as e } from "./html";

export function renderComputer(state: AppState): string {
  const panels = currentChapter(state).computer.panels;
  if (state.active.id === 0) {
    return `<section class="computer-intro panel">
      <div class="back-row"><button id="computer-back" class="text-button" data-action="view" data-view="workbench">← Back</button></div>
      <span class="eyebrow">THE REPAIR STATION</span><div class="intro-prompt" aria-hidden="true">&gt;_</div>
      <h2>Machine and tools, side by side.</h2>
      <p>This is where you work on RV Pocket: inspect the device, connect the cable, run diagnostics, and read its responses. Each mission brings the tools it needs.</p>
      <p>There is nothing to configure yet. Open the EBOOK, then start your first repair when you are ready.</p>
      <div class="button-row"><button id="computer-to-manual" class="button secondary" data-action="view" data-view="manual">Open EBOOK</button></div>
    </section>`;
  }
  const machine = state.active.machine;
  return `<div class="computer-grid">
    <div class="back-row"><button id="computer-back" class="text-button" data-action="view" data-view="workbench">← Back</button></div>
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
        <div><span class="eyebrow">UART CABLE</span><p class="connection-label"><span class="status-dot ${machine.uartConnected ? "connected" : ""}"></span>${machine.uartConnected ? "Connected" : "Disconnected"}</p></div>
        <button id="connect-cable" class="button secondary" data-action="cable">${machine.uartConnected ? "Disconnect cable" : "Connect cable"}</button>
      </div>
    </section>
    ${panels.includes("terminal") ? `<section class="terminal-panel" aria-labelledby="terminal-heading">
      <div class="terminal-header"><h2 id="terminal-heading">Serial terminal</h2><span><span class="status-dot ${machine.uartConnected ? "connected" : ""}"></span>${machine.uartConnected ? "LINK CONNECTED" : "NO CONNECTION"}</span></div>
      <div class="terminal-body"><span class="terminal-label">RECEIVED FROM RV POCKET</span>
        ${machine.terminalOutput ? "" : `<p class="terminal-empty">No characters received.<br><span>Waiting for the machine's first word.</span></p>`}
        <pre id="terminal-output" aria-label="Received UART data">${e(machine.terminalOutput)}</pre>
      </div>
      <div class="terminal-footer"><span>RX ONLY / NO LOCAL ECHO</span><span>${machine.terminalOutput.length} ${machine.terminalOutput.length === 1 ? "character" : "characters"}</span></div>
    </section>` : ""}
    ${panels.includes("uart-task") ? `<section class="diagnostic-panel panel" aria-labelledby="diagnostic-heading">
      <span class="eyebrow">SUPPLIED BOARD DIAGNOSTIC</span><h2 id="diagnostic-heading">Send one character.</h2>
      <p>A small diagnostic is already on the board. Choose the part that should send its response.</p>
      <label class="field-label" for="output-device">Output device</label>
      <select id="output-device"><option value="" ${state.ui.selectedDevice === "" ? "selected" : ""}>Choose a device…</option>${["cpu", "ram", "uart"].map((device) => `<option value="${device}" ${state.ui.selectedDevice === device ? "selected" : ""}>${device.toUpperCase()}</option>`).join("")}</select>
      <div class="value-field"><span class="field-label">Supplied value</span><code>65 <span>('A')</span></code><span class="muted">The value is provided. No code to write.</span></div>
      <button id="run-diagnostic" class="button primary full-width" data-action="run">Run diagnostic <span aria-hidden="true">→</span></button>
      <p class="small muted">Need a clue? <button id="diagnostic-to-manual" class="text-button" data-action="view" data-view="manual">Look in the EBOOK</button>.</p>
    </section>` : ""}
  </div>`;
}
