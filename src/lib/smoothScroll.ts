import Lenis from "lenis";

/**
 * Single shared Lenis instance for the whole site.
 *
 * Everything that scrolls the page programmatically (nav links, hash
 * jumps, route-change resets) must go through the helpers below rather
 * than window.scrollTo / element.scrollIntoView. Lenis keeps its own
 * target scroll position; a native programmatic scroll that bypasses it
 * can fight Lenis' interpolation and visibly snap back or stutter.
 */
let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

export const getLenis = () => instance;

// Matches the sticky nav height (scroll-mt-20 = 80px on sections). Lenis'
// scrollTo doesn't honour CSS scroll-margin, so the offset is explicit.
const NAV_OFFSET = -80;

/** Smoothly scroll to a section by id, falling back to native scrolling. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  if (instance) {
    instance.scrollTo(el, { offset: NAV_OFFSET, duration: 1.2 });
  } else {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

/** Jump to the top instantly (used on route changes). */
export function resetScroll() {
  if (instance) {
    instance.scrollTo(0, { immediate: true, force: true });
  } else {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }
}

/** Smoothly scroll to the top of the page. */
export function scrollToTop() {
  if (instance) {
    instance.scrollTo(0, { duration: 1.2 });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
