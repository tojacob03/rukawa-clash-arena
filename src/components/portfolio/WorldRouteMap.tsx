import { useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, type MotionValue } from "framer-motion";
import { MapPin, Plane } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// World topology bundled locally instead of loaded from unpkg - no
// third-party request on page view.
import geoUrl from "world-atlas/countries-110m.json";

const GOLD = "#F5C542";
const originCoords: [number, number] = [10.4515, 51.1657]; // Germany (centre)
const destCoords: [number, number] = [121.4737, 31.2304]; // Shanghai

// Flight route in the map's SVG coordinates (800x600, Mercator, scale 140,
// centre [70, 45]): Germany ~(254.5, 276.7) to Shanghai ~(525.8, 341.4),
// arcing north.
const flightPath = "M 254.5 276.7 Q 390 230 525.8 341.4";

type Point = { x: number; y: number };

/**
 * The heavy part of the Road to Worlds section (world topology + d3-geo),
 * split out so it only loads when the section scrolls near the viewport.
 *
 * `progress` (0-1) places the plane on the route and fills the gold trail
 * behind it; `stations` are fractions along the route where the season's
 * milestones sit. Everything is written straight to the SVG on change, so
 * scrolling never re-renders the map. `viewBox` crops the map; the route
 * coordinates stay the same.
 */
const WorldRouteMap = ({
  progress,
  stations,
  viewBox,
}: {
  progress: MotionValue<number>;
  stations: number[];
  /** Crop of the 800x600 map, e.g. just the route on narrow screens */
  viewBox?: string;
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const [length, setLength] = useState(0);
  const [points, setPoints] = useState<Point[]>([]);
  const [reached, setReached] = useState(-1);
  // Glows are SVG filters, not CSS drop-shadow(): WebKit doesn't repaint SVG
  // elements carrying a CSS filter when their attributes change, which froze
  // the trail and the plane in Safari. Unique ids: phone and desktop layouts
  // can both mount a map.
  const glow = `route-glow-${useId().replace(/:/g, "")}`;

  const place = (p: number) => {
    const path = pathRef.current;
    if (!path || !length) return;
    const t = Math.min(Math.max(p, 0), 1);
    const at = path.getPointAtLength(t * length);
    const ahead = path.getPointAtLength(Math.min(t * length + 1, length));
    const behind = path.getPointAtLength(Math.max(t * length - 1, 0));
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
    planeRef.current?.setAttribute("transform", `translate(${at.x} ${at.y}) rotate(${angle})`);
    trailRef.current?.setAttribute("stroke-dashoffset", String(length * (1 - t)));
    setReached(stations.reduce((n, s, i) => (t >= s - 0.001 ? i : n), -1));
  };

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    setLength(len);
    setPoints(stations.map((s) => {
      const pt = path.getPointAtLength(s * len);
      return { x: pt.x, y: pt.y };
    }));
  }, [stations]);

  useLayoutEffect(() => {
    place(progress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length]);

  useMotionValueEvent(progress, "change", place);

  return (
    <div className="absolute inset-0 z-0">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 140, center: [70, 45] }}
        className="h-full w-full"
        viewBox={viewBox}
      >
        <defs>
          <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feFlood floodColor={GOLD} floodOpacity="0.85" />
            <feComposite in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1e293b"
                stroke="#334155"
                strokeWidth={0.7}
                className="outline-none"
              />
            ))
          }
        </Geographies>

        {/* The whole route, dashed and dim ... */}
        <path
          ref={pathRef}
          d={flightPath}
          fill="none"
          stroke={GOLD}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeDasharray="4 4"
          opacity={0.35}
        />
        {/* ... and the part already flown, solid and bright. */}
        <path
          ref={trailRef}
          d={flightPath}
          fill="none"
          stroke={GOLD}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={length || 1}
          strokeDashoffset={length || 1}
          filter={`url(#${glow})`}
        />

        {/* Season milestones on the way */}
        {points.map((pt, i) => (
          <g key={i} transform={`translate(${pt.x} ${pt.y})`}>
            {i <= reached && (
              <motion.circle
                r={4}
                fill={GOLD}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            )}
            <circle
              r={i <= reached ? 4 : 3}
              fill={i <= reached ? GOLD : "#0f172a"}
              stroke={i <= reached ? GOLD : "#64748b"}
              strokeWidth={1.5}
              style={{ transition: "all 0.4s" }}
            />
          </g>
        ))}

        {/* Origin: Germany */}
        <Marker coordinates={originCoords}>
          <circle r={3} fill={GOLD} />
        </Marker>

        {/* Destination: Shanghai */}
        <Marker coordinates={destCoords}>
          <g transform="translate(-12, -24)">
            <motion.circle
              cx="12"
              cy="24"
              r="8"
              fill={GOLD}
              animate={{ r: [8, 26], opacity: [0, 0.4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <g filter={`url(#${glow})`}>
              <MapPin width={24} height={24} className="text-clash-gold" />
            </g>
          </g>
        </Marker>

        {/* The plane, positioned by `place` */}
        <g ref={planeRef} className="pointer-events-none">
          <g transform="rotate(45)" filter={`url(#${glow})`}>
            <Plane
              width={22}
              height={22}
              x={-11}
              y={-11}
              fill="currentColor"
              className="text-white"
            />
          </g>
        </g>
      </ComposableMap>
    </div>
  );
};

export default WorldRouteMap;
