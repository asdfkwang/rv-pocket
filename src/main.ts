import { viewLabel, chapters, createAppState, currentChapter, missionComplete, navigate, parseRoute, resetMission, routeHash, switchToInterruptDraft, views, type ChapterId, type View } from "./app-state";
import { getLang, t, toggleLang } from "./i18n";
import { chapterMission, chapterTitle } from "./chapters/locale";
import { renderStation } from "./views/station";
import { renderPc, sourceStatus, stationSerialSummary, editorFileName } from "./views/pc";
import { renderPocket } from "./views/pocket";
import { flashFirmware, formatByte, parseByte, rebootTarget, serialDisplay } from "./sim/uart";
import { flashMemoryFirmware, formatAddress, formatWord, readStoreAddress, rebootMemoryTarget, WATCHED_RAM_ADDRESS } from "./sim/memory";
import { flashTimerFirmware, formatFrequency, formatInterval, mtimeCounter, parseTimebase, rebootTimerTarget, recordTimerTick, timerIntervalMs, timerTargetTicks } from "./sim/timer";
import { flashInputProgram, pollInput } from "./sim/input";
import { flashInterruptProgram, INTERRUPT_TICK_MS, interruptProgramFromDraft, rebootInterruptTarget, setInterruptButton, tickInterrupt } from "./sim/interrupt";
import { interruptCpuNote, irqReplayStep, renderIrqReplay } from "./views/inspection";
import { renderMissionStatus, renderSuccess } from "./views/mission";
import { renderDatasheet } from "./views/datasheet";
import { DATASHEET_SECTIONS } from "./datasheet-content";
import { confirmCheck, getBookmarks, getCheckSelection, getCurrentCheck, getCheckTotal, getEbookSlug, getEbookTitle, harderPrompt, isCheckCorrect, openEbookChapter, renderBook, renderEbookToc, setEbookQuery, stepCheck, toggleCheckChoice } from "./views/book";
import { escapeHtml as e } from "./views/html";

import { flashMovingProgram, movingProgramFromDraft, moveMovingMarker, rebootMovingTarget, setMovingButton, tickMoving } from "./sim/moving";
import { editProgramBlock } from "./chapters/types";
import { flashFramebufferProgram, moveFramebufferMarker, rebootFramebufferTarget, ROW_BYTES_CHOICES, setFramebufferPosition, type RowBytes } from "./sim/framebuffer";
import { renderFramebufferRam } from "./views/inspection";
import { flashDisplayProgram, rebootDisplayTarget, setDisplayButton, tickDisplay } from "./sim/display";
import { displayStatus, renderDisplayReadout, renderDisplayScreen } from "./views/display";

const app = document.querySelector<HTMLDivElement>("#app")!;
const announcement = document.querySelector<HTMLParagraphElement>("#announcement")!;
function tourSteps() {
  return [
    { target: "chapter-select", title: t("tourEpisodesTitle"), body: t("tourEpisodesBody") },
    { target: "open-datasheet", title: "DATASHEET", body: "Look up the Pocket's addresses and device registers here." },
    { target: "open-book", title: "BOOK", body: "Study computer systems here. The original chapters and checks are all in this book." },
    { target: "open-pc", title: "PC", body: t("tourTerminalBody") },
    { target: "start-chapter", title: t("tourStartTitle"), body: t("tourStartBody") },
  ];
}
const initial = parseRoute(location.hash);
let state = createAppState(initial.route);
let routeNotice = initial.notice;
let buildAttempt = 0;
let txTimer: number | undefined;
let timerTimeout: number | undefined;
let timerLedTimeout: number | undefined;
let timerAttempt = 0;
let mtimeTicker: number | undefined;
let interruptTicker: number | undefined;
let displayTicker: number | undefined;
let activeButtonPointer: number | undefined;
let activeButtonKey: string | undefined;

function canonicalizeRoute() {
  const hash = routeHash({ chapterId: state.active.id, view: state.view });
  if (location.hash !== hash) history.replaceState(null, "", hash);
}

function render() {
  const steps = tourSteps();
  const focused = document.activeElement;
  const focusId = focused instanceof HTMLElement ? focused.id : "";
  const selection = focused instanceof HTMLInputElement && focused.selectionStart !== null
    ? { start: focused.selectionStart, end: focused.selectionEnd } : null;
  const chapter = currentChapter(state);
  document.documentElement.lang = getLang();
  document.title = t("docTitleFmt", {
    label: chapter.id === 0 ? t("prologue") : t("episodeFmt", { n: String(chapter.id).padStart(2, "0") }),
    title: chapterTitle(chapter),
  });
  app.innerHTML = `<div class="app-shell">
    <div class="top-bar"${state.ui.introDismissed ? "" : " inert"}><div class="chapter-select"><label class="eyebrow" for="chapter-select">${e(t("episodeLabel"))}</label><select id="chapter-select">${chapters.map((item) => `<option value="${item.id}" ${item.id === chapter.id ? "selected" : ""}>${item.id === 0 ? t("prologue") : t("episodeFmt", { n: String(item.id).padStart(2, "0") })} — ${e(chapterTitle(item))}</option>`).join("")}</select></div><div class="top-bar-actions"><button id="reset-mission" class="reset-button" data-action="reset">${e(t("resetEpisode"))} <span aria-hidden="true">↺</span></button><button id="lang-toggle" class="reset-button" data-action="lang">${e(t("langToggleLabel"))}</button></div></div>
    <nav class="view-nav" aria-label="Views"${state.ui.introDismissed ? "" : " inert"}>${(["station", "pc", "datasheet", "book"] as const).map((view) => `<button class="view-tab${state.view === view ? " active" : ""}" data-action="view" data-view="${view}"${state.view === view ? ' aria-current="page"' : ""}>${viewLabel(view)}</button>`).join("")}</nav>
    <main id="main-content" tabindex="-1"${state.ui.introDismissed ? "" : " inert"}>
      ${routeNotice ? `<p class="route-notice">${e(routeNotice)}</p>` : ""}
      <div id="mission-status">${renderMissionStatus(state)}</div>
      <div id="mission-success">${renderSuccess(state)}</div>
      ${state.ui.feedback ? `<div class="feedback"><span class="eyebrow">${e(t("benchFeedback"))}</span><p>${e(state.ui.feedback)}</p></div>` : ""}
      <div id="view-content">${state.view === "station" ? renderStation(state) : state.view === "pc" ? renderPc(state) : state.view === "pocket" ? renderPocket(state) : state.view === "datasheet" ? renderDatasheet(state) : renderBook(state)}</div>
    </main>
    ${state.active.id === 0 && state.ui.introDismissed && state.view === "station" ? `<button id="start-chapter" class="start-fab button primary${state.ui.tourStep === steps.length - 1 ? " tour-glow" : ""}" data-action="start">${e(t("startEpisode01"))} <span aria-hidden="true">→</span></button>` : ""}
    ${state.ui.introDismissed ? "" : `<div class="popup-overlay"><div class="popup" role="dialog" aria-modal="true" aria-labelledby="mission-title">
      <span class="eyebrow">${e(chapter.id === 0 ? t("prologueEyebrow") : `REPAIR ${String(chapter.id).padStart(2, "0")} / ${chapter.title.toUpperCase()}`)}</span>
      <h1 id="mission-title" tabindex="-1">${e(chapterTitle(chapter))}</h1>
      <p class="mission-observation">${e(chapterMission(chapter).initialObservation)}</p>
      <p><strong>${e(chapterMission(chapter).summary)}</strong></p>
      <button id="got-it" class="button primary" data-action="dismiss">${e(t("gotIt"))}</button>
    </div></div>`}
  </div>`;
  const tour = state.active.id === 0 && state.ui.introDismissed && state.ui.tourStep !== null
    ? { ...steps[state.ui.tourStep]!, index: state.ui.tourStep }
    : null;
  if (tour) {
    app.insertAdjacentHTML("beforeend", `<div class="tour-card" role="status"><span class="eyebrow">${e(t("guideFmt", { i: tour.index + 1, n: steps.length }))}</span><strong>${e(tour.title)}</strong><p>${e(tour.body)}</p><div class="tour-actions"><button id="tour-skip" class="text-button" data-action="tour-skip">${e(t("tourSkip"))}</button><button id="tour-next" class="button primary" data-action="tour-next">${e(t(tour.index === steps.length - 1 ? "tourDone" : "tourNext"))}</button></div></div>`);
    document.getElementById(tour.target)?.classList.add("tour-spotlight");
  }
  const focusTarget = focusId ? document.getElementById(focusId) : null;
  if (focusTarget) {
    focusTarget.focus({ preventScroll: true });
    if (selection && focusTarget instanceof HTMLInputElement) focusTarget.setSelectionRange(selection.start, selection.end);
  }
  else if (focusId) document.getElementById("mission-title")?.focus({ preventScroll: true });
  if (!state.ui.introDismissed) document.getElementById("got-it")?.focus();
  syncMtimeTicker();
  syncInterruptTicker();
  syncDisplayTicker();
}

function announce(message: string) { announcement.textContent = message; }

// MTIME is a live counter. Patch only its text so ticks never redraw the page and
// the reader's position in BOOK, DATASHEET, or the editor survives.
function syncMtimeTicker() {
  const wanted = state.ui.coverOpen && state.ui.coverModule === "ram"
    && state.active.id === 3 && state.view === "station";
  if (wanted && mtimeTicker === undefined) {
    mtimeTicker = window.setInterval(() => {
      if (state.active.id !== 3) return;
      const counter = document.getElementById("mtime-counter");
      if (counter) counter.textContent = formatWord(mtimeCounter(state.active.machine, performance.now()));
    }, 100);
  } else if (!wanted && mtimeTicker !== undefined) {
    window.clearInterval(mtimeTicker);
    mtimeTicker = undefined;
  }
}

function stopMtimeTicker() {
  window.clearInterval(mtimeTicker);
  mtimeTicker = undefined;
}

// The installed program runs across views. Only observations are patched; the
// independent replay shows history and never delays input or writes machine state.
function syncInterruptTicker() {
  const wanted = state.active.id === 5 && state.ui.introDismissed;
  if (wanted && interruptTicker === undefined) {
    interruptTicker = window.setInterval(() => {
      if (state.active.id !== 5) return;
      const wasComplete = missionComplete(state);
      state.active.machine = tickInterrupt(state.active.machine, INTERRUPT_TICK_MS);
      state.ui.irqReplayElapsedMs = Math.min(1_000, state.ui.irqReplayElapsedMs + INTERRUPT_TICK_MS);
      refreshInterruptObservation();
      if (!wasComplete && missionComplete(state)) announce(currentChapter(state).mission.successMessage);
    }, INTERRUPT_TICK_MS);
  } else if (!wanted && interruptTicker !== undefined) {
    stopInterruptTicker();
  }
}

function stopInterruptTicker() {
  window.clearInterval(interruptTicker);
  interruptTicker = undefined;
}

function refreshInterruptObservation() {
  if (state.active.id !== 5) return;
  const machine = state.active.machine;
  const values: Record<string, string> = {
    "button-reads": machine.buttonReads.toLocaleString("en-US"),
    "irq-count": machine.irqCount.toLocaleString("en-US"),
    "cpu-state": machine.cpuState,
    "cpu-led": machine.ledValue ? "ON" : "OFF",
    "interrupt-cpu-note": interruptCpuNote(machine),
  };
  for (const [id, value] of Object.entries(values)) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
  const current = irqReplayStep(state);
  document.querySelectorAll<HTMLElement>(".irq-trace-step").forEach((element) => {
    const index = Number(element.dataset.step);
    element.classList.toggle("active", index === current);
    element.classList.toggle("reached", index <= current);
    if (index === current) element.setAttribute("aria-current", "step");
    else element.removeAttribute("aria-current");
  });
  refreshInputObservation();
}

function stopDisplayTicker() {
  window.clearInterval(displayTicker);
  displayTicker = undefined;
}

function syncDisplayTicker() {
  const wanted = (state.active.id === 6 || state.active.id === 8) && state.ui.introDismissed;
  if (wanted && displayTicker === undefined) {
    displayTicker = window.setInterval(() => {
      if (state.active.id !== 6 && state.active.id !== 8) return;
      const wasComplete = missionComplete(state);
      if (state.active.id === 6) state.active.machine = tickDisplay(state.active.machine, 100);
      else state.active.machine = tickMoving(state.active.machine, 100);
      refreshDisplayObservation();
      if (!wasComplete && missionComplete(state)) announce(currentChapter(state).mission.successMessage);
    }, 100);
  } else if (!wanted) stopDisplayTicker();
}

function refreshDisplayObservation() {
  if (state.active.id !== 6 && state.active.id !== 7 && state.active.id !== 8) return;
  document.querySelectorAll<HTMLElement>(".device-screen").forEach((screen) => { screen.innerHTML = renderDisplayScreen(state); });
  const readout = document.getElementById("display-live");
  if (readout) readout.innerHTML = renderDisplayReadout(state, readout.dataset.readout === "hardware");
  if (state.active.id === 6 || state.active.id === 8) {
    refreshInputObservation();
    const ram = document.getElementById("framebuffer-live");
    if (ram) ram.innerHTML = renderFramebufferRam(state);
  } else {
    const m = state.active.machine;
    document.querySelectorAll<HTMLElement>(".coordinate-cell").forEach((cell) => {
      const x = Number(cell.dataset.x), y = Number(cell.dataset.y);
      const requested = x === m.x && y === m.y;
      const actual = x === m.actualPixel?.x && y === m.actualPixel?.y;
      cell.classList.toggle("requested", requested);
      cell.classList.toggle("actual", actual);
      cell.setAttribute("aria-pressed", String(requested));
      cell.setAttribute("aria-label", `Test (${x}, ${y})${requested ? ", requested" : ""}${actual ? ", actual pixel" : ""}`);
    });
    const ram = document.getElementById("framebuffer-live");
    if (ram) ram.innerHTML = renderFramebufferRam(state);
    const observed = document.getElementById("mission-observed");
    if (observed) { observed.textContent = `${m.observedTargets.length}/5 VERIFIED`; observed.classList.toggle("pass", missionComplete(state)); }
    const status = document.getElementById("station-serial");
    if (status) status.textContent = stationSerialSummary(state);
    refreshSuccess();
  }
}

function refreshSuccess() {
  const success = document.getElementById("mission-success");
  const complete = missionComplete(state);
  if (success && Boolean(success.firstElementChild) !== complete) success.innerHTML = renderSuccess(state);
}

function testCoordinate(x: number, y: number) {
  if (state.active.id !== 7 || state.ui.buildPhase !== "idle" || !state.ui.introDismissed) return;
  const wasComplete = missionComplete(state);
  state.active.machine = setFramebufferPosition(state.active.machine, x, y);
  refreshDisplayObservation();
  if (!wasComplete && missionComplete(state)) announce(currentChapter(state).mission.successMessage);
}

function moveMarker(direction: string) {
  if ((state.active.id !== 7 && state.active.id !== 8) || state.ui.buildPhase !== "idle" || !state.ui.introDismissed) return;
  const offset = { up: [0, -1], left: [-1, 0], right: [1, 0], down: [0, 1] }[direction];
  if (!offset) return;
  const wasComplete = missionComplete(state);
  if (state.active.id === 7) state.active.machine = moveFramebufferMarker(state.active.machine, offset[0]!, offset[1]!);
  else state.active.machine = moveMovingMarker(state.active.machine, offset[0]!, offset[1]!);
  refreshDisplayObservation();
  if (!wasComplete && missionComplete(state)) announce(currentChapter(state).mission.successMessage);
}

// Both pointer and keyboard input are edges. Episode 04 polls once; Episode 05
// delivers the edge through the currently installed polling or IRQ program.
function setButton(held: boolean) {
  if ((state.active.id !== 4 && state.active.id !== 5 && state.active.id !== 6 && state.active.id !== 8) || state.ui.buttonHeld === held || state.ui.buildPhase !== "idle" || !state.ui.introDismissed) return;
  state.ui.buttonHeld = held;
  const wasComplete = missionComplete(state);
  const pressed = held ? 1 : 0;
  state.active.machine = state.active.id === 4
    ? pollInput(state.active.machine, pressed)
    : state.active.id === 5 ? setInterruptButton(state.active.machine, pressed)
    : state.active.id === 6 ? setDisplayButton(state.active.machine, pressed)
    : setMovingButton(state.active.machine, pressed);
  if (state.active.id === 5) {
    state.ui.irqReplayElapsedMs = 0;
    const replay = document.getElementById("irq-replay");
    if (replay) replay.innerHTML = renderIrqReplay(state);
  }
  const complete = missionComplete(state);
  if (complete && !wasComplete) announce(currentChapter(state).mission.successMessage);
  else announce(held
    ? state.active.machine.ledValue ? "Button pressed. The LED is on." : "Button pressed. The LED did not change."
    : `Button released. The LED is ${state.active.machine.ledValue ? "still on" : "off"}.`);
}

function refreshInputObservation() {
  if (state.active.id !== 4 && state.active.id !== 5 && state.active.id !== 6 && state.active.id !== 8) return;
  const machine = state.active.machine;
  const buttonValue = document.getElementById("button-value");
  if (buttonValue) buttonValue.textContent = formatWord(machine.buttonValue);
  const ledValue = document.getElementById("led-value");
  if (ledValue) ledValue.textContent = formatWord(machine.ledValue);
  document.querySelectorAll(".led-light").forEach((light) => light.classList.toggle("on", machine.ledValue === 1));
  const status = document.getElementById("station-serial");
  if (status) status.textContent = stationSerialSummary(state);
  const ledStatus = document.getElementById("pocket-led-status");
  if (ledStatus) ledStatus.textContent = machine.ledValue ? "on" : "off";
  const buttonStatus = document.getElementById("pocket-button-status");
  if (buttonStatus) buttonStatus.textContent = machine.buttonValue ? "pressed" : "released";
  const complete = missionComplete(state);
  const observed = document.getElementById("mission-observed");
  if (observed) {
    observed.textContent = state.active.id === 5 ? state.active.machine.cpuState : state.active.id === 6 || state.active.id === 8 ? displayStatus(state) : machine.ledValue ? "ON" : "OFF";
    observed.classList.toggle("pass", complete);
  }
  const success = document.getElementById("mission-success");
  if (success && Boolean(success.firstElementChild) !== complete) success.innerHTML = renderSuccess(state);
}

function refreshLights() {
  document.querySelectorAll(".uart-tx-light").forEach((light) => light.classList.toggle("tx-pulse", state.ui.txActive));
  document.querySelectorAll(".timer-light").forEach((light) => light.classList.toggle("on", state.ui.timerLedActive));
  const txStatus = document.getElementById("tx-status");
  if (txStatus) txStatus.textContent = state.ui.txActive ? "transmitting" : "idle";
  const timerStatus = document.getElementById("pocket-timer-status");
  if (timerStatus) timerStatus.textContent = state.ui.timerLedActive ? "tick" : "waiting";
}

function refreshTimerObservation(completedNow: boolean) {
  if (state.active.id !== 3) return;
  const mission = document.getElementById("mission-status");
  if (mission) mission.innerHTML = renderMissionStatus(state);
  if (completedNow) {
    const success = document.getElementById("mission-success");
    if (success) success.innerHTML = renderSuccess(state);
    announce(currentChapter(state).mission.successMessage);
  }
  const serial = document.getElementById("serial-output");
  if (serial) serial.textContent = state.active.machine.terminalOutput;
  const preview = document.getElementById("station-serial");
  if (preview) preview.textContent = stationSerialSummary(state);
  const observed = document.getElementById("timer-observed");
  if (observed) observed.textContent = formatInterval(state.active.machine.observedIntervalMs);
  const count = document.getElementById("timer-count");
  if (count) count.textContent = String(state.active.machine.tickCount);
  refreshLights();
}

function stopTimer() {
  timerAttempt++;
  window.clearTimeout(timerTimeout);
  window.clearTimeout(timerLedTimeout);
  timerTimeout = undefined;
  state.ui.timerLedActive = false;
  if (state.active.id === 3) state.ui.txActive = false;
  refreshLights();
}

function startTimer() {
  if (state.active.id !== 3) return;
  // The hardware counter never restarts; only the program's wait does.
  if (state.active.machine.counterStartedAt === null) state.active.machine.counterStartedAt = performance.now();
  if (!state.ui.introDismissed || state.ui.buildPhase !== "idle" || timerTimeout !== undefined) return;
  const attempt = timerAttempt;
  timerTimeout = window.setTimeout(() => {
    if (attempt !== timerAttempt || state.active.id !== 3 || state.ui.buildPhase !== "idle") return;
    timerTimeout = undefined;
    const wasComplete = missionComplete(state);
    state.active.machine = recordTimerTick(state.active.machine, performance.now());
    state.ui.txActive = true;
    state.ui.timerLedActive = true;
    refreshTimerObservation(!wasComplete && missionComplete(state));
    window.clearTimeout(timerLedTimeout);
    const ui = state.ui;
    timerLedTimeout = window.setTimeout(() => {
      if (state.ui !== ui || attempt !== timerAttempt) return;
      ui.txActive = false;
      ui.timerLedActive = false;
      refreshLights();
    }, 180);
    startTimer();
  }, timerIntervalMs(state.active.machine.timebaseHz));
}

function pulseTx() {
  window.clearTimeout(txTimer);
  const ui = state.ui;
  ui.txActive = true;
  render();
  txTimer = window.setTimeout(() => {
    if (state.ui !== ui) return;
    ui.txActive = false;
    refreshLights();
  }, 650);
}

async function buildAndFlash() {
  if (state.active.id === 0 || state.ui.buildPhase !== "idle") return;
  const chapterId = state.active.id;
  const fileName = editorFileName(state);
  const binaryName = fileName.replace(/\.[cS]$/, ".bin");
  const byte = parseByte(state.ui.draftByte);
  const store = readStoreAddress(state.ui.draftStoreAddress);
  const timebase = parseTimebase(state.ui.draftTimebase);
  const program = currentChapter(state).computer.program;
  const error = chapterId === 1 && byte === null ? "Enter one hex byte from 0x00 to 0xFF."
    : chapterId === 2 ? store.error
    : chapterId === 3 && timebase === null ? "Choose a supported program timebase."
    : chapterId === 4 && program!.blocks.some((block) => !(state.ui.draftBlocks.body ?? []).includes(block.id))
      ? "Place every block before building." : "";
  if (error) {
    state.ui.feedback = `Build stopped. ${error} The running firmware is unchanged.`;
    render();
    document.getElementById(chapterId === 1 ? "byte-value" : chapterId === 2 ? "store-address" : "timebase-frequency")?.focus();
    announce(state.ui.feedback);
    return;
  }
  if (chapterId === 3) stopTimer();
  if (chapterId === 4 || chapterId === 5 || chapterId === 6 || chapterId === 8) {
    releaseHeldButton();
    state.ui.irqReplayElapsedMs = 1_000;
  }
  const attempt = ++buildAttempt;
  const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
  state.ui.feedback = "";
  state.ui.buildPhase = "building";
  state.ui.buildLog = ["BUILD..."];
  render();
  announce(`Building ${fileName}.`);
  await wait(400);
  if (attempt !== buildAttempt || state.active.id !== chapterId) return;
  state.ui.buildPhase = "flashing";
  state.ui.buildLog = ["BUILD...", `✓ ${binaryName}`, "", "FLASH...", "░░░░░░░░░░ 0%"];
  render();
  await wait(500);
  if (attempt !== buildAttempt || state.active.id !== chapterId) return;
  state.ui.buildPhase = "booting";
  state.ui.buildLog = ["BUILD...", `✓ ${binaryName}`, "", "FLASH...", "██████████ 100%", "", "RESET..."];
  render();
  await wait(400);
  if (attempt !== buildAttempt || state.active.id !== chapterId) return;
  if (state.active.id === 5) stopInterruptTicker();
  if (state.active.id === 6 || state.active.id === 8) stopDisplayTicker();
  if (state.active.id === 1) {
    state.active.machine = rebootTarget(flashFirmware(state.active.machine, byte!));
    state.ui.draftByte = formatByte(byte!);
    const received = serialDisplay(state.active.machine.terminalOutput);
    state.ui.feedback = missionComplete(state) ? "The Pocket sent A. UART PASS. The display can wait for its own repair."
      : `The Pocket sent ${received}. Expected A. Check the byte in boot.S and the ASCII table in DATASHEET.`;
  } else if (state.active.id === 2) {
    state.active.machine = rebootMemoryTarget(flashMemoryFirmware(state.active.machine, store.address!));
    state.ui.draftStoreAddress = formatAddress(store.address!);
    state.ui.feedback = missionComplete(state)
      ? `RAM PASS. The store reached ${formatAddress(WATCHED_RAM_ADDRESS)} and nothing was transmitted. Watch the value under OPEN COVER.`
      : `The store went to ${formatAddress(store.address!)}. The target word at ${formatAddress(WATCHED_RAM_ADDRESS)} is still empty. Compare the destination with the Memory Map in DATASHEET.`;
  } else if (state.active.id === 3) {
    state.active.machine = rebootTimerTarget(flashTimerFirmware(state.active.machine, timebase!));
    state.ui.feedback = `Program timebase installed: ${formatFrequency(timebase!)}. The program now waits ${timerTargetTicks(timebase!).toLocaleString("en-US")} ticks. Observe two ticks; the hardware timer stays at 1 GHz.`;
  } else if (state.active.id === 5) {
    state.active.machine = flashInterruptProgram(state.active.machine, state.ui.draftInterrupts
      ? interruptProgramFromDraft(state.ui.draftBlocks) : { kind: "polling" });
    state.ui.irqReplayElapsedMs = 0;
    state.ui.feedback = state.ui.draftInterrupts
      ? "button.c installed. Watch the live CPU state, then press and release A. No ACK means the IRQ stays pending."
      : "Polling installed again. BUTTON READS keeps increasing while the button is untouched. Switch to interrupts to repair it.";
  } else if (state.active.id === 8) {
    state.active.machine = flashMovingProgram(state.active.machine, movingProgramFromDraft(state.ui.draftBlocks));
    state.ui.feedback = "events.c installed. Hold A for one second and use the D-pad. The handler must return so main can process frames.";
  } else if (state.active.id === 7) {
    state.active.machine = flashFramebufferProgram(state.active.machine, state.ui.draftRowBytes);
    state.ui.feedback = "pixel.c installed. Test the center and all four corners; follow the actual write address.";
  } else if (state.active.id === 6) {
    state.active.machine = flashDisplayProgram(state.active.machine, state.ui.draftBlocks.setup ?? []);
    state.ui.feedback = "display.c installed. Observe the screen and the actual startup log. Device readiness takes 500 ms.";
  } else {
    state.active.machine = flashInputProgram(state.active.machine, state.ui.draftBlocks.body ?? []);
    state.ui.feedback = `button.c installed with ${(state.ui.draftBlocks.body ?? []).length} blocks. Hold the A button on the station and watch the LED.`;
  }
  state.ui.buildPhase = "idle";
  state.ui.buildLog.push("✓ Pocket booted");
  if (state.active.id === 3) { render(); startTimer(); }
  else if (state.active.id >= 4) render();
  else if (state.active.id === 2 && !sentOnThisRun()) render();
  else pulseTx();
  announce(state.ui.feedback);
}

function sentOnThisRun(): boolean {
  return state.active.id === 2
    ? state.active.machine.lastUartTx?.execution === state.active.machine.executionCount
    : true;
}

function resetTarget() {
  if (state.active.id === 0 || state.ui.buildPhase !== "idle") return;
  releaseHeldButton();
  if (state.active.id === 5) stopInterruptTicker();
  if (state.active.id === 6 || state.active.id === 8) stopDisplayTicker();
  if (state.active.id === 1) {
    state.active.machine = rebootTarget(state.active.machine);
    state.ui.feedback = `Pocket reset. Received ${serialDisplay(state.active.machine.terminalOutput)} from the installed firmware.`;
  } else if (state.active.id === 2) {
    state.active.machine = rebootMemoryTarget(state.active.machine);
    const store = state.active.machine.lastStore;
    state.ui.feedback = missionComplete(state)
      ? `Pocket reset. RAM PASS. The store reached ${formatAddress(WATCHED_RAM_ADDRESS)} again, and nothing was transmitted.`
      : `Pocket reset. The installed program stored to ${store ? formatAddress(store.address) : "an unknown address"}. The target word at ${formatAddress(WATCHED_RAM_ADDRESS)} is unchanged.`;
  } else if (state.active.id === 3) {
    stopTimer();
    state.active.machine = rebootTimerTarget(state.active.machine);
    state.ui.feedback = `Pocket reset. The diagnostic uses the installed ${formatFrequency(state.active.machine.timebaseHz)} program timebase; the hardware timer runs at 1 GHz.`;
  } else if (state.active.id === 5) {
    state.ui.buttonHeld = false;
    state.active.machine = rebootInterruptTarget(state.active.machine);
    state.ui.irqReplayElapsedMs = 0;
    state.ui.feedback = "Pocket reset. Counters and observations cleared; the installed program restarted. The editor draft is preserved.";
  } else if (state.active.id === 8) {
    state.active.machine = rebootMovingTarget(state.active.machine);
    state.ui.feedback = "Pocket reset. Installed event flow restarted; frames, pending work, and observations cleared. The editor draft is preserved.";
  } else if (state.active.id === 7) {
    state.active.machine = rebootFramebufferTarget(state.active.machine);
    state.ui.feedback = "Pocket reset. The installed ROW_BYTES is preserved; position and observations restarted. The draft is unchanged.";
  } else if (state.active.id === 6) {
    state.ui.buttonHeld = false;
    state.active.machine = rebootDisplayTarget(state.active.machine);
    state.ui.feedback = "Pocket reset. The installed startup sequence restarted; the editor draft is preserved.";
  } else {
    state.ui.buttonHeld = false;
    state.active.machine = pollInput(state.active.machine, 0);
    state.ui.feedback = "Pocket reset. The installed program ran again. Hold the A button and watch the LED.";
  }
  if (state.active.id === 3) { render(); startTimer(); }
  else if (state.active.id >= 4) render();
  else if (state.active.id === 2 && !sentOnThisRun()) render();
  else pulseTx();
  announce(state.ui.feedback);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to textarea fallback */ }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function goTo(chapterId: ChapterId, view: View) {
  const hash = routeHash({ chapterId, view });
  if (location.hash !== hash) location.hash = hash;
}

window.addEventListener("hashchange", () => {
  // The skip link is a document anchor, not a route change.
  if (location.hash === "#main-content") {
    document.getElementById("main-content")?.focus();
    canonicalizeRoute();
    return;
  }
  const parsed = parseRoute(location.hash);
  releaseHeldButton();
  if (parsed.route.chapterId !== state.active.id) { buildAttempt++; stopTimer(); stopInterruptTicker(); stopDisplayTicker(); }
  state = navigate(state, parsed.route);
  routeNotice = parsed.notice;
  canonicalizeRoute();
  render();
  startTimer();
  window.scrollTo({ top: 0 });
  announce(routeNotice || t("announceViewFmt", {
    label: state.active.id === 0 ? t("prologue") : t("episodeFmt", { n: String(state.active.id).padStart(2, "0") }),
    title: chapterTitle(currentChapter(state)),
    view: viewLabel(state.view),
  }));
});

app.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-action]") : null;
  if (!button) return;
  switch (button.dataset.action) {
    case "view": {
      const view = views.find((item) => item === button.dataset.view);
      if (view === "datasheet") {
        const section = DATASHEET_SECTIONS.find((item) => item.id === button.dataset.section);
        if (section) state.ui.datasheetSection = section.id;
      }
      if (view) goTo(state.active.id, view);
      return;
    }
    case "test-pixel":
      testCoordinate(Number(button.dataset.x), Number(button.dataset.y));
      return;
    case "move-marker":
      moveMarker(button.dataset.direction ?? "");
      return;
    case "build-flash":
      void buildAndFlash();
      return;
    case "toggle-cover": {
      // Opening or closing the cover must not interrupt a running diagnostic.
      state.ui.coverOpen = !state.ui.coverOpen;
      render();
      announce(state.ui.coverOpen ? "Cover open. The hardware modules are on the station." : "Cover closed.");
      return;
    }
    case "cover-module": {
      const module = button.dataset.module;
      if (module !== "cpu" && module !== "ram" && module !== "display") return;
      state.ui.coverModule = module;
      render();
      announce(`${module.toUpperCase()} module.`);
      return;
    }
    case "switch-interrupts":
      if (state.ui.buildPhase !== "idle") return;
      state = switchToInterruptDraft(state);
      render();
      announce("Interrupt draft opened. The installed polling program is still running.");
      return;
    case "block-add":
    case "block-remove": {
      const program = currentChapter(state).computer.program;
      const id = button.dataset.block;
      const slot = program?.slots.find((candidate) => candidate.id === button.dataset.slot);
      if (!program || !slot || !id || !slot.blocks.includes(id) || state.ui.buildPhase !== "idle") return;
      state.ui.draftBlocks = editProgramBlock(program, state.ui.draftBlocks, slot.id, id, button.dataset.action === "block-add");
      render();
      return;
    }
    case "next-episode": {
      const next = chapters.find((candidate) => candidate.id === Number(button.dataset.episode));
      if (next) goTo(next.id as ChapterId, "station");
      return;
    }
    case "reset-target":
      resetTarget();
      return;
    case "datasheet-section": {
      const section = DATASHEET_SECTIONS.find((item) => item.id === button.dataset.section);
      if (!section) return;
      state.ui.datasheetSection = section.id;
      render();
      document.getElementById("datasheet-title")?.focus({ preventScroll: true });
      announce(section.title);
      return;
    }
    case "lang":
      toggleLang();
      render();
      announce(`${getLang() === "ko" ? "한국어" : "English"}`);
      return;
    case "start":
      if (state.active.id === 0) state.active.machine.started = true;
      goTo(1, "station");
      return;
    case "dismiss":
      state.ui.introDismissed = true;
      if (state.active.id === 0) state.ui.tourStep = 0;
      render();
      document.getElementById("main-content")?.focus({ preventScroll: true });
      if (state.active.id === 1 || state.active.id === 2) pulseTx();
      if (state.active.id === 3) startTimer();
      announce(state.active.id === 0 ? "The PC, Pocket, DATASHEET and BOOK are on the station." : chapterMission(currentChapter(state)).summary);
      return;
    case "tour-next": {
      if (state.ui.tourStep === null) return;
      const next = state.ui.tourStep + 1;
      state.ui.tourStep = next >= tourSteps().length ? null : next;
      render();
      if (state.ui.tourStep === null) {
        document.getElementById("main-content")?.focus();
        announce(t("announceTourDone"));
      } else {
        document.getElementById("tour-next")?.focus();
        announce(tourSteps()[state.ui.tourStep]!.body);
      }
      return;
    }
    case "tour-skip":
      state.ui.tourStep = null;
      render();
      document.getElementById("main-content")?.focus();
      return;
    case "ebook-open": {
      const slug = button.dataset.slug ?? "";
      openEbookChapter(slug);
      render();
      document.getElementById("ebook-title")?.focus();
      announce(getEbookTitle());
      return;
    }
    case "ebook-section": {
      const heading = document.getElementById(button.dataset.heading ?? "");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start" });
      return;
    }
    case "check-prev":
    case "check-next": {
      const total = getCheckTotal();
      stepCheck(button.dataset.action === "check-next" ? 1 : -1, total);
      render();
      document.getElementById("check-question")?.focus();
      return;
    }
    case "check-confirm": {
      confirmCheck();
      render();
      document.getElementById("check-question")?.focus();
      const q = getCurrentCheck();
      if (q) announce(isCheckCorrect(q.answers, getCheckSelection().selected) ? t("ebookCorrect") : t("ebookWrong"));
      return;
    }
    case "check-harder": {
      const q = getCurrentCheck();
      if (!q) return;
      const text = harderPrompt(getEbookTitle(), q.plain);
      copyText(text).then((ok) =>
        announce(ok ? t("announceCopyOk") : t("announceCopyFail")),
      );
      return;
    }
    case "reset":
      releaseHeldButton();
      buildAttempt++;
      stopTimer();
      stopInterruptTicker();
      stopDisplayTicker();
      state = resetMission(state);
      state.ui.feedback = t("resetFeedback");
      break;
    default: return;
  }
  render();
  announce(state.ui.feedback);
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === "chapter-select") {
    if (chapters.some((chapter) => String(chapter.id) === target.value)) goTo(Number(target.value) as ChapterId, state.view);
  } else if (target instanceof HTMLSelectElement && target.id === "row-bytes" && state.active.id === 7 && state.ui.buildPhase === "idle") {
    const value = Number(target.value);
    if (!ROW_BYTES_CHOICES.includes(value as RowBytes)) return;
    state.ui.draftRowBytes = value as RowBytes;
    const status = document.getElementById("source-status");
    if (status) status.textContent = sourceStatus(state);
  } else if (target instanceof HTMLSelectElement && target.id === "timebase-frequency" && state.active.id === 3 && state.ui.buildPhase === "idle") {
    const timebase = parseTimebase(target.value);
    if (timebase === null) return;
    state.ui.draftTimebase = target.value;
    const preview = document.getElementById("source-preview-target-ticks");
    if (preview) preview.textContent = String(timerTargetTicks(timebase));
    const status = document.getElementById("source-status");
    if (status) status.textContent = sourceStatus(state);
  } else if (target instanceof HTMLInputElement && target.dataset.checkChoice) {
    const q = getCurrentCheck();
    if (!q || q.kind === "open") return;
    toggleCheckChoice(target.dataset.checkChoice, q.kind === "multi");
    render();
  } else if (target instanceof HTMLInputElement && target.dataset.question) {
    const question = currentChapter(state).quiz.find((item) => item.id === target.dataset.question);
    if (!question || !question.choices.some((choice) => choice.id === target.value)) return;
    state.ui.quizAnswers[question.id] = target.value;
    render();
    announce(`${target.value === question.answerId ? "That's right." : "Not quite. Try again."} ${question.explanation}`);
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.id === "byte-value" && state.active.id === 1 && state.ui.buildPhase === "idle") {
    state.ui.draftByte = target.value;
    target.setAttribute("aria-invalid", String(parseByte(target.value) === null));
    const status = document.getElementById("source-status");
    if (status) status.textContent = sourceStatus(state);
    return;
  }
  if (target instanceof HTMLInputElement && target.id === "store-address" && state.active.id === 2 && state.ui.buildPhase === "idle") {
    state.ui.draftStoreAddress = target.value;
    target.setAttribute("aria-invalid", String(readStoreAddress(target.value).address === null));
    const status = document.getElementById("source-status");
    if (status) status.textContent = sourceStatus(state);
    return;
  }
  if (target instanceof HTMLInputElement && target.id === "ebook-search") {
    setEbookQuery(target.value);
    const toc = document.getElementById("ebook-toc");
    if (toc) toc.innerHTML = renderEbookToc(getEbookSlug(), getBookmarks(state.active.id));
  }
});

// Preserve the mission URL when using the accessibility skip link.
document.querySelector<HTMLAnchorElement>(".skip-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  const main = document.getElementById("main-content");
  main?.focus();
  main?.scrollIntoView({ block: "start" });
});

window.addEventListener("keydown", (event) => {
  const direction = { ArrowUp: "up", ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down" }[event.key];
  if (!direction || event.repeat || event.ctrlKey || event.metaKey || event.altKey || (state.active.id !== 7 && state.active.id !== 8) || (state.view !== "pc" && state.view !== "station" && state.view !== "pocket")) return;
  if (event.target instanceof Element && event.target.closest("input, select, textarea, [contenteditable]")) return;
  event.preventDefault();
  moveMarker(direction);
});

// The A button is a hold, not a click. Pointer and keyboard both press and release,
// and losing focus or leaving the page releases too, so the machine is never stuck down.
function isHoldTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.dataset.hold === "a";
}

for (const type of ["pointerdown", "keydown"] as const) {
  app.addEventListener(type, (event) => {
    if (!isHoldTarget(event.target) || !state.ui.introDismissed || state.ui.buildPhase !== "idle") return;
    if (event instanceof KeyboardEvent && (event.key !== " " && event.key !== "Enter" || event.repeat)) return;
    if (event instanceof PointerEvent && event.button !== 0) return;
    event.preventDefault();
    if (activeButtonPointer !== undefined || activeButtonKey !== undefined) return;
    if (event instanceof PointerEvent) activeButtonPointer = event.pointerId;
    if (event instanceof KeyboardEvent) activeButtonKey = event.key;
    if (event.target instanceof HTMLButtonElement) {
      event.target.focus({ preventScroll: true });
      if (event instanceof PointerEvent) event.target.setPointerCapture(event.pointerId);
    }
    setButton(true);
    renderPocketButton();
  });
}
for (const type of ["pointerup", "keyup", "pointercancel", "blur"] as const) {
  app.addEventListener(type, (event) => {
    if (event instanceof PointerEvent && event.pointerId !== activeButtonPointer) return;
    if (event instanceof KeyboardEvent && event.key !== activeButtonKey) return;
    // Pointer capture continues a hold when a second finger focuses the D-pad.
    if (type === "blur" && activeButtonKey === undefined) return;
    if (!isHoldTarget(event.target)) return;
    releaseHeldButton();
  }, type === "blur");
}

function releaseHeldButton() {
  activeButtonPointer = undefined;
  activeButtonKey = undefined;
  if (!state.ui.buttonHeld) return;
  setButton(false);
  renderPocketButton();
}

function releasePointer(event: PointerEvent) {
  if (event.pointerId === activeButtonPointer) releaseHeldButton();
}
window.addEventListener("pointerup", releasePointer);
window.addEventListener("pointercancel", releasePointer);
window.addEventListener("blur", releaseHeldButton);

// A full render would drop the focus the player is holding, so the press only
// patches the light and the readout around it.
function renderPocketButton() {
  if (state.active.id !== 4 && state.active.id !== 5 && state.active.id !== 6 && state.active.id !== 8) return;
  const button = document.getElementById("pocket-button-a");
  if (button instanceof HTMLButtonElement) {
    button.classList.toggle("pressed", state.ui.buttonHeld);
    button.setAttribute("aria-pressed", String(state.ui.buttonHeld));
  }
  if (state.active.id === 5) refreshInterruptObservation();
  else if (state.active.id >= 6) refreshDisplayObservation();
  else refreshInputObservation();
}

canonicalizeRoute();
render();
window.addEventListener("pagehide", () => { releaseHeldButton(); stopTimer(); stopMtimeTicker(); stopInterruptTicker(); stopDisplayTicker(); });
window.addEventListener("pageshow", () => { startTimer(); syncMtimeTicker(); syncInterruptTicker(); syncDisplayTicker(); });
if (routeNotice) announce(routeNotice);
