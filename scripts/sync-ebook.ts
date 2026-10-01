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

async function parseCheck(md: string): Promise<{ intro: string; questions: { html: string; plain: string; hintHtml: string | null }[] }> {
  const sec = md.split(/^## Check\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  const items: { text: string[]; hint: string[] }[] = [];
  const introLines: string[] = [];
  let current: { text: string[]; hint: string[] } | null = null;
  for (const line of sec.split("\n")) {
    const qm = line.match(/^\d+\.\s+(.*)$/);
    const hm = line.match(/^\s*>\s*Hint:\s*(.*)$/i);
    if (qm) {
      current = { text: [qm[1]!], hint: [] };
      items.push(current);
    } else if (hm && current) {
      current.hint.push(hm[1]!);
    } else if (current && line.trim() !== "") {
      current.text.push(line.trim());
    } else if (!current) {
      introLines.push(line);
    }
  }
  const intro = (await marked.parse(introLines.join("\n").trim(), { async: false }) as string).trim();
  const questions = [];
  for (const item of items) {
    const html = (await marked.parse(item.text.join("\n").trim(), { async: false }) as string).trim();
    const hintHtml = item.hint.length
      ? (await marked.parse(item.hint.join("\n").trim(), { async: false }) as string).trim()
      : null;
    questions.push({ html, plain: stripTags(html), hintHtml });
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
export interface EbookCheckQuestion { html: string; plain: string; hintHtml: string | null }
export interface EbookHeading { id: string; text: string; depth: number }
export interface EbookChapter { slug: string; num: string; title: string; html: string; headings: EbookHeading[]; text: string; checkIntro: string; check: EbookCheckQuestion[] }
export const EBOOK_CHAPTERS: readonly EbookChapter[] = ${JSON.stringify(chapters)};
`;

await Bun.write(ROOT + "src/ebook-content.ts", out);
console.log(`ebook: ${chapters.length} chapters -> src/ebook-content.ts`);
