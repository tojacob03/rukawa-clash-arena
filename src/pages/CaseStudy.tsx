import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { marked } from "marked";
import { ArrowLeft } from "lucide-react";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import { caseStudiesBySlug } from "@/data/caseStudies";

const CaseStudy = () => {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? caseStudiesBySlug[slug] : undefined;

  const html = useMemo(() => (study ? marked.parse(study.content, { async: false }) : ""), [study]);

  if (!study) {
    return <Navigate to="/work" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <article className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/work"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to case studies
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.22em] text-clash-gold">{study.eyebrow}</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">{study.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{study.summary}</p>

          <div
            className="prose prose-invert prose-headings:font-bold prose-headings:text-foreground prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-clash-gold mt-12 max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div className="mt-16 border-t border-border/50 pt-8">
            <Link
              to="/#contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-clash-gold transition-colors hover:text-foreground"
            >
              Talk about your set prep →
            </Link>
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default CaseStudy;
