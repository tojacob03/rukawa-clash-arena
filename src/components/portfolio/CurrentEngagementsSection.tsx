import { Card } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

const CurrentEngagementsSection = () => {
  return (
    <section id="current-engagements" className="py-14 sm:py-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            Current Esports Engagements
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
        </div>

        <Card className="gradient-card shadow-card border-border/50 p-6 sm:p-8 md:p-12">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="p-4 gradient-primary rounded-xl shadow-glow">
              <Briefcase className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-4 text-clash-gold">Active Analyst Role</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Since May 2026, I have returned to the competitive Clash Royale scene as a
                dedicated Esports Analyst. My focus lies on strategic matchup preparation and
                data-driven opponent research. Currently, I am providing analytical support
                for top-tier players such as Morten (SK Gaming) and Viiper (Joblife),
                contributing to recent successes in the CRL Monthly Finals.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CurrentEngagementsSection;
