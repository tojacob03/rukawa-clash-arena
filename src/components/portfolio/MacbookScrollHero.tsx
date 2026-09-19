"use client";

import type { ReactNode } from "react";

interface MacbookScrollHeroProps {
  title?: ReactNode;
  children: ReactNode;
}

const MacbookScrollHero = ({ title, children }: MacbookScrollHeroProps) => {
  return (
    <section className="relative flex w-full flex-col items-center overflow-hidden px-4 pb-18 pt-12 sm:px-6 sm:pt-20">
      {title && <div className="mb-10 max-w-xl text-center sm:mb-14">{title}</div>}

      <div className="relative w-[min(92vw,64rem)] [perspective:1200px]">
        <div className="relative aspect-[16/10] w-full rounded-[1.35rem] bg-[#08090b] p-[1.1%] shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-[1.1%] overflow-hidden rounded-[0.95rem] border border-white/10 bg-[#0b0f19]">
            {children}
          </div>
        </div>

        <div className="relative -z-10 mx-auto mt-[-0.5rem] h-[clamp(7rem,17vw,12rem)] w-[92%] rounded-b-[1.6rem] rounded-t-[0.35rem] bg-gradient-to-b from-[#2a2c31] to-[#14161a] shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-x-[10%] top-0 h-3 rounded-b-xl bg-[#07080a]" />
          <div className="absolute inset-x-[18%] bottom-[10%] h-[28%] rounded-xl border border-white/10 bg-[#1a1b20]" />
          <div className="absolute inset-x-[-3%] bottom-0 h-2 rounded-full bg-[#303138]" />
        </div>
      </div>
    </section>
  );
};

export default MacbookScrollHero;
