import type { AppState } from "../app-state";
import { FB_BASE, DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../sim/framebuffer";
import { formatAddress } from "../platform";
import { escapeHtml as e } from "./html";
import { UI, ui, fill } from "../ui-locale";

// Register names and status values stay English on purpose: they name hardware state
// and match the DATASHEET. The sentences around them are translated.
function row(name: { en: string; ko: string }, value: string, id?: string): string {
  return `<div class="register-row"><dt>${e(ui(name))}</dt><dd${id ? ` id="${id}"` : ""}>${e(value)}</dd></div>`;
}

export function displayStatus(state: AppState): string {
  if (state.active.id === 8) return `FRAME ${state.active.machine.frameCount}`;
  if (state.active.id === 7) return state.active.machine.actualPixel ? ui(UI.displayMarkerVisible) : ui(UI.displayOutside);
  if (state.active.id !== 6) return ui(UI.displayBlack);
  return state.active.machine.outputEnabled ? ui(UI.displayTestPattern) : ui(UI.displayBlack);
}

export function renderDisplayScreen(state: AppState): string {
  const lit = state.active.id === 6 && state.active.machine.outputEnabled;
  return `<span class="pixel-screen" role="img" aria-label="${e(displayStatus(state))}">${Array.from({ length: 128 }, (_, i) => {
    const x = i % 16, y = Math.floor(i / 16);
    const on = state.active.id === 7 || state.active.id === 8 ? Boolean(state.active.machine.cells[FB_BASE + i]) : lit && (x === 0 || x === 15 || y === 0 || y === 7 || (x + y) % 4 === 0);
    return `<span class="display-pixel${on ? " on" : ""}${state.active.id === 8 && state.active.machine.cells[FB_BASE + i] === 2 ? " auto" : ""}" aria-hidden="true"></span>`;
  }).join("")}</span>`;
}

export function renderDisplayReadout(state: AppState, hardwareOnly = false): string {
  if (state.active.id === 8) return hardwareOnly
    ? `<dl class="register-table">${row(UI.displayPower, ui(UI.on))}${row(UI.displayReady, "1")}${row(UI.displayMode, "FRAMEBUFFER")}${row(UI.displayOutput, ui(UI.on))}${row(UI.displayScanWindow, `${formatAddress(FB_BASE)}–${formatAddress(FB_BASE + 127)}`)}${row(UI.displayLastFrame, String(state.active.machine.frameCount))}</dl><p class="inspection-note">${e(ui(UI.displayScanNote))}</p>`
    : renderMovingReadout(state);
  if (state.active.id === 7) return renderFramebufferTrace(state);
  if (state.active.id !== 6) return "";
  const m = state.active.machine;
  const rows = [
    row(UI.displayPower, m.powered ? ui(UI.on) : ui(UI.off)),
    row(UI.displayReady, m.ready ? "1" : "0"),
    row(UI.displayMode, m.mode === "NONE" ? ui(UI.displayNotSet) : m.mode),
    row(UI.displayOutput, m.outputEnabled ? ui(UI.on) : ui(UI.off)),
    row(UI.displayMainStep, m.waiting ? ui(UI.displayWaitReady) : ui(UI.displayCpuWait)),
  ].join("");
  return `<dl class="register-table">${rows}</dl><p class="inspection-note">${e(ui(UI.displayIrqNote))}</p><h4 class="eyebrow">${e(ui(UI.displayActualStartup))}</h4><pre class="display-log">${e(m.log.join("\n"))}</pre>`;
}

export function renderFramebufferTrace(state: AppState): string {
  if (state.active.id !== 7) return "";
  const m = state.active.machine;
  const rows = [
    row(UI.fbRequest, `(${m.x}, ${m.y})`),
    row(UI.fbRowOffset, `${m.y} × ${m.installedRowBytes} = ${m.y * m.installedRowBytes}`),
    row(UI.fbPixelOffset, `+ ${m.x} = ${m.y * m.installedRowBytes + m.x} bytes`),
    row(UI.fbWriteAddress, formatAddress(m.lastWrite.address)),
    row(UI.fbDisplayReads, `${formatAddress(FB_BASE)}–${formatAddress(FB_BASE + DISPLAY_WIDTH * DISPLAY_HEIGHT - 1)}`),
    row(UI.fbActualPixel, m.actualPixel ? `(${m.actualPixel.x}, ${m.actualPixel.y})` : ui(UI.displayOutside)),
  ].join("");
  const verified = fill(UI.fbVerified, { n: String(m.observedTargets.length) });
  return `<dl class="register-table">${rows}</dl><p class="inspection-note">${e(ui(UI.fbTraceNote))}</p><p>${e(verified)}</p>`;
}

export function renderCoordinateGrid(state: AppState): string {
  if (state.active.id !== 7) return "";
  const m = state.active.machine;
  const cells = Array.from({ length: 128 }, (_, i) => {
    const x = i % DISPLAY_WIDTH, y = Math.floor(i / DISPLAY_WIDTH);
    const requested = m.x === x && m.y === y;
    const actual = m.actualPixel?.x === x && m.actualPixel.y === y;
    const label = [
      fill(UI.fbTestCell, { x: String(x), y: String(y) }),
      requested ? ui(UI.fbRequested) : "",
      actual ? ui(UI.fbActual) : "",
    ].filter(Boolean).join("");
    return `<button class="coordinate-cell${requested ? " requested" : ""}${actual ? " actual" : ""}" data-action="test-pixel" data-x="${x}" data-y="${y}" aria-label="${e(label)}" aria-pressed="${requested}"></button>`;
  }).join("");
  return `<div class="coordinate-grid" role="group" aria-label="${e(ui(UI.fbGridAria))}">${cells}</div>`;
}

export function renderMovingReadout(state: AppState): string {
  if (state.active.id !== 8) return "";
  const m = state.active.machine;
  const rows = [
    row(UI.movingFrame, String(m.frameCount)),
    row(UI.movingCpuAt, m.cpuAt),
    row(UI.movingCurrentStep, m.currentStep),
    row(UI.movingTimerRequest, m.pendingTimer ? ui(UI.movingPending) : ui(UI.movingClear)),
    row(UI.movingButtonIrq, m.pendingIrq ? ui(UI.movingPending) : ui(UI.movingClear)),
    row(UI.movingDirection, m.direction === 1 ? ui(UI.movingRight) : ui(UI.movingLeft)),
    row(UI.movingMarker, `(${m.markerX}, ${m.markerY})`),
  ].join("");
  const hold = fill(UI.movingHoldTest, {
    n: String(Math.min(1000, m.heldProgressMs)),
    state: ui(m.dpadHandled ? UI.movingHandled : UI.movingTryMove),
  });
  return `<span class="eyebrow">${e(ui(UI.movingCurrent))}</span><dl class="register-table">${rows}</dl><p class="inspection-note">${e(ui(UI.movingNote))}</p><p>${e(hold)}</p><h4 class="eyebrow">${e(ui(UI.movingHistory))}</h4><pre class="display-log">${e(m.history.join("\n"))}</pre>`;
}