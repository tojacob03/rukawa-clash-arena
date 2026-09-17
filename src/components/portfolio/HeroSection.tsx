import { Button } from "@/components/ui/button";
import { ChevronDown, Trophy, BarChart3 } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const HeroSection = () => {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-24 sm:py-20">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBackground})`,
        }}
      />
      <div className="absolute inset-0 gradient-hero" />

      <div className="absolute top-20 left-10 animate-float hidden sm:block">
        <Trophy className="w-8 h-8 text-clash-gold opacity-30" />
      </div>
      <div
        className="absolute top-40 right-20 animate-float hidden sm:block"
        style={{
          animationDelay: "1s",
        }}
      >
        <BarChart3 className="w-10 h-10 text-primary opacity-40" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-5 sm:px-6">
        <div className="animate-slide-in-up">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold mb-4 sm:mb-6 text-white">
            Rukawa
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-white/85 mb-8 max-w-3xl mx-auto leading-relaxed">
            Clash Royale analyst for Solo CRL. I turn a player’s battle log into
            set decisions — and I built the app that does it.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-10 sm:mb-12">
            <Button
              variant="hero"
              size="xl"
              onClick={() => scrollToSection("work")}
              className="group w-full sm:w-auto"
            >
              View the method
              <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="w-full sm:w-auto text-white border-white/70 hover:bg-white hover:text-primary"
              onClick={() => scrollToSection("contact")}
            >
              Get in touch
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-10 sm:mt-16">
          <div className="text-center animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="text-2xl sm:text-3xl font-bold text-clash-gold mb-1 sm:mb-2">Player analysis</div>
            <div className="text-sm sm:text-base text-muted-foreground">Solo CRL player prep</div>
          </div>
          <div className="text-center animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="text-2xl sm:text-3xl font-bold text-clash-gold mb-1 sm:mb-2">Top 2, 3 & 4</div>
            <div className="text-sm sm:text-base text-muted-foreground">CRL Monthly Finals support</div>
          </div>
          <div className="text-center animate-slide-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="text-2xl sm:text-3xl font-bold text-clash-gold mb-1 sm:mb-2">Internal tooling</div>
            <div className="text-sm sm:text-base text-muted-foreground">Ingest, duel detection, remaining decks</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:block">
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </div>
    </section>
  );
};

export default HeroSection;
