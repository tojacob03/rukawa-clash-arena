import { useEffect, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { marked } from "marked";
import { ArrowLeft } from "lucide-react";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import { caseStudiesBySlug } from "@/data/caseStudies";

// Page chrome in the writeup's own language, so a German case study doesn't
// open with "Back to case studies" and close with a set-prep pitch.
const COPY = {
  en: {
    locale: "en-GB",
    back: "Back to case studies",
    role: "Role",
    duration: "Duration",
    stack: "Stack",
    published: "Published",
    cta: "Talk about your set prep →",
  },
  de: {
    locale: "de-DE",
    back: "Zurück zu den Case Studies",
    role: "Rolle",
    duration: "Zeitraum",
    stack: "Stack",
    published: "Veröffentlicht",
    cta: "Kontakt aufnehmen →",
  },
} as const;

const formatDate = (iso: string, locale: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
};

const CaseStudy = () => {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? caseStudiesBySlug[slug] : undefined;

  const html = useMemo(() => (study ? marked.parse(study.content, { async: false }) : ""), [study]);

  // Tab title during in-app navigation. Crawlers and link previews get the
  // same data from the prerendered /work/<slug>/index.html instead, since
  // they don't run this JavaScript.
  useEffect(() => {
    if (!study) return;
    const previous = document.title;
    document.title = `${study.title} | Rukawa Analytics`;
    return () => {
      document.title = previous;
    };
  }, [study]);

  if (!study) {
    return <Navigate to="/work" replace />;
  }

  const copy = COPY[study.lang];

  // Only render the rows the frontmatter actually fills - an empty "Role"
  // column looks worse than no column.
  const meta = [
    study.role && { label: copy.role, value: study.role },
    study.duration && { label: copy.duration, value: study.duration },
    study.stack.length > 0 && { label: copy.stack, value: study.stack.join(", ") },
    study.date && { label: copy.published, value: formatDate(study.date, copy.locale) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <article lang={study.lang} className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/work"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>

          {study.eyebrow && <p className="mt-8 label-caps text-clash-gold">{study.eyebrow}</p>}
          <h1 className="mt-4 text-display-md font-semibold gradient-primary bg-clip-text text-transparent">
            {study.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{study.summary}</p>

          {(study.metric || study.stats.length > 0) && (
            <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end">
              {study.metric && (
                <div>
                  <div className="tabular-stat text-6xl font-semibold tracking-tight text-clash-gold sm:text-7xl">
                    {study.metric}
                  </div>
                  {study.metricLabel && (
                    <div className="mt-2 text-sm text-muted-foreground">{study.metricLabel}</div>
                  )}
                </div>
              )}
              {study.stats.length > 0 && (
                <div className="flex flex-wrap gap-x-8 gap-y-4 sm:pb-1">
                  {study.stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="tabular-stat text-2xl font-semibold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {meta.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 overflow-hidden rounded-lg border border-border/50 sm:grid-cols-4">
              {meta.map((item, i) => (
                <div
                  key={item.label}
                  className={`px-4 py-3 ${i > 0 ? "border-l border-border/50" : ""} ${
                    i >= 2 ? "border-t border-border/50 sm:border-t-0" : ""
                  } ${i === 2 ? "border-l-0 sm:border-l" : ""}`}
                >
                  <dt className="label-caps text-muted-foreground/60">{item.label}</dt>
                  <dd className="mt-1 text-sm text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div
            className="prose prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-clash-gold mt-12 max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div className="mt-16 border-t border-border/50 pt-8">
            <Link
              to={study.ctaHref ?? "/#contact"}
              className="inline-flex items-center gap-2 text-sm font-medium text-clash-gold transition-colors hover:text-foreground"
            >
              {study.ctaLabel ?? copy.cta}
            </Link>
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default CaseStudy;
