import type { AppState } from "../app-state";

export function renderWorkbench(state: AppState): string {
  const intro = state.active.id === 0;
  return `<div class="hub">
    <button id="open-computer" class="hub-button" data-action="view" data-view="computer"><span class="hub-mark" aria-hidden="true">&gt;_</span><strong>PC</strong>${intro ? `<span>Run diagnostics and see what the machine says.</span>` : ""}</button>
    <button id="open-manual" class="hub-button" data-action="view" data-view="manual"><span class="hub-mark" aria-hidden="true">M</span><strong>BOOK</strong>${intro ? `<span>The old manual. Look here when something does not make sense.</span>` : ""}</button>
    <button id="open-pocket" class="hub-button" data-action="view" data-view="pocket"><span class="hub-mark" aria-hidden="true">RV</span><strong>POCKET</strong>${intro ? `<span>The broken pocket computer from the old studio.</span>` : ""}</button>
  </div>`;
}
