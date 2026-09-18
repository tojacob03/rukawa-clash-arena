import { motion } from "framer-motion";
import { MapPin, Plane } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";

// Die GeoJSON-Daten für die Weltkarte (Vektoren)
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Koordinaten
const originCoords: [number, number] = [10.4515, 51.1657]; // Deutschland (Zentrum)
const destCoords: [number, number] = [121.4737, 31.2304]; // Shanghai

// Flugroute im SVG-Koordinatensystem der Karte (800x600, Mercator, scale 140, center [70,45]).
// Deutschland projiziert auf ~(254.5, 276.7), Shanghai auf ~(525.8, 341.4) – Bogen nach Norden.
const flightPath = "M 254.5 276.7 Q 390 230 525.8 341.4";

const ShanghaiRoadmap = () => {
  return (
    <section className="py-14 sm:py-20 px-5 sm:px-6 relative overflow-hidden">
      <style>
        {`
          @keyframes dash-flow {
            0% { stroke-dashoffset: 8; }
            100% { stroke-dashoffset: 0; }
          }
        `}
      </style>

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
                scale: 140,
                center: [70, 45],
              }}
              className="w-full h-full"
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1e293b"
                      stroke="#334155"
                      strokeWidth={0.7}
                      className="outline-none transition-colors duration-300 hover:fill-slate-700"
                    />
                  ))
                }
              </Geographies>

              {/* Die Daten-Flugroute */}
              <Line
                from={originCoords}
                to={destCoords}
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeLinecap="round"
                className="opacity-70"
                style={{
                  strokeDasharray: "4 4",
                  animation: "dash-flow 1s linear infinite",
                }}
              />

              {/* Marker: Ursprung (Deutschland) */}
              <Marker coordinates={originCoords}>
                <motion.circle
                  r="4"
                  fill="#a855f7"
                  className="opacity-80"
                  animate={{
                    scale: [1, 2.5],
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

              {/* Marker: Ziel (Shanghai) */}
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

              {/* DAS FLUGZEUG - Direkt in der Map-Ebene platziert für butterweiche, fehlerfreie Bewegung */}
              <foreignObject x="0" y="0" width="100%" height="100%" className="overflow-visible pointer-events-none">
                <div className="animate-flight-path absolute top-0 left-0">
                  <Plane className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(168,85,247,0.9)]" />
                </div>
              </foreignObject>
            </ComposableMap>
          </div>

          {/* Glassmorphism Info-Karte */}
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-auto md:top-6 md:bottom-auto z-10 pointer-events-none">
            <Card className="p-5 md:p-6 bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Next Major Deployment
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1">CRL Worlds 2026</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <p className="text-primary font-medium m-0">Shanghai, China</p>
                <span className="hidden sm:inline text-muted-foreground/50">•</span>
                <p className="text-foreground/80 font-medium m-0 text-sm sm:text-base">Nov 6-8</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShanghaiRoadmap;
