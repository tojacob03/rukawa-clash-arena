import { useState } from "react";

const links = [
  { id: "work", label: "Work" },
  { id: "method", label: "Method" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

const SiteNav = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-lg font-bold text-foreground"
        >
          Rukawa
        </button>
        <div className="hidden sm:flex items-center gap-6">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollTo(link.id)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
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
              onClick={() => scrollTo(link.id)}
              className="text-left text-sm text-muted-foreground"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default SiteNav;
