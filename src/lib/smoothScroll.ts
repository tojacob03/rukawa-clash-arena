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

/**
 * Smoothly scroll to a section by id, falling back to native scrolling.
 *
 * The distance to the sticky nav comes from each section's CSS
 * scroll-margin (scroll-mt-14 = the 56px nav; lg:scroll-mt-0 on sections
 * that stick or pin, which fill the viewport from their very top). Lenis
 * honours scroll-margin, so no extra offset here - the old hard-coded
 * -80px was added on top of it and made every jump land off-centre.
 */
export function scrollToSection(id: string) {
  let el = document.getElementById(id);
  // Sections with separate mobile markup (e.g. Experience) hide the desktop
  // element below their breakpoint; jump to the visible "<id>-mobile" then.
  if (el && el.getClientRects().length === 0) el = document.getElementById(`${id}-mobile`) ?? el;
  if (!el) return;

  if (instance) {
    instance.scrollTo(el, { duration: 1.2 });
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
