import type { SVGProps } from 'react';

/** Isometric Rubik cube, three faces, each split in nine. Identidad. */
export function LucideRubik(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none">
      <g stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
        <path fill="currentColor" fillOpacity="0.14" d="M12 3.2 20.4 8.1 12 13 3.6 8.1Z" />
        <path fill="currentColor" fillOpacity="0.32" d="M3.6 8.1 12 13v8.2l-8.4-4.9Z" />
        <path fill="currentColor" fillOpacity="0.52" d="M20.4 8.1 12 13v8.2l8.4-4.9Z" />
        <path d="M9.2 4.83 17.6 9.73M6.4 6.47 14.8 11.37M14.8 4.83 6.4 9.73M17.6 6.47 9.2 11.37" />
        <path d="M3.6 10.83 12 15.73M3.6 13.57 12 18.47M6.4 9.73v8.2M9.2 11.37v8.2" />
        <path d="M20.4 10.83 12 15.73M20.4 13.57 12 18.47M17.6 9.73v8.2M14.8 11.37v8.2" />
      </g>
    </svg>
  );
}

export default LucideRubik;
