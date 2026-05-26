import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, Crown } from "lucide-react";

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
    title: "CRL Monthly Finals Achievements",
    event: "Top 2, 3, 4 & Top 12 Finishes",
    icon: Medal,
    rank: "Top 2/12",
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

const AchievementsSection = () => {
  return (
    <section id="achievements" className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            Achievements & Results
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {achievements.map((achievement, index) => (
            <Card
              key={index}
              className="gradient-card shadow-card border-border/50 p-6 hover:shadow-glow transition-all duration-300 group hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-xl bg-secondary/50 ${achievement.color} group-hover:animate-glow`}>
                  <achievement.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-foreground">{achievement.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold bg-secondary/50 ${achievement.color}`}>
                      {achievement.rank}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{achievement.event}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
