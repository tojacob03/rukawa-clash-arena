import { motion } from "framer-motion";
import { MapPin, Activity, Crosshair, Cpu } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// Die GeoJSON-Daten für die Weltkarte (Vektoren)
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const ShanghaiRoadmap = () => {
  return (
    <section className="py-14 sm:py-20 px-5 sm:px-6 relative overflow-hidden">
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
        <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-border/50 bg-secondary/10">
          {/* Grid Overlay für den technischen Look */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

          {/* ECHTE VEKTOR-KARTE */}
          <div className="absolute inset-0 z-0 opacity-50">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 140, // Zoom-Faktor
                center: [80, 40], // Zentriert die Karte grob auf Asien/Europa
              }}
              className="w-full h-full"
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1e293b" // Dunkle Länder (Tailwind slate-800)
                      stroke="#0f172a" // Noch dunklere Ränder (Tailwind slate-900)
                      strokeWidth={0.5}
                      className="outline-none"
                    />
                  ))
                }
              </Geographies>

              {/* Marker exakt auf Shanghai Koordinaten [Längengrad, Breitengrad] */}
              <Marker coordinates={[121.4737, 31.2304]}>
                {/* Wir verschieben den Mittelpunkt leicht, damit der MapPin optisch perfekt sitzt */}
                <g transform="translate(-12, -24)">
                  {/* Ping 1: Butterweicher Fade-In und Fade-Out */}
                  <motion.circle
                    cx="12"
                    cy="24"
                    r="8"
                    fill="currentColor"
                    className="text-primary"
                    animate={{
                      r: [8, 28],
                      opacity: [0, 0.4, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Ping 2: Startet verzögert für den perfekten Radar-Rhythmus */}
                  <motion.circle
                    cx="12"
                    cy="24"
                    r="8"
                    fill="currentColor"
                    className="text-primary"
                    animate={{
                      r: [8, 20],
                      opacity: [0, 0.6, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5,
                    }}
                  />
                  {/* Das Icon selbst, mit leichtem Glow-Effekt */}
                  <MapPin className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                </g>
              </Marker>
            </ComposableMap>
          </div>

          {/* Glassmorphism Info-Karte */}
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 md:top-6 md:bottom-auto z-10 pointer-events-none">
            <Card className="p-6 bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl">
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

                {/* NEU: Fokus auf deine App und deren Mehrwert */}
                <div className="flex items-start gap-3">
                  <Cpu className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Proprietary Tooling</h4>
                    <p className="text-xs text-muted-foreground">
                      Instant duel detection and win-condition predictions straight from raw battle logs.
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
