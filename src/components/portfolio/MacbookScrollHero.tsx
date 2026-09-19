"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";

/**
 * A simplified, theme-adapted take on Aceternity's "Fey.com Macbook Scroll"
 * (https://ui.aceternity.com/components/macbook-scroll). Keeps the actual
 * mechanic - the lid opening as you scroll, via scroll-linked scale/rotate/
 * translate on framer-motion (already a project dependency) - but drops the
 * full decorative keyboard/speaker-grid markup from the original to keep
 * this lean. `children` renders inside the screen, so real content (not a
 * static screenshot) shows through.
 */

interface MacbookScrollHeroProps {
  title?: ReactNode;
  children: ReactNode;
}

const Lid = ({
  scaleX,
  scaleY,
  rotate,
  translate,
  children,
}: {
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  rotate: MotionValue<number>;
  translate: MotionValue<number>;
  children: ReactNode;
}) => {
  return (
    <div className="relative [perspective:800px]">
      {/* closed lid, sits behind the animated screen */}
      <div
        style={{ transform: "perspective(800px) rotateX(-25deg) translateZ(0px)", transformOrigin: "bottom" }}
        className="relative h-[12rem] w-[32rem] rounded-2xl bg-[#0a0a0c] p-2"
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#0a0a0c]">
          <span className="h-2 w-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* animated screen */}
      <motion.div
        style={{
          scaleX,
          scaleY,
          rotateX: rotate,
          translateY: translate,
          transformStyle: "preserve-3d",
          transformOrigin: "top",
        }}
        className="absolute inset-0 h-96 w-[32rem] rounded-2xl bg-[#0a0a0c] p-2"
      >
        <div className="absolute inset-0 rounded-lg bg-[#1a1a1d]" />
        <div className="absolute inset-2 overflow-hidden rounded-lg bg-background">{children}</div>
      </motion.div>
    </div>
  );
};

const Base = () => (
  <div className="relative -z-10 h-[22rem] w-[32rem] overflow-hidden rounded-2xl bg-[#1a1a1d]">
    <div className="relative h-10 w-full">
      <div className="absolute inset-x-0 mx-auto h-4 w-[80%] rounded-b bg-[#050505]" />
    </div>
    <div className="mx-auto mt-6 h-[65%] w-[85%] rounded-md bg-gradient-to-b from-[#242427] to-[#1a1a1d]" />
    <div className="absolute inset-x-0 bottom-6 mx-auto h-24 w-40 rounded-lg border border-[#3a3a3d]/60" />
  </div>
);

const MacbookScrollHero = ({ title, children }: MacbookScrollHeroProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const scaleX = useTransform(scrollYProgress, [0, 0.3], [1.2, isMobile ? 1 : 1.5]);
  const scaleY = useTransform(scrollYProgress, [0, 0.3], [0.6, isMobile ? 1 : 1.5]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, 1500]);
  const rotate = useTransform(scrollYProgress, [0.1, 0.12, 0.3], [-28, -28, 0]);
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Respect the visitor's OS-level motion preference: no scroll-linked 3D
  // transforms, just the laptop already open with its real content visible.
  if (prefersReducedMotion) {
    return (
      <div className="flex flex-col items-center py-16 sm:py-24">
        {title && <div className="mb-10 max-w-xl text-center">{title}</div>}
        <div className="relative h-[18rem] w-[90vw] max-w-[32rem] overflow-hidden rounded-2xl border-4 border-[#1a1a1d] bg-background sm:h-[22rem]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="flex min-h-[150vh] shrink-0 scale-[0.35] flex-col items-center justify-start py-0 [perspective:800px] sm:scale-50 md:scale-100 md:py-32"
    >
      <motion.div style={{ translateY: textTransform, opacity: textOpacity }} className="mb-16 max-w-xl text-center">
        {title}
      </motion.div>
      <Lid scaleX={scaleX} scaleY={scaleY} rotate={rotate} translate={translate}>
        {children}
      </Lid>
      <Base />
    </div>
  );
};

export default MacbookScrollHero;
