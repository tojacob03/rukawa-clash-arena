import { useEffect } from "react";
import NotFound from "./NotFound";

/**
 * Waza Arc is its own app (arc/index.html), served at /arc/. A link without
 * the trailing slash can land in the portfolio's SPA fallback instead; this
 * sends it on to /arc/. If the portfolio is showing on /arc/ itself, the host
 * did not serve the Arc entry, so there is nothing to redirect to.
 */
const ArcRedirect = () => {
  const withSlash = window.location.pathname.endsWith("/");

  useEffect(() => {
    if (!withSlash) window.location.replace(`/arc/${window.location.hash}`);
  }, [withSlash]);

  return withSlash ? <NotFound /> : null;
};

export default ArcRedirect;
