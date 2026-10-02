import { currentChapter, type AppState } from "../app-state";
import { formatByte, parseByte, serialDisplay } from "../sim/uart";
import { formatAddress, formatWord, readStoreAddress, WATCHED_RAM_ADDRESS } from "../sim/memory";
import { TIMEBASE_RATES, parseTimebase, formatFrequency, formatInterval, timerTargetTicks, INITIAL_TIMEBASE_HZ } from "../sim/timer";
import { runProgram } from "../sim/input";
import { interruptProgramFromDraft, isInterruptSolution } from "../sim/interrupt";
import { chapter04 } from "../chapters/chapter-04";
import { escapeHtml as e } from "./html";
import { renderPocketHardware } from "./pocket";
import { displayStatus, renderDisplayReadout, renderCoordinateGrid } from "./display";

export function sourceStatus(state: AppState): string {
  if (state.active.id === 1) {
    const byte = parseByte(state.ui.draftByte);
    if (byte === null) return "Enter one hex byte: 0x00–0xFF.";
    return byte === state.active.machine.firmwareByte ? "Matches running firmware" : "Changed · Build & Flash to run";
  }
  if (state.active.id === 2) {
    const { address, error } = readStoreAddress(state.ui.draftStoreAddress);
    if (address === null) return error;
    return address === state.active.machine.installedAddress
      ? "Matches the installed program · RESET runs it again"
      : "Changed · Build & Flash installs and boots it";
  }
  if (state.active.id === 3) return parseTimebase(state.ui.draftTimebase) === state.active.machine.timebaseHz
    ? "Matches installed program timebase" : "Changed · Build & Flash to apply the program timebase";
  if (state.active.id === 4) {
    const program = currentChapter(state).computer.program!;
    const missing = program.blocks.filter((block) => !(state.ui.draftBlocks.body ?? []).includes(block.id)).length;
    if (missing) return `Add the ${missing} missing block${missing > 1 ? "s" : ""}.`;
    const pressed = runProgram(state.ui.draftBlocks.body ?? [], 1).led;
    const released = runProgram(state.ui.draftBlocks.body ?? [], 0).led;
    if (pressed === 1 && released === 0) return "Draft answers both states · Build & Flash to install";
    if (pressed === 0 && released === 1) return "This order is inverted. The LED follows the wrong branch.";
    if (pressed === 0) return "This order never turns the LED on. Read the button before you test it.";
    return "This order leaves the LED on. It needs the other branch too.";
  }
  if (state.active.id === 5) {
    if (!state.ui.draftInterrupts) return "Polling keeps reading while nothing happens · Switch to interrupts to repair it";
    const draft = interruptProgramFromDraft(state.ui.draftBlocks);
    if (!draft.setup.includes("enable")) return "No button IRQs are enabled. You can flash this draft to observe it.";
    if (!draft.wait.includes("wait")) return "Main never waits. The CPU will keep running between IRQs.";
    if (!draft.handler.includes("read")) return "The handler never reads the button. UPDATE uses an initial value of zero.";
    if (!draft.handler.includes("update")) return "The handler does not write the LED.";
    if (!draft.handler.includes("ack")) return "The IRQ stays pending without ACK. It will call the handler again.";
    if (!isInterruptSolution(draft)) return "Use the service order READ → UPDATE → ACK in the handler.";
    return "Draft enables IRQs and waits · Build & Flash, then press and release A";
  }
  if (state.active.id === 8) return "Draft event flow · Build & Flash, hold A for one second, and move with the D-pad";
  if (state.active.id === 7) return state.ui.draftRowBytes === state.active.machine.installedRowBytes ? "Matches installed ROW_BYTES · test a coordinate" : "Changed · Build & Flash applies ROW_BYTES";
  if (state.active.id === 6) return "Draft startup sequence · Build & Flash to observe what the device accepts";
  return "";
}

function renderProgram(state: AppState, editable: boolean): string {
  const inherited = state.active.id === 5 && !state.ui.draftInterrupts;
  const program = inherited ? chapter04.computer.program : currentChapter(state).computer.program;
  if (!program) return "";
  const placement = inherited ? { body: chapter04.computer.program!.solution } : state.ui.draftBlocks;
  const disabled = state.ui.buildPhase !== "idle";
  const line = (text: string, extra = "") => `<div class="source-line"><span class="line-number" aria-hidden="true"></span><code>${e(text)}</code>${extra}</div>`;
  const source = program.skeleton.map((entry) => {
    if (typeof entry === "string") return line(entry);
    const slot = program.slots.find((candidate) => candidate.id === entry.slot)!;
    const chosen = placement[slot.id] ?? [];
    if (!chosen.length) return line(`${slot.indent}/* ${slot.label} */`);
    return chosen.map((id) => {
      const block = program.blocks.find((candidate) => candidate.id === id)!;
      const remove = editable && !inherited
        ? `<button class="block-remove" data-action="block-remove" data-slot="${e(slot.id)}" data-block="${e(id)}" aria-label="Remove ${e(block.label ?? block.lines[0] ?? id)}"${disabled ? " disabled" : ""}>−</button>` : "";
      return block.lines.map((text, index) => line(slot.indent + text, index === 0 ? remove : "")).join("");
    }).join("");
  }).join("");
  const palette = !editable ? "" : inherited
    ? `<button class="button secondary interrupt-switch" data-action="switch-interrupts"${disabled ? " disabled" : ""}>SWITCH TO INTERRUPTS</button><p class="runtime-note">The installed polling program keeps running until Build & Flash.</p>`
    : `<div class="block-palette" role="group" aria-label="Available blocks">${program.slots.map((slot) => `<div class="block-slot"><span class="eyebrow">${e(slot.label)}</span>${slot.blocks.map((id) => {
      const block = program.blocks.find((candidate) => candidate.id === id)!;
      return `<button class="block-chip" data-action="block-add" data-slot="${e(slot.id)}" data-block="${e(id)}"${(placement[slot.id] ?? []).includes(id) || disabled ? " disabled" : ""}><code>${program.singleLocation && Object.entries(placement).some(([key, ids]) => key !== slot.id && ids.includes(id)) ? "MOVE HERE · " : ""}${e(block.label ?? block.lines[0] ?? id)}</code></button>`;
    }).join("")}</div>`).join("")}</div>`;
  const runtime = state.active.id === 8 && editable ? `<p class="runtime-note">Runtime snapshots input events and supplies a safe event_wait(): it sleeps only when no event is queued. Timer service requests arrive every 100 ms; this is an application frame rate, not the 1 GHz hardware timer frequency. A held handler blocks main; ACK clears the request but does not finish the handler.</p>` : state.active.id === 5 && state.ui.draftInterrupts && editable
    ? `<p class="runtime-note">Supplied runtime connects BUTTON → IRQ → CPU and saves/restores context. Enable covers press and release; wait stops polling; ACK clears the pending request. CSR, trap, APLIC, and IMSIC setup are supplied.</p>` : "";
  return `<div class="source-lines program-lines">${source}</div>${palette}${runtime}`;
}

// The station monitor and the PC editor show the same source; only the PC is editable.
export function renderSource(state: AppState, editable: boolean): string {
  const source = currentChapter(state).computer.source;
  if (!source) return "";
  const disabled = state.ui.buildPhase !== "idle" ? " disabled" : "";
  return `<div class="source-lines">${source.lines.map((line, index) => {
    const value = line.field === "byte" ? state.ui.draftByte
      : line.field === "store-address" ? state.ui.draftStoreAddress
      : line.field === "row-bytes" ? String(state.ui.draftRowBytes)
      : line.field === "target-ticks" ? String(timerTargetTicks(parseTimebase(state.ui.draftTimebase) ?? INITIAL_TIMEBASE_HZ))
      : "";
    const input = !line.field || !editable ? ""
      : line.field === "row-bytes" ? `<select id="row-bytes" aria-label="Row bytes"${disabled}>${[8, 16, 32].map((value) => `<option value="${value}"${value === state.ui.draftRowBytes ? " selected" : ""}>${value}</option>`).join("")}</select>`
      : `<input id="${line.field === "byte" ? "byte-value" : "store-address"}" class="byte-input${line.field === "store-address" ? " address-input" : ""}" type="text" value="${e(value)}" aria-label="${line.field === "byte" ? "Byte value" : "Store destination address"} in ${e(source.fileName)}" aria-describedby="editor-hint source-status" autocomplete="off" autocapitalize="off" spellcheck="false"${disabled}>`;
    const field = !line.field ? "" : input || `<span id="source-preview-${line.field}" class="byte-preview">${e(value)}</span>`;
    return `<div class="source-line"><span class="line-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><code>${e(line.before)}${field}<span class="code-comment">${e(line.after ?? "")}</span></code></div>`;
  }).join("")}</div>`;
}

function renderControls(state: AppState): string {
  if (state.active.id !== 3) return "";
  const disabled = state.ui.buildPhase !== "idle" ? " disabled" : "";
  return `<fieldset class="diagnostic-controls"${disabled}><legend>PROGRAM TIMEBASE</legend><label for="timebase-frequency">Ticks per second <select id="timebase-frequency">${TIMEBASE_RATES.map((rate) => `<option value="${rate}"${state.ui.draftTimebase === String(rate) ? " selected" : ""}>${formatFrequency(rate)}</option>`).join("")}</select></label><p>The program uses this value to calculate its one-second tick target. The hardware timer stays at 1 GHz. Build & Flash applies it.</p></fieldset>`;
}

export function stationSerialSummary(state: AppState): string {
  if (state.active.id === 0) return "—";
  if (state.active.id === 1) return `> ${serialDisplay(state.active.machine.terminalOutput)}`;
  if (state.active.id === 2) return `RAM ${formatAddress(WATCHED_RAM_ADDRESS)} · ${formatWord(state.active.machine.cells[WATCHED_RAM_ADDRESS] ?? 0)}`;
  if (state.active.id === 3) return state.active.machine.tickCount ? `tick ${state.active.machine.tickCount} / ${formatInterval(state.active.machine.observedIntervalMs)}` : "TIMER / waiting…";
  if (state.active.id === 5) return `${state.active.machine.cpuState} / ${state.active.machine.buttonReads.toLocaleString("en-US")} reads / ${state.active.machine.irqCount.toLocaleString("en-US")} IRQs`;
  if (state.active.id === 8) return `FRAME ${state.active.machine.frameCount} / ${state.active.machine.currentStep}`;
  if (state.active.id === 6 || state.active.id === 7) return `DISPLAY / ${displayStatus(state)}`;
  return state.active.machine.ledValue ? "LED on" : "LED off";
}

// The monitor on the station shows the same assembled program, without the palette.
export function renderEditor(state: AppState, editable: boolean): string {
  return currentChapter(state).computer.program
    ? renderProgram(state, editable)
    : renderSource(state, editable);
}

export function editorFileName(state: AppState): string {
  const computer = currentChapter(state).computer;
  return computer.program?.fileName ?? computer.source?.fileName ?? "";
}

function serialText(state: AppState): string {
  if (state.active.id === 0) return "";
  if (state.active.id === 1) return `> ${serialDisplay(state.active.machine.terminalOutput)}`;
  if (state.active.id === 4 || state.active.id === 5 || state.active.id === 6 || state.active.id === 7 || state.active.id === 8) return "";
  return state.active.machine.terminalOutput;
}

export function renderPc(state: AppState): string {
  const chapter = currentChapter(state);
  const fileName = editorFileName(state);
  if (state.active.id === 0 || !fileName) return `<section class="panel pc-welcome"><span class="eyebrow">RV DEVSTATION</span><h1>The development PC.</h1><p>The last project is still here. Start Episode 01 to open boot.S and listen to the Pocket.</p><button class="button primary" data-action="start">Start Episode 01 →</button></section>`;
  const serialNote = state.active.id === 1 ? "Last boot output"
    : state.active.id === 2 ? `Output of execution ${state.active.machine.executionCount} / the program may store instead of transmitting`
    : state.active.id === 3 ? "Live output / one line per timer tick"
    : "This program sends nothing over the wire";
  const busy = state.ui.buildPhase !== "idle";
  const phase = { idle: "BUILD & FLASH", building: "BUILDING…", flashing: "FLASHING…", booting: "RESETTING…" }[state.ui.buildPhase];
  return `<section class="devstation" aria-labelledby="pc-heading">
    <header class="devstation-header"><h2 id="pc-heading">RV DEVSTATION</h2><span>EP${String(chapter.id).padStart(2, "0")} / ${e(fileName)}</span></header>
    <div class="devstation-panels">
      <section class="editor-panel" aria-labelledby="editor-heading">
        <div class="panel-title"><h3 id="editor-heading">${e(fileName)}</h3><span>EDITOR</span></div>
        <p id="editor-hint" class="editor-hint">${e(chapter.computer.editorHint ?? "")}</p>
        ${renderEditor(state, true)}
        ${renderControls(state)}
        <p id="source-status" class="source-status">${e(sourceStatus(state))}</p>
      </section>
      ${state.active.id >= 6 ? `<section class="live-pocket-panel"><div class="panel-title"><h3>LIVE POCKET</h3><span>INSTALLED PROGRAM</span></div>${renderPocketHardware(state, true)}${state.active.id === 7 ? `<p class="grid-key">OUTLINE = REQUEST · SOLID = ACTUAL<br>Click a cell or use the D-pad / arrow keys.</p><div id="coordinate-tests">${renderCoordinateGrid(state)}</div>` : ""}<div id="display-live">${renderDisplayReadout(state)}</div></section>` : `<section class="serial-panel" aria-labelledby="serial-heading"><div class="panel-title"><h3 id="serial-heading">SERIAL</h3><span class="serial-connection"><span class="status-dot connected"></span>connected / 115200</span></div>
        <pre id="serial-output" class="serial-output${state.active.id === 1 ? "" : " multiline"}" aria-label="Received serial output">${e(serialText(state))}</pre>
        <span class="serial-note">${e(serialNote)}</span>
      </section>`}
    </div>
    <footer class="devstation-footer"><div class="pc-actions"><button id="build-flash" class="button primary" data-action="build-flash"${busy ? " disabled" : ""}>${phase}</button><button id="reset-target" class="button secondary" data-action="reset-target"${busy ? " disabled" : ""}>RESET</button><button class="text-button" data-action="view" data-view="datasheet" data-section="${chapter.computer.datasheetSection}">DATASHEET ↗</button><button class="text-button" data-action="view" data-view="station">STATION ↗</button></div><span class="eyebrow">EDIT → BUILD → FLASH → BOOT → OBSERVE</span></footer>
    <section class="build-panel" aria-labelledby="build-heading"><h3 id="build-heading" class="eyebrow">BUILD / FLASH</h3><pre id="build-log">${e(state.ui.buildLog.length ? state.ui.buildLog.join("\n") : "Ready. Build & Flash installs the edited settings and reboots the Pocket.")}</pre><span class="build-footnote">Local prototype simulation</span></section>
  </section>`;
}
