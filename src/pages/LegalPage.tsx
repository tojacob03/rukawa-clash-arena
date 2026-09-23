import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { marked } from "marked";
import { ArrowLeft } from "lucide-react";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import impressum from "@/content/legal/impressum.md?raw";
import datenschutz from "@/content/legal/datenschutz.md?raw";

// Legal pages are written in German on purpose: the site is operated from
// Germany, so Impressum (§ 5 DDG) and Datenschutzerklärung (DSGVO) are
// provided in German. Content lives in src/content/legal/*.md.
const pages = {
  impressum: { title: "Impressum", content: impressum },
  datenschutz: { title: "Datenschutzerklärung", content: datenschutz },
} as const;

type LegalPageProps = { page: keyof typeof pages };

const LegalPage = ({ page }: LegalPageProps) => {
  const { title, content } = pages[page];
  // breaks: true keeps single line breaks (addresses) as <br>.
  const html = useMemo(() => marked.parse(content, { async: false, breaks: true }) as string, [content]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Rukawa Analytics`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <article lang="de" className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="mt-8 text-4xl font-semibold gradient-primary bg-clip-text text-transparent sm:text-5xl">
            {title}
          </h1>
          <div
            className="prose prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-clash-gold mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default LegalPage;
