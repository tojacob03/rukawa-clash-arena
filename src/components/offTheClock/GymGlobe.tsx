import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
// d3-geo and topojson-client come with react-simple-maps (the Road to Worlds
// map). Used directly here because the globe redraws on every animation
// frame, which is far cheaper as a handful of path strings than as React
// re-renders of ~180 <Geography> components.
import { geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import type { MatStop } from "@/data/offTheClock";

const GOLD = "#F5C542";
const SIZE = 600;
const C = SIZE / 2;
const RADIUS = 270; // the globe as a whole
const ZOOM = RADIUS * 2.3; // flown in on a route
const SPIN_MS = 1500;
const ZOOM_OUT_MS = 500;

type Coords = [number, number];
type Rotation = [number, number];
type Tween<T> = { from: T; to: T; start: number; duration: number };

const countries = (world as unknown as { objects: { countries: never } }).objects.countries;
const land = feature(world as never, countries);
const borders = mesh(world as never, countries, (a: unknown, b: unknown) => a !== b);
const graticule = geoGraticule10();

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const progress = (tw: Tween<unknown>, now: number) => easeInOut(Math.min((now - tw.start) / tw.duration, 1));

// Where the camera looks for a stop: the middle of its route from home, so
// both ends are in frame. For home itself, the middle of every stop.
const focusFor = (stops: MatStop[], i: number): Coords => {
  const home = stops.find((s) => s.home) ?? stops[0];
  if (stops[i].home) {
    const lon = stops.reduce((sum, s) => sum + s.coords[0], 0) / stops.length;
    const lat = stops.reduce((sum, s) => sum + s.coords[1], 0) / stops.length;
    return [lon, lat];
  }
  return geoInterpolate(home.coords, stops[i].coords)(0.5) as Coords;
};
const rotationFor = ([lon, lat]: Coords): Rotation => [-lon, -lat];

// The globe first comes into view over the Atlantic, then spins east.
const INTRO: Rotation = rotationFor([-35, 28]);

/**
 * An orthographic globe with a great-circle route from the home gym to
 * every city trained in. `active` spins and zooms onto that route; dragging
 * pulls back out to the whole globe. Drawn imperatively in one rAF loop
 * that only runs while `running` (in view) is true.
 */
const GymGlobe = ({
  stops,
  active,
  running,
  onDrag,
}: {
  stops: MatStop[];
  active: number;
  running: boolean;
  onDrag: () => void;
}) => {
  const home = stops.find((s) => s.home) ?? stops[0];
  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const rotation = useRef<Rotation>(reduceMotion ? rotationFor(focusFor(stops, active)) : INTRO);
  const scale = useRef(reduceMotion ? ZOOM : RADIUS);
  const spin = useRef<Tween<Rotation> | null>(null);
  const zoom = useRef<Tween<number> | null>(null);
  const activeRef = useRef(active);
  // The first flight (in from the Atlantic) waits until the globe is seen.
  const started = useRef(reduceMotion);
  const dirty = useRef(true);

  const projection = useMemo(
    () => geoOrthographic().translate([C, C]).clipAngle(90).precision(0.4),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const landRef = useRef<SVGPathElement>(null);
  const bordersRef = useRef<SVGPathElement>(null);
  const gridRef = useRef<SVGPathElement>(null);
  const arcRefs = useRef<(SVGPathElement | null)[]>([]);
  const markerRefs = useRef<(SVGGElement | null)[]>([]);
  const pulseRef = useRef<SVGCircleElement>(null);

  const centre = (): Coords => [-rotation.current[0], -rotation.current[1]];

  const draw = (now: number) => {
    if (dirty.current) {
      projection.rotate(rotation.current).scale(scale.current);
      landRef.current?.setAttribute("d", path(land) ?? "");
      bordersRef.current?.setAttribute("d", path(borders) ?? "");
      gridRef.current?.setAttribute("d", path(graticule) ?? "");

      stops.forEach((stop, i) => {
        const arc = arcRefs.current[i];
        if (arc) arc.setAttribute("d", path({ type: "LineString", coordinates: [home.coords, stop.coords] }) ?? "");
        const marker = markerRefs.current[i];
        if (marker) {
          const [x, y] = projection(stop.coords) ?? [0, 0];
          const facing = geoDistance(stop.coords, centre()) < Math.PI / 2 - 0.05;
          const inLens = Math.hypot(x - C, y - C) < RADIUS - 6;
          marker.setAttribute("transform", `translate(${x} ${y})`);
          marker.style.opacity = facing && inLens ? "1" : "0";
        }
      });
      dirty.current = false;
    }

    // A light runs the active route, home -> city, on a loop.
    const pulse = pulseRef.current;
    const stop = stops[activeRef.current];
    if (!pulse) return;
    if (stop.home || reduceMotion) {
      pulse.style.opacity = "0";
      return;
    }
    const t = (now % 2400) / 2400;
    const point = geoInterpolate(home.coords, stop.coords)(easeInOut(t));
    const [x, y] = projection(point) ?? [0, 0];
    pulse.setAttribute("cx", String(x));
    pulse.setAttribute("cy", String(y));
    pulse.style.opacity = geoDistance(point, centre()) < Math.PI / 2 ? String(Math.sin(Math.PI * t)) : "0";
  };

  const flyTo = (i: number, now: number) => {
    const to = rotationFor(focusFor(stops, i));
    const from = rotation.current;
    // Take the short way round.
    const dLon = ((((to[0] - from[0]) % 360) + 540) % 360) - 180;
    spin.current = { from, to: [from[0] + dLon, to[1]], start: now, duration: SPIN_MS };
    zoom.current = { from: scale.current, to: ZOOM, start: now, duration: SPIN_MS };
  };

  useEffect(() => {
    activeRef.current = active;
    if (reduceMotion) {
      rotation.current = rotationFor(focusFor(stops, active));
      dirty.current = true;
      draw(0);
      return;
    }
    if (started.current) flyTo(active, performance.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Layout effect: the first frame is drawn before paint, so markers never
  // flash at the SVG origin.
  useLayoutEffect(() => {
    dirty.current = true;
    draw(performance.now());
    if (!running) return;
    if (!started.current) {
      started.current = true;
      flyTo(activeRef.current, performance.now());
    }
    let frame = 0;
    const tick = (now: number) => {
      const sp = spin.current;
      if (sp) {
        const k = progress(sp, now);
        rotation.current = [sp.from[0] + (sp.to[0] - sp.from[0]) * k, sp.from[1] + (sp.to[1] - sp.from[1]) * k];
        dirty.current = true;
        if (now - sp.start >= sp.duration) spin.current = null;
      }
      const zm = zoom.current;
      if (zm) {
        scale.current = zm.from + (zm.to - zm.from) * progress(zm, now);
        dirty.current = true;
        if (now - zm.start >= zm.duration) zoom.current = null;
      }
      draw(now);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Drag to spin; pulls back out to the whole globe while dragging.
  // Horizontal only on touch (touch-action: pan-y keeps the page
  // scrollable), both axes with a mouse.
  const drag = useRef<{ x: number; y: number; from: Rotation; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, from: rotation.current, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.pointerType === "touch" ? 0 : e.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dx) + Math.abs(dy) < 4) return;
      d.moved = true;
      spin.current = null;
      if (!reduceMotion) {
        zoom.current = { from: scale.current, to: RADIUS, start: performance.now(), duration: ZOOM_OUT_MS };
      } else {
        scale.current = RADIUS;
      }
      onDrag();
    }
    const speed = 90 / RADIUS; // degrees per pixel at globe scale
    rotation.current = [d.from[0] + dx * speed, Math.max(-75, Math.min(75, d.from[1] - dy * speed))];
    dirty.current = true;
    if (!running) draw(performance.now());
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
      role="img"
      aria-label={`Globe with the ${stops.length} cities I have trained in, connected to ${home.city}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <defs>
        <radialGradient id="globe-ocean" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="hsl(220 22% 15%)" />
          <stop offset="100%" stopColor="hsl(220 28% 7%)" />
        </radialGradient>
        <radialGradient id="globe-rim" cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="hsl(220 28% 6%)" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(220 28% 6%)" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="globe-halo" cx="50%" cy="50%" r="50%">
          <stop offset="86%" stopColor={GOLD} stopOpacity="0.08" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        {/* SVG filter rather than CSS drop-shadow(): WebKit doesn't repaint
            SVG elements with a CSS filter when their attributes change. */}
        <filter id="globe-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feFlood floodColor={GOLD} floodOpacity="0.9" />
          <feComposite in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="globe-lens">
          <circle cx={C} cy={C} r={RADIUS} />
        </clipPath>
      </defs>

      <circle cx={C} cy={C} r={RADIUS + 28} fill="url(#globe-halo)" />
      <circle cx={C} cy={C} r={RADIUS} fill="url(#globe-ocean)" />

      {/* Zoomed in, the sphere is larger than the frame: everything is seen
          through a globe-sized lens. */}
      <g clipPath="url(#globe-lens)">
        <path ref={gridRef} fill="none" stroke="hsl(220 15% 32%)" strokeWidth={0.5} opacity={0.4} />
        <path ref={landRef} fill="hsl(220 16% 21%)" />
        <path ref={bordersRef} fill="none" stroke="hsl(220 25% 11%)" strokeWidth={0.7} />

        {stops.map((stop, i) =>
          stop.home ? null : (
            <path
              key={stop.city}
              ref={(el) => {
                arcRefs.current[i] = el;
              }}
              fill="none"
              stroke={GOLD}
              strokeLinecap="round"
              strokeWidth={i === active ? 2.4 : 1.2}
              opacity={i === active ? 1 : 0.3}
              style={{ transition: "opacity 0.4s, stroke-width 0.4s" }}
            />
          ),
        )}

        <circle ref={pulseRef} r={4.5} fill="#fff" filter="url(#globe-glow)" />
      </g>

      <circle cx={C} cy={C} r={RADIUS} fill="url(#globe-rim)" className="pointer-events-none" />
      <circle cx={C} cy={C} r={RADIUS} fill="none" stroke="hsl(220 15% 26%)" />

      {/* Markers sit above the rim shade; draw() hides the ones outside the
          lens or on the far side. */}
      {stops.map((stop, i) => {
        const on = i === active;
        const labelled = on || stop.home;
        return (
          <g
            key={stop.city}
            ref={(el) => {
              markerRefs.current[i] = el;
            }}
            className="pointer-events-none transition-opacity duration-300"
          >
            {on && <circle r={7} fill="none" stroke={GOLD} strokeWidth={1.5} className="globe-ping" />}
            <circle
              r={stop.home ? 6.5 : on ? 6 : 4.5}
              fill={stop.home || on ? GOLD : "hsl(220 25% 8%)"}
              stroke={GOLD}
              strokeWidth={2}
            />
            {labelled && (
              // Home is labelled to the left, the active city to the right,
              // so the two never collide (Bremen is 40 km from Oldenburg).
              <text
                x={stop.home && !on ? -12 : 12}
                y={-12}
                textAnchor={stop.home && !on ? "end" : "start"}
                fill={on ? "#fff" : GOLD}
                fontSize={on ? 20 : 15}
                fontWeight={600}
                paintOrder="stroke"
                stroke="hsl(220 28% 7%)"
                strokeWidth={5}
                strokeLinejoin="round"
              >
                {stop.city}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default GymGlobe;
