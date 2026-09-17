import { Card } from "@/components/ui/card";

const AboutSection = () => {
  return (
    <section id="about" className="py-14 sm:py-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            About
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full" />
        </div>

        <Card className="gradient-card shadow-card border-border/50 p-6 sm:p-8 md:p-12">
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
            Since May 2026 I have been back in competitive Clash Royale as an
            analyst focused on{" "}
            <span className="text-foreground">Solo CRL player preparation</span>
            : how someone actually plays across accounts, which decks they
            default to in Game 1, and what is left once cards are burned.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            That work currently includes analytical support for players such as
            Morten (SK Gaming) and Viiper (Joblife). Delivery happens in a
            private web app — not in the old PDF scouting packs or a client
            portal.
          </p>
        </Card>
      </div>
    </section>
  );
};

export default AboutSection;
