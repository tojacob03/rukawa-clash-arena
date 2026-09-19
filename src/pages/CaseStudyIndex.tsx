import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
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
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">Behind the systems</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Deeper writeups on the tooling and decisions behind the work above - updated occasionally, not on a
            schedule.
          </p>

          <div className="mt-12 divide-y divide-border/50">
            {caseStudies.map((study) => (
              <Link
                key={study.slug}
                to={`/work/${study.slug}`}
                className="group flex flex-col gap-2 py-8 first:pt-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-foreground transition-colors group-hover:text-clash-gold sm:text-2xl">
                    {study.title}
                  </h2>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-clash-gold" />
                </div>
                <p className="max-w-2xl leading-relaxed text-muted-foreground">{study.summary}</p>
                {study.date && (
                  <span className="text-xs uppercase tracking-widest text-muted-foreground/70">{study.date}</span>
                )}
              </Link>
            ))}

            {caseStudies.length === 0 && (
              <p className="py-8 text-muted-foreground">Nothing published here yet - check back soon.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CaseStudyIndex;
