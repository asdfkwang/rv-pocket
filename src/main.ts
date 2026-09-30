import { chapters, createAppState, currentChapter, missionComplete, navigate, parseRoute, resetMission, routeHash, views, type ChapterId, type View } from "./app-state";
import { runDiagnostic, setUartConnection } from "./sim/uart";
import { renderWorkbench } from "./views/workbench";
import { renderComputer } from "./views/computer";
import { renderManual } from "./views/manual";
import { escapeHtml as e, viewLabels } from "./views/html";

const app = document.querySelector<HTMLDivElement>("#app")!;
const announcement = document.querySelector<HTMLParagraphElement>("#announcement")!;
const initial = parseRoute(location.hash);
let state = createAppState(initial.route);
let routeNotice = initial.notice;

function canonicalizeRoute() {
  const hash = routeHash({ chapterId: state.active.id, view: state.view });
  if (location.hash !== hash) history.replaceState(null, "", hash);
}

function render() {
  const focusId = document.activeElement instanceof HTMLElement ? document.activeElement.id : "";
  const chapter = currentChapter(state);
  const complete = missionComplete(state);
  document.title = `Chapter ${String(chapter.id).padStart(2, "0")} — ${chapter.title} | RV Pocket`;
  app.innerHTML = `<div class="app-shell">
    <div class="chapter-select"><label class="eyebrow" for="chapter-select">CHAPTER</label><select id="chapter-select">${chapters.map((item) => `<option value="${item.id}" ${item.id === chapter.id ? "selected" : ""}>${String(item.id).padStart(2, "0")} — ${e(item.title)}</option>`).join("")}</select></div>
    <main id="main-content" tabindex="-1">
      ${routeNotice ? `<p class="route-notice">${e(routeNotice)}</p>` : ""}
      <section class="mission-header" aria-labelledby="mission-title">
        <div class="mission-heading"><div><span class="eyebrow">${chapter.id === 0 ? "PROLOGUE / THE OLD STUDIO" : "FIRST REPAIR / DIAGNOSTIC ACCESS"}</span><h1 id="mission-title" tabindex="-1">${e(chapter.title)}</h1></div><button id="reset-mission" class="reset-button" data-action="reset">Reset chapter <span aria-hidden="true">↺</span></button></div>
        <p class="mission-observation">${e(chapter.mission.initialObservation)}</p>
        <div class="mission-objective"><span class="eyebrow">${chapter.id === 0 ? "YOUR FIRST STEP" : "MISSION"}</span><strong>${e(chapter.mission.summary)}</strong>${chapter.id === 0 ? `<button id="start-chapter" class="button primary" data-action="start">Start Chapter 01 <span aria-hidden="true">→</span></button>` : `<span class="mission-status ${complete ? "complete" : ""}">${complete ? "REPAIR COMPLETE" : "IN PROGRESS"}</span>`}</div>
      </section>
      ${state.active.id === 1 && complete ? `<section class="success-banner" aria-label="Repair complete"><span class="success-check" aria-hidden="true">✓</span><div><h2>${e(chapter.mission.successMessage)}</h2><p>First contact established. Next planned repair: Chapter 02 — Bad Memory.</p></div></section>` : ""}
      ${state.ui.feedback ? `<div class="feedback"><span class="eyebrow">BENCH FEEDBACK</span><p>${e(state.ui.feedback)}</p></div>` : ""}
      <div id="view-content">${state.view === "workbench" ? renderWorkbench(state) : state.view === "computer" ? renderComputer(state) : renderManual(state)}</div>
    </main>
    <footer class="site-footer"><span>Find the problem. Read the manual. Fix the machine.</span><span>LOCAL SESSION / NO SAVED PROGRESS</span></footer>
  </div>`;
  const focusTarget = focusId ? document.getElementById(focusId) : null;
  if (focusTarget) focusTarget.focus({ preventScroll: true });
  else if (focusId) document.getElementById("mission-title")?.focus({ preventScroll: true });
}

function announce(message: string) { announcement.textContent = message; }

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
  state = navigate(state, parsed.route);
  routeNotice = parsed.notice;
  canonicalizeRoute();
  render();
  announce(routeNotice || `Chapter ${state.active.id}: ${currentChapter(state).title}. ${viewLabels[state.view]} view.`);
});

app.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-action]") : null;
  if (!button) return;
  switch (button.dataset.action) {
    case "view": {
      const view = views.find((item) => item === button.dataset.view);
      if (view) goTo(state.active.id, view);
      return;
    }
    case "start":
      if (state.active.id === 0) state.active.machine.started = true;
      goTo(1, state.view);
      return;
    case "inspect":
      state.ui.inspected = true;
      announce(state.active.id === 1 ? "Power is on. The screen is black. A connector on the edge is marked UART." : "A worn pocket computer from the old studio. Start the first repair when you are ready.");
      render();
      return;
    case "cable":
      if (state.active.id !== 1) return;
      state.active.machine = setUartConnection(state.active.machine, !state.active.machine.uartConnected);
      state.ui.feedback = state.active.machine.uartConnected
        ? "UART cable connected. The computer is ready to receive. Connecting the cable alone does not send a character."
        : "UART cable disconnected. Previously received characters remain in the terminal; no new data can arrive.";
      break;
    case "run": {
      if (state.active.id !== 1) return;
      const result = runDiagnostic(state.active.machine, state.ui.selectedDevice);
      state.active.machine = result.state;
      state.ui.feedback = result.feedback;
      break;
    }
    case "reset":
      state = resetMission(state);
      state.ui.feedback = "Chapter reset. You are starting fresh in the same view.";
      break;
    default: return;
  }
  render();
  announce(state.ui.feedback);
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === "chapter-select") {
    if (target.value === "0" || target.value === "1") goTo(Number(target.value) as ChapterId, state.view);
  } else if (target instanceof HTMLSelectElement && target.id === "output-device") {
    if (["", "cpu", "ram", "uart"].includes(target.value)) {
      state.ui.selectedDevice = target.value as typeof state.ui.selectedDevice;
      state.ui.feedback = "";
      render();
    }
  } else if (target instanceof HTMLInputElement && target.dataset.question) {
    const question = currentChapter(state).quiz.find((item) => item.id === target.dataset.question);
    if (!question || !question.choices.some((choice) => choice.id === target.value)) return;
    state.ui.quizAnswers[question.id] = target.value;
    render();
    announce(`${target.value === question.answerId ? "That's right." : "Not quite. Try again."} ${question.explanation}`);
  }
});

// Preserve the mission URL when using the accessibility skip link.
document.querySelector<HTMLAnchorElement>(".skip-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  const main = document.getElementById("main-content");
  main?.focus();
  main?.scrollIntoView({ block: "start" });
});

canonicalizeRoute();
render();
if (routeNotice) announce(routeNotice);
