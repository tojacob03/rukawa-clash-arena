import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "@/lib/smoothScroll";

gsap.registerPlugin(ScrollTrigger);

/**
 * Site-wide smooth scrolling, wired into GSAP so pinned sections stay in
 * sync with the scroll.
 *
 * Why this is compatible with the pinned Experience section and the sticky
 * MacbookScroll (unlike the page-transition wrapper was): Lenis animates
 * the NATIVE scroll position - it never transforms <body> or a wrapper. So
 * position:fixed and position:sticky keep resolving against the viewport.
 *
 * The three wiring lines below are the part that matters:
 *  1. lenis.on("scroll", ScrollTrigger.update) - ScrollTrigger recalculates
 *     on every interpolated Lenis frame, not only on raw native scroll
 *     events. Without it, the pin lags a frame behind and jitters.
 *  2. Lenis is driven by GSAP's ticker instead of its own rAF loop, so both
 *     update in the same frame, in the same order.
 *  3. lagSmoothing(0) stops GSAP from "catching up" after a slow frame,
 *     which would otherwise make the pinned section jump.
 */
const SmoothScroll = () => {
  useEffect(() => {
    // Respect the OS-level reduced-motion setting: plain native scrolling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      // Exponential ease-out - fast start, long gentle settle.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices keep native momentum scrolling; hijacking it tends
      // to feel worse than the platform default.
      syncTouch: false,
    });

    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
};

export default SmoothScroll;
