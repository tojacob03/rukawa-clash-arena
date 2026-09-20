import { type ReactNode } from "react";
import { motion } from "framer-motion";

// Same curve as --ease-out-expo in index.css, so page transitions and
// section reveals share one motion language.
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Wraps a route's content so it cross-fades on navigation. Paired with
 * <AnimatePresence mode="wait"> in App.tsx, which holds the outgoing page
 * until its exit finishes before mounting the next one.
 *
 * DELIBERATELY OPACITY-ONLY - do not add transform/filter/blur here.
 * Any element with a `transform` or `filter` becomes the containing block
 * for `position: fixed` descendants, which is exactly what GSAP
 * ScrollTrigger uses to pin sections (TeamHistorySection's horizontal
 * scroll). And framer-motion leaves `filter: blur(0px)` on the node after
 * the animation settles - still a filter value, still a containing block -
 * so the pin stays broken, not just during the transition. That rendered
 * the pinned section as an empty black area.
 *
 * `opacity` creates a stacking context but NOT a containing block for
 * fixed positioning, so it is safe to animate here.
 */
const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{
      duration: 0.45,
      ease: EASE,
      // Exit is quicker than enter: a slow fade-out feels sluggish, a slow
      // fade-in feels considered.
      exit: { duration: 0.25, ease: "easeIn" },
    }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
