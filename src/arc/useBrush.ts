// Section titles are written, not faded in: the kanji in the margin is
// brushed from top to bottom (the direction it is written in), then the
// title's lines rise out of their own baseline, one after the other. Plays
// once, when the title first comes into view, and only if GSAP is already
// loaded (no flash of hidden text). Reduced motion: never.

import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { motionReady } from "./motion.ts";

export function useBrush(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    const m = motionReady();
    // Lines are measured in the final typeface; before the fonts are in, show the title as it is.
    if (!el || !m || (typeof document !== "undefined" && document.fonts && document.fonts.status !== "loaded")) return;
    const { gsap, SplitText } = m;
    const title = el.querySelector("h1, h2");
    const kanji = el.querySelector(".wm");
    if (!title) return;
    const split = SplitText.create(title, { type: "lines", mask: "lines" });
    gsap.set(split.lines, { yPercent: 108 });
    if (kanji) gsap.set(kanji, { clipPath: "inset(0% 0% 100% 0%)" });
    let tl: ReturnType<typeof gsap.timeline> | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        tl = gsap.timeline({
          delay: 0.15,
          onComplete: () => {
            split.revert();
            if (kanji) gsap.set(kanji, { clearProps: "clipPath" });
          },
        });
        if (kanji) tl.to(kanji, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75, ease: "power2.inOut" }, 0);
        tl.to(split.lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.09 }, kanji ? 0.18 : 0);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tl?.kill();
      split.revert();
      if (kanji) gsap.set(kanji, { clearProps: "clipPath" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
