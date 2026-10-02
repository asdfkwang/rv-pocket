import { currentChapter, type AppState } from "../app-state";
import { escapeHtml as e } from "./html";
import { renderSource, stationSerialSummary } from "./pc";
import { renderPocketHardware } from "./pocket";

export function renderStation(state: AppState): string {
  const chapter = currentChapter(state);
  const output = stationSerialSummary(state);
  return `<section class="station" aria-labelledby="station-heading">
    <header class="station-heading"><div><span class="eyebrow">THE OLD STUDIO / DEVELOPMENT DESK</span><h1 id="station-heading">Everything is still here.</h1></div><p>One machine. One repair at a time.</p></header>
    <div class="station-desk">
      <button id="open-pc" class="desk-object pc-object" data-action="view" data-view="pc" aria-label="Open development PC">
        <span class="monitor"><span class="monitor-top">RV DEVSTATION <span>PC</span></span><span class="monitor-display">${chapter.computer.source ? `<span class="preview-file">${e(chapter.computer.source.fileName)}</span>${renderSource(state, false)}` : `<span class="pc-sleep">THE LAST PROJECT<br><span>Waiting to be opened.</span></span>`}<span class="monitor-serial${state.active.id > 1 ? " diagnostic" : ""}"><span>SERIAL</span><strong id="station-serial">${e(output)}</strong></span></span></span><span class="monitor-neck"></span><span class="monitor-foot"></span><span class="object-label">PC <span>Open development tools ↗</span></span>
      </button>
      <button id="open-pocket" class="desk-object pocket-object" data-action="view" data-view="pocket" aria-label="Inspect RV Pocket">${renderPocketHardware(state)}<span class="object-label">RV POCKET <span>${state.active.id === 2 ? "RAM diagnostic readout" : state.active.id === 3 ? "Timer LED · screen dark" : "Power on · screen dark"} ↗</span></span></button>
      <div class="desk-cable"><span class="cable-end"></span><span class="cable-wire"></span><span class="cable-label"><span class="status-dot connected"></span>UART / CONNECTED</span><span class="cable-wire"></span><span class="cable-end"></span></div>
      <div class="desk-reading"><div class="desk-note"><span class="eyebrow">LEFT ON THE DESK</span><p>${state.active.id === 1 ? "boot.S is still open.<br>The Pocket is already sending a byte." : state.active.id === 2 ? "The old RAM diagnostic is running.<br>Its failure addresses keep changing." : state.active.id === 3 ? "The timer diagnostic is running.<br>One second should feel like one second." : "The Pocket, its development PC,<br>and two books left beside them."}</p></div><div class="desk-books">
        <button id="open-datasheet" class="desk-object reference-object" data-action="view" data-view="datasheet" aria-label="Open hardware datasheet"><span class="manual-cover"><span>RV POCKET</span><strong>HARDWARE<br>DATASHEET</strong><span class="manual-rule"></span><span>DEVICE SPEC / REV. 01</span></span><span class="object-label">DATASHEET <span>Addresses & registers ↗</span></span></button>
        <button id="open-book" class="desk-object reference-object book-object" data-action="view" data-view="book" aria-label="Open study book"><span class="manual-cover"><span>RV POCKET</span><strong>COMPUTER<br>SYSTEMS</strong><span class="manual-rule"></span><span>BOOK / 40 CHAPTERS</span></span><span class="object-label">BOOK <span>Read & study ↗</span></span></button>
      </div></div>
    </div>
    <footer class="desk-footer"><span>STATION DESK</span><span>DEVELOPMENT UNIT 001</span></footer>
  </section>`;
}
