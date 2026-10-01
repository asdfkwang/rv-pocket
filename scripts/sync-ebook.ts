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

const readme = await Bun.file(ROOT + "ebook/README.md").text();
const entries = [...readme.matchAll(/- \[(Chapter \d+ — [^\]]+)\]\((chapters\/[^)]+)\)/g)];
if (entries.length === 0) throw new Error("No TOC entries found in ebook/README.md");

const chapters = [];
for (const [, title, file] of entries) {
  if (!title || !file) throw new Error("Bad TOC entry");
  const md = await Bun.file(ROOT + "ebook/" + file).text();
  const num = title.match(/Chapter (\d+)/)![1]!;
  const slug = file.replace(/^chapters\//, "").replace(/\.md$/, "");
  const html = await marked.parse(md, { async: false }) as string;
  const { html: withIds, headings } = addHeadingIds(html, new Set());
  chapters.push({ slug, num, title, html: withIds, headings, text: md });
}

const out = `// Generated from ebook/*.md by bun run sync-ebook. Do not edit.
export interface EbookHeading { id: string; text: string; depth: number }
export interface EbookChapter { slug: string; num: string; title: string; html: string; headings: EbookHeading[]; text: string }
export const EBOOK_CHAPTERS: readonly EbookChapter[] = ${JSON.stringify(chapters)};
`;

await Bun.write(ROOT + "src/ebook-content.ts", out);
console.log(`ebook: ${chapters.length} chapters -> src/ebook-content.ts`);
