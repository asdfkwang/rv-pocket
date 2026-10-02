import { currentChapter, type AppState } from "../app-state";
import { formatAddress, formatWord, WATCHED_RAM_ADDRESS } from "../sim/memory";
import { mtimeCounter, timerTargetTicks } from "../sim/timer";
import { BUTTON_ADDRESS, LED_ADDRESS, MTIME_ADDRESS } from "../platform";
import { escapeHtml as e } from "./html";

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
  if (state.active.id === 4 || state.active.id === 5) {
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
  if (state.active.id === 4 || state.active.id === 5) {
    if (address === BUTTON_ADDRESS) return state.active.machine.buttonValue;
    if (address === LED_ADDRESS) return state.active.machine.ledValue;
  }
  return 0;
}

function renderRamModule(state: AppState): string {
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
  ).join("")}</dl><p class="inspection-note">The program is still inside its wait loop, comparing MTIME against x6. x6 is the tick count the program asked for; MTIME is the count the hardware has actually produced.</p>`;
}

// Episode 05 has no interrupts yet, so the CPU counters are how the cost of polling
// becomes visible. Loop passes and reads climb together while the machine is idle.
function renderLoopCpu(state: AppState): string {
  if (state.active.id !== 5) return "";
  const machine = state.active.machine;
  return `<dl class="register-table">
    <div class="register-row"><dt>loop passes</dt><dd id="loop-passes">${machine.loopPasses.toLocaleString("en-US")}</dd><span class="register-note">the loop is running</span></div>
    <div class="register-row"><dt>button reads</dt><dd id="button-reads">${machine.buttonReads.toLocaleString("en-US")}</dd><span class="register-note">what that cost</span></div>
    <div class="register-row"><dt>heartbeat</dt><dd id="loop-heartbeat">${machine.heartbeat.toLocaleString("en-US")}</dd><span class="register-note">the second job</span></div>
  </dl><p class="inspection-note">The loop has been turning the whole time. A read is what makes a pass cost something, so the read count is the CPU. Nothing has pressed the button.</p>`;
}

function renderCpuModule(state: AppState): string {
  return state.active.id === 3 ? renderTimerCpu(state) : renderLoopCpu(state);
}

// The cover is an observation aid. It is never a completion gate, so an episode
// that declares no cover has no button at all.
export function renderCoverToggle(state: AppState): string {
  if (!currentChapter(state).cover) return "";
  const open = state.ui.coverOpen;
  return `<button id="toggle-cover" class="cover-toggle${open ? " open" : ""}" data-action="toggle-cover" aria-expanded="${open}" aria-controls="inspection-panel">${open ? "CLOSE COVER" : "OPEN COVER"} <span aria-hidden="true">${open ? "▼" : "▲"}</span></button>`;
}

export function renderInspectionPanel(state: AppState): string {
  const cover = currentChapter(state).cover;
  if (!cover || !state.ui.coverOpen) return "";
  const selected = cover.modules.includes(state.ui.coverModule) ? state.ui.coverModule : cover.selected;
  return `<section class="inspection-panel" id="inspection-panel" aria-labelledby="inspection-heading" tabindex="-1">
    <header class="inspection-header"><h3 id="inspection-heading" class="eyebrow">RV POCKET / OPEN COVER</h3><nav class="module-tabs" aria-label="Hardware modules">${cover.modules.map((module) => `<button class="module-tab${module === selected ? " active" : ""}" data-action="cover-module" data-module="${module}" aria-pressed="${module === selected}">${module.toUpperCase()}</button>`).join("")}</nav></header>
    ${selected === "cpu" ? renderCpuModule(state) : renderRamModule(state)}
  </section>`;
}
