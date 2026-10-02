import { currentChapter, type AppState } from "../app-state";
import { escapeHtml as e } from "./html";
import { renderSource, stationSerialSummary } from "./pc";
import { renderInspectionPanel, renderCoverToggle } from "./inspection";
import { renderPocketHardware } from "./pocket";

function deskNote(chapterId: number): string {
  if (chapterId === 1) return "boot.S is still open.<br>The Pocket is already sending a byte.";
  if (chapterId === 2) return "The store program is running.<br>Its output cannot show where the value went.";
  if (chapterId === 3) return "The timer diagnostic is running.<br>One second should feel like one second.";
  return "The Pocket, its development PC,<br>and two books left beside them.";
}

export function renderStation(state: AppState): string {
  const chapter = currentChapter(state);
  const output = stationSerialSummary(state);
  const cover = renderCoverToggle(state);
  const panel = renderInspectionPanel(state);
  return `<section class="station" aria-labelledby="station-heading">
    <header class="station-heading"><div><span class="eyebrow">THE OLD STUDIO / DEVELOPMENT DESK</span><h1 id="station-heading">Everything is still here.</h1></div><p>One machine. One repair at a time.</p></header>
    <div class="station-desk${panel ? " has-inspection" : ""}">
      <button id="open-pc" class="desk-object pc-object" data-action="view" data-view="pc" aria-label="Open development PC">
        <span class="monitor"><span class="monitor-top">RV DEVSTATION <span>PC</span></span><span class="monitor-display">${chapter.computer.source ? `<span class="preview-file">${e(chapter.computer.source.fileName)}</span>${renderSource(state, false)}` : `<span class="pc-sleep">THE LAST PROJECT<br><span>Waiting to be opened.</span></span>`}<span class="monitor-serial${state.active.id > 1 ? " diagnostic" : ""}"><span>SERIAL</span><strong id="station-serial">${e(output)}</strong></span></span><span class="monitor-neck"></span><span class="monitor-foot"></span><span class="object-label">PC <span>Open development tools ↗</span></span>
      </button>
      <div class="pocket-bay">
        <button id="open-pocket" class="desk-object pocket-object" data-action="view" data-view="pocket" aria-label="Inspect RV Pocket">${renderPocketHardware(state)}<span class="object-label">RV POCKET <span>Power on · screen dark ↗</span></span></button>
        ${cover}
      </div>
      <div class="desk-cable"><span class="cable-end"></span><span class="cable-wire"></span><span class="cable-label"><span class="status-dot connected"></span>UART / CONNECTED</span><span class="cable-wire"></span><span class="cable-end"></span></div>
      ${panel}
      <div class="desk-reading"><div class="desk-note"><span class="eyebrow">LEFT ON THE DESK</span><p>${deskNote(chapter.id)}</p></div><div class="desk-books">
        <button id="open-datasheet" class="desk-object reference-object" data-action="view" data-view="datasheet" aria-label="Open hardware datasheet"><span class="manual-cover"><span>RV POCKET</span><strong>HARDWARE<br>DATASHEET</strong><span class="manual-rule"></span><span>DEVICE SPEC / REV. 01</span></span><span class="object-label">DATASHEET <span>Addresses & registers ↗</span></span></button>
        <button id="open-book" class="desk-object reference-object book-object" data-action="view" data-view="book" aria-label="Open study book"><span class="manual-cover"><span>RV POCKET</span><strong>COMPUTER<br>SYSTEMS</strong><span class="manual-rule"></span><span>BOOK / 40 CHAPTERS</span></span><span class="object-label">BOOK <span>Read & study ↗</span></span></button>
      </div></div>
    </div>
    <footer class="desk-footer"><span>STATION DESK</span><span>DEVELOPMENT UNIT 001</span></footer>
  </section>`;
}
