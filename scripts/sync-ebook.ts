import { marked } from "marked";

// Single source of truth: ebook/*.md -> src/ebook-content.ts (gitignored).
// Order follows the Table of Contents in ebook/README.md.

const ROOT = new URL("..", import.meta.url).pathname;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/(^-|-$)/g, "");
}

function addHeadingIds(html: string, used: Set<string>): { html: string; headings: { id: string; text: string; depth: number }[] } {
  const headings: { id: string; text: string; depth: number }[] = [];
  const out = html.replace(/<h([23])>(.*?)<\/h\1>/gs, (_m, depth: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "");
    const base = slugify(text) || "section";
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    headings.push({ id, text, depth: Number(depth) });
    return `<h${depth} id="${id}" tabindex="-1">${inner}</h${depth}>`;
  });
  return { html: out, headings };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// A Check is one H2 section. Preserve everything following it, including
// chapters without a Check, and ignore heading-like text inside code fences.
export function splitCheck(md: string): { before: string; check: string; after: string } {
  const lines = md.split(/\r?\n/);
  let start = -1;
  let end = lines.length;
  let fence = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker) {
      if (!fence) fence = marker[1]!;
      else if (marker[1]![0] === fence[0] && marker[1]!.length >= fence.length && !marker[2]!.trim()) fence = "";
      continue;
    }
    if (fence) continue;
    if (start === -1 && /^## (?:Check|체크)\s*$/.test(line)) start = i;
    else if (start !== -1 && /^##\s+/.test(line)) { end = i; break; }
  }
  if (start === -1) return { before: md, check: "", after: "" };
  return { before: lines.slice(0, start).join("\n"), check: lines.slice(start + 1, end).join("\n"), after: lines.slice(end).join("\n") };
}

export async function parseCheck(md: string): Promise<{ intro: string; questions: { html: string; plain: string; hintHtml: string | null; choices: { id: string; html: string }[]; answers: string[]; explanationHtml: string | null; kind: "open" | "single" | "multi" }[] }> {
  const sec = splitCheck(md).check;
  const items: { text: string[]; hint: string[]; choices: { id: string; lines: string[] }[]; answer: string | null; explanation: string[] }[] = [];
  const introLines: string[] = [];
  let current: { text: string[]; hint: string[]; choices: { id: string; lines: string[] }[]; answer: string | null; explanation: string[] } | null = null;
  let field: "text" | "choice" | "explanation" | null = null;
  for (const line of sec.split("\n")) {
    const qm = line.match(/^\d+\.\s+(.*)$/);
    const cm = line.match(/^\s*-\s*([A-Z])\)\s*(.*)$/);
    const am = line.match(/^\s*-\s*(?:Answer|정답):\s*(.+)$/i);
    const em = line.match(/^\s*-\s*(?:Explanation|해설):\s*(.*)$/i);
    const hm = line.match(/^\s*>\s*Hint:\s*(.*)$/i);
    if (qm) {
      current = { text: [qm[1]!], hint: [], choices: [], answer: null, explanation: [] };
      items.push(current);
      field = "text";
    } else if (cm && current) {
      current.choices.push({ id: cm[1]!.toUpperCase(), lines: [cm[2]!] });
      field = "choice";
    } else if (am && current) {
      current.answer = am[1]!.trim().toUpperCase();
      field = null;
    } else if (em && current) {
      if (em[1]!.trim()) current.explanation.push(em[1]!.trim());
      field = "explanation";
    } else if (hm && current) {
      current.hint.push(hm[1]!);
    } else if (current && line.trim() !== "" && field && field !== null) {
      if (field === "text") current.text.push(line.trim());
      else if (field === "explanation") current.explanation.push(line.trim());
      else if (field === "choice") current.choices[current.choices.length - 1]!.lines.push(line.trim());
    } else if (!current) {
      introLines.push(line);
    }
  }
  const intro = (await marked.parse(introLines.join("\n").trim(), { async: false }) as string).trim();
  const questions: { html: string; plain: string; hintHtml: string | null; choices: { id: string; html: string }[]; answers: string[]; explanationHtml: string | null; kind: "open" | "single" | "multi" }[] = [];
  for (const item of items) {
    const html = (await marked.parse(item.text.join("\n").trim(), { async: false }) as string).trim();
    const hintHtml = item.hint.length
      ? (await marked.parse(item.hint.join("\n").trim(), { async: false }) as string).trim()
      : null;
    const explanationHtml = item.explanation.length
      ? (await marked.parse(item.explanation.join("\n").trim(), { async: false }) as string).trim()
      : null;
    const choices = [];
    for (const c of item.choices) {
      choices.push({ id: c.id, html: (await marked.parse(c.lines.join("\n").trim(), { async: false }) as string).trim() });
    }
    const answers = item.answer && item.answer !== "OPEN"
      ? item.answer.split(/[\s,]+/).map((a) => a.trim().toUpperCase()).filter(Boolean)
      : [];
    const kind = answers.length === 0 ? "open" : answers.length === 1 ? "single" : "multi";
    questions.push({ html, plain: stripTags(html), hintHtml, choices, answers, explanationHtml, kind });
  }
  return { intro, questions };
}

interface ChapterEntry { num: string; file: string }

async function readToc(lang: "en" | "ko"): Promise<ChapterEntry[]> {
  const readmePath = lang === "ko" ? ROOT + "ebook/ko/README.md" : ROOT + "ebook/README.md";
  const readme = await Bun.file(readmePath).text();
  // Accept both "Chapter 01 — Title" and "챕터 01 — Title" link labels.
  const entries = [...readme.matchAll(/- \[(?:Chapter|챕터) (\d+)[^\]]*\]\(([^)]+)\)/g)];
  if (entries.length === 0) throw new Error(`No TOC entries found in ${readmePath}`);
  return entries.map(([, num, file]) => ({ num: num!, file: file! }));
}

async function buildChapters(entries: ChapterEntry[], partial = false): Promise<unknown[]> {
  const chapters = [];
  for (const { num, file } of entries) {
    const path = ROOT + "ebook/" + file;
    if (!(await Bun.file(path).exists())) {
      if (partial) {
        // Keep the English chapter so ordering and the TOC stay stable.
        const enFile = file.replace(/^ko\//, "");
        const md = await Bun.file(ROOT + "ebook/" + enFile).text();
        chapters.push(await buildOne(enFile, num, md));
        continue;
      }
      throw new Error(`Missing ebook file: ${file}`);
    }
    const md = await Bun.file(path).text();
    chapters.push(await buildOne(file, num, md));
  }
  return chapters;
}

export async function buildOne(file: string, num: string, md: string) {
  const slug = file.replace(/^ko\//, "").replace(/^chapters\//, "").replace(/\.md$/, "");
  const title = md.split("\n")[0]?.replace(/^#\s*/, "").trim() ?? `Chapter ${num}`;
  const sections = splitCheck(md);
  const used = new Set<string>();
  const render = async (source: string) => {
    const html = await marked.parse(source, { async: false }) as string;
    const linked = html.replace(/<a href="(?:\.\/)?(?:chapters\/)?(\d{2}_[a-z0-9_]+)\.md">(.*?)<\/a>/gs,
      '<button class="text-button" data-action="ebook-open" data-slug="$1">$2</button>');
    return addHeadingIds(linked, used);
  };
  const before = await render(sections.before);
  const after = await render(sections.after);
  const part = md.match(/^> \*\*(Part [^*]+)\*\*/m)?.[1] ?? "";
  const { intro: checkIntro, questions: check } = await parseCheck(md);
  return { slug, num, title, part, html: before.html, afterCheckHtml: after.html, headings: [...before.headings, ...after.headings], text: md, checkIntro, check };
}

export async function syncEbook() {
const enChapters = await buildChapters(await readToc("en"));

// Korean book is optional; fall back to English when ebook/ko is absent.
let koChapters: unknown[] = enChapters;
try {
  koChapters = await buildChapters(await readToc("ko"), true);
} catch (error) {
  console.log("ebook/ko unavailable, using English book for all languages:", error instanceof Error ? error.message : error);
}

const out = `// Generated from ebook/*.md by bun run sync-ebook. Do not edit.
export interface EbookChoice { id: string; html: string }
export interface EbookCheckQuestion { html: string; plain: string; hintHtml: string | null; choices: EbookChoice[]; answers: string[]; explanationHtml: string | null; kind: "open" | "single" | "multi" }
export interface EbookHeading { id: string; text: string; depth: number }
export interface EbookChapter { slug: string; num: string; title: string; part: string; html: string; afterCheckHtml: string; headings: EbookHeading[]; text: string; checkIntro: string; check: EbookCheckQuestion[] }
export const EBOOK_CHAPTERS_EN: readonly EbookChapter[] = ${JSON.stringify(enChapters)};
export const EBOOK_CHAPTERS_KO: readonly EbookChapter[] = ${JSON.stringify(koChapters)};
`;

await Bun.write(ROOT + "src/ebook-content.ts", out);
console.log(`ebook: ${enChapters.length} en chapters, ${koChapters.length} ko chapters -> src/ebook-content.ts`);
}

if (import.meta.main) await syncEbook();
