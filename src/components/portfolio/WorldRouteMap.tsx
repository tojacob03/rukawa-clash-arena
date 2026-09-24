import { motion } from "framer-motion";
import { MapPin, Plane } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// Weltkarten-Daten (TopoJSON) lokal gebündelt statt von unpkg geladen -
// kein Drittanbieter-Request beim Seitenaufruf.
import geoUrl from "world-atlas/countries-110m.json";

// Koordinaten
const originCoords: [number, number] = [10.4515, 51.1657]; // Deutschland (Zentrum)
const destCoords: [number, number] = [121.4737, 31.2304]; // Shanghai

// Flugroute im SVG-Koordinatensystem der Karte (800x600, Mercator, scale 140, center [70,45]).
// Deutschland projiziert auf ~(254.5, 276.7), Shanghai auf ~(525.8, 341.4) – Bogen nach Norden.
const flightPath = "M 254.5 276.7 Q 390 230 525.8 341.4";


// The heavy part of the Worlds section (world topology + d3-geo, ~300 kB),
// split out so it only loads when the section scrolls near the viewport.
const WorldRouteMap = () => (
  <>
    <style>
      {`
        @keyframes dash-flow {
          0% { stroke-dashoffset: 8; }
          100% { stroke-dashoffset: 0; }
        }
      `}
    </style>
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

        {/* Die Daten-Flugroute (gestrichelte Linie) */}
        <path
          d={flightPath}
          fill="none"
          stroke="#F5C542"
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
            fill="#F5C542"
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
          <circle r="2" fill="#F5C542" />
        </Marker>

        {/* Marker: Ziel (Shanghai) */}
        <Marker coordinates={destCoords}>
          <g transform="translate(-12, -24)">
            <motion.circle
              cx="12"
              cy="24"
              r="8"
              fill="currentColor"
              className="text-clash-gold"
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
              className="text-clash-gold"
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
            <MapPin className="w-6 h-6 text-clash-gold drop-shadow-[0_0_8px_rgba(245,197,66,0.8)]" />
          </g>
        </Marker>

        {/*
          DAS FLUGZEUG — Position (animateMotion) und Sichtbarkeit (animate)
          laufen beide auf der SMIL-Zeitbasis, damit sie garantiert synchron
          bleiben. Vorher liefen animateMotion (SMIL) und eine CSS-@keyframes-
          Animation unabhängig voneinander, was je nach Browser-Timing zu einer
          leichten Phasenverschiebung und damit sichtbarem "Pulsieren" führte.
        */}
        <g className="pointer-events-none">
          <animateMotion dur="8s" repeatCount="indefinite" rotate="auto" path={flightPath} />

          <g transform="rotate(45)">
            <animate
              attributeName="opacity"
              values="0;1;1;1;0"
              keyTimes="0;0.1;0.5;0.9;1"
              dur="8s"
              repeatCount="indefinite"
            />
            <Plane
              width={20}
              height={20}
              x={-10}
              y={-10}
              fill="currentColor"
              className="text-white drop-shadow-[0_0_8px_rgba(245,197,66,1)]"
            />
          </g>
        </g>
      </ComposableMap>
    </div>
  </>
);

export default WorldRouteMap;
