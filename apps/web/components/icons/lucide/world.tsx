import type { SVGProps } from 'react';

export function LucideWorld(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8.25" />
        <path d="M3.75 12h16.5" />
        <path d="M12 3.75c2.4 2.35 3.6 5.15 3.6 8.25s-1.2 5.9-3.6 8.25c-2.4-2.35-3.6-5.15-3.6-8.25s1.2-5.9 3.6-8.25Z" />
      </g>
    </svg>
  );
}

export default LucideWorld;
