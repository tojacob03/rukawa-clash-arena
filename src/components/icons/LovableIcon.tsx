import { forwardRef, type SVGProps } from "react";

const LovableIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 21s-7.5-4.7-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9Z"
        fill="#FF4D82"
      />
    </svg>
  ),
);

LovableIcon.displayName = "LovableIcon";

export default LovableIcon;
