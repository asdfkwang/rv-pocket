import type { AppState } from "../app-state";
import { FB_BASE, DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../sim/framebuffer";
import { formatAddress } from "../platform";
import { escapeHtml as e } from "./html";

export function displayStatus(state: AppState): string {
  if (state.active.id === 8) return `FRAME ${state.active.machine.frameCount}`;
  if (state.active.id === 7) return state.active.machine.actualPixel ? "MARKER VISIBLE" : "OUTSIDE DISPLAY";
  if (state.active.id !== 6) return "BLACK";
  return state.active.machine.outputEnabled ? "TEST PATTERN" : "BLACK";
}

export function renderDisplayScreen(state: AppState): string {
  const lit = state.active.id === 6 && state.active.machine.outputEnabled;
  return `<span class="pixel-screen" role="img" aria-label="${displayStatus(state)}">${Array.from({ length: 128 }, (_, i) => {
    const x = i % 16, y = Math.floor(i / 16);
    const on = state.active.id === 7 || state.active.id === 8 ? Boolean(state.active.machine.cells[FB_BASE + i]) : lit && (x === 0 || x === 15 || y === 0 || y === 7 || (x + y) % 4 === 0);
    return `<span class="display-pixel${on ? " on" : ""}${state.active.id === 8 && state.active.machine.cells[FB_BASE + i] === 2 ? " auto" : ""}" aria-hidden="true"></span>`;
  }).join("")}</span>`;
}

export function renderDisplayReadout(state: AppState, hardwareOnly = false): string {
  if (state.active.id === 8) return hardwareOnly
    ? `<dl class="register-table"><div class="register-row"><dt>DISPLAY POWER</dt><dd>ON</dd></div><div class="register-row"><dt>READY</dt><dd>1</dd></div><div class="register-row"><dt>MODE</dt><dd>FRAMEBUFFER</dd></div><div class="register-row"><dt>OUTPUT</dt><dd>ON</dd></div><div class="register-row"><dt>SCAN WINDOW</dt><dd>0x00003000–0x0000307F</dd></div><div class="register-row"><dt>LAST FRAME</dt><dd>${state.active.machine.frameCount}</dd></div></dl><p class="inspection-note">The display scans the same 128 bytes continuously, even when the CPU is busy. CPU shows why the application stopped changing those bytes.</p>`
    : renderMovingReadout(state);
  if (state.active.id === 7) return renderFramebufferTrace(state);
  if (state.active.id !== 6) return "";
  const m = state.active.machine;
  return `<dl class="register-table"><div class="register-row"><dt>DISPLAY POWER</dt><dd>${m.powered ? "ON" : "OFF"}</dd></div><div class="register-row"><dt>READY</dt><dd>${m.ready ? "1" : "0"}</dd></div><div class="register-row"><dt>MODE</dt><dd>${m.mode === "NONE" ? "NOT SET" : m.mode}</dd></div><div class="register-row"><dt>OUTPUT</dt><dd>${m.outputEnabled ? "ON" : "OFF"}</dd></div><div class="register-row"><dt>MAIN STEP</dt><dd>${m.waiting ? "WAIT READY" : "CPU WAIT"}</dd></div></dl><p class="inspection-note">The supplied button IRQ service starts before display setup, so A still controls the LED while main waits.</p><h4 class="eyebrow">ACTUAL STARTUP / INSTALLED PROGRAM</h4><pre class="display-log">${e(m.log.join("\n"))}</pre>`;
}

export function renderFramebufferTrace(state: AppState): string {
  if (state.active.id !== 7) return "";
  const m = state.active.machine;
  return `<dl class="register-table"><div class="register-row"><dt>REQUEST</dt><dd>(${m.x}, ${m.y})</dd></div><div class="register-row"><dt>ROW OFFSET</dt><dd>${m.y} × ${m.installedRowBytes} = ${m.y * m.installedRowBytes}</dd></div><div class="register-row"><dt>PIXEL OFFSET</dt><dd>+ ${m.x} = ${m.y * m.installedRowBytes + m.x} bytes</dd></div><div class="register-row"><dt>WRITE ADDRESS</dt><dd>${formatAddress(m.lastWrite.address)}</dd></div><div class="register-row"><dt>DISPLAY READS</dt><dd>${formatAddress(FB_BASE)}–${formatAddress(FB_BASE + DISPLAY_WIDTH * DISPLAY_HEIGHT - 1)}</dd></div><div class="register-row"><dt>ACTUAL PIXEL</dt><dd>${m.actualPixel ? `(${m.actualPixel.x}, ${m.actualPixel.y})` : "OUTSIDE DISPLAY"}</dd></div></dl><p class="inspection-note">The display scans 16 bytes per row. The address is in bytes; a successful RAM write can still miss the visible framebuffer.</p><p>VERIFIED ${m.observedTargets.length}/5: center (8, 4), top-left (0, 0), top-right (15, 0), bottom-left (0, 7), bottom-right (15, 7).</p>`;
}

export function renderCoordinateGrid(state: AppState): string {
  if (state.active.id !== 7) return "";
  const m = state.active.machine;
  return `<div class="coordinate-grid" role="group" aria-label="Test coordinates; outline requested, solid actual">${Array.from({ length: 128 }, (_, i) => {
    const x = i % DISPLAY_WIDTH, y = Math.floor(i / DISPLAY_WIDTH);
    const requested = m.x === x && m.y === y;
    const actual = m.actualPixel?.x === x && m.actualPixel.y === y;
    return `<button class="coordinate-cell${requested ? " requested" : ""}${actual ? " actual" : ""}" data-action="test-pixel" data-x="${x}" data-y="${y}" aria-label="Test (${x}, ${y})${requested ? ", requested" : ""}${actual ? ", actual pixel" : ""}" aria-pressed="${requested}"></button>`;
  }).join("")}</div>`;
}

export function renderMovingReadout(state: AppState): string {
  if (state.active.id !== 8) return "";
  const m = state.active.machine;
  return `<span class="eyebrow">CURRENT EXECUTION / LIVE</span><dl class="register-table"><div class="register-row"><dt>FRAME</dt><dd>${m.frameCount}</dd></div><div class="register-row"><dt>CPU AT</dt><dd>${e(m.cpuAt)}</dd></div><div class="register-row"><dt>CURRENT STEP</dt><dd>${e(m.currentStep)}</dd></div><div class="register-row"><dt>TIMER REQUEST</dt><dd>${m.pendingTimer ? "PENDING" : "CLEAR"}</dd></div><div class="register-row"><dt>BUTTON IRQ</dt><dd>${m.pendingIrq ? "PENDING" : "CLEAR"}</dd></div><div class="register-row"><dt>DIRECTION</dt><dd>${m.direction === 1 ? "RIGHT →" : "← LEFT"}</dd></div><div class="register-row"><dt>MARKER</dt><dd>(${m.markerX}, ${m.markerY})</dd></div></dl><p class="inspection-note">The display keeps showing its last frame while main is blocked. A short handler records input, acknowledges, and returns so main can process frames.</p><p>HOLD TEST ${Math.min(1000, m.heldProgressMs)}/1000 ms · D-PAD ${m.dpadHandled ? "HANDLED" : "TRY A MOVE"}</p><h4 class="eyebrow">RECENT EXECUTION / ACTUAL HISTORY</h4><pre class="display-log">${e(m.history.join("\n"))}</pre>`;
}
