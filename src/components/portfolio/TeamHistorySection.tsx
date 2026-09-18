import { Card } from "@/components/ui/card";
import { Calendar, Users, Trophy, Briefcase, Activity } from "lucide-react";

const teamHistory = [
  {
    role: "Freelance Data Analyst",
    // Geändert: Stellt klar, dass du als externer Analyst Top-Spieler supportest
    team: "Supporting Tier-1 CRL Pros (Morten & Viiper)",
    period: "May 2026 – Present",
    // Geändert: Erklärt präzise die Hierarchie (via Coach) und droppt die Orga-Namen elegant
    description:
      "Providing analytical support to the coaching staff of SK Gaming and Joblife players. Player-level prep for Solo CRL: battle-log profiling, Game 1 tendencies, and remaining-deck strategies.",
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

const TeamHistorySection = () => {
  return (
    <section id="experience" className="scroll-mt-20 py-14 sm:py-20 px-5 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            Experience
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full" />
        </div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-clash-blue to-clash-gold hidden md:block" />

          <div className="space-y-8">
            {teamHistory.map((item, index) => (
              <div key={index} className="relative">
                <div className="absolute left-6 w-4 h-4 gradient-primary rounded-full hidden md:block" />

                <Card className="ml-0 md:ml-20 gradient-card shadow-card border-border/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-secondary/50 ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h3 className="text-xl font-bold text-foreground">{item.role}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1 sm:mt-0">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{item.period}</span>
                        </div>
                      </div>
                      <p className="text-lg text-clash-blue font-semibold mb-2">{item.team}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{item.description}</p>
                      )}
                      {item.achievement && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 gradient-accent rounded-full text-accent-foreground text-sm font-medium">
                          <Trophy className="w-4 h-4" />
                          {item.achievement}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamHistorySection;
