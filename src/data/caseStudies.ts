export interface CaseStudy {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  date: string;
  /** Raw markdown body (frontmatter stripped) - render with `marked`. */
  content: string;
}

// Every .md file under src/content/case-studies/ becomes one case study.
// To add a new one: create a new file there with the same frontmatter shape
// (slug, eyebrow, title, summary, date) and a markdown body below the second
// "---". No code changes needed - it shows up on /work automatically.
const files = import.meta.glob("/src/content/case-studies/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const [, frontmatter, content] = match;
  const data: Record<string, string> = {};
  for (const line of frontmatter.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) data[key] = value;
  }
  return { data, content: content.trim() };
}

export const caseStudies: CaseStudy[] = Object.values(files)
  .map((raw) => {
    const { data, content } = parseFrontmatter(raw);
    if (!data.slug || !data.title) return null;
    return {
      slug: data.slug,
      eyebrow: data.eyebrow ?? "",
      title: data.title,
      summary: data.summary ?? "",
      date: data.date ?? "",
      content,
    };
  })
  .filter((s): s is CaseStudy => s !== null)
  .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

export const caseStudiesBySlug: Record<string, CaseStudy> = Object.fromEntries(
  caseStudies.map((s) => [s.slug, s]),
);
