import { forwardRef } from "react";

/**
 * Lovable's heart mark, redrawn as an original vector shape matching their
 * current brand (verified directly on their official Brand Hub at
 * lovablebrand.lovable.app/brand/logo: a rounded heart with a blue -> pink
 * -> orange gradient). Not in Simple Icons / react-icons, so this is a
 * from-scratch heart path rather than a traced/scraped asset.
 */
const LovableIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="lovable-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C6EF5" />
          <stop offset="50%" stopColor="#FF5CA8" />
          <stop offset="100%" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
      {/* Standard rounded-heart curve: two lobes meeting at a center dip,
          tapering to a single bottom point. */}
      <path
        fill="url(#lovable-gradient)"
        d="M12 20.5c-.35 0-.69-.12-.96-.35C7.1 16.7 3.5 13.2 3.5 9.1 3.5 6.28 5.78 4 8.6 4c1.42 0 2.72.65 3.4 1.7.68-1.05 1.98-1.7 3.4-1.7 2.82 0 5.1 2.28 5.1 5.1 0 4.1-3.6 7.6-7.54 11.05-.27.23-.61.35-.96.35Z"
      />
    </svg>
  )
);
LovableIcon.displayName = "LovableIcon";

export default LovableIcon;
