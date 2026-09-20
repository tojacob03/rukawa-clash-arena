import {
  SiReact,
  SiTypescript,
  SiSupabase,
  SiVite,
  SiTailwindcss,
  SiFramer,
  SiGreensock,
  SiPython,
} from "react-icons/si";

const logos = [
  { Icon: SiReact, name: "React" },
  { Icon: SiTypescript, name: "TypeScript" },
  { Icon: SiSupabase, name: "Supabase" },
  { Icon: SiVite, name: "Vite" },
  { Icon: SiTailwindcss, name: "Tailwind CSS" },
  { Icon: SiFramer, name: "Framer Motion" },
  { Icon: SiGreensock, name: "GSAP" },
  { Icon: SiPython, name: "Python" },
];

// Doubled so the 0%->-50% translateX loop is seamless - the second half is
// an exact duplicate lined up right where the first half ends.
const loopedLogos = [...logos, ...logos];

const TechMarquee = () => {
  return (
    <div
      className="w-full overflow-hidden border-y border-border/40 bg-secondary/5 py-6"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div className="flex w-max animate-marquee items-center gap-14 motion-reduce:animate-none">
        {loopedLogos.map(({ Icon, name }, index) => (
          <div
            key={`${name}-${index}`}
            className="flex shrink-0 items-center gap-2.5 text-muted-foreground/70 transition-colors hover:text-foreground"
            title={name}
          >
            <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="hidden text-sm font-medium sm:inline">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechMarquee;
