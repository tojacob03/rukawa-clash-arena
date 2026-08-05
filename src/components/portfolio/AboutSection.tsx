import { Card } from "@/components/ui/card";
import { Target } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-14 sm:py-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            About Me
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
        </div>
        
        <Card className="gradient-card shadow-card border-border/50 p-6 sm:p-8 md:p-12">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="p-4 gradient-primary rounded-xl shadow-glow">
              <Target className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-clash-gold">Objective</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                To contribute to a competitive Clash Royale team as a data-driven analyst, 
                providing structured scouting and opponent insights to support matchup 
                preparation and overall team performance.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default AboutSection;