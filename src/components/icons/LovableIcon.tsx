import { forwardRef } from "react";

/**
 * Lovable's actual brand mark, sourced from the open-source Dashboard Icons
 * collection (github.com/homarr-labs/dashboard-icons, Apache-2.0 - curated
 * specifically for this kind of "built with" attribution use), since
 * Lovable isn't in Simple Icons / react-icons.
 */
const LovableIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 121 122"
      fill="none"
      className={className}
      {...props}
    >
      <mask
        id="lovable-mask"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="121"
        height="122"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M36.0687 0C55.9888 0 72.1373 16.1551 72.1373 36.0835V49.7975H84.141C104.061 49.7975 120.21 65.9526 120.21 85.8809C120.21 105.809 104.061 121.964 84.141 121.964H0V36.0835C0 16.1551 16.1485 0 36.0687 0Z"
          fill="url(#lovable-gradient)"
        />
      </mask>
      <g mask="url(#lovable-mask)">
        <ellipse cx="52.7381" cy="65.1011" rx="81.3729" ry="81.1923" fill="#4B73FF" />
        <ellipse cx="61.6734" cy="20.547" rx="104.216" ry="81.1923" fill="#FF66F4" />
        <ellipse cx="78.6659" cy="5.26802" rx="81.3729" ry="71.3042" fill="#FF0105" />
        <ellipse cx="63.121" cy="20.5275" rx="48.9374" ry="48.8288" fill="#FE7B02" />
      </g>
      <defs>
        <linearGradient
          id="lovable-gradient"
          x1="40.4527"
          y1="21.4331"
          x2="76.9327"
          y2="121.971"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.025" stopColor="#FF8E63" />
          <stop offset="0.56" stopColor="#FF7EB0" />
          <stop offset="0.95" stopColor="#4B73FF" />
        </linearGradient>
      </defs>
    </svg>
  )
);
LovableIcon.displayName = "LovableIcon";

export default LovableIcon;
