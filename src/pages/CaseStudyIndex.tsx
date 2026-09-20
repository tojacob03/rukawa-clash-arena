import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import { caseStudies } from "@/data/caseStudies";

const CaseStudyIndex = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-clash-gold">Case studies</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl gradient-primary bg-clip-text text-transparent">
            Behind the systems
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Deeper writeups on the tooling and decisions behind the work above - updated occasionally, not on a
            schedule.
          </p>

          <div className="mt-12 space-y-4">
            {caseStudies.map((study) => (
              <Link key={study.slug} to={`/work/${study.slug}`} className="group block">
                <Card className="gradient-card shadow-card border-border/50 p-6 transition-all duration-300 hover:shadow-glow sm:p-8">
                  {study.eyebrow && (
                    <p className="text-xs uppercase tracking-[0.22em] text-clash-gold">{study.eyebrow}</p>
                  )}
                  <div className="mt-2 flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-foreground transition-colors group-hover:text-clash-gold sm:text-2xl">
                      {study.title}
                    </h2>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-clash-gold" />
                  </div>
                  <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{study.summary}</p>
                  {study.date && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground/70">
                      <Calendar className="h-3.5 w-3.5" />
                      {study.date}
                    </div>
                  )}
                </Card>
              </Link>
            ))}

            {caseStudies.length === 0 && (
              <Card className="gradient-card border-border/50 p-8 text-center text-muted-foreground">
                Nothing published here yet - check back soon.
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
