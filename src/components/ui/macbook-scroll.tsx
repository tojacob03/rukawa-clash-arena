import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const MacbookScroll = ({
  src,
  showGradient,
  title,
  badge,
}: {
  src?: string;
  showGradient?: boolean;
  title?: string | React.ReactNode;
  badge?: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window && window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  const scaleX = useTransform(
    scrollYProgress,
    [0, 0.3],
    [1.2, isMobile ? 1 : 1.5]
  );
  const scaleY = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0.6, isMobile ? 1 : 1.5]
  );
  const translate = useTransform(scrollYProgress, [0, 1], [0, 1500]);
  const rotate = useTransform(scrollYProgress, [0.1, 0.12, 0.3], [-28, -28, 0]);
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div
      ref={ref}
      className="min-h-[200vh] flex flex-col items-center py-0 md:py-80 justify-start flex-shrink-0 [perspective:800px] transform md:scale-100 scale-[0.35] sm:scale-50"
    >
      <motion.h2
        style={{
          translateY: textTransform,
          opacity: textOpacity,
        }}
        className="dark:text-white text-neutral-800 text-3xl pb-20 md:text-5xl font-bold mb-20 text-center"
      >
        {title || (
          <span>
            This Macbook is built with Tailwindcss. <br /> No kidding.
          </span>
        )}
      </motion.h2>
      {/* Magic happens here */}
      <motion.div
        style={{
          transformY: translate,
          rotateX: rotate,
          scaleX,
          scaleY,
        }}
        className="flex flex-col items-center sticky top-20"
      >
        <div className="relative">
          <Lid src={src} />
        </div>
        <div className="h-[22px] w-[32rem] 32rem bg-[#010101] rounded-2xl overflow-hidden relative -z-10">
          <div className="h-full w-full bg-gradient-to-b from-[#272729] to-[#010101]" />
        </div>
        <Trackpad />
      </motion.div>
      {badge && <div className="absolute bottom-4 left-4">{badge}</div>}
    </div>
  );
};

export const Lid = ({ src }: { src?: string }) => {
  return (
    <div className="relative [perspective:800px]">
      <div
        style={{
          transform: "perspective(800px) rotateX(-25deg) translateZ(0px)",
          transformOrigin: "bottom",
          transformStyle: "preserve-3d",
        }}
        className="h-[12rem] w-[32rem] bg-[#010101] rounded-2xl p-2 relative"
      >
        <div className="h-full w-full bg-slate-900 rounded-lg overflow-hidden relative">
          {src ? (
            <img
              src={src}
              alt="Macbook display"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <span className="text-white font-semibold">Replace me</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Trackpad = () => {
  return (
    <div
      className="w-[32rem] h-[10rem] bg-gradient-to-b from-[#272729] to-[#010101] rounded-b-3xl relative -z-10 -mt-[2px]"
    >
      <div className="w-[10rem] h-[5rem] border border-[#272729] rounded-xl absolute top-2 left-1/2 -translate-x-1/2 bg-[#010101]/20"></div>
    </div>
  );
};
