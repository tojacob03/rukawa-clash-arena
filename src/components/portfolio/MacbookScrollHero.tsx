"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface MacbookScrollHeroProps {
  title?: ReactNode;
  children: ReactNode;
}

const Macbook = ({ children }: { children: ReactNode }) => {
  const { scrollYProgress } = useScroll();
  const openProgress = useTransform(scrollYProgress, [0, 0.28], [0, 1]);
  const reducedMotion = useReducedMotion();

  const rotateX = useTransform(openProgress, [0, 1], [-28, 0]);
  const scaleY = useTransform(openProgress, [0, 1], [0.58, 1]);
  const scaleX = useTransform(openProgress, [0, 1], [1.02, 1]);
  const translateY = useTransform(openProgress, [0, 1], [8, 0]);

  return (
    <div className="relative w-[min(90vw,64rem)] [perspective:1200px]">
      <div className="relative aspect-[16/10] w-full rounded-[1.25rem] bg-[#08090b] p-[1.1%] shadow-2xl shadow-black/40">
        <motion.div
          style={
            reducedMotion
              ? undefined
              : {
                  rotateX,
                  scaleX,
                  scaleY,
                  translateY,
                  transformOrigin: "top center",
                  transformStyle: "preserve-3d",
                }
          }
          className="absolute inset-[1.1%] z-10 overflow-hidden rounded-[0.85rem] bg-[#0b0f19] ring-1 ring-white/10"
        >
          {children}
        </motion.div>
      </div>

      <div className="relative -z-10 mx-auto h-[clamp(7rem,18vw,13rem)] w-[92%] rounded-b-[1.5rem] rounded-t-[0.35rem] bg-gradient-to-b from-[#27282d] to-[#111216] shadow-2xl shadow-black/40">
        <div className="absolute inset-x-[10%] top-0 h-3 rounded-b-xl bg-[#07080a]" />
        <div className="absolute inset-x-[18%] bottom-[10%] h-[28%] rounded-xl border border-white/10 bg-[#1a1b20]" />
        <div className="absolute inset-x-[-3%] bottom-0 h-2 rounded-full bg-[#303138]" />
      </div>
    </div>
  );
};

const MacbookScrollHero = ({ title, children }: MacbookScrollHeroProps) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const prefersReducedMotion = useReducedMotion();

  const openProgress = useTransform(scrollYProgress, [0, 0.32], [0, 1]);
  const titleY = useTransform(openProgress, [0, 1], [0, -18]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[125vh] w-full flex-col items-center overflow-hidden px-4 pb-24 pt-12 sm:px-6 sm:pt-20"
    >
      <motion.div
        style={prefersReducedMotion ? undefined : { y: titleY }}
        className="relative z-20 mb-12 max-w-xl text-center sm:mb-16"
      >
        {title}
      </motion.div>

      <Macbook>{children}</Macbook>
    </section>
  );
};

export default MacbookScrollHero;
