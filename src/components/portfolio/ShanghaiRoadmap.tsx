import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";

// Die GeoJSON-Daten für die Weltkarte (Vektoren)
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Koordinaten
const originCoords: [number, number] = [10.4515, 51.1657]; // Deutschland (Zentrum)
const destCoords: [number, number] = [121.4737, 31.2304]; // Shanghai

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
          <div className="absolute inset-0 z-0 opacity-70">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 140, // Zoom-Faktor
                center: [70, 45], // Etwas weiter nach links zentriert, um Europa und Asien perfekt einzufangen
              }}
              className="w-full h-full"
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1e293b" // Dunkle Länder
                      stroke="#334155" // Helle Ränder für bessere Sichtbarkeit
                      strokeWidth={0.7}
                      className="outline-none transition-colors duration-300 hover:fill-slate-700" // Hover-Effekt
                    />
                  ))
                }
              </Geographies>

              {/* Die Daten-Flugroute (Gebogene Linie von DE nach CN) */}
              <Line
                from={originCoords}
                to={destCoords}
                stroke="#a855f7" // Das Tailwind-Lila (Clash Purple)
                strokeWidth={1.5}
                strokeLinecap="round"
                className="animate-pulse opacity-60"
                style={{ strokeDasharray: "4 4" }} // Gestrichelte Tech-Linie
              />

              {/* Marker: Ursprung (Deutschland) - Kleiner "Sende"-Ping */}
              <Marker coordinates={originCoords}>
                <motion.circle
                  r="4"
                  fill="#a855f7"
                  className="opacity-80"
                  animate={{
                    scale: [1, 2],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <circle r="2" fill="#a855f7" />
              </Marker>

              {/* Marker: Ziel (Shanghai) - Der große Empfangs-Ping */}
              <Marker coordinates={destCoords}>
                <g transform="translate(-12, -24)">
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
                  <MapPin className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                </g>
              </Marker>
            </ComposableMap>
          </div>

          {/* Glassmorphism Info-Karte (Jetzt kompakt als kleines Data-Badge) */}
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-auto md:top-6 md:bottom-auto z-10 pointer-events-none">
            <Card className="p-5 md:p-6 bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Next Major Deployment
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1">CRL Worlds 2026</h3>
              <p className="text-primary font-medium m-0">Shanghai, China</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShanghaiRoadmap;
