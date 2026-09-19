import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
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
  
  // Der Scroll-Progress misst den Fortschritt innerhalb des 300vh hohen Containers
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

  // Die originalen Aceternity-Transformationen für das "Herauswachsen" des Screens
  const scaleX = useTransform(scrollYProgress, [0, 0.3], [1.2, isMobile ? 1 : 1.5]);
  const scaleY = useTransform(scrollYProgress, [0, 0.3], [0.6, isMobile ? 1 : 1.5]);
  
  // FIX: Wir übersetzen den Laptop nicht mehr um absurde 1500px nach unten. 
  // Das hat vorher die Platzierung auf dem Monitor ruiniert.
  const translate = useTransform(scrollYProgress, [0, 1], [0, 800]); 
  
  const rotate = useTransform(scrollYProgress, [0.1, 0.12, 0.3], [-28, -28, 0]);
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    // FIX: py-80 entfernt. scale-Klassen entfernt. Wir machen das jetzt sauber responsiv.
    <div
      ref={ref}
      className="min-h-[300vh] flex flex-col items-center justify-start flex-shrink-0 w-full"
    >
      {/* 
        FIX: Der Sticky-Container erstreckt sich nun über die gesamte Bildschirmhöhe (h-screen).
        Das zwingt das MacBook, sich EXAKT in der vertikalen Mitte des Bildschirms auszurichten.
      */}
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        
        <motion.div
          style={{
            translateY: textTransform,
            opacity: textOpacity,
          }}
          className="absolute top-20 z-50 text-3xl md:text-5xl font-bold text-center px-4"
        >
          {title || (
            <span className="text-foreground">
              This Macbook is built with Tailwindcss. <br /> No kidding.
            </span>
          )}
        </motion.div>

        {/*
          Das MacBook-Element selbst.
          FIX: scale-[0.6] auf mobilen Geräten, md:scale-100 auf Desktop.
        */}
        <motion.div
          style={{
            transformY: translate,
            rotateX: rotate,
          }}
          className="flex flex-col items-center [perspective:800px] scale-[0.6] sm:scale-75 md:scale-100"
        >
          <div className="relative [perspective:800px]">
            <Lid src={src} scrollYProgress={scrollYProgress} scaleX={scaleX} scaleY={scaleY} />
          </div>
          
          {/* The Base (Keyboard Area) - bleibt bewusst unskaliert */}
          <div className="h-[22px] w-[32rem] bg-[#010101] rounded-2xl overflow-hidden relative -z-10">
            <div className="h-full w-full bg-gradient-to-b from-[#272729] to-[#010101]" />
          </div>
          <Trackpad />
          
          {showGradient && (
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent z-50 pointer-events-none" />
          )}
        </motion.div>

        {badge && <div className="absolute bottom-4 left-4 z-50">{badge}</div>}
      </div>
    </div>
  );
};

export const Lid = ({
  src,
  scrollYProgress,
  scaleX,
  scaleY,
}: {
  src?: string;
  scrollYProgress: any;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
}) => {
  // Der Deckel klappt von -90 Grad (zu) auf 0 Grad (auf) auf
  const lidRotation = useTransform(scrollYProgress, [0, 0.3], [-90, 0]);

  return (
    <motion.div
      style={{
        rotateX: lidRotation,
        scaleX,
        scaleY,
        transformOrigin: "bottom",
        transformStyle: "preserve-3d",
      }}
      className="h-[18rem] w-[32rem] bg-[#010101] rounded-2xl p-2 relative shadow-2xl"
    >
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-black rounded-b-lg z-20 flex justify-center items-center">
         <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
      </div>
      <div className="h-full w-full bg-slate-900 rounded-lg overflow-hidden relative z-10">
        {src ? (
          <img
            src={src}
            alt="Macbook display"
            className="object-cover object-top w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Image required</span>
          </div>
        )}
      </div>
      {/* Glanz-Effekt auf dem Bildschirm beim Aufklappen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 z-20 pointer-events-none rounded-lg" />
    </motion.div>
  );
};

export const Trackpad = () => {
  return (
    <div className="w-[32rem] h-[10rem] bg-gradient-to-b from-[#272729] to-[#010101] rounded-b-3xl relative -z-10 -mt-[2px] shadow-2xl flex flex-col items-center justify-start pt-2">
      {/* Keyboard Placeholder Mockup */}
      <div className="w-[28rem] h-[4.5rem] bg-[#111111] rounded-md border border-[#222222] mb-2 p-1 flex flex-col gap-0.5 opacity-80">
         <div className="w-full h-1/4 bg-[#1a1a1a] rounded-[2px]" />
         <div className="w-full h-1/4 bg-[#1a1a1a] rounded-[2px]" />
         <div className="w-full h-1/4 bg-[#1a1a1a] rounded-[2px]" />
         <div className="w-full h-1/4 flex gap-1">
            <div className="w-1/4 h-full bg-[#1a1a1a] rounded-[2px]" />
            <div className="flex-1 h-full bg-[#1a1a1a] rounded-[2px]" />
            <div className="w-1/4 h-full bg-[#1a1a1a] rounded-[2px]" />
         </div>
      </div>
      
      {/* Trackpad cutout */}
      <div className="w-[10rem] h-[4rem] border border-[#272729] rounded-xl bg-[#010101]/20 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]"></div>
      
      {/* Notch an der Kante zum Aufklappen */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-b from-neutral-600 to-transparent rounded-t-full" />
    </div>
  );
};
