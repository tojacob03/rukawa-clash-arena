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
import LovableIcon from "@/components/icons/LovableIcon";

// Brand colors (Simple Icons hex values) applied via `color`, since these
// SVGs fill with currentColor. Lovable renders its own baked-in gradient,
// so it gets no color override.
const logos = [
  { Icon: SiReact, name: "React", color: "#61DAFB" },
  { Icon: SiTypescript, name: "TypeScript", color: "#3178C6" },
  { Icon: SiSupabase, name: "Supabase", color: "#3ECF8E" },
  { Icon: SiVite, name: "Vite", color: "#646CFF" },
  { Icon: SiTailwindcss, name: "Tailwind CSS", color: "#06B6D4" },
  { Icon: SiFramer, name: "Framer Motion", color: "#0055FF" },
  { Icon: SiGreensock, name: "GSAP", color: "#88CE02" },
  { Icon: SiPython, name: "Python", color: "#3776AB" },
  { Icon: LovableIcon, name: "Lovable", color: undefined },
];

// Doubled so the 0%->-50% translateX loop is seamless.
const loopedLogos = [...logos, ...logos];

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
        IMPORTANT: spacing is margin-right on every item, not a flex `gap`.
        Flex `gap` doesn't add space after the last child, so with 9 icons
        doubled to 18, one "half" was 944px but the true repeat period
        (icon+space x9) is 1008px - translateX(-50%) landed 32px short of
        a full period and produced a visible snap at the loop point.
        Margin on every item (including the very last, off-screen one)
        makes each half exactly one period wide, so -50% is exact.
      */}
      <div className="flex w-max animate-marquee items-center motion-reduce:animate-none">
        {loopedLogos.map(({ Icon, name, color }, index) => (
          <Icon
            key={`${name}-${index}`}
            title={name}
            style={color ? { color } : undefined}
            className="h-10 w-10 shrink-0 opacity-90 transition-opacity hover:opacity-100 sm:h-12 sm:w-12 mr-16"
          />
        ))}
      </div>
    </div>
  );
};

export default TechMarquee;
