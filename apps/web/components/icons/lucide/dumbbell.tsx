import type { SVGProps } from 'react';

export function LucideDumbbell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M14.4 14.4 9.6 9.6" />
        <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768" />
        <path d="m12.075 16.922.707-.707" />
        <path d="M4.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768" />
        <path d="m3 3 3 3" />
        <path d="m21 21-3-3" />
        <path d="m12.075 7.078-.707.707" />
        <path d="M6.343 6.343a2 2 0 1 0 2.829 2.829l-1.767-1.768" />
        <path d="m17.657 6.343 1.768-1.767a2 2 0 1 0-2.829-2.829l-1.767 1.768" />
      </g>
    </svg>
  );
}

export default LucideDumbbell;
