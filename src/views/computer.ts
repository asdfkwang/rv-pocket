import { currentChapter, type AppState } from "../app-state";
import { escapeHtml as e } from "./html";

export function renderComputer(state: AppState): string {
  const panels = currentChapter(state).computer.panels;
  if (state.active.id === 0) {
    return `<section class="computer-intro panel">
      <span class="eyebrow">YOUR DEVELOPMENT COMPUTER</span><div class="intro-prompt" aria-hidden="true">&gt;_</div>
      <h2>A window into the machine.</h2>
      <p>This is where you will run diagnostics, try repairs, and read RV Pocket's responses. Each mission brings the tools it needs.</p>
      <p>There is nothing to configure yet. Explore the Workbench or open the Manual, then start your first repair when you are ready.</p>
      <div class="button-row"><button id="computer-to-workbench" class="button secondary" data-action="view" data-view="workbench">Back to Workbench</button><button id="computer-to-manual" class="button secondary" data-action="view" data-view="manual">Open Manual</button></div>
    </section>`;
  }
  const machine = state.active.machine;
  return `<div class="computer-grid">
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
      <p class="small muted">Need a clue? <button id="diagnostic-to-manual" class="text-button" data-action="view" data-view="manual">Look in the Manual</button>.</p>
      <button id="diagnostic-to-workbench" class="text-button" data-action="view" data-view="workbench">${machine.uartConnected ? "Inspect cable in Workbench" : "Connect the cable in Workbench"} <span aria-hidden="true">↗</span></button>
    </section>` : ""}
  </div>`;
}
