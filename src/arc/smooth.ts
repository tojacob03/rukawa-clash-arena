// Smooth scrolling on desktop (Lenis): the page moves like a heavy sheet of
// paper under the hand instead of jumping line by line. Only with a mouse or
// trackpad; touch keeps the native scroll, and reduced motion keeps it off.
// Surfaces with their own pan and zoom (the branch, the sea chart) and
// dialogs are left alone.

import type Lenis from "lenis";
import { reducedMotion } from "./motion.ts";

let lenis: Lenis | null = null;

const OWN_SCROLL = "[data-lenis-prevent], [role=dialog], .modal, .scroll-stage, .sea-frame, .sea-stage";

export function startSmooth(): () => void {
  if (reducedMotion() || !window.matchMedia?.("(pointer: fine)").matches) return () => {};
  let raf = 0;
  let stopped = false;
  void import("lenis").then(({ default: L }) => {
    if (stopped) return;
    lenis = new L({ lerp: 0.14, prevent: (node) => !!node.closest?.(OWN_SCROLL) });
    const loop = (t: number) => {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    lenis?.destroy();
    lenis = null;
  };
}

/** To the top of a new page at once, also while a smooth scroll is still running. */
export function jumpTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0 });
}
