import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import SiteNav from "@/components/portfolio/SiteNav";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/#work", label: "The analysis system" },
  { to: "/work", label: "Case studies" },
  { to: "/#contact", label: "Contact" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    const previous = document.title;
    document.title = "Page not found | Rukawa Analytics";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-7xl flex-col justify-center px-5 py-20 sm:px-8">
        <p className="label-caps text-clash-gold">Error 404</p>
        <h1 className="mt-6 text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-foreground">
          This page
          <br />
          <span className="text-muted-foreground/70">burned a card.</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          There is nothing at <span className="font-mono text-foreground">{location.pathname}</span>. It may have
          moved, or the link was mistyped.
        </p>
        <ul className="mt-12 grid max-w-3xl gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="group flex items-center justify-between bg-background px-6 py-5 text-foreground transition-colors hover:bg-card"
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-clash-gold" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default NotFound;
