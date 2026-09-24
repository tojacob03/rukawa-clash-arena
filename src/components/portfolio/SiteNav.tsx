import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { scrollToSection, scrollToTop } from "@/lib/smoothScroll";

const links = [
  { id: "work", label: "Work" },
  { id: "projects", label: "Projects" },
  { id: "method", label: "Method" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

const SiteNav = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Section ids only exist on the homepage. From any other route (e.g. a
  // case study), navigate home with the target hash instead, and let
  // Index.tsx's hash-scroll effect handle scrolling once it has mounted.
  // On the homepage, scrolling goes through Lenis (scrollToSection) so it
  // uses the same smooth motion as wheel scrolling instead of the browser's
  // own smooth-scroll, which would fight Lenis' interpolation.
  const goToSection = (id: string) => {
    setOpen(false);
    if (location.pathname === "/") {
      // The open mobile menu sits in the sticky nav and pushes the page
      // down; measuring the target while it's still open made every jump
      // land short by the menu's height. Scroll once it has closed.
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(id)));
    } else {
      navigate(`/#${id}`);
    }
  };

  const goHome = () => {
    setOpen(false);
    if (location.pathname === "/") {
      scrollToTop();
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16 h-14 flex items-center justify-between gap-4">
        <button type="button" onClick={goHome} className="text-lg font-bold text-foreground">
          Rukawa
        </button>
        <div className="hidden sm:flex items-center gap-6">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => goToSection(link.id)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
          <span className="h-4 w-px bg-border" aria-hidden />
          <Link
            to="/off-the-clock"
            className={`text-sm transition-colors ${
              location.pathname === "/off-the-clock" ? "text-clash-gold" : "text-muted-foreground hover:text-clash-gold"
            }`}
          >
            Off the clock
          </Link>
        </div>
        <button
          type="button"
          className="sm:hidden text-sm text-muted-foreground"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>
      {open && (
        <div className="sm:hidden border-t border-border/50 px-5 py-3 flex flex-col gap-3 bg-background">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => goToSection(link.id)}
              className="text-left text-sm text-muted-foreground"
            >
              {link.label}
            </button>
          ))}
          <Link
            to="/off-the-clock"
            onClick={() => setOpen(false)}
            className="border-t border-border/50 pt-3 text-sm text-clash-gold"
          >
            Off the clock
          </Link>
        </div>
      )}
    </nav>
  );
};

export default SiteNav;
