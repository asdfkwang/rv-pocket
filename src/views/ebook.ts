import { currentChapter, type AppState } from "../app-state";
import { escapeHtml as e } from "./html";
import { EBOOK_CHAPTERS } from "../ebook-content";
import { EBOOK_BOOKMARKS } from "../ebook-bookmarks";

// EBOOK reader state lives outside episode state on purpose:
// the book is identical no matter which episode opens it.
let ebookSlug: string | null = null;
let ebookQuery = "";

export function getEbookSlug(): string {
  return ebookSlug ?? EBOOK_CHAPTERS[0]!.slug;
}

export function getEbookTitle(): string {
  const slug = getEbookSlug();
  return EBOOK_CHAPTERS.find((c) => c.slug === slug)?.title ?? slug;
}

export function openEbookChapter(slug: string): void {
  if (EBOOK_CHAPTERS.some((ch) => ch.slug === slug)) ebookSlug = slug;
}

export function getEbookQuery(): string {
  return ebookQuery;
}

export function setEbookQuery(query: string): void {
  ebookQuery = query;
}

export function getBookmarks(episodeId: number): string[] {
  return [...(EBOOK_BOOKMARKS[episodeId] ?? [])].filter((slug) =>
    EBOOK_CHAPTERS.some((ch) => ch.slug === slug),
  );
}

function tocList(activeSlug: string, bookmarks: readonly string[]): string {
  const q = ebookQuery.trim().toLowerCase();
  const items = EBOOK_CHAPTERS.filter((ch) =>
    !q || ch.title.toLowerCase().includes(q)
      || ch.headings.some((h) => h.text.toLowerCase().includes(q))
      || ch.text.toLowerCase().includes(q),
  );
  if (!items.length) return `<p class="muted">No chapters match.</p>`;
  return `<ul class="ebook-toc-list">${items.map((ch) =>
    `<li><button class="ebook-toc-item${ch.slug === activeSlug ? " active" : ""}" data-action="ebook-open" data-slug="${ch.slug}"${ch.slug === activeSlug ? ' aria-current="true"' : ""}>${bookmarks.includes(ch.slug) ? `<span class="ebook-star" aria-hidden="true">★ </span>` : ""}${e(ch.title)}</button></li>`,
  ).join("")}</ul>`;
}

export function renderEbookToc(activeSlug: string, bookmarks: readonly string[] = []): string {
  return tocList(activeSlug, bookmarks);
}

function bookmarkBox(episodeId: number): string {
  const slugs = getBookmarks(episodeId);
  if (!slugs.length) return "";
  const items = slugs.map((slug) => EBOOK_CHAPTERS.find((ch) => ch.slug === slug)!);
  return `<section class="ebook-bookmarks" aria-label="Recommended for this episode"><span class="eyebrow">FOR THIS EPISODE</span><ul>${items.map((ch) => `<li><button class="text-button" data-action="ebook-open" data-slug="${ch.slug}">★ ${e(ch.title)}</button></li>`).join("")}</ul></section>`;
}

export function renderEbook(state: AppState): string {
  const slug = getEbookSlug();
  const ch = EBOOK_CHAPTERS.find((c) => c.slug === slug) ?? EBOOK_CHAPTERS[0]!;
  const body = ch.html.replace(/^<h1>.*?<\/h1>\n?/, "");
  const episode = currentChapter(state);
  const bookmarks = getBookmarks(state.active.id);
  return `<div class="ebook">
    <aside class="ebook-side" aria-label="Book contents">
      <button id="ebook-back" class="text-button" data-action="view" data-view="workbench">← Back</button>
      ${bookmarkBox(state.active.id)}
      <label class="field-label" for="ebook-search">Search the book</label>
      <input id="ebook-search" type="search" value="${e(getEbookQuery())}" placeholder="Title, section, or word…" autocomplete="off">
      <nav aria-label="Chapters"><div id="ebook-toc">${tocList(slug, bookmarks)}</div></nav>
    </aside>
    <article class="ebook-page" aria-labelledby="ebook-title">
      <span class="eyebrow">RV POCKET FIELD EBOOK</span>
      <h1 id="ebook-title" tabindex="-1">${e(ch.title)}</h1>
      ${ch.headings.length ? `<nav class="ebook-sections" aria-label="On this page"><span class="eyebrow">ON THIS PAGE</span><ul>${ch.headings.map((h) => `<li><button class="text-button" data-action="ebook-section" data-target="${h.id}">${e(h.text)}</button></li>`).join("")}</ul></nav>` : ""}
      <div class="ebook-body">${body}</div>
      ${episode.quiz.length ? `<section class="quiz-section" aria-labelledby="quiz-heading"><span class="eyebrow">EPISODE CHECK</span><h2 id="quiz-heading">Check your understanding.</h2><p class="muted">Questions for the current episode. Try again as often as you like, or return to the repair whenever you are ready.</p>
        ${episode.quiz.map((question, index) => {
          const selected = state.ui.quizAnswers[question.id];
          const correct = selected === question.answerId;
          return `<fieldset class="quiz-question"><legend><span class="question-number">${String(index + 1).padStart(2, "0")}</span>${e(question.prompt)}</legend>
            <div class="quiz-options">${question.choices.map((choice) => `<label class="quiz-choice ${selected === choice.id ? "selected" : ""}"><input id="quiz-${e(question.id)}-${e(choice.id)}" type="radio" name="quiz-${e(question.id)}" data-question="${e(question.id)}" value="${e(choice.id)}" ${selected === choice.id ? "checked" : ""}><span>${e(choice.label)}</span></label>`).join("")}</div>
            ${selected ? `<p class="quiz-feedback ${correct ? "correct" : "retry"}"><strong>${correct ? "That's right." : "Not quite. Try again."}</strong> ${e(question.explanation)}</p>` : ""}</fieldset>`;
        }).join("")}
      </section>` : ""}
    </article>
  </div>`;
}
