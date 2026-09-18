import { motion } from "framer-motion";
import { MapPin, Activity, Crosshair, Network } from "lucide-react";
import { Card } from "@/components/ui/card";

const ShanghaiRoadmap = () => {
  return (
    <section className="py-14 sm:py-20 px-5 sm:px-6 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-primary bg-clip-text text-transparent">
            Global Operations
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Scaling analytics from regional qualifiers to the biggest stage in Clash Royale.
          </p>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-border/50 bg-secondary/20">
          {/* ANGEPASST: Neues Shanghai-Bild, 'mix-blend' entfernt, 'grayscale' hinzugefügt für Sichtbarkeit */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 grayscale"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1558434690-34988e0c8b9d?q=80&w=2000&auto=format&fit=crop')",
            }}
          />

          {/* Grid Overlay für den technischen Look */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          {/* ANGEPASST: Der Radar-Ping - deutlich langsamer und weicher in der Transparenz */}
          <div className="absolute top-1/2 left-[65%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary relative z-10" />
              <motion.div
                className="absolute w-12 h-12 bg-primary/20 rounded-full"
                animate={{
                  scale: [1, 2.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <motion.div
                className="absolute w-8 h-8 bg-primary/30 rounded-full"
                animate={{
                  scale: [1, 2],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 1.5,
                }}
              />
            </div>
          </div>

          {/* Glassmorphism Info-Karte */}
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 md:top-6 md:bottom-auto">
            <Card className="p-6 bg-background/70 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                  Next Major Deployment
                </span>
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-1">CRL Worlds 2026</h3>
              <p className="text-primary font-medium mb-6">Shanghai, China</p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Live Data Ingestion</h4>
                    <p className="text-xs text-muted-foreground">
                      Real-time meta tracking under offline tournament conditions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Crosshair className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Opponent Scouting</h4>
                    <p className="text-xs text-muted-foreground">On-site strategic preparation for Tier-1 players.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Network className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Industry Networking</h4>
                    <p className="text-xs text-muted-foreground">
                      Connecting with global esports organizations and data teams.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShanghaiRoadmap;
