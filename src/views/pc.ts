import { currentChapter, type AppState } from "../app-state";
import { formatByte, parseByte, serialDisplay } from "../sim/uart";
import { formatAddress, readMemoryRange, RAM_START, RAM_END, WORKAREA_START, WORKAREA_END } from "../sim/memory";
import { CLOCK_RATES, parseClock, formatInterval, timerIntervalMs } from "../sim/timer";
import { escapeHtml as e } from "./html";

export function sourceStatus(state: AppState): string {
  if (state.active.id === 1) {
    const byte = parseByte(state.ui.draftByte);
    if (byte === null) return "Enter one hex byte: 0x00–0xFF.";
    return byte === state.active.machine.firmwareByte ? "Matches running firmware" : "Changed · Build & Flash to run";
  }
  if (state.active.id === 2) {
    const { range, error } = readMemoryRange(state.ui.draftRangeStart, state.ui.draftRangeEnd);
    if (!range) return error;
    return range.start === state.active.machine.installedStart && range.end === state.active.machine.installedEnd
      ? "Matches installed range · RUN tries the diagnostic again"
      : "RUN tries this range · Build & Flash installs it for RESET";
  }
  if (state.active.id === 3) return parseClock(state.ui.draftClock) === state.active.machine.clockMhz
    ? "Matches running clock source" : "Changed · Build & Flash to apply the clock source";
  return "";
}

export function renderSource(state: AppState, editable: boolean): string {
  const source = currentChapter(state).computer.source;
  if (!source) return "";
  return `<div class="source-lines">${source.lines.map((line, index) => {
    const value = line.field === "byte" ? state.ui.draftByte : line.field === "range-start" ? state.ui.draftRangeStart : state.ui.draftRangeEnd;
    const field = !line.field ? "" : editable && line.field === "byte"
      ? `<input id="byte-value" class="byte-input" type="text" value="${e(value)}" aria-label="Byte value in ${e(source.fileName)}" aria-describedby="editor-hint source-status" aria-invalid="${parseByte(value) === null}" autocomplete="off" autocapitalize="off" spellcheck="false"${state.ui.buildPhase !== "idle" ? " disabled" : ""}>`
      : `<span id="source-preview-${line.field}" class="byte-preview">${e(value)}</span>`;
    return `<div class="source-line"><span class="line-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><code>${e(line.before)}${field}<span class="code-comment">${e(line.after ?? "")}</span></code></div>`;
  }).join("")}</div>`;
}

function renderControls(state: AppState): string {
  const disabled = state.ui.buildPhase !== "idle" ? " disabled" : "";
  if (state.active.id === 2) return `<fieldset class="diagnostic-controls"${disabled}><legend>TEST RANGE</legend><label for="range-start">START <input id="range-start" type="text" value="${e(state.ui.draftRangeStart)}" aria-describedby="range-hint source-status" autocomplete="off" spellcheck="false"></label><label for="range-end">END <input id="range-end" type="text" value="${e(state.ui.draftRangeEnd)}" aria-describedby="range-hint source-status" autocomplete="off" spellcheck="false"></label><p id="range-hint">START is included. END is excluded.</p></fieldset>`;
  if (state.active.id === 3) return `<fieldset class="diagnostic-controls"${disabled}><legend>CLOCK SOURCE</legend><label for="clock-source">Counter clock <select id="clock-source">${CLOCK_RATES.map((clock) => `<option value="${clock}"${state.ui.draftClock === String(clock) ? " selected" : ""}>${clock} MHz</option>`).join("")}</select></label><p>The new source takes effect after Build & Flash.</p></fieldset>`;
  return "";
}

export function renderInspector(state: AppState): string {
  if (state.active.id === 2) {
    const { range } = readMemoryRange(state.ui.draftRangeStart, state.ui.draftRangeEnd);
    const regions = [
      { start: RAM_START, end: WORKAREA_START, label: "RAM", reserved: false },
      { start: WORKAREA_START, end: WORKAREA_END, label: "MEMTEST WORKAREA", reserved: true },
      { start: WORKAREA_END, end: RAM_END, label: "RAM", reserved: false },
    ];
    return `<section class="inspector-panel memory-inspector" aria-labelledby="memory-map-heading"><h3 id="memory-map-heading" class="eyebrow">MEMORY MAP</h3><div class="memory-map">${regions.map((region) => {
      const selected = range !== null && range.start < region.end && range.end > region.start;
      return `<span class="memory-address">${formatAddress(region.start)}</span><div class="memory-region${region.reserved ? " reserved" : ""}${selected ? " in-range" : ""}"><strong>${region.label}</strong>${region.reserved ? `<span>reserved · keep the test out</span>` : ""}</div>`;
    }).join("")}<span class="memory-address">${formatAddress(RAM_END)} / END</span></div><p class="map-legend">Highlighted blocks overlap the draft test range.</p><p class="map-evidence">Last run: ${state.active.machine.passed ? `PASS / ${state.active.machine.bytesChecked} bytes` : state.active.machine.errorAddresses.map((address) => `FAIL @ ${formatAddress(address)}`).join("<br>")}</p></section>`;
  }
  if (state.active.id === 3) {
    const machine = state.active.machine;
    return `<section class="inspector-panel timer-inspector" aria-labelledby="timer-heading"><h3 id="timer-heading" class="eyebrow">TIMER INSPECTOR</h3><dl><div><dt>Clock source</dt><dd>${machine.clockMhz} MHz</dd></div><div><dt>Counter rate</dt><dd>${machine.clockMhz} MHz</dd></div><div><dt>Target ticks</dt><dd>10,000,000</dd></div><div><dt>Configured delay</dt><dd>${formatInterval(timerIntervalMs(machine.clockMhz))}</dd></div><div><dt>Observed delay</dt><dd id="timer-observed">${formatInterval(machine.observedIntervalMs)}</dd></div><div><dt>Expected delay</dt><dd>1.000 s</dd></div><div><dt>Ticks received</dt><dd id="timer-count">${machine.tickCount}</dd></div></dl><p class="map-legend">Watch the serial ticks and Pocket's timer LED.</p></section>`;
  }
  return "";
}

export function stationSerialSummary(state: AppState): string {
  if (state.active.id === 0) return "—";
  if (state.active.id === 1) return `> ${serialDisplay(state.active.machine.terminalOutput)}`;
  if (state.active.id === 2) return state.active.machine.passed ? "MEMTEST / PASS" : `FAIL @ ${formatAddress(state.active.machine.errorAddresses[0]!)}`;
  return state.active.machine.tickCount ? `tick ${state.active.machine.tickCount} / ${formatInterval(state.active.machine.observedIntervalMs)}` : "TIMER / waiting…";
}

export function renderPc(state: AppState): string {
  const chapter = currentChapter(state);
  const source = chapter.computer.source;
  if (state.active.id === 0 || !source) return `<section class="panel pc-welcome"><span class="eyebrow">RV DEVSTATION</span><h1>The development PC.</h1><p>The last project is still here. Start Episode 01 to open boot.S and listen to the Pocket.</p><button class="button primary" data-action="start">Start Episode 01 →</button></section>`;
  const machine = state.active.machine;
  const busy = state.ui.buildPhase !== "idle";
  const phase = { idle: "BUILD & FLASH", building: "BUILDING…", flashing: "FLASHING…", booting: "RESETTING…" }[state.ui.buildPhase];
  return `<section class="devstation" aria-labelledby="pc-heading">
    <header class="devstation-header"><h2 id="pc-heading">RV DEVSTATION</h2><span>EP${String(chapter.id).padStart(2, "0")} / ${e(source.fileName)}</span></header>
    <div class="devstation-panels">
      <section class="editor-panel" aria-labelledby="editor-heading">
        <div class="panel-title"><h3 id="editor-heading">${e(source.fileName)}</h3><span>EDITOR</span></div>
        <p id="editor-hint" class="editor-hint">${e(chapter.computer.editorHint ?? "")}</p>
        ${renderSource(state, true)}
        ${renderControls(state)}
        <p id="source-status" class="source-status">${e(sourceStatus(state))}</p>
      </section>
      <div class="pc-observation">
        <section class="serial-panel" aria-labelledby="serial-heading"><div class="panel-title"><h3 id="serial-heading">SERIAL</h3><span class="serial-connection"><span class="status-dot connected"></span>connected / 115200</span></div>
          <pre id="serial-output" class="serial-output${state.active.id > 1 ? " multiline" : ""}" aria-label="Received serial output">${state.active.id === 1 ? `<span aria-hidden="true">&gt; </span>${e(serialDisplay(machine.terminalOutput))}` : e(machine.terminalOutput)}</pre>
          <span class="serial-note">${state.active.id === 1 ? "Last boot output" : state.active.id === 2 ? `Run ${state.active.machine.runCount} / development diagnostic` : "Live output / one line per timer tick"}</span>
        </section>
        <div id="episode-inspector">${renderInspector(state)}</div>
        <section class="target-panel" aria-labelledby="target-heading"><h3 id="target-heading" class="eyebrow">TARGET / RV POCKET</h3><dl><div><dt>UART</dt><dd>connected</dd></div>${state.active.id === 1 ? `<div><dt>Running byte</dt><dd>${formatByte(state.active.machine.firmwareByte)}</dd></div>` : state.active.id === 2 ? `<div><dt>Installed range</dt><dd>${formatAddress(state.active.machine.installedStart)}–${formatAddress(state.active.machine.installedEnd)}</dd></div>` : ""}<div><dt>Last flash</dt><dd>${machine.flashCount ? "OK" : "inherited firmware"}</dd></div><div><dt>TX</dt><dd><span class="status-dot uart-tx-light${state.ui.txActive ? " tx-pulse" : ""}"></span><span id="tx-status">${state.ui.txActive ? "transmitting" : "idle"}</span></dd></div></dl></section>
      </div>
    </div>
    <footer class="devstation-footer"><div class="pc-actions">${state.active.id === 2 ? `<button id="run-memory" class="button primary" data-action="run-memory"${busy ? " disabled" : ""}>RUN</button>` : ""}<button id="build-flash" class="button${state.active.id === 2 ? " secondary" : " primary"}" data-action="build-flash"${busy ? " disabled" : ""}>${phase}</button><button id="reset-target" class="button secondary" data-action="reset-target"${busy ? " disabled" : ""}>RESET</button><button class="text-button" data-action="view" data-view="datasheet" data-section="${chapter.computer.datasheetSection}">DATASHEET ↗</button></div><span class="eyebrow">EDIT → BUILD → FLASH → BOOT → OBSERVE</span></footer>
    <section class="build-panel" aria-labelledby="build-heading"><h3 id="build-heading" class="eyebrow">BUILD / FLASH</h3><pre id="build-log">${e(state.ui.buildLog.length ? state.ui.buildLog.join("\n") : "Ready. Build & Flash installs the edited settings and reboots the Pocket.")}</pre><span class="build-footnote">Local prototype simulation</span></section>
  </section>`;
}
