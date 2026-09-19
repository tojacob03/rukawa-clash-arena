import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type MacbookScrollProps = {
  src: string;
  alt?: string;
  className?: string;
};

/** A lightweight Aceternity-inspired MacBook reveal driven by the page scroll. */
export function MacbookScroll({ src, alt = "Product preview", className }: MacbookScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [38, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.82, 1]);
  const translateY = useTransform(scrollYProgress, [0, 1], [90, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <div ref={containerRef} className={cn("relative mx-auto w-full max-w-5xl px-4", className)}>
      <div className="pointer-events-none absolute inset-x-10 bottom-4 h-24 rounded-full bg-clash-purple/20 blur-3xl" />
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
