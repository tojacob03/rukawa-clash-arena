import { forwardRef } from "react";

/**
 * Lovable's heart mark, hand-drawn since it isn't in Simple Icons /
 * react-icons. Uses their actual brand gradient (hot pink -> coral).
 */
const LovableIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => {
    const gradientId = "lovable-gradient";
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={className}
        {...props}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF4F86" />
            <stop offset="100%" stopColor="#FF8A4F" />
          </linearGradient>
        </defs>
        <path
          fill={`url(#${gradientId})`}
          d="M12 20.8c-.35 0-.7-.12-.98-.35C6.6 17.02 3.5 13.9 3.5 9.9 3.5 6.9 5.8 4.7 8.6 4.7c1.4 0 2.7.6 3.4 1.6.7-1 2-1.6 3.4-1.6 2.8 0 5.1 2.2 5.1 5.2 0 4-3.1 7.12-7.52 10.55-.28.23-.63.35-.98.35Z"
        />
      </svg>
    );
  }
);
LovableIcon.displayName = "LovableIcon";

export default LovableIcon;
