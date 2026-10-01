import { marked } from "marked";

// Single source of truth: ebook/*.md -> src/ebook-content.ts (gitignored).
// Order follows the Table of Contents in ebook/README.md.

const ROOT = new URL("..", import.meta.url).pathname;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function addHeadingIds(html: string, used: Set<string>): { html: string; headings: { id: string; text: string; depth: number }[] } {
  const headings: { id: string; text: string; depth: number }[] = [];
  const out = html.replace(/<h([23])>(.*?)<\/h\1>/gs, (_m, depth: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "");
    let id = slugify(text) || "section";
    let n = 2;
    while (used.has(id)) id = `${slugify(text)}-${n++}`;
    used.add(id);
    headings.push({ id, text, depth: Number(depth) });
    return `<h${depth} id="${id}">${inner}</h${depth}>`;
  });
  return { html: out, headings };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function parseCheck(md: string): Promise<{ intro: string; questions: { html: string; plain: string; hintHtml: string | null; choices: { id: string; html: string }[]; answers: string[]; explanationHtml: string | null; kind: "open" | "single" | "multi" }[] }> {
  const sec = md.split(/^## Check\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  const items: { text: string[]; hint: string[]; choices: { id: string; lines: string[] }[]; answer: string | null; explanation: string[] }[] = [];
  const introLines: string[] = [];
  let current: { text: string[]; hint: string[]; choices: { id: string; lines: string[] }[]; answer: string | null; explanation: string[] } | null = null;
  let field: "text" | "choice" | "explanation" | null = null;
  for (const line of sec.split("\n")) {
    const qm = line.match(/^\d+\.\s+(.*)$/);
    const cm = line.match(/^\s*-\s*([A-E])\)\s*(.*)$/);
    const am = line.match(/^\s*-\s*Answer:\s*(.+)$/i);
    const em = line.match(/^\s*-\s*Explanation:\s*(.*)$/i);
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

const readme = await Bun.file(ROOT + "ebook/README.md").text();
const entries = [...readme.matchAll(/- \[(Chapter \d+ — [^\]]+)\]\((chapters\/[^)]+)\)/g)];
if (entries.length === 0) throw new Error("No TOC entries found in ebook/README.md");

const chapters = [];
for (const [, title, file] of entries) {
  if (!title || !file) throw new Error("Bad TOC entry");
  const md = await Bun.file(ROOT + "ebook/" + file).text();
  const num = title.match(/Chapter (\d+)/)![1]!;
  const slug = file.replace(/^chapters\//, "").replace(/\.md$/, "");
  const bodyMd = md.split(/^## Check\s*$/m)[0]!;
  const html = await marked.parse(bodyMd, { async: false }) as string;
  const { html: withIds, headings } = addHeadingIds(html, new Set());
  const { intro: checkIntro, questions: check } = await parseCheck(md);
  chapters.push({ slug, num, title, html: withIds, headings, text: md, checkIntro, check });
}

const out = `// Generated from ebook/*.md by bun run sync-ebook. Do not edit.
export interface EbookChoice { id: string; html: string }
export interface EbookCheckQuestion { html: string; plain: string; hintHtml: string | null; choices: EbookChoice[]; answers: string[]; explanationHtml: string | null; kind: "open" | "single" | "multi" }
export interface EbookHeading { id: string; text: string; depth: number }
export interface EbookChapter { slug: string; num: string; title: string; html: string; headings: EbookHeading[]; text: string; checkIntro: string; check: EbookCheckQuestion[] }
export const EBOOK_CHAPTERS: readonly EbookChapter[] = ${JSON.stringify(chapters)};
`;

await Bun.write(ROOT + "src/ebook-content.ts", out);
console.log(`ebook: ${chapters.length} chapters -> src/ebook-content.ts`);
