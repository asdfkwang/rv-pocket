import type { AppState } from "../app-state";

export function renderWorkbench(state: AppState): string {
  const intro = state.active.id === 0;
  return `<div class="hub">
    <button id="open-station" class="hub-button" data-action="view" data-view="computer"><span class="hub-mark" aria-hidden="true">&gt;_</span><strong>STATION</strong>${intro ? `<span>Inspect the device, connect the cable, run diagnostics.</span>` : ""}</button>
    <button id="open-manual" class="hub-button" data-action="view" data-view="manual"><span class="hub-mark" aria-hidden="true">M</span><strong>BOOK</strong>${intro ? `<span>The old manual. Look here when something does not make sense.</span>` : ""}</button>
  </div>`;
}
