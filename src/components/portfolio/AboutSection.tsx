import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ChevronDown, BarChart3, Trophy, ArrowRight } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const HeroSection = () => {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const stats = [
    { value: "Player analysis", label: "Solo CRL prep" },
    { value: "Top 2, 3 & 4", label: "CRL finals support" },
    { value: "Internal tooling", label: "Ingest, duel detection, decisions" },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-24 sm:py-20">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBackground})`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,78,255,0.18),_transparent_40%),linear-gradient(135deg,rgba(10,12,18,0.95),rgba(12,18,30,0.78))]" />

      <div className="absolute left-8 top-20 hidden sm:block">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Trophy className="h-8 w-8 text-clash-gold/60" />
        </motion.div>
      </div>
      <div className="absolute right-16 top-32 hidden sm:block">
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <BarChart3 className="h-10 w-10 text-primary/50" />
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <Badge className="mb-5 border border-clash-gold/40 bg-clash-gold/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-clash-gold shadow-[0_0_24px_rgba(245,191,65,0.12)]">
            Available for select projects
          </Badge>

          <h1 className="mb-4 text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl md:text-8xl">
            Rukawa
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-white/80 sm:text-xl md:text-2xl">
            I build tools that turn battle data into sharper decisions — for Solo CRL prep, deck analysis, and live
            competitive workflows.
          </p>

          <div className="mb-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              variant="hero"
              size="xl"
              onClick={() => scrollToSection("work")}
              className="group w-full sm:w-auto"
            >
              View the method
              <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-1" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              onClick={() => scrollToSection("about")}
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white hover:text-primary sm:w-auto"
            >
              About my approach
            </Button>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="rounded-2xl border border-white/10 bg-background/20 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-sm"
            >
              <div className="mb-1 text-xl font-bold text-clash-gold sm:text-2xl">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 animate-bounce sm:block">
        <ArrowRight className="h-5 w-5 rotate-90 text-white/60" />
      </div>
    </section>
  );
};

export default HeroSection;
