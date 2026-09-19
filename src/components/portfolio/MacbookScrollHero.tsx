"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface MacbookScrollHeroProps {
  title?: ReactNode;
  children: ReactNode;
}

const MacbookScrollHero = ({ title, children }: MacbookScrollHeroProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Keep the animation driven by this section's progress rather than the
  // global page progress, so it also works when the hero is below the fold.
  const progress = useTransform(scrollYProgress, [0.12, 0.42], [0, 1], {
    clamp: true,
  });
  const rotateX = useTransform(progress, [0, 1], [-72, 0]);
  const translateY = useTransform(progress, [0, 1], [28, 0]);
  const scale = useTransform(progress, [0, 1], [0.94, 1]);
  const titleY = useTransform(progress, [0, 1], [22, 0]);
  const titleOpacity = useTransform(progress, [0, 0.55], [0, 1]);

  const lidStyle = prefersReducedMotion
    ? undefined
    : {
        rotateX,
        y: translateY,
        scale,
        transformOrigin: "bottom center",
        transformStyle: "preserve-3d" as const,
      };

  return (
    <section
      ref={sectionRef}
      aria-label="Player analysis preview"
      className="relative min-h-[140vh] w-full overflow-hidden px-4 pt-16 sm:px-6 sm:pt-24"
    >
      <div className="sticky top-16 flex min-h-[calc(100vh-4rem)] flex-col items-center sm:top-20 sm:min-h-[calc(100vh-5rem)]">
        {title && (
          <motion.div
            style={prefersReducedMotion ? undefined : { y: titleY, opacity: titleOpacity }}
            className="relative z-20 mb-10 max-w-xl text-center sm:mb-14"
          >
            {title}
          </motion.div>
        )}

        <div className="relative w-[min(92vw,64rem)] [perspective:1800px]">
          <motion.div
            style={lidStyle}
            className="relative z-10 aspect-[16/10] w-full origin-bottom rounded-[1.35rem] bg-[#07080a] p-[1.15%] shadow-[0_35px_90px_rgba(0,0,0,0.5)] [backface-visibility:hidden]"
          >
            <div className="relative h-full w-full overflow-hidden rounded-[0.95rem] border border-white/10 bg-[#0b0f19]">
              <div className="absolute inset-x-1/2 top-0 z-10 h-3 w-24 -translate-x-1/2 rounded-b-lg bg-[#050608]" />
              {/* The extra absolute wrapper guarantees the screenshot can never
                  paint outside the display, regardless of its intrinsic size. */}
              <div className="absolute inset-0 overflow-hidden rounded-[0.95rem]">
                <div className="flex h-full w-full items-center justify-center">
                  {children}
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/[0.06]" />
            </div>
          </motion.div>

          <div className="relative z-0 mx-auto -mt-px h-[clamp(6.5rem,16vw,11rem)] w-[92%] rounded-b-[1.7rem] rounded-t-[0.4rem] bg-gradient-to-b from-[#303238] via-[#202126] to-[#111216] shadow-[0_35px_70px_rgba(0,0,0,0.42)]">
            <div className="absolute inset-x-[9%] top-0 h-3 rounded-b-xl bg-[#060709]" />
            <div className="absolute inset-x-[17%] bottom-[12%] h-[27%] rounded-xl border border-white/10 bg-[#191a1f]" />
            <div className="absolute inset-x-[-3%] bottom-0 h-2 rounded-full bg-[#383a41]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MacbookScrollHero;
