import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Trophy, Briefcase, Activity } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Newest first - kept in this order because it also drives the mobile
// vertical timeline (newest-on-top reads better as a stacked list).
const teamHistory = [
  {
    role: "Freelance Data Analyst",
    team: "Supporting Tier-1 CRL Pros (Morten & Viiper)",
    period: "May 2026 – Present",
    achievement: "CRL 2026 World Championship track",
    icon: Activity,
    color: "text-green-400",
  },
  {
    role: "Independent coach & analyst",
    team: "Freelance",
    period: "2025",
    description: "Deck picking and later analyst support during the CRL 2025 season, before a short break.",
    achievement: "CRL 2025 season",
    icon: Briefcase,
    color: "text-clash-silver",
  },
  {
    role: "Analyst",
    team: "Selección Colombia",
    period: "Supremacy League Copa América 2025",
    achievement: "Top 6 finish",
    icon: Trophy,
    color: "text-clash-gold",
  },
  {
    role: "Analyst / coach",
    team: "Odyssey",
    period: "March 2025 – October 2025",
    icon: Users,
    color: "text-clash-blue",
  },
  {
    role: "Analyst",
    team: "The Dark Empire",
    period: "2019–2021",
    icon: Users,
    color: "text-clash-silver",
  },
];

// Oldest -> newest, for the horizontal "journey" scroll on desktop.
const stations = [...teamHistory].reverse();

const SectionHeader = () => (
  <>
    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
      Experience
    </h2>
    <div className="w-24 h-1 gradient-accent mx-auto rounded-full" />
  </>
);

const StationCard = ({
  item,
  isCurrent,
}: {
  item: (typeof stations)[number];
  isCurrent: boolean;
}) => (
  <Card
    className={`gradient-card shadow-card p-6 sm:p-8 ${
      isCurrent ? "border-green-400/60 ring-1 ring-green-400/30" : "border-border/50"
    }`}
  >
    <div className="flex items-start gap-4">
      <div className={`p-4 rounded-xl bg-secondary/50 ${item.color}`}>
        <item.icon className="w-8 h-8" />
      </div>
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{item.period}</span>
          {isCurrent && (
            <span className="ml-1 rounded-full bg-green-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-400">
              Present
            </span>
          )}
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground">{item.role}</h3>
        <p className="mb-2 text-lg font-semibold text-clash-blue">{item.team}</p>
        {item.description && (
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        )}
        {item.achievement && (
          <div className="inline-flex items-center gap-2 rounded-full gradient-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            <Trophy className="w-4 h-4" />
            {item.achievement}
          </div>
        )}
      </div>
    </div>
  </Card>
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
      <section id="experience-mobile" className="scroll-mt-20 py-14 sm:py-20 px-5 sm:px-6 md:hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <SectionHeader />
          </div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-clash-blue to-clash-gold hidden md:block" />
            <div className="space-y-8">
              {teamHistory.map((item, index) => (
                <div key={index} className="relative">
                  <div className="absolute left-6 w-4 h-4 gradient-primary rounded-full hidden md:block" />
                  <div className="ml-0 md:ml-20">
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
        className="scroll-mt-20 relative h-screen overflow-hidden hidden md:block"
      >
        <div className="absolute inset-x-0 top-14 z-10 px-6 text-center pointer-events-none">
          <SectionHeader />
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">First station → today</p>
        </div>

        <div ref={trackRef} className="flex h-full items-center pl-[12vw] pr-[12vw]" style={{ width: "max-content" }}>
          {stations.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-[min(60vw,30rem)] shrink-0">
                <StationCard item={item} isCurrent={index === stations.length - 1} />
              </div>
              {index < stations.length - 1 && (
                <div
                  ref={(el) => (connectorRefs.current[index] = el)}
                  className="mx-6 h-0.5 w-16 shrink-0 sm:w-24"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, hsl(var(--clash-blue)), hsl(var(--clash-gold)), hsl(var(--clash-blue)))",
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
