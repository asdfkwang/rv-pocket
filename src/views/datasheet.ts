import type { AppState } from "../app-state";
import { DATASHEET_SECTIONS, type Cell } from "../datasheet-content";
import { escapeHtml as e } from "./html";
import { UI, ui } from "../ui-locale";

function cell(value: Cell): string {
  return typeof value === "string" ? e(value) : e(ui(value));
}

function renderTable(columns: readonly Cell[], rows: readonly (readonly Cell[])[]): string {
  return `<div class="datasheet-table-wrap"><table><thead><tr>${columns.map((column) => `<th scope="col">${cell(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((item, index) => index === 0 ? `<th scope="row">${cell(item)}</th>` : `<td>${cell(item)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

export function renderDatasheet(state: AppState): string {
  const section = DATASHEET_SECTIONS.find((item) => item.id === state.ui.datasheetSection)!;
  const detail = "detail" in section ? section.detail : null;
  return `<div class="datasheet">
    <aside class="datasheet-side" aria-label="${e(ui(UI.datasheetContents))}"><span class="eyebrow">${e(ui(UI.datasheetReference))}</span><strong>RV POCKET<br>DATASHEET</strong><p class="datasheet-revision">${e(ui(UI.datasheetRevision))}</p><nav aria-label="${e(ui(UI.datasheetSections))}">${DATASHEET_SECTIONS.map((item) => `<button class="datasheet-nav${item.id === section.id ? " active" : ""}" data-action="datasheet-section" data-section="${item.id}"${item.id === section.id ? ' aria-current="page"' : ""}>${cell(item.title)}</button>`).join("")}</nav><button class="text-button" data-action="view" data-view="pc">${e(ui(UI.datasheetBack))}</button><p class="datasheet-study-link">${e(ui(UI.datasheetNeed))}<br><button class="text-button" data-action="view" data-view="book">${e(ui(UI.datasheetOpenBook))}</button></p></aside>
    <article class="datasheet-page" aria-labelledby="datasheet-title"><header><span class="eyebrow">${e(ui(UI.datasheetWordmark))}</span><h1 id="datasheet-title" tabindex="-1">${cell(section.title)}</h1><p>${cell(section.summary)}</p></header>${renderTable(section.columns, section.rows)}<div class="datasheet-notes">${section.notes.map((note) => `<p>${cell(note)}</p>`).join("")}</div>${detail ? `<section class="datasheet-detail"><h2>${cell(detail.title)}</h2><p>${cell(detail.summary)}</p>${renderTable(detail.columns, detail.rows)}<div class="datasheet-notes">${detail.notes.map((note) => `<p>${cell(note)}</p>`).join("")}</div></section>` : ""}${section.id === "uart" ? `<pre class="datasheet-path">RV Pocket                      Development PC
[ UART ] ------- cable ------> [ SERIAL ]</pre><button class="button secondary" data-action="datasheet-section" data-section="ascii">${e(ui(UI.datasheetAsciiLink))}</button>` : ""}</article>
  </div>`;
}
