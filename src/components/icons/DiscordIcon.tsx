import { forwardRef } from "react";

/**
 * Outline Discord mark, hand-drawn to match lucide-react's icon conventions
 * (24x24 viewBox, stroke-based, currentColor, 2px rounded stroke) since
 * lucide does not ship an official Discord glyph.
 */
const DiscordIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7 5c1-.7 2.6-1 5-1s4 .3 5 1l1.5 3c1 2 1 6 0 8.5-1 1.7-2.8 2.7-3.9 3.2l-1-2c-.6.15-1.2.3-1.6.3s-1-.15-1.6-.3l-1 2c-1.1-.5-2.9-1.5-3.9-3.2-1-2.5-1-6.5 0-8.5Z" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
    </svg>
  )
);
DiscordIcon.displayName = "DiscordIcon";

export default DiscordIcon;
