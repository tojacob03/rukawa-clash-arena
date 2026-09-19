import { ReactNode, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type MacbookScrollProps = {
  title?: ReactNode;
  badge?: ReactNode;
  src: string;
  alt?: string;
  showGradient?: boolean;
  className?: string;
};

/** Aceternity-style MacBook preview with a scroll-driven laptop reveal. */
export function MacbookScroll({
  title,
  badge,
  src,
  alt = "Product preview",
  showGradient = true,
  className,
}: MacbookScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.25,
  });

  const rotateX = useTransform(smoothProgress, [0, 1], [35, 0]);
  const scale = useTransform(smoothProgress, [0, 1], [0.78, 1]);
  const translateY = useTransform(smoothProgress, [0, 1], [100, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.18], [0, 1]);

  return (
    <div ref={containerRef} className={cn("relative mx-auto w-full max-w-5xl px-4", className)}>
      {showGradient && (
        <div className="pointer-events-none absolute inset-x-10 top-16 h-64 rounded-full bg-clash-purple/20 blur-3xl" />
      )}

      {(title || badge) && (
        <div className="relative z-10 mb-8 flex flex-col items-center justify-center gap-4 text-center">
          {title && (
            <div className="max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </div>
          )}
          {badge}
        </div>
      )}

      <motion.div
        style={{ rotateX, scale, y: translateY, opacity, transformPerspective: 1200 }}
        className="relative mx-auto origin-bottom [transform-style:preserve-3d]"
      >
        <div className="relative overflow-hidden rounded-t-[1.15rem] border-[10px] border-b-0 border-slate-700/90 bg-slate-950 shadow-2xl shadow-black/50 sm:rounded-t-[1.5rem] sm:border-[14px] sm:border-b-0">
          <div className="absolute left-1/2 top-1 z-10 h-2.5 w-20 -translate-x-1/2 rounded-b-lg bg-black/80 sm:h-3 sm:w-28" />
          <div className="aspect-[16/10] overflow-hidden bg-black">
            <img src={src} alt={alt} className="h-full w-full object-cover object-top" />
          </div>
        </div>
        <div className="relative h-3 rounded-b-[1.25rem] bg-gradient-to-b from-slate-500 via-slate-300 to-slate-500 shadow-xl sm:h-4 sm:rounded-b-[1.75rem]">
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-b-full bg-slate-700/70 sm:w-24" />
        </div>
        <div className="mx-auto h-2 w-[92%] rounded-b-full bg-slate-500/60 blur-[1px] sm:h-3" />
      </motion.div>
    </div>
  );
}

export default MacbookScroll;
