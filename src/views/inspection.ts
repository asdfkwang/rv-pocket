import { currentChapter, type AppState } from "../app-state";
import { formatAddress, formatWord, WATCHED_RAM_ADDRESS } from "../sim/memory";
import { mtimeCounter, timerTargetTicks } from "../sim/timer";
import { BUTTON_ADDRESS, LED_ADDRESS, MTIME_ADDRESS } from "../platform";
import { escapeHtml as e } from "./html";
import type { InterruptMissionState } from "../sim/interrupt";
import { FB_BASE, DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../sim/framebuffer";
import { renderDisplayReadout, renderMovingReadout } from "./display";
import { UI, ui, fill } from "../ui-locale";

// A row is one 32-bit word. Addresses step by four because the store is a word store,
// and a word in memory holds its lowest byte at the lowest address (little-endian).
interface WordRow { address: number; label: string; note?: string; id?: string }

function ramRows(state: AppState): (WordRow | "gap")[] {
  const rows: (WordRow | "gap")[] = [
    { address: 0x00000000, label: "" },
    { address: 0x00000004, label: "" },
    "gap",
    { address: WATCHED_RAM_ADDRESS, label: "target", note: "expected destination" },
    "gap",
  ];
  if (state.active.id === 3) rows.push({ address: MTIME_ADDRESS, label: "mtime", note: "timer counter", id: "mtime-counter" });
  if (state.active.id === 4 || state.active.id === 5 || state.active.id === 6) {
    rows.push({ address: BUTTON_ADDRESS, label: "button", note: "read by the program", id: "button-value" });
    rows.push({ address: LED_ADDRESS, label: "led", note: "written by the program", id: "led-value" });
  }
  // A store outside the listed words appears here, so a wrong destination is never silent.
  if (state.active.id === 2) {
    const stored = state.active.machine.lastStore?.address;
    if (stored !== undefined && !rows.some((row) => row !== "gap" && row.address === stored)) {
      rows.push({ address: stored, label: "program", note: "last store landed here" });
    }
  }
  return rows;
}

function ramValue(state: AppState, address: number): number {
  if (state.active.id === 2) return state.active.machine.cells[address] ?? 0;
  if (state.active.id === 3) return address === MTIME_ADDRESS ? mtimeCounter(state.active.machine, performance.now()) : 0;
  if (state.active.id === 4 || state.active.id === 5 || state.active.id === 6) {
    if (address === BUTTON_ADDRESS) return state.active.machine.buttonValue;
    if (address === LED_ADDRESS) return state.active.machine.ledValue;
  }
  return 0;
}

function renderRamModule(state: AppState): string {
  if ((state.active.id === 7 || state.active.id === 8)) return `<div id="framebuffer-live">${renderFramebufferRam(state)}</div>`;
  return `<dl class="word-table">${ramRows(state).map((row) => row === "gap"
    ? `<div class="word-gap" aria-hidden="true">⋮</div>`
    : `<div class="word-row${row.label ? ` ${row.label}` : ""}"><dt>${e(formatAddress(row.address))}</dt><dd${row.id ? ` id="${row.id}"` : ""}>${e(formatWord(ramValue(state, row.address)))}</dd>${row.note ? `<span class="word-note">${e(row.note)}</span>` : ""}</div>`,
  ).join("")}</dl>`;
}

function renderTimerCpu(state: AppState): string {
  if (state.active.id !== 3) return "";
  const machine = state.active.machine;
  const rows: [string, number, string?][] = [
    ["x0", 0, "zero, hardwired"],
    ["x1", 0, "ra"],
    ["x5", MTIME_ADDRESS, "t0 / MTIME"],
    ["x6", timerTargetTicks(machine.timebaseHz), "t1 / ticks to wait"],
    ["x7", 0, "t2"],
  ];
  return `<dl class="register-table">${rows.map(([name, value, note]) =>
    `<div class="register-row"><dt>${e(name)}</dt><dd>${e(formatAddress(value))}</dd>${note ? `<span class="register-note">${e(note)}</span>` : ""}</div>`,
  ).join("")}</dl><p class="inspection-note">${e(ui(UI.coverTimerNote))}</p>`;
}

export function interruptCpuNote(machine: InterruptMissionState): string {
  if (machine.installedProgram.kind === "polling") return ui(UI.cpuNotePolling);
  if (machine.pendingIrq) return ui(UI.cpuNotePending);
  if (machine.cpuState === "RUNNING") return ui(UI.cpuNoWait);
  return ui(UI.cpuNoteGood);
}

export function irqReplayStep(state: AppState): number {
  if (state.active.id !== 5 || !state.active.machine.lastEvent) return -1;
  const length = state.active.machine.lastEvent.steps.length;
  return Math.min(length - 1, Math.floor(state.ui.irqReplayElapsedMs * length / 1_000));
}

export function renderIrqReplay(state: AppState): string {
  if (state.active.id !== 5) return "";
  const event = state.active.machine.lastEvent;
  if (!event) return `<p class="inspection-note">${e(ui(UI.coverNoEvent))}</p>`;
  const current = irqReplayStep(state);
  const headline = fill(UI.coverReplayFmt, {
    what: ui(event.buttonValue ? UI.coverPress : UI.coverRelease),
    reads: event.buttonReads.toLocaleString("en-US"),
    irqs: event.irqCount.toLocaleString("en-US"),
  });
  return `<p class="inspection-note">${e(headline)}</p><ol class="irq-trace">${event.steps.map((step, index) => `<li class="irq-trace-step${index === current ? " active" : ""}${index <= current ? " reached" : ""}" data-step="${index}"${index === current ? ' aria-current="step"' : ""}>${e(step)}</li>`).join("")}</ol>`;
}

function renderInterruptCpu(state: AppState): string {
  if (state.active.id !== 5) return "";
  const machine = state.active.machine;
  return `<span class="eyebrow">${e(ui(UI.coverCurrentState))}</span><dl class="register-table">
    <div class="register-row"><dt>${e(ui(UI.coverButtonReads))}</dt><dd id="button-reads">${machine.buttonReads.toLocaleString("en-US")}</dd></div>
    <div class="register-row"><dt>${e(ui(UI.coverIrqCount))}</dt><dd id="irq-count">${machine.irqCount.toLocaleString("en-US")}</dd></div>
    <div class="register-row"><dt>${e(ui(UI.coverCpuState))}</dt><dd id="cpu-state">${machine.cpuState}</dd></div>
    <div class="register-row"><dt>LED</dt><dd id="cpu-led">${machine.ledValue ? ui(UI.on) : ui(UI.off)}</dd></div>
  </dl><p id="interrupt-cpu-note" class="inspection-note">${e(interruptCpuNote(machine))}</p>
  <section class="irq-replay-panel" aria-labelledby="irq-replay-heading"><h4 id="irq-replay-heading" class="eyebrow">${e(ui(UI.coverLastEvent))}</h4><p class="inspection-note">${e(ui(UI.coverReplayNote))}</p><div id="irq-replay">${renderIrqReplay(state)}</div></section>`;
}

function renderCpuModule(state: AppState): string {
  return state.active.id === 8 ? `<div id="display-live">${renderMovingReadout(state)}</div>` : state.active.id === 3 ? renderTimerCpu(state) : renderInterruptCpu(state);
}

// The cover is an observation aid. It is never a completion gate, so an episode
// that declares no cover has no button at all.
export function renderCoverToggle(state: AppState): string {
  if (!currentChapter(state).cover) return "";
  const open = state.ui.coverOpen;
  return `<button id="toggle-cover" class="cover-toggle${open ? " open" : ""}" data-action="toggle-cover" aria-expanded="${open}" aria-controls="inspection-panel">${e(ui(open ? UI.coverCloseLabel : UI.coverOpenLabel))} <span aria-hidden="true">${open ? "▼" : "▲"}</span></button>`;
}

export function renderInspectionPanel(state: AppState): string {
  const cover = currentChapter(state).cover;
  if (!cover || !state.ui.coverOpen) return "";
  const selected = cover.modules.includes(state.ui.coverModule) ? state.ui.coverModule : cover.selected;
  return `<section class="inspection-panel" id="inspection-panel" aria-labelledby="inspection-heading" tabindex="-1">
    <header class="inspection-header"><h3 id="inspection-heading" class="eyebrow">${e(ui(UI.coverHeading))}</h3><nav class="module-tabs" aria-label="${e(ui(UI.coverModulesAria))}">${cover.modules.map((module) => `<button class="module-tab${module === selected ? " active" : ""}" data-action="cover-module" data-module="${module}" aria-pressed="${module === selected}">${module.toUpperCase()}</button>`).join("")}</nav></header>
    ${selected === "display" ? `<div id="display-live" data-readout="hardware">${renderDisplayReadout(state, true)}</div>` : selected === "cpu" ? renderCpuModule(state) : renderRamModule(state)}
  </section>`;
}

export function renderFramebufferRam(state: AppState): string {
  if (state.active.id !== 7 && state.active.id !== 8) return "";
  const m = state.active.machine;
  const lastAddress = state.active.id === 7 ? state.active.machine.lastWrite.address : null;
  const outside = Object.entries(m.cells).filter(([address, value]) => Number(address) >= FB_BASE + 128 && value !== 0);
  const note = fill(UI.framebufferNote, { what: ui(state.active.id === 7 ? UI.framebufferOutline : UI.framebufferLit) });
  return `<p class="inspection-note">${e(note)}</p><div class="framebuffer-rows">${Array.from({ length: DISPLAY_HEIGHT }, (_, y) => `<div class="framebuffer-row">${formatAddress(FB_BASE + y * DISPLAY_WIDTH)} ${Array.from({ length: DISPLAY_WIDTH }, (_, x) => {
    const address = FB_BASE + y * DISPLAY_WIDTH + x;
    return `<span class="framebuffer-byte${m.cells[address] ? " on" : ""}${address === lastAddress ? " last" : ""}"${address === lastAddress ? ' title="Last write"' : ""}>${(m.cells[address] ?? 0).toString(16).padStart(2, "0")}</span>`;
  }).join("")}</div>`).join("")}</div>${outside.length ? `<h4 class="eyebrow">WRITES OUTSIDE DISPLAY</h4><pre class="display-log">${outside.map(([address, value]) => `${formatAddress(Number(address))}  ${value.toString(16).padStart(2, "0")}${Number(address) === lastAddress ? " ← LAST WRITE" : ""}`).join("\n")}</pre>` : ""}`;
}
