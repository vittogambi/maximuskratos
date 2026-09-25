import type { SVGProps } from 'react';

export function LucideCoins(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8.25" />
        <path d="M12 7.25v9.5" />
        <path d="M14.6 9.1a2.15 2.15 0 0 0-2-1.15h-.9a1.7 1.7 0 0 0 0 3.4h1.6a1.7 1.7 0 0 1 0 3.4h-.9a2.15 2.15 0 0 1-2-1.15" />
      </g>
    </svg>
  );
}

export default LucideCoins;
