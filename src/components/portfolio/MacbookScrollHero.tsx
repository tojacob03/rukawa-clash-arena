"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";

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
      <div
        style={{ transform: "perspective(800px) rotateX(-25deg) translateZ(0px)", transformOrigin: "bottom" }}
        className="relative h-[12rem] w-[32rem] rounded-2xl bg-[#0a0a0c] p-2"
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#0a0a0c]">
          <span className="h-2 w-2 rounded-full bg-white/20" />
        </div>
      </div>

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
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const scaleX = useTransform(scrollYProgress, [0, 0.18], [1.05, isMobile ? 1.1 : 1.18]);
  const scaleY = useTransform(scrollYProgress, [0, 0.18], [0.92, isMobile ? 1.02 : 1.08]);
  const translate = useTransform(scrollYProgress, [0, 0.18], [0, isMobile ? 20 : 30]);
  const rotate = useTransform(scrollYProgress, [0, 0.18], [-8, 0]);
  const textTransform = useTransform(scrollYProgress, [0, 0.2], [0, 32]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 1]);

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
      className="flex min-h-[110vh] shrink-0 flex-col items-center justify-start overflow-hidden py-0 [perspective:800px] md:py-20"
    >
      <motion.div style={{ translateY: textTransform, opacity: textOpacity }} className="mb-12 max-w-xl text-center">
        {title}
      </motion.div>

      <div className="relative [perspective:800px]">
        <div
          style={{ transform: "perspective(800px) rotateX(-25deg) translateZ(0px)", transformOrigin: "bottom" }}
          className="relative h-[12rem] w-[32rem] rounded-2xl bg-[#0a0a0c] p-2"
        >
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#0a0a0c]">
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>
        </div>

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

      <Base />
    </div>
  );
};

export default MacbookScrollHero;
