"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

interface MacbookScrollHeroProps {
  title?: ReactNode;
  children: ReactNode;
}

/**
 * A small, self-contained MacBook scroll reveal.
 *
 * The lid is kept in normal flow above the base and animated around its top
 * edge. That makes the component work with any content, including the
 * imported player-analysis screenshot used on the home page.
 */
const MacbookScrollHero = ({ title, children }: MacbookScrollHeroProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 20%"],
  });

  const reveal = useTransform(scrollYProgress, [0, 0.72], [0, 1]);
  const lidRotate = useTransform(reveal, [0, 1], [-76, 0]);
  const lidScale = useTransform(reveal, [0, 1], [0.92, 1]);
  const lidY = useTransform(reveal, [0, 1], [34, 0]);
  const titleY = useTransform(reveal, [0, 1], [24, 0]);
  const titleOpacity = useTransform(reveal, [0, 0.55], [0, 1]);

  const motionStyle = prefersReducedMotion
    ? undefined
    : {
        rotateX: lidRotate,
        scale: lidScale,
        y: lidY,
        transformOrigin: "bottom center",
        transformStyle: "preserve-3d" as const,
      };

  return (
    <section
      ref={sectionRef}
      aria-label="Player analysis preview"
      className="relative flex min-h-[112vh] w-full flex-col items-center overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pt-24"
    >
      {title && (
        <motion.div
          style={prefersReducedMotion ? undefined : { y: titleY, opacity: titleOpacity }}
          className="relative z-20 mb-12 max-w-xl text-center sm:mb-16"
        >
          {title}
        </motion.div>
      )}

      <div className="relative w-[min(92vw,64rem)] [perspective:1800px]">
        {/* Display lid */}
        <motion.div
          style={motionStyle}
          className="relative z-10 aspect-[16/10] w-full origin-bottom rounded-[1.35rem] bg-[#07080a] p-[1.15%] shadow-[0_35px_90px_rgba(0,0,0,0.5)] [backface-visibility:hidden]"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[0.95rem] border border-white/10 bg-[#0b0f19] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="absolute inset-x-1/2 top-0 z-10 h-3 w-24 -translate-x-1/2 rounded-b-lg bg-[#050608]" />
            <div className="h-full w-full">{children}</div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/[0.06]" />
          </div>
        </motion.div>

        {/* Keyboard deck and front edge */}
        <div className="relative z-0 mx-auto -mt-px h-[clamp(6.5rem,16vw,11rem)] w-[92%] rounded-b-[1.7rem] rounded-t-[0.4rem] bg-gradient-to-b from-[#303238] via-[#202126] to-[#111216] shadow-[0_35px_70px_rgba(0,0,0,0.42)]">
          <div className="absolute inset-x-[9%] top-0 h-3 rounded-b-xl bg-[#060709] shadow-[0_2px_4px_rgba(255,255,255,0.08)]" />
          <div className="absolute inset-x-[17%] bottom-[12%] h-[27%] rounded-xl border border-white/10 bg-[#191a1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
          <div className="absolute inset-x-[-3%] bottom-0 h-2 rounded-full bg-[#383a41]" />
        </div>
      </div>
    </section>
  );
};

export default MacbookScrollHero;
