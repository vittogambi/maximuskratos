import type { SVGProps } from 'react';

export function LucideStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="m12 2.8 2.35 5.16 5.64.7-4.18 3.86 1.1 5.58L12 15.7l-4.91 2.4 1.1-5.58L3.99 8.66l5.64-.7L12 2.8Z"
      />
    </svg>
  );
}

export default LucideStar;
