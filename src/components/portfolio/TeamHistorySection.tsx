import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionIntro from "@/components/portfolio/SectionIntro";

gsap.registerPlugin(ScrollTrigger);

// Newest first - kept in this order because it also drives the mobile
// vertical timeline (newest-on-top reads better as a stacked list).
const teamHistory = [
  {
    role: "Freelance Data Analyst",
    team: "Supporting Tier-1 CRL Pros (Morten & Viiper)",
    period: "May 2026 – Present",
    achievement: "CRL 2026 World Championship track",
  },
  {
    role: "Independent coach & analyst",
    team: "Freelance",
    period: "2025",
    description: "Deck picking and later analyst support during the CRL 2025 season, before a short break.",
    achievement: "CRL 2025 season",
  },
  {
    role: "Analyst",
    team: "Selección Colombia",
    period: "Supremacy League Copa América 2025",
    achievement: "Top 6 finish",
  },
  {
    role: "Analyst / coach",
    team: "Odyssey",
    period: "March 2025 – October 2025",
  },
  {
    role: "Analyst",
    team: "The Dark Empire",
    period: "2019–2021",
  },
];

// Oldest -> newest, for the horizontal "journey" scroll on desktop.
const stations = [...teamHistory].reverse();

const Intro = () => (
  <SectionIntro
    eyebrow="Experience"
    title="Seven years in competitive Clash Royale."
    description="From The Dark Empire in 2019 to Selección Colombia and Tier-1 Solo CRL prep – first station to today."
  />
);

// Typographic card: period first, role, team, one result line. No icon
// tiles or extra accent colours - gold is the only accent.
const StationCard = ({
  item,
  isCurrent,
}: {
  item: (typeof stations)[number];
  isCurrent: boolean;
}) => (
  <div
    className={`rounded-2xl border bg-card/60 p-6 sm:p-8 ${
      isCurrent ? "border-clash-gold/40" : "border-border/60"
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="label-caps text-clash-gold">{item.period}</span>
      {isCurrent && (
        <span className="label-caps rounded-full border border-clash-gold/40 px-2 py-0.5 text-clash-gold">Now</span>
      )}
    </div>
    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{item.role}</h3>
    <p className="mt-1 text-lg text-foreground/80">{item.team}</p>
    {item.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
    {item.achievement && (
      <p className="mt-5 border-t border-border/60 pt-4 text-sm font-medium text-foreground">
        <span className="text-clash-gold">→</span> {item.achievement}
      </p>
    )}
  </div>
);

const TeamHistorySection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const connectorRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;

    // gsap.matchMedia handles the Desktop/Mobile switch on resize without
    // tearing down/rebuilding React state.
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const track = trackRef.current!;
      const distance = track.scrollWidth - window.innerWidth;

      if (distance <= 0) return;

      const connectors = connectorRefs.current.filter((el): el is HTMLDivElement => el !== null);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${distance}`,
          scrub: true,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(track, { x: -distance, ease: "none" }, 0);

      // The connecting lines travel through their own gradient in sync with
      // the same scroll - not a separate looping CSS animation, so it reads
      // as tied to the journey rather than decorative background noise.
      if (connectors.length) {
        tl.to(connectors, { backgroundPositionX: "100%", ease: "none" }, 0);
      }

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <>
      {/* MOBILE LAYOUT */}
      <section id="experience-mobile" className="scroll-mt-14 py-14 sm:py-20 px-5 sm:px-6 md:hidden">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <Intro />
          </div>

          <div className="relative">
            <div className="space-y-8">
              {teamHistory.map((item, index) => (
                <div key={index} className="relative">
                  <div>
                    <StationCard item={item} isCurrent={index === 0} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DESKTOP LAYOUT (GSAP Pinned) */}
      <section
        id="experience"
        ref={sectionRef}
        className="scroll-mt-0 relative h-screen overflow-hidden hidden md:block"
      >
        <div className="pointer-events-none absolute inset-x-0 top-24 z-10 mx-auto max-w-7xl px-8">
          <Intro />
        </div>

        {/*
          2xl: padding shrinks (12vw -> 8vw) and the card cap grows (30rem ->
          36rem) - on very wide 16:10 screens this lets neighboring cards
          peek in at the edges instead of leaving one card floating alone in
          a lot of empty space, and reinforces the horizontal pull.
        */}
        <div
          ref={trackRef}
          className="flex h-full items-center pt-52 pl-[12vw] pr-[12vw] 2xl:pl-[8vw] 2xl:pr-[8vw]"
          style={{ width: "max-content" }}
        >
          {stations.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-[min(60vw,30rem)] shrink-0 2xl:w-[min(45vw,36rem)]">
                <StationCard item={item} isCurrent={index === stations.length - 1} />
              </div>
              {index < stations.length - 1 && (
                <div
                  ref={(el) => (connectorRefs.current[index] = el)}
                  className="mx-6 h-0.5 w-16 shrink-0 sm:w-24"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, hsl(var(--border)), hsl(var(--clash-gold)), hsl(var(--border)))",
                    backgroundSize: "200% 100%",
                    backgroundPosition: "0% 0%",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default TeamHistorySection;
