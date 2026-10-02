import { currentChapter, type AppState } from "../app-state";
import { formatByte, parseByte, serialDisplay } from "../sim/uart";
import { formatAddress, formatWord, readStoreAddress, WATCHED_RAM_ADDRESS } from "../sim/memory";
import { TIMEBASE_RATES, parseTimebase, formatFrequency, formatInterval, timerTargetTicks, INITIAL_TIMEBASE_HZ } from "../sim/timer";
import { runProgram } from "../sim/input";
import { interruptProgramFromDraft, isInterruptSolution } from "../sim/interrupt";
import { chapter04 } from "../chapters/chapter-04";
import { chapterEditorHint } from "../chapters/locale";
import { escapeHtml as e } from "./html";
import { renderPocketHardware } from "./pocket";
import { displayStatus, renderDisplayReadout, renderCoordinateGrid } from "./display";
import { UI, ui } from "../ui-locale";
import { t } from "../i18n";

export function sourceStatus(state: AppState): string {
  if (state.active.id === 1) {
    const byte = parseByte(state.ui.draftByte);
    if (byte === null) return ui(UI.statusByteInvalid);
    return byte === state.active.machine.firmwareByte ? ui(UI.statusByteSame) : ui(UI.statusByteChanged);
  }
  if (state.active.id === 2) {
    const { address, error } = readStoreAddress(state.ui.draftStoreAddress);
    if (address === null) return error;
    return address === state.active.machine.installedAddress ? ui(UI.statusStoreSame) : ui(UI.statusStoreChanged);
  }
  if (state.active.id === 3) return parseTimebase(state.ui.draftTimebase) === state.active.machine.timebaseHz
    ? ui(UI.statusTimebaseSame) : ui(UI.statusTimebaseChanged);
  if (state.active.id === 4) {
    const program = currentChapter(state).computer.program!;
    const missing = program.blocks.filter((block) => !(state.ui.draftBlocks.body ?? []).includes(block.id)).length;
    if (missing) return ui(UI.statusBlocksMissing).replace("{n}", String(missing)).replace("{s}", missing > 1 ? "s" : "");
    const pressed = runProgram(state.ui.draftBlocks.body ?? [], 1).led;
    const released = runProgram(state.ui.draftBlocks.body ?? [], 0).led;
    if (pressed === 1 && released === 0) return ui(UI.statusBlocksBoth);
    if (pressed === 0 && released === 1) return ui(UI.statusBlocksInverted);
    if (pressed === 0) return ui(UI.statusBlocksNeverOn);
    return ui(UI.statusBlocksStuckOn);
  }
  if (state.active.id === 5) {
    if (!state.ui.draftInterrupts) return ui(UI.statusStillPolling);
    const draft = interruptProgramFromDraft(state.ui.draftBlocks);
    if (!draft.setup.includes("enable")) return ui(UI.statusIrqNone);
    if (!draft.wait.includes("wait")) return ui(UI.statusIrqNoWait);
    if (!draft.handler.includes("read")) return ui(UI.statusIrqNoRead);
    if (!draft.handler.includes("update")) return ui(UI.statusIrqNoUpdate);
    if (!draft.handler.includes("ack")) return ui(UI.statusIrqNoAck);
    if (!isInterruptSolution(draft)) return ui(UI.statusIrqOrder);
    return ui(UI.statusIrqReady);
  }
  if (state.active.id === 8) return ui(UI.statusEvents);
  if (state.active.id === 7) return state.ui.draftRowBytes === state.active.machine.installedRowBytes ? ui(UI.statusRowBytesSame) : ui(UI.statusRowBytesChanged);
  if (state.active.id === 6) return ui(UI.statusDisplayDraft);
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
    ? `<button class="button secondary interrupt-switch" data-action="switch-interrupts"${disabled ? " disabled" : ""}>${e(ui(UI.switchToInterrupts))}</button><p class="runtime-note">${e(ui(UI.runtimePolling))}</p>`
    : `<div class="block-palette" role="group" aria-label="Available blocks">${program.slots.map((slot) => `<div class="block-slot"><span class="eyebrow">${e(slot.label)}</span>${slot.blocks.map((id) => {
      const block = program.blocks.find((candidate) => candidate.id === id)!;
      return `<button class="block-chip" data-action="block-add" data-slot="${e(slot.id)}" data-block="${e(id)}"${(placement[slot.id] ?? []).includes(id) || disabled ? " disabled" : ""}><code>${program.singleLocation && Object.entries(placement).some(([key, ids]) => key !== slot.id && ids.includes(id)) ? "MOVE HERE · " : ""}${e(block.label ?? block.lines[0] ?? id)}</code></button>`;
    }).join("")}</div>`).join("")}</div>`;
  const runtime = state.active.id === 8 && editable ? `<p class="runtime-note">${e(ui(UI.runtimeEvents))}</p>` : state.active.id === 5 && state.ui.draftInterrupts && editable
    ? `<p class="runtime-note">${e(ui(UI.runtimeInterrupts))}</p>` : "";
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
  return `<fieldset class="diagnostic-controls"${disabled}><legend>${e(ui(UI.timebaseLegend))}</legend><label for="timebase-frequency">${e(ui(UI.timebaseLabel))} <select id="timebase-frequency">${TIMEBASE_RATES.map((rate) => `<option value="${rate}"${state.ui.draftTimebase === String(rate) ? " selected" : ""}>${formatFrequency(rate)}</option>`).join("")}</select></label><p>${e(ui(UI.timebaseNote))}</p></fieldset>`;
}

export function stationSerialSummary(state: AppState): string {
  if (state.active.id === 0) return "—";
  if (state.active.id === 1) return `> ${serialDisplay(state.active.machine.terminalOutput)}`;
  if (state.active.id === 2) return `RAM ${formatAddress(WATCHED_RAM_ADDRESS)} · ${formatWord(state.active.machine.cells[WATCHED_RAM_ADDRESS] ?? 0)}`;
  if (state.active.id === 3) return state.active.machine.tickCount ? `tick ${state.active.machine.tickCount} / ${formatInterval(state.active.machine.observedIntervalMs)}` : "TIMER / waiting…";
  if (state.active.id === 5) return `${state.active.machine.cpuState} / ${state.active.machine.buttonReads.toLocaleString("en-US")} reads / ${state.active.machine.irqCount.toLocaleString("en-US")} IRQs`;
  if (state.active.id === 8) return `FRAME ${state.active.machine.frameCount} / ${state.active.machine.currentStep}`;
  if (state.active.id === 6 || state.active.id === 7) return `DISPLAY / ${displayStatus(state)}`;
  return state.active.machine.ledValue ? ui(UI.ledOn) : ui(UI.ledOff);
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
  if (state.active.id === 0 || !fileName) return `<section class="panel pc-welcome"><span class="eyebrow">RV DEVSTATION</span><h1>${e(ui(UI.editorWelcomeTitle))}</h1><p>${e(ui(UI.editorWelcomeBody))}</p><button class="button primary" data-action="start">${e(t("startEpisode01"))} →</button></section>`;
  const serialNote = state.active.id === 1 ? ui(UI.serialNoteBoot)
    : state.active.id === 2 ? ui(UI.serialNoteStore).replace("{n}", String(state.active.machine.executionCount))
    : state.active.id === 3 ? ui(UI.serialNoteTimer)
    : ui(UI.serialNoteQuiet);
  const busy = state.ui.buildPhase !== "idle";
  const phase = ui({ idle: UI.buildIdle, building: UI.buildBuilding, flashing: UI.buildFlashing, booting: UI.buildBooting }[state.ui.buildPhase]);
  return `<section class="devstation" aria-labelledby="pc-heading">
    <header class="devstation-header"><h2 id="pc-heading">RV DEVSTATION</h2><span>EP${String(chapter.id).padStart(2, "0")} / ${e(fileName)}</span></header>
    <div class="devstation-panels">
      <section class="editor-panel" aria-labelledby="editor-heading">
        <div class="panel-title"><h3 id="editor-heading">${e(fileName)}</h3><span>${e(ui(UI.editorPanel))}</span></div>
        <p id="editor-hint" class="editor-hint">${e(chapterEditorHint(chapter))}</p>
        ${renderEditor(state, true)}
        ${renderControls(state)}
        <p id="source-status" class="source-status">${e(sourceStatus(state))}</p>
      </section>
      ${state.active.id >= 6 ? `<section class="live-pocket-panel"><div class="panel-title"><h3>${e(ui(UI.livePocket))}</h3><span>${e(ui(UI.installedProgram))}</span></div>${renderPocketHardware(state, true)}${state.active.id === 7 ? `<p class="grid-key">${e(ui(UI.gridKey))}</p><div id="coordinate-tests">${renderCoordinateGrid(state)}</div>` : ""}<div id="display-live">${renderDisplayReadout(state)}</div></section>` : `<section class="serial-panel" aria-labelledby="serial-heading"><div class="panel-title"><h3 id="serial-heading">SERIAL</h3><span class="serial-connection"><span class="status-dot connected"></span>${e(ui(UI.serialConnected))}</span></div>
        <pre id="serial-output" class="serial-output${state.active.id === 1 ? "" : " multiline"}" aria-label="Received serial output">${e(serialText(state))}</pre>
        <span class="serial-note">${e(serialNote)}</span>
      </section>`}
    </div>
    <footer class="devstation-footer"><div class="pc-actions"><button id="build-flash" class="button primary" data-action="build-flash"${busy ? " disabled" : ""}>${phase}</button><button id="reset-target" class="button secondary" data-action="reset-target"${busy ? " disabled" : ""}>RESET</button><button class="text-button" data-action="view" data-view="datasheet" data-section="${chapter.computer.datasheetSection}">DATASHEET ↗</button><button class="text-button" data-action="view" data-view="station">STATION ↗</button></div><span class="eyebrow">EDIT → BUILD → FLASH → BOOT → OBSERVE</span></footer>
    <section class="build-panel" aria-labelledby="build-heading"><h3 id="build-heading" class="eyebrow">${e(ui(UI.buildLogHeading))}</h3><pre id="build-log">${e(state.ui.buildLog.length ? state.ui.buildLog.join("\n") : ui(UI.buildLogIdle))}</pre><span class="build-footnote">${e(ui(UI.buildFootnote))}</span></section>
  </section>`;
}
