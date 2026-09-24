import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://rukawaanalytics.com";
const SITE_NAME = "Rukawa Analytics";
const WORK_TITLE = `Case Studies | ${SITE_NAME}`;
const WORK_DESCRIPTION =
  "Writeups on the systems behind my work: the Clash Royale analysis tooling behind Solo CRL prep, and data projects beyond esports.";

// Standalone project pages outside /work. They get the same prerendered head
// as the case studies, so a shared link previews the project itself instead
// of the Clash Royale homepage.
const PROJECT_PAGES = [
  {
    route: "strompreis",
    title: `Strompreis-Kompass | ${SITE_NAME}`,
    description:
      "Wann ist Strom am günstigsten? Börsenstrompreise, Wind- und Solarerzeugung und negative Preise, laufend aktualisiert aus den offiziellen Daten der Bundesnetzagentur (SMARD).",
    image: "/og/strompreis.png",
  },
  {
    route: "race-strategy",
    title: `Race Strategy Lab | ${SITE_NAME}`,
    description:
      "Tyre strategy, tyre wear, race pace and pit stop analysis for every Grand Prix since 2023, built on OpenF1 data.",
    image: "/og/race-strategy.png",
  },
  {
    route: "off-the-clock",
    title: `Off the clock | ${SITE_NAME}`,
    description:
      "What Till Oscar Jacob (Rukawa) does away from battle logs: No-Gi grappling, espresso, detective novels and fragrance.",
    image: "/og/default.jpg",
  },
];

interface CaseStudyMeta {
  slug: string;
  title: string;
  summary: string;
  date: string;
  ogImage?: string;
}

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    data[line.slice(0, separatorIndex).trim()] = line.slice(separatorIndex + 1).trim();
  }
  return data;
}

function loadCaseStudies(root: string): CaseStudyMeta[] {
  const dir = path.join(root, "src/content/case-studies");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const data = parseFrontmatter(raw);
      return {
        slug: data.slug ?? f.replace(/\.md$/, ""),
        title: data.title ?? "",
        summary: data.summary ?? "",
        date: data.date ?? "",
        ogImage: data.ogImage || undefined,
      };
    })
    .filter((s) => s.title)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Attribute-safe escaping for values injected into the HTML head.
const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const absoluteUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

function buildSitemap(studies: CaseStudyMeta[]): string {
  const staticUrls = [
    { loc: "/", priority: "1.0" },
    { loc: "/work", priority: "0.8" },
    ...PROJECT_PAGES.map((page) => ({ loc: `/${page.route}`, priority: "0.8" })),
  ];
  const urls = [
    ...staticUrls.map(
      (u) => `  <url>\n    <loc>${SITE_URL}${u.loc}</loc>\n    <priority>${u.priority}</priority>\n  </url>`,
    ),
    ...studies.map(
      (s) =>
        `  <url>\n    <loc>${SITE_URL}/work/${s.slug}</loc>${
          s.date ? `\n    <lastmod>${s.date}</lastmod>` : ""
        }\n    <priority>0.7</priority>\n  </url>`,
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
    "\n",
  )}\n</urlset>\n`;
}

function buildRss(studies: CaseStudyMeta[]): string {
  const items = studies
    .map((s) => {
      const link = `${SITE_URL}/work/${s.slug}`;
      const pubDate = s.date ? new Date(s.date).toUTCString() : new Date().toUTCString();
      return `    <item>\n      <title>${escapeXml(s.title)}</title>\n      <link>${link}</link>\n      <guid>${link}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${escapeXml(
        s.summary,
      )}</description>\n    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${SITE_NAME} — Case Studies</title>\n    <link>${SITE_URL}/work</link>\n    <description>Writeups on the systems behind my work: Clash Royale analysis tooling and data projects beyond esports.</description>\n    <language>en</language>\n${items}\n  </channel>\n</rss>\n`;
}

interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type: "website" | "article";
  publishedTime?: string;
}

/**
 * Takes the built dist/index.html and swaps in page-specific head tags.
 *
 * Why: the site renders client-side, so every URL is served the same
 * index.html. Link previews (LinkedIn, Discord, X, Slack) and most crawlers
 * don't execute JavaScript - they read the raw HTML head. Without this, every
 * case study link would preview as the homepage.
 *
 * Existing tags are removed first and then re-added as one block, rather
 * than edited in place, so the result never ends up with duplicates.
 */
function renderPage(template: string, meta: PageMeta): string {
  const stripped = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(
      /<meta\s+(?:name|property)="(?:description|og:site_name|og:title|og:description|og:url|og:type|og:image|twitter:title|twitter:description|twitter:image|article:published_time)"[^>]*>/g,
      "",
    )
    .replace(/<link\s+rel="canonical"[^>]*>/g, "");

  const tags = [
    `<title>${escapeAttr(meta.title)}</title>`,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`,
    `<link rel="canonical" href="${escapeAttr(meta.url)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`,
    `<meta property="og:url" content="${escapeAttr(meta.url)}" />`,
    `<meta property="og:image" content="${escapeAttr(meta.image)}" />`,
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(meta.image)}" />`,
    meta.publishedTime ? `<meta property="article:published_time" content="${escapeAttr(meta.publishedTime)}" />` : "",
  ]
    .filter(Boolean)
    .map((t) => `    ${t}`)
    .join("\n");

  return stripped.replace("</head>", `${tags}\n  </head>`);
}

function writePage(outDir: string, routePath: string, html: string) {
  const dir = path.join(outDir, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

/**
 * At build time, from src/content/case-studies/*.md and PROJECT_PAGES:
 *  - /sitemap.xml and /rss.xml
 *  - /work/index.html, /work/<slug>/index.html and /<project>/index.html
 *    with their own title, description, canonical URL and social preview tags
 *
 * Add a new case study .md file and all of it regenerates on the next
 * build - no manual step.
 */
export function feedsPlugin(): Plugin {
  return {
    name: "generate-feeds",
    apply: "build",
    closeBundle() {
      const root = process.cwd();
      const outDir = path.join(root, "dist");
      if (!fs.existsSync(outDir)) return;

      const studies = loadCaseStudies(root);
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), buildSitemap(studies));
      fs.writeFileSync(path.join(outDir, "rss.xml"), buildRss(studies));

      const templatePath = path.join(outDir, "index.html");
      if (!fs.existsSync(templatePath)) return;
      const template = fs.readFileSync(templatePath, "utf-8");

      // Case studies without their own ogImage inherit the site-wide one, so
      // fixing the homepage preview image fixes every page at once.
      const defaultImage =
        template.match(/<meta\s+property="og:image"\s+content="([^"]*)"/)?.[1] ?? `${SITE_URL}/favicon.svg`;

      writePage(
        outDir,
        "work",
        renderPage(template, {
          title: WORK_TITLE,
          description: WORK_DESCRIPTION,
          url: `${SITE_URL}/work`,
          image: defaultImage,
          type: "website",
        }),
      );

      for (const page of PROJECT_PAGES) {
        writePage(
          outDir,
          page.route,
          renderPage(template, {
            title: page.title,
            description: page.description,
            url: `${SITE_URL}/${page.route}`,
            image: absoluteUrl(page.image),
            type: "website",
          }),
        );
      }

      for (const study of studies) {
        writePage(
          outDir,
          path.join("work", study.slug),
          renderPage(template, {
            title: `${study.title} | ${SITE_NAME}`,
            description: study.summary,
            url: `${SITE_URL}/work/${study.slug}`,
            image: study.ogImage ? absoluteUrl(study.ogImage) : defaultImage,
            type: "article",
            publishedTime: study.date || undefined,
          }),
        );
      }
    },
  };
}
