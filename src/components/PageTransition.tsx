import { type ReactNode } from "react";
import { motion } from "framer-motion";

// Same curve as --ease-out-expo in index.css, so page transitions and
// section reveals share one motion language.
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Wraps a route's content so it fades/blurs in on enter and out on exit.
 * Paired with <AnimatePresence mode="wait"> in App.tsx, which holds the
 * outgoing page until its exit finishes before mounting the next one -
 * without "wait", both pages would be in the DOM at once and the layout
 * would visibly jump.
 */
const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
    transition={{
      duration: 0.5,
      ease: EASE,
      // Exit is deliberately quicker than enter: a slow fade-out feels
      // sluggish, a slow fade-in feels considered.
      exit: { duration: 0.28, ease: "easeIn" },
    }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
