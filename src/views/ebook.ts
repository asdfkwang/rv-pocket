import type { AppState } from "../app-state";
import { t } from "../i18n";
import { escapeHtml as e } from "./html";
import { EBOOK_CHAPTERS_EN, EBOOK_CHAPTERS_KO, type EbookChapter, type EbookCheckQuestion } from "../ebook-content";
import { getLang } from "../i18n";

/** The book is per-language, but the same content is used until ebook/ko exists. */
function book(): readonly EbookChapter[] {
  return getLang() === "ko" ? EBOOK_CHAPTERS_KO : EBOOK_CHAPTERS_EN;
}
import { EBOOK_BOOKMARKS } from "../ebook-bookmarks";

// EBOOK reader state lives outside episode state on purpose:
// the book is identical no matter which episode opens it.
let ebookSlug: string | null = null;
let ebookQuery = "";
let checkIndex = 0;
const checkWork: Record<string, { selected: string[]; checked: boolean }> = {};

function checkKey(): string {
  return `${getEbookSlug()}:${checkIndex}`;
}

export function getCheckSelection(): { selected: string[]; checked: boolean } {
  return checkWork[checkKey()] ?? { selected: [], checked: false };
}

export function toggleCheckChoice(id: string, multi: boolean): void {
  const key = checkKey();
  const cur = checkWork[key] ?? { selected: [], checked: false };
  const selected = multi
    ? cur.selected.includes(id) ? cur.selected.filter((s) => s !== id) : [...cur.selected, id]
    : [id];
  checkWork[key] = { selected, checked: false };
}

export function confirmCheck(): void {
  const key = checkKey();
  const cur = checkWork[key] ?? { selected: [], checked: false };
  checkWork[key] = { ...cur, checked: true };
}

export function isCheckCorrect(answers: readonly string[], selected: readonly string[]): boolean {
  return answers.length > 0 && answers.length === selected.length && answers.every((a) => selected.includes(a));
}

export function getEbookSlug(): string {
  return ebookSlug ?? book()[0]!.slug;
}

export function getEbookTitle(): string {
  const slug = getEbookSlug();
  return book().find((c) => c.slug === slug)?.title ?? slug;
}

export function openEbookChapter(slug: string): void {
  if (book().some((ch) => ch.slug === slug)) ebookSlug = slug;
  checkIndex = 0;
}

export function getCheckIndex(): number {
  return checkIndex;
}

export function getCheckTotal(): number {
  const ch = book().find((c) => c.slug === getEbookSlug());
  return ch?.check.length ?? 0;
}

export function getCurrentCheck(): EbookCheckQuestion | null {
  const ch = book().find((c) => c.slug === getEbookSlug());
  return ch?.check[checkIndex] ?? null;
}

export function stepCheck(delta: number, total: number): void {
  if (total <= 0) return;
  checkIndex = (checkIndex + delta + total) % total;
}

export function harderPrompt(chapterTitle: string, questionPlain: string): string {
  return t("ebookPromptFmt", { chapter: chapterTitle, question: questionPlain });
}

export function getEbookQuery(): string {
  return ebookQuery;
}

export function setEbookQuery(query: string): void {
  ebookQuery = query;
}

export function getBookmarks(episodeId: number): string[] {
  return [...(EBOOK_BOOKMARKS[episodeId] ?? [])].filter((slug) =>
    book().some((ch) => ch.slug === slug),
  );
}

function tocList(activeSlug: string, bookmarks: readonly string[]): string {
  const q = ebookQuery.trim().toLowerCase();
  const items = book().filter((ch) =>
    !q || ch.title.toLowerCase().includes(q)
      || ch.headings.some((h) => h.text.toLowerCase().includes(q))
      || ch.text.toLowerCase().includes(q),
  );
  if (!items.length) return `<p class="muted">${t("ebookNoMatch")}</p>`;
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
  const items = slugs.map((slug) => book().find((ch) => ch.slug === slug)!);
  return `<section class="ebook-bookmarks" aria-label="${t("ebookForThisEpisode")}"><span class="eyebrow">${t("ebookForThisEpisode")}</span><ul>${items.map((ch) => `<li><button class="text-button" data-action="ebook-open" data-slug="${ch.slug}">★ ${e(ch.title)}</button></li>`).join("")}</ul></section>`;
}

export function renderEbook(state: AppState): string {
  const slug = getEbookSlug();
  const ch = book().find((c) => c.slug === slug) ?? book()[0]!;
  const body = ch.html.replace(/^<h1>.*?<\/h1>\n?/, "");
  const bookmarks = getBookmarks(state.active.id);
  return `<div class="ebook">
    <aside class="ebook-side" aria-label="Book contents">
      <button id="ebook-back" class="text-button" data-action="view" data-view="station">${t("back")}</button>
      ${bookmarkBox(state.active.id)}
      <label class="field-label" for="ebook-search">${t("ebookSearchLabel")}</label>
      <input id="ebook-search" type="search" value="${e(getEbookQuery())}" placeholder="${t("ebookSearchPlaceholder")}" autocomplete="off">
      <nav aria-label="${t("ebookChaptersNav")}"><div id="ebook-toc">${tocList(slug, bookmarks)}</div></nav>
    </aside>
    <article class="ebook-page" aria-labelledby="ebook-title">
      <span class="eyebrow">${t("ebookWordmark")}</span>
      <h1 id="ebook-title" tabindex="-1">${e(ch.title)}</h1>
      <div class="ebook-body">${body}</div>
      ${ch.check.length ? `<section class="quiz-section" aria-labelledby="ebook-check-heading"><span id="ebook-check-heading" class="eyebrow">${t("ebookCheckFmt", { i: checkIndex + 1, n: ch.check.length })}</span>
        ${(() => {
          const q = ch.check[checkIndex]!;
          const work = getCheckSelection();
          const open = q.kind === "open";
          const graded = !open && work.checked;
          const correct = isCheckCorrect(q.answers, work.selected);
          const choices = open ? "" : `<div class="check-options" role="group" aria-label="${t("ebookChoicesLabel")}">${q.choices.map((c) => {
            const on = work.selected.includes(c.id);
            const mark = graded ? (q.answers.includes(c.id) ? "correct" : on ? "wrong" : "") : on ? "selected" : "";
            const label = c.html.replace(/^<p>(.*)<\/p>$/s, "$1");
            return `<label class="quiz-choice ${mark}"><input id="check-ch-${checkIndex}-${c.id}" type="${q.kind === "multi" ? "checkbox" : "radio"}" name="check-ch-${checkIndex}" data-check-choice="${c.id}" ${on ? "checked" : ""}><span><strong>${c.id})</strong> ${label}</span></label>`;
          }).join("")}</div>
          ${graded ? `<p class="quiz-feedback ${correct ? "correct" : "retry"}"><strong>${correct ? t("ebookCorrect") : t("ebookWrong")}</strong></p>` : ""}
          ${graded && q.explanationHtml ? `<div class="check-explanation">${q.explanationHtml}</div>` : ""}
          ${!open && !graded ? `<div class="check-actions"><button id="check-confirm" class="button primary" data-action="check-confirm">${t("ebookCheckButton")}</button></div>` : ""}`;
          return `<div id="check-question" class="check-question" tabindex="-1">${q.html}</div>
          ${choices}
          ${q.hintHtml ? `<details class="check-hint"><summary>${t("ebookHint")}</summary>${q.hintHtml}</details>` : ""}
          <div class="check-actions">
            <button id="check-prev" class="button secondary" data-action="check-prev" ${ch.check.length < 2 ? "disabled" : ""}>${t("ebookPrev")}</button>
            <button id="check-next" class="button secondary" data-action="check-next" ${ch.check.length < 2 ? "disabled" : ""}>${t("ebookNext")}</button>
          </div>
          <button id="check-harder" class="text-button" data-action="check-harder">${t("ebookHarder")} <span aria-hidden="true">⧉</span></button>`;
        })()}
      </section>` : ""}
    </article>
  </div>`;
}
