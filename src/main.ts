import { viewLabel, chapters, createAppState, currentChapter, missionComplete, navigate, parseRoute, resetMission, routeHash, views, type ChapterId, type View } from "./app-state";
import { getLang, setLang, t, toggleLang } from "./i18n";
import { chapterMission, chapterTitle } from "./chapters/locale";
import { renderStation } from "./views/station";
import { renderTerminal } from "./views/terminal";
import { confirmCheck, getBookmarks, getCheckIndex, getCheckSelection, getCurrentCheck, getCheckTotal, getEbookSlug, getEbookTitle, harderPrompt, isCheckCorrect, openEbookChapter, renderEbook, renderEbookToc, setEbookQuery, stepCheck, toggleCheckChoice } from "./views/ebook";
import { escapeHtml as e } from "./views/html";

const app = document.querySelector<HTMLDivElement>("#app")!;
const announcement = document.querySelector<HTMLParagraphElement>("#announcement")!;
const tourSteps = [
  { target: "chapter-select", title: "tourEpisodesTitle", body: "tourEpisodesBody" },
  { target: "open-ebook", title: "tourEbookTitle", body: "tourEbookBody" },
  { target: "open-terminal", title: "tourTerminalTitle", body: "tourTerminalBody" },
  { target: "start-chapter", title: "tourStartTitle", body: "tourStartBody" },
] as const;
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
  document.documentElement.lang = getLang();
  document.title = t("docTitleFmt", {
    label: chapter.id === 0 ? t("prologue") : t("episodeFmt", { n: String(chapter.id).padStart(2, "0") }),
    title: chapterTitle(chapter),
  });
  app.innerHTML = `<div class="app-shell">
    ${state.view === "ebook" || state.view === "terminal" ? "" : `<div class="top-bar"${state.ui.introDismissed ? "" : " inert"}><div class="chapter-select"><label class="eyebrow" for="chapter-select">${e(t("episodeLabel"))}</label><select id="chapter-select">${chapters.map((item) => `<option value="${item.id}" ${item.id === chapter.id ? "selected" : ""}>${item.id === 0 ? t("prologue") : t("episodeFmt", { n: String(item.id).padStart(2, "0") })} — ${e(chapterTitle(item))}</option>`).join("")}</select></div><div class="top-bar-actions"><button id="reset-mission" class="reset-button" data-action="reset">${e(t("resetEpisode"))} <span aria-hidden="true">↺</span></button><button id="lang-toggle" class="reset-button" data-action="lang">${e(t("langToggleLabel"))}</button></div></div>`}
    <main id="main-content" tabindex="-1"${state.ui.introDismissed ? "" : " inert"}>
      ${routeNotice ? `<p class="route-notice">${e(routeNotice)}</p>` : ""}
      ${state.active.id === 1 && complete ? `<section class="success-banner" aria-label="Repair complete"><span class="success-check" aria-hidden="true">✓</span><div><h2>${e(chapter.mission.successMessage)}</h2><p>${e(t("successNextEpisode"))}</p></div></section>` : ""}
      ${state.ui.feedback ? `<div class="feedback"><span class="eyebrow">${e(t("benchFeedback"))}</span><p>${e(state.ui.feedback)}</p></div>` : ""}
      <div id="view-content">${state.view === "station" ? renderStation() : state.view === "terminal" ? renderTerminal() : renderEbook(state)}</div>
    </main>
    ${state.active.id === 0 && state.ui.introDismissed && state.view === "station" ? `<button id="start-chapter" class="start-fab button primary${state.ui.tourStep === tourSteps.length - 1 ? " tour-glow" : ""}" data-action="start">${e(t("startEpisode01"))} <span aria-hidden="true">→</span></button>` : ""}
    ${state.ui.introDismissed ? "" : `<div class="popup-overlay"><div class="popup" role="dialog" aria-modal="true" aria-labelledby="mission-title">
      <span class="eyebrow">${e(chapter.id === 0 ? t("prologueEyebrow") : t("episode01Eyebrow"))}</span>
      <h1 id="mission-title" tabindex="-1">${e(chapterTitle(chapter))}</h1>
      <p class="mission-observation">${e(chapterMission(chapter).initialObservation)}</p>
      <p><strong>${e(chapterMission(chapter).summary)}</strong></p>
      <button id="got-it" class="button primary" data-action="dismiss">${e(t("gotIt"))}</button>
    </div></div>`}
  </div>`;
  const tour = state.active.id === 0 && state.ui.introDismissed && state.ui.tourStep !== null
    ? { ...tourSteps[state.ui.tourStep]!, index: state.ui.tourStep }
    : null;
  if (tour) {
    app.insertAdjacentHTML("beforeend", `<div class="tour-card" role="status"><span class="eyebrow">${e(t("guideFmt", { i: tour.index + 1, n: tourSteps.length }))}</span><strong>${e(t(tour.title))}</strong><p>${e(t(tour.body))}</p><div class="tour-actions"><button id="tour-skip" class="text-button" data-action="tour-skip">${e(t("tourSkip"))}</button><button id="tour-next" class="button primary" data-action="tour-next">${e(t(tour.index === tourSteps.length - 1 ? "tourDone" : "tourNext"))}</button></div></div>`);
    document.getElementById(tour.target)?.classList.add("tour-spotlight");
  }
  const focusTarget = focusId ? document.getElementById(focusId) : null;
  if (focusTarget) focusTarget.focus({ preventScroll: true });
  else if (focusId) document.getElementById("mission-title")?.focus({ preventScroll: true });
  if (!state.ui.introDismissed) document.getElementById("got-it")?.focus();
}

function announce(message: string) { announcement.textContent = message; }

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
  state = navigate(state, parsed.route);
  routeNotice = parsed.notice;
  canonicalizeRoute();
  render();
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
      if (view) goTo(state.active.id, view);
      return;
    }
    case "lang":
      toggleLang();
      render();
      announce(`${getLang() === "ko" ? "한국어" : "English"}`);
      return;
    case "start":
      if (state.active.id === 0) state.active.machine.started = true;
      goTo(1, state.view);
      return;
    case "dismiss":
      state.ui.introDismissed = true;
      if (state.active.id === 0) state.ui.tourStep = 0;
      render();
      document.getElementById("main-content")?.focus();
      announce(t("announceDismiss"));
      return;
    case "tour-next": {
      if (state.ui.tourStep === null) return;
      const next = state.ui.tourStep + 1;
      state.ui.tourStep = next >= tourSteps.length ? null : next;
      render();
      if (state.ui.tourStep === null) {
        document.getElementById("main-content")?.focus();
        announce(t("announceTourDone"));
      } else {
        document.getElementById("tour-next")?.focus();
        announce(t(tourSteps[state.ui.tourStep]!.body));
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
    if (target.value === "0" || target.value === "1") goTo(Number(target.value) as ChapterId, state.view);
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

canonicalizeRoute();
render();
if (routeNotice) announce(routeNotice);
