// GSAP for the few staged moments of the app (the voyage on the sea chart,
// the scouter's measurement, the hand of quest cards, the chapter end). Loaded
// only when one of them plays, so the rest of the app never downloads it.
// With reduced motion nothing is loaded and every scene shows its end state.

type Motion = {
  gsap: typeof import("gsap").gsap;
  Flip: typeof import("gsap/Flip").Flip;
  SplitText: typeof import("gsap/SplitText").SplitText;
};

export type Timeline = ReturnType<Motion["gsap"]["timeline"]>;
export type Tween = ReturnType<Motion["gsap"]["to"]>;
export type FlipState = ReturnType<Motion["Flip"]["getState"]>;

let lib: Promise<Motion> | null = null;
let ready: Motion | null = null;

/** True when the person asked the system for less motion. */
export const reducedMotion = () => typeof window === "undefined" || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** GSAP with the plugins the scenes use. Rejects with reduced motion, so callers fall back to the end state. */
export function loadMotion(): Promise<Motion> {
  if (reducedMotion()) return Promise.reject(new Error("reduced motion"));
  lib ??= Promise.all([
    import("gsap"),
    import("gsap/MotionPathPlugin"),
    import("gsap/DrawSVGPlugin"),
    import("gsap/Flip"),
    import("gsap/CustomEase"),
    import("gsap/SplitText"),
  ]).then(([g, mp, dr, fl, ce, sp]) => {
    g.gsap.registerPlugin(mp.MotionPathPlugin, dr.DrawSVGPlugin, fl.Flip, ce.CustomEase, sp.SplitText);
    // Something set down with weight (a card into the hand, a stamp on paper): overshoot once, then rest.
    ce.CustomEase.create("arc.settle", "M0,0 C0.2,0.7 0.4,1.06 0.62,1.04 0.8,1.02 0.9,1 1,1");
    ready = { gsap: g.gsap, Flip: fl.Flip, SplitText: sp.SplitText };
    return ready;
  });
  lib.catch(() => {
    lib = null;
  });
  return lib;
}

/** The library if it has already loaded, for scenes that must start in the same frame (no flash of the end state). */
export const motionReady = (): Motion | null => (reducedMotion() ? null : ready);

/** Fetch the library once the page is idle, so the first scene does not wait for it. */
export function preloadMotion() {
  if (reducedMotion()) return;
  const go = () => void loadMotion().catch(() => {});
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(go, { timeout: 4000 });
  else setTimeout(go, 1500);
}
