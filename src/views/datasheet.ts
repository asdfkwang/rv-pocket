import type { AppState } from "../app-state";
import { DATASHEET_SECTIONS } from "../datasheet-content";
import { escapeHtml as e } from "./html";

export function renderDatasheet(state: AppState): string {
  const section = DATASHEET_SECTIONS.find((item) => item.id === state.ui.datasheetSection)!;
  return `<div class="datasheet">
    <aside class="datasheet-side" aria-label="Datasheet contents"><span class="eyebrow">HARDWARE REFERENCE</span><strong>RV POCKET<br>DATASHEET</strong><p class="datasheet-revision">DEVELOPMENT UNIT 001 / REV. 01</p><nav aria-label="Datasheet sections">${DATASHEET_SECTIONS.map((item) => `<button class="datasheet-nav${item.id === section.id ? " active" : ""}" data-action="datasheet-section" data-section="${item.id}"${item.id === section.id ? ' aria-current="page"' : ""}>${e(item.title)}</button>`).join("")}</nav><button class="text-button" data-action="view" data-view="pc">← BACK TO PC</button><p class="datasheet-study-link">Need the explanation?<br><button class="text-button" data-action="view" data-view="book">Open BOOK ↗</button></p></aside>
    <article class="datasheet-page" aria-labelledby="datasheet-title"><header><span class="eyebrow">RV POCKET / DEVICE SPECIFICATION</span><h1 id="datasheet-title" tabindex="-1">${e(section.title)}</h1><p>${e(section.summary)}</p></header><div class="datasheet-table-wrap"><table><thead><tr>${section.columns.map((column) => `<th scope="col">${e(column)}</th>`).join("")}</tr></thead><tbody>${section.rows.map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${e(cell)}</th>` : `<td>${e(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="datasheet-notes">${section.notes.map((note) => `<p>${e(note)}</p>`).join("")}</div>${section.id === "uart" ? `<pre class="datasheet-path">RV Pocket                      Development PC
[ UART ] ------- cable ------> [ SERIAL ]</pre><button class="button secondary" data-action="datasheet-section" data-section="ascii">ASCII character codes →</button>` : ""}</article>
  </div>`;
}
