import { SiFramer, SiGreensock } from "react-icons/si";
import LovableIcon from "@/components/icons/LovableIcon";

/**
 * Real, full-color/gradient brand logos (devicon, MIT licensed) as static
 * assets - these brands have genuine multi-tone marks (Python's blue/yellow
 * snakes, Vite's purple-to-yellow bolt, Supabase's green gradient bolt) that
 * a flat single-color icon-font rendering loses.
 */
const imageLogos = [
  { src: "/logos/react.svg", name: "React" },
  { src: "/logos/typescript.svg", name: "TypeScript" },
  { src: "/logos/supabase.svg", name: "Supabase" },
  { src: "/logos/vite.svg", name: "Vite" },
  { src: "/logos/tailwindcss.svg", name: "Tailwind CSS" },
  { src: "/logos/python.svg", name: "Python" },
];

// Framer and GSAP/GreenSock are genuinely single-color brand marks (their
// real logos aren't gradients), so the Simple Icons monochrome version is
// already accurate - just tinted to the brand's own color.
const componentLogos = [
  { Icon: SiFramer, name: "Framer Motion", color: "#0055FF" },
  { Icon: SiGreensock, name: "GSAP", color: "#88CE02" },
];

type Logo =
  | { kind: "image"; src: string; name: string }
  | { kind: "component"; Icon: typeof SiFramer; name: string; color: string }
  | { kind: "custom"; Icon: typeof LovableIcon; name: string };

const logos: Logo[] = [
  ...imageLogos.map((l): Logo => ({ kind: "image", ...l })),
  ...componentLogos.map((l): Logo => ({ kind: "component", ...l })),
  { kind: "custom", Icon: LovableIcon, name: "Lovable" },
];

// Doubled so the 0%->-50% translateX loop is seamless.
const loopedLogos = [...logos, ...logos];

const iconClass = "h-10 w-10 shrink-0 opacity-90 transition-opacity hover:opacity-100 sm:h-12 sm:w-12 mr-16";

const TechMarquee = () => {
  return (
    <div
      className="w-full overflow-hidden border-y border-border/40 bg-secondary/5 py-8"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      {/*
        Spacing is margin-right on every item (not flex `gap`, which skips
        the trailing edge) so each doubled half is exactly one repeat
        period wide and translateX(-50%) loops without a snap.
      */}
      <div className="flex w-max animate-marquee items-center motion-reduce:animate-none">
        {loopedLogos.map((logo, index) => {
          const key = `${logo.name}-${index}`;
          if (logo.kind === "image") {
            return <img key={key} src={logo.src} alt={logo.name} title={logo.name} className={iconClass} />;
          }
          if (logo.kind === "component") {
            return (
              <logo.Icon key={key} title={logo.name} style={{ color: logo.color }} className={iconClass} />
            );
          }
          return <logo.Icon key={key} title={logo.name} className={iconClass} />;
        })}
      </div>
    </div>
  );
};

export default TechMarquee;
