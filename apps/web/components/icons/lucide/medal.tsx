import type { SVGProps } from 'react';

export function LucideMedal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        <circle cx="12" cy="8" r="5.25" />
        <path d="M8.5 12.6 7.2 20.5 12 17.8l4.8 2.7-1.3-7.9" />
      </g>
    </svg>
  );
}

export default LucideMedal;
