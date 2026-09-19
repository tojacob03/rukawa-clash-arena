import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type MacbookScrollProps = {
  src: string;
  alt?: string;
  className?: string;
};

/**
 * MacBook Scroll: the laptop remains in place while the page screenshot
 * travels vertically inside the display as the user scrolls.
 */
export function MacbookScroll({ src, alt = "Product preview", className }: MacbookScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Keep the MacBook frame stable; only the content in its display moves.
  const screenY = useTransform(scrollYProgress, [0.15, 0.85], ["0%", "-42%"]);

  return (
    <div ref={containerRef} className={cn("relative mx-auto w-full max-w-5xl px-4", className)}>
      <div className="pointer-events-none absolute inset-x-10 bottom-5 h-24 rounded-full bg-clash-purple/20 blur-3xl" />

      <div className="relative mx-auto [perspective:1600px]">
        <div className="relative overflow-hidden rounded-t-[1.15rem] border-[10px] border-b-0 border-slate-700/90 bg-slate-950 shadow-2xl shadow-black/50 sm:rounded-t-[1.5rem] sm:border-[14px] sm:border-b-0">
          <div className="absolute left-1/2 top-1 z-20 h-2.5 w-20 -translate-x-1/2 rounded-b-lg bg-black/80 sm:h-3 sm:w-28" />

          {/* The viewport is the MacBook screen. The screenshot scrolls inside it. */}
          <div className="relative aspect-[16/10] overflow-hidden bg-black">
            <motion.img
              src={src}
              alt={alt}
              style={{ y: screenY }}
              className="absolute left-0 top-0 h-[142%] w-full max-w-none object-cover object-top"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
          </div>
        </div>

        <div className="relative h-3 rounded-b-[1.25rem] bg-gradient-to-b from-slate-500 via-slate-300 to-slate-500 shadow-xl sm:h-4 sm:rounded-b-[1.75rem]">
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-b-full bg-slate-700/70 sm:w-24" />
        </div>
        <div className="mx-auto h-2 w-[92%] rounded-b-full bg-slate-500/60 blur-[1px] sm:h-3" />
      </div>
    </div>
  );
}

export default MacbookScroll;
