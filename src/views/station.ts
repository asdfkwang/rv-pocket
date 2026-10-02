import { currentChapter, type AppState } from "../app-state";
import { escapeHtml as e } from "./html";
import { editorFileName, renderEditor, stationSerialSummary } from "./pc";
import { renderInspectionPanel, renderCoverToggle } from "./inspection";
import { renderPocketHardware } from "./pocket";
import { UI, ui, type UiText } from "../ui-locale";

const DESK_NOTES: Record<number, UiText> = {
  1: UI.noteBoot, 2: UI.noteStore, 3: UI.noteTimer, 4: UI.noteButton,
  5: UI.noteInterrupt, 6: UI.noteDisplay, 7: UI.noteFramebuffer, 8: UI.noteMoving,
};

function deskNote(chapterId: number): string {
  return ui(DESK_NOTES[chapterId] ?? UI.notePrologue);
}

function pocketLabel(chapterId: number): string {
  if (chapterId >= 6) return ui({ en: "Inspect the live display ↗", ko: "실시간 디스플레이 확인 ↗" });
  return chapterId === 4 || chapterId === 5 ? ui(UI.pocketLabelHold) : ui(UI.pocketLabelIdle);
}

export function renderStation(state: AppState): string {
  const chapter = currentChapter(state);
  const output = stationSerialSummary(state);
  const cover = renderCoverToggle(state);
  const panel = renderInspectionPanel(state);
  const fileName = editorFileName(state);
  return `<section class="station" aria-labelledby="station-heading">
    <header class="station-heading"><div><span class="eyebrow">${e(ui(UI.stationEyebrow))}</span><h1 id="station-heading">${e(ui(UI.stationHeading))}</h1></div><p>${e(ui(UI.stationTagline))}</p></header>
    <div class="station-desk${panel ? " has-inspection" : ""}">
      <button id="open-pc" class="desk-object pc-object" data-action="view" data-view="pc" aria-label="Open development PC">
        <span class="monitor"><span class="monitor-top">RV DEVSTATION <span>PC</span></span><span class="monitor-display">${fileName ? `<span class="preview-file">${e(fileName)}</span>${renderEditor(state, false)}` : `<span class="pc-sleep">${ui(UI.stationSleep)}</span>`}<span class="monitor-serial${state.active.id > 1 ? " diagnostic" : ""}"><span>SERIAL</span><strong id="station-serial">${e(output)}</strong></span></span><span class="monitor-neck"></span><span class="monitor-foot"></span><span class="object-label">PC <span>${e(ui(UI.stationPcHint))}</span></span>
      </button>
      <div class="pocket-bay">
        <div class="desk-object pocket-object">${renderPocketHardware(state, true)}<button id="open-pocket" class="pocket-inspect-link" data-action="view" data-view="pocket" aria-label="Inspect RV Pocket">${e(pocketLabel(chapter.id))}</button></div>
        ${cover}
      </div>
      <div class="desk-cable"><span class="cable-end"></span><span class="cable-wire"></span><span class="cable-label"><span class="status-dot connected"></span>UART / CONNECTED</span><span class="cable-wire"></span><span class="cable-end"></span></div>
      ${panel}
      <div class="desk-reading"><div class="desk-note"><span class="eyebrow">${e(ui(UI.stationLeftOnDesk))}</span><p>${deskNote(chapter.id)}</p></div><div class="desk-books">
        <button id="open-datasheet" class="desk-object reference-object" data-action="view" data-view="datasheet" aria-label="Open hardware datasheet"><span class="manual-cover"><span>RV POCKET</span><strong>HARDWARE<br>DATASHEET</strong><span class="manual-rule"></span><span>DEVICE SPEC / REV. 01</span></span><span class="object-label">DATASHEET <span>${e(ui(UI.stationDatasheetHint))}</span></span></button>
        <button id="open-book" class="desk-object reference-object book-object" data-action="view" data-view="book" aria-label="Open study book"><span class="manual-cover"><span>RV POCKET</span><strong>COMPUTER<br>SYSTEMS</strong><span class="manual-rule"></span><span>BOOK / 40 CHAPTERS</span></span><span class="object-label">BOOK <span>${e(ui(UI.stationBookHint))}</span></span></button>
      </div></div>
    </div>
    <footer class="desk-footer"><span>${e(ui(UI.stationDeskLabel))}</span><span>DEVELOPMENT UNIT 001</span></footer>
  </section>`;
}
