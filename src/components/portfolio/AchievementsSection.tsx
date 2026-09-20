import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, Crown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const achievements = [
  {
    title: "4th Place",
    event: "GGtoor x Haneki Cup Season 1",
    icon: Trophy,
    rank: "4th",
    color: "text-clash-blue",
  },
  {
    title: "Champion",
    event: "Amazon University Esports Masters S4 Germany",
    icon: Crown,
    rank: "1st",
    color: "text-clash-gold",
  },
  {
    title: "CRL Monthly Finals",
    event: "1x Top 2, 2x Top 3, 1x Top 4",
    icon: Medal,
    rank: "CRL 25 & 26",
    color: "text-clash-silver",
  },
  {
    title: "Copa América",
    event: "Supremacy League 2025",
    icon: Award,
    rank: "Top 6",
    color: "text-primary",
  },
];

const SectionHeader = () => (
  <>
    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
      Achievements & Results
    </h2>
    <div className="w-24 h-1 gradient-accent mx-auto rounded-full" />
  </>
);

const AchievementCard = ({
  achievement,
  large = false,
}: {
  achievement: (typeof achievements)[number];
  large?: boolean;
}) => (
  <Card
    className={`gradient-card shadow-card border-border/50 hover:shadow-glow transition-all duration-300 group ${
      large ? "p-8 sm:p-10" : "p-6"
    }`}
  >
    <div className="flex items-start gap-4">
      <div
        className={`rounded-xl bg-secondary/50 ${achievement.color} group-hover:animate-glow ${
          large ? "p-5" : "p-4"
        }`}
      >
        <achievement.icon className={large ? "w-10 h-10" : "w-8 h-8"} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className={`font-bold text-foreground ${large ? "text-2xl" : "text-xl"}`}>{achievement.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-bold bg-secondary/50 ${achievement.color}`}>
            {achievement.rank}
          </span>
        </div>
        <p className={`text-muted-foreground ${large ? "text-base" : ""}`}>{achievement.event}</p>
      </div>
    </div>
  </Card>
);

/**
 * On desktop: a GSAP ScrollTrigger-pinned section where vertical scroll
 * drives horizontal movement through the achievement cards. Uses GSAP's own
 * pin mechanism (not CSS position:sticky) - it manages its own spacer element
 * and isn't affected by ancestor `overflow` the way sticky is.
 *
 * On mobile: a plain stacked grid, no scroll-hijacking - horizontal pinned
 * scroll tends to fight with touch swipe gestures and feels worse than a
 * normal list on small screens.
 */
const AchievementsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!isDesktop || !sectionRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const distance = track.scrollWidth - window.innerWidth;
      if (distance <= 0) return;

      gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${distance}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isDesktop]);

  if (!isDesktop) {
    return (
      <section id="achievements" className="py-14 px-5 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <SectionHeader />
          </div>
          <div className="grid grid-cols-1 gap-6">
            {achievements.map((achievement, index) => (
              <AchievementCard key={index} achievement={achievement} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="achievements" ref={sectionRef} className="relative h-screen overflow-hidden bg-muted/30">
      <div className="absolute inset-x-0 top-14 z-10 px-6 text-center pointer-events-none">
        <SectionHeader />
      </div>
      <div
        ref={trackRef}
        className="flex h-full items-center gap-8 pl-[12vw] pr-[12vw]"
        style={{ width: "max-content" }}
      >
        {achievements.map((achievement, index) => (
          <div key={index} className="w-[min(70vw,36rem)] shrink-0">
            <AchievementCard achievement={achievement} large />
          </div>
        ))}
      </div>
    </section>
  );
};

export default AchievementsSection;
