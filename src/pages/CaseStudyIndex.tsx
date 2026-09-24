import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import { caseStudies } from "@/data/caseStudies";

const PAGE_TITLE = "Case Studies | Rukawa Analytics";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

const CaseStudyIndex = () => {
  // Keeps the tab title right during in-app navigation. Crawlers get the
  // same title from the prerendered /work/index.html (vite-plugins/feeds.ts).
  useEffect(() => {
    const previous = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="label-caps text-clash-gold">Case studies</p>
          <h1 className="mt-4 text-display-md font-semibold gradient-primary bg-clip-text text-transparent">
            Behind the systems
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Deeper writeups on the tooling and decisions behind the work – updated occasionally, not on a schedule.
          </p>

          <div className="mt-12 space-y-4">
            {caseStudies.map((study, index) => (
              <Link key={study.slug} to={`/work/${study.slug}`} className="group block">
                <Card className="gradient-card shadow-card border-border/50 p-6 transition-all duration-300 hover:shadow-glow sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground/40">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {study.eyebrow && <p className="label-caps text-clash-gold">{study.eyebrow}</p>}
                      </div>

                      <h2 className="mt-3 text-xl font-semibold text-foreground transition-colors group-hover:text-clash-gold sm:text-2xl">
                        {study.title}
                      </h2>
                      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{study.summary}</p>
                    </div>

                    {/* Headline metric - the number that should register
                        before anyone reads a word of the summary. */}
                    {study.metric && (
                      <div className="shrink-0 sm:text-right">
                        <div className="tabular-stat text-4xl font-semibold tracking-tight text-clash-gold sm:text-5xl">
                          {study.metric}
                        </div>
                        {study.metricLabel && (
                          <div className="mt-1 text-xs text-muted-foreground">{study.metricLabel}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {study.stats.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                      {study.stats.map((stat) => (
                        <div key={stat.label}>
                          <div className="tabular-stat text-lg font-semibold text-foreground">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground/70">
                      {study.role && <span>{study.role}</span>}
                      {study.stack.length > 0 && <span>{study.stack.join(" · ")}</span>}
                      {study.date && <span>{formatDate(study.date)}</span>}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors group-hover:text-clash-gold">
                      Read case study
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}

            {caseStudies.length === 0 && (
              <Card className="gradient-card border-border/50 p-8 text-center text-muted-foreground">
                Nothing published here yet – check back soon.
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CaseStudyIndex;
