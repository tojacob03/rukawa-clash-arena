import { lazy, Suspense, useRef } from "react";
import { useInView } from "framer-motion";
import SectionIntro from "@/components/portfolio/SectionIntro";

// The map itself (world topology + d3-geo) is the heaviest thing on the
// homepage, so it is its own chunk and only starts loading when the section
// is about a screen away. The container has a fixed height, so nothing
// below it moves when the map arrives.
const WorldRouteMap = lazy(() => import("@/components/portfolio/WorldRouteMap"));

// CRL World Finals 2026, Shanghai, Nov 6-8 (China Standard Time). After the
// event the card switches from "next" to a recap label instead of going stale.
const WORLDS_END = new Date("2026-11-09T00:00:00+08:00");

const ShanghaiRoadmap = () => {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: "800px 0px" });
  const upcoming = new Date() < WORLDS_END;

  return (
    <section id="worlds" className="scroll-mt-20 px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          eyebrow="Road to Worlds"
          title="From regional qualifiers to the biggest stage."
          description="Two of the players I prepare qualified for the CRL World Finals 2026 in Shanghai."
        />

        <div
          ref={ref}
          className="relative mt-12 h-[420px] w-full overflow-hidden rounded-2xl border border-border/60 bg-card/40 sm:h-[500px]"
        >
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          {near && (
            <Suspense fallback={null}>
              <WorldRouteMap />
            </Suspense>
          )}

          <div className="pointer-events-none absolute bottom-6 left-6 right-6 z-10 md:bottom-auto md:right-auto md:top-6">
            <div className="rounded-xl border border-border/60 bg-background/80 p-5 shadow-2xl backdrop-blur-xl md:p-6">
              <div className="mb-3 flex items-center gap-2">
                {upcoming && <span className="h-2 w-2 animate-pulse rounded-full bg-clash-gold motion-reduce:animate-none" />}
                <span className="label-caps text-muted-foreground">
                  {upcoming ? "Next major event" : "Latest major event"}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-foreground md:text-2xl">CRL World Finals 2026</h3>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                <span className="font-medium text-clash-gold">Shanghai, China</span> · Nov 6-8 · 2 players qualified
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShanghaiRoadmap;
