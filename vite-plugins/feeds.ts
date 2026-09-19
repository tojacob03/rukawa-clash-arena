import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://rukawaanalytics.com";

interface CaseStudyMeta {
  slug: string;
  title: string;
  summary: string;
  date: string;
}

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
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

function buildSitemap(studies: CaseStudyMeta[]): string {
  const staticUrls = [
    { loc: "/", priority: "1.0" },
    { loc: "/work", priority: "0.8" },
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

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Rukawa Analytics — Case Studies</title>\n    <link>${SITE_URL}/work</link>\n    <description>Writeups on Clash Royale analysis tooling and Solo CRL prep.</description>\n    <language>en</language>\n${items}\n  </channel>\n</rss>\n`;
}

/**
 * Generates /sitemap.xml and /rss.xml from src/content/case-studies/*.md at
 * build time. Add a new case study .md file and both regenerate on the next
 * build automatically - no manual step.
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
    },
  };
}
