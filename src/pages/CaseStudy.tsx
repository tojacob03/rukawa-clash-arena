import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import { caseStudies } from "@/data/caseStudies";

const CaseStudy = () => {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? caseStudies[slug] : undefined;

  if (!study) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <article className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/#work"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to overview
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.22em] text-clash-gold">{study.eyebrow}</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">{study.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{study.summary}</p>

          <div className="mt-12 space-y-10">
            {study.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">{section.heading}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>

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
