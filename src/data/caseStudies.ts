export interface CaseStudyStat {
  value: string;
  label: string;
}

export interface CaseStudy {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  date: string;
  /** Headline number shown large on the /work card and the detail page. */
  metric?: string;
  metricLabel?: string;
  /** Secondary numbers shown smaller beside the headline metric. */
  stats: CaseStudyStat[];
  role?: string;
  duration?: string;
  stack: string[];
  /** Absolute or site-relative URL for the social preview image. */
  ogImage?: string;
  /** Language of the writeup - switches the page's labels and date format. */
  lang: "en" | "de";
  /** Pinned to the top of /work regardless of date. */
  featured: boolean;
  /** Closing link under the article; defaults to the contact section. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Raw markdown body (frontmatter stripped) - render with `marked`. */
  content: string;
}

// Every .md file under src/content/case-studies/ becomes one case study.
// To add a new one, create a file there with frontmatter like:
//
//   ---
//   slug: my-study
//   eyebrow: Data quality
//   title: The title
//   summary: One or two sentences.
//   date: 2026-10-01
//   metric: 1,000                          (optional)
//   metricLabel: battles per profile       (optional)
//   stats: 3 | duel slots; 12 | modes      (optional, "value | label" pairs split by ";")
//   role: Design, build & analysis         (optional)
//   duration: 2021 – present               (optional)
//   stack: React, TypeScript, Supabase     (optional, comma separated)
//   ogImage: /og/my-study.png              (optional, falls back to the site default)
//   lang: de                               (optional, "en" or "de", default "en")
//   ctaLabel: Open the dashboard →         (optional, closing link text)
//   ctaHref: /strompreis                   (optional, closing link target, default /#contact)
//   featured: true                         (optional, pins it to the top of /work)
//   ---
//
// No code changes needed - it shows up on /work, in the sitemap, the RSS
// feed and gets its own share preview automatically on the next build.
const files = import.meta.glob("/src/content/case-studies/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const [, frontmatter, content] = match;
  const data: Record<string, string> = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) data[key] = value;
  }
  return { data, content: content.trim() };
}

const splitList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const parseStats = (value?: string): CaseStudyStat[] =>
  (value ?? "")
    .split(";")
    .map((pair) => {
      const [v, ...rest] = pair.split("|");
      return { value: (v ?? "").trim(), label: rest.join("|").trim() };
    })
    .filter((s) => s.value && s.label);

export const caseStudies: CaseStudy[] = Object.values(files)
  .map((raw) => {
    const { data, content } = parseFrontmatter(raw);
    if (!data.slug || !data.title) return null;
    const lang: CaseStudy["lang"] = data.lang === "de" ? "de" : "en";
    return {
      slug: data.slug,
      eyebrow: data.eyebrow ?? "",
      title: data.title,
      summary: data.summary ?? "",
      date: data.date ?? "",
      metric: data.metric || undefined,
      metricLabel: data.metricLabel || undefined,
      stats: parseStats(data.stats),
      role: data.role || undefined,
      duration: data.duration || undefined,
      stack: splitList(data.stack),
      ogImage: data.ogImage || undefined,
      lang,
      ctaLabel: data.ctaLabel || undefined,
      ctaHref: data.ctaHref || undefined,
      featured: data.featured === "true",
      content,
    };
  })
  .filter((s): s is NonNullable<typeof s> => s !== null)
  // Featured first (the esports work leads /work), then newest first.
  .sort((a, b) => Number(b.featured) - Number(a.featured) || (a.date < b.date ? 1 : -1));

export const caseStudiesBySlug: Record<string, CaseStudy> = Object.fromEntries(
  caseStudies.map((s) => [s.slug, s]),
);
