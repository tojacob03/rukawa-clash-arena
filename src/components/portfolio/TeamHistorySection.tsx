import { Card } from "@/components/ui/card";
import { Calendar, Users, Trophy } from "lucide-react";

const teamHistory = [
  {
    role: "Analyst",
    team: "The Dark Empire",
    period: "2019–2021",
    icon: Users,
    color: "text-clash-silver"
  },
  {
    role: "Analyst/Coach",
    team: "Odyssey",
    period: "March 2025 – Present",
    icon: Users,
    color: "text-clash-blue"
  },
  {
    role: "Analyst",
    team: "Selección Colombia",
    period: "Supremacy League Copa América 2025",
    achievement: "Top 6 Finish",
    icon: Trophy,
    color: "text-clash-gold"
  }
];

const TeamHistorySection = () => {
  return (
    <section id="team-history" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            Team History
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
        </div>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-clash-blue to-clash-gold hidden md:block"></div>
          
          <div className="space-y-8">
            {teamHistory.map((item, index) => (
              <div 
                key={index}
                className="relative animate-slide-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Timeline Dot */}
                <div className="absolute left-6 w-4 h-4 gradient-primary rounded-full shadow-glow hidden md:block"></div>
                
                <Card className="ml-0 md:ml-20 gradient-card shadow-card border-border/50 p-6 hover:shadow-glow transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-secondary/50 ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h3 className="text-xl font-bold text-foreground">{item.role}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{item.period}</span>
                        </div>
                      </div>
                      <p className="text-lg text-clash-blue font-semibold mb-2">{item.team}</p>
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