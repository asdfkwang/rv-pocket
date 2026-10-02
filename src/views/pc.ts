import { currentChapter, type AppState } from "../app-state";
import { formatByte, parseByte, serialDisplay } from "../sim/uart";
import { formatAddress, formatWord, readStoreAddress, WATCHED_RAM_ADDRESS } from "../sim/memory";
import { TIMEBASE_RATES, parseTimebase, formatFrequency, formatInterval, timerTargetTicks, INITIAL_TIMEBASE_HZ } from "../sim/timer";
import { runProgram } from "../sim/input";
import { runLoop } from "../sim/loop";
import { escapeHtml as e } from "./html";

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
    const missing = program.blocks.filter((block) => !state.ui.draftBlocks.includes(block.id)).length;
    if (missing) return `Add the ${missing} missing block${missing > 1 ? "s" : ""}.`;
    const pressed = runProgram(state.ui.draftBlocks, 1).led;
    const released = runProgram(state.ui.draftBlocks, 0).led;
    if (pressed === 1 && released === 0) return "Draft answers both states · Build & Flash to install";
    if (pressed === 0 && released === 1) return "This order is inverted. The LED follows the wrong branch.";
    if (pressed === 0) return "This order never turns the LED on. Read the button before you test it.";
    return "This order leaves the LED on. It needs the other branch too.";
  }
  if (state.active.id === 5) {
    const program = currentChapter(state).computer.program!;
    const missing = program.blocks.filter((block) => !state.ui.draftBlocks.includes(block.id)).length;
    if (missing) return `Add the ${missing} missing block${missing > 1 ? "s" : ""}.`;
    if (state.ui.draftBlocks[0] !== "wait") {
      return "The loop still reads the button on every pass. Open the cover on CPU and compare the two counts.";
    }
    return "Draft waits before reading · Build & Flash to install";
  }
  return "";
}

function renderProgram(state: AppState, editable: boolean): string {
  const program = currentChapter(state).computer.program;
  if (!program) return "";
  const chosen = state.ui.draftBlocks;
  const line = (text: string, extra = "") => `<div class="source-line"><span class="line-number" aria-hidden="true"></span><code>${e(text)}</code>${extra}</div>`;
  const body = program.blocks.map((block) => {
    if (!chosen.includes(block.id)) return "";
    const remove = editable
      ? `<button class="block-remove" data-action="block-remove" data-block="${e(block.id)}" aria-label="Remove ${e(block.lines[0] ?? block.id)}"${state.ui.buildPhase !== "idle" ? " disabled" : ""}>−</button>`
      : "";
    return line(block.lines.join("\n"), remove);
  }).join("");
  const slots = chosen.length
    ? body
    : line("        /* place the blocks here */");
  return `<div class="source-lines program-lines">${program.skeleton.slice(0, 3).map((text) => line(text)).join("")}${slots}${program.skeleton.slice(3).map((text) => line(text)).join("")}</div>
    ${editable ? `<div class="block-palette" role="group" aria-label="Available blocks">${program.blocks.map((block) => `<button class="block-chip" data-action="block-add" data-block="${e(block.id)}"${chosen.includes(block.id) || state.ui.buildPhase !== "idle" ? " disabled" : ""}><code>${e(block.lines[0] ?? block.id)}</code></button>`).join("")}</div>` : ""}`;
}

// The station monitor and the PC editor show the same source; only the PC lets the player type.
export function renderSource(state: AppState, editable: boolean): string {
  const source = currentChapter(state).computer.source;
  if (!source) return "";
  const disabled = state.ui.buildPhase !== "idle" ? " disabled" : "";
  return `<div class="source-lines">${source.lines.map((line, index) => {
    const value = line.field === "byte" ? state.ui.draftByte
      : line.field === "store-address" ? state.ui.draftStoreAddress
      : line.field === "target-ticks" ? String(timerTargetTicks(parseTimebase(state.ui.draftTimebase) ?? INITIAL_TIMEBASE_HZ))
      : "";
    const input = !line.field || !editable ? ""
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
  if (state.active.id === 5) return `${state.active.machine.loopPasses.toLocaleString("en-US")} passes / ${state.active.machine.buttonReads.toLocaleString("en-US")} reads`;
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
  if (state.active.id === 4 || state.active.id === 5) return "";
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
      <section class="serial-panel" aria-labelledby="serial-heading"><div class="panel-title"><h3 id="serial-heading">SERIAL</h3><span class="serial-connection"><span class="status-dot connected"></span>connected / 115200</span></div>
        <pre id="serial-output" class="serial-output${state.active.id === 1 ? "" : " multiline"}" aria-label="Received serial output">${e(serialText(state))}</pre>
        <span class="serial-note">${e(serialNote)}</span>
      </section>
    </div>
    <footer class="devstation-footer"><div class="pc-actions"><button id="build-flash" class="button primary" data-action="build-flash"${busy ? " disabled" : ""}>${phase}</button><button id="reset-target" class="button secondary" data-action="reset-target"${busy ? " disabled" : ""}>RESET</button><button class="text-button" data-action="view" data-view="datasheet" data-section="${chapter.computer.datasheetSection}">DATASHEET ↗</button><button class="text-button" data-action="view" data-view="station">STATION ↗</button></div><span class="eyebrow">EDIT → BUILD → FLASH → BOOT → OBSERVE</span></footer>
    <section class="build-panel" aria-labelledby="build-heading"><h3 id="build-heading" class="eyebrow">BUILD / FLASH</h3><pre id="build-log">${e(state.ui.buildLog.length ? state.ui.buildLog.join("\n") : "Ready. Build & Flash installs the edited settings and reboots the Pocket.")}</pre><span class="build-footnote">Local prototype simulation</span></section>
  </section>`;
}
