'use client';

import { useReducedMotion } from 'motion/react';

type MkCycleHubProps = {
  /** Accessible label for the hub graphic. */
  label?: string;
};

/**
 * Classic spur-gear outline: tip / flank / root sequence for each tooth.
 * Single closed path so the silhouette reads as one cog, not stacked shapes.
 */
function spurGearPath({
  cx,
  cy,
  teeth,
  tipR,
  rootR,
}: {
  cx: number;
  cy: number;
  teeth: number;
  tipR: number;
  rootR: number;
}): string {
  const step = (Math.PI * 2) / teeth;
  const tipHalf = step * 0.16;
  const rootHalf = step * 0.34;
  const parts: string[] = [];

  for (let i = 0; i < teeth; i++) {
    const mid = -Math.PI / 2 + i * step;
    const pts: Array<[number, number]> = [
      [cx + rootR * Math.cos(mid - rootHalf), cy + rootR * Math.sin(mid - rootHalf)],
      [cx + tipR * Math.cos(mid - tipHalf), cy + tipR * Math.sin(mid - tipHalf)],
      [cx + tipR * Math.cos(mid + tipHalf), cy + tipR * Math.sin(mid + tipHalf)],
      [cx + rootR * Math.cos(mid + rootHalf), cy + rootR * Math.sin(mid + rootHalf)],
    ];
    for (const [x, y] of pts) {
      parts.push(`${parts.length === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  }
  parts.push('Z');
  return parts.join(' ');
}

const GEAR_OUTER = spurGearPath({ cx: 50, cy: 50, teeth: 16, tipR: 47, rootR: 37 });

/**
 * Cycle engine hub: real spur gear around the MK shield mark.
 * Desktop-only visual (parent CSS hides hub on small screens).
 */
export function MkCycleHub({ label = 'Ciclo operativo Maximus Kratos' }: MkCycleHubProps) {
  const reduced = useReducedMotion();

  return (
    <div className="ag-about-cycle__hub" aria-hidden title={label}>
      <div className={`ag-about-cycle__gear${reduced ? '' : ' ag-about-cycle__gear--spin'}`}>
        <svg className="ag-about-cycle__gear-svg" viewBox="0 0 100 100" aria-hidden>
          {/* Soft plate behind teeth */}
          <circle className="ag-about-cycle__gear-plate" cx="50" cy="50" r="36.5" />
          {/* Spur gear silhouette */}
          <path className="ag-about-cycle__gear-rim" d={GEAR_OUTER} />
          {/* Inner ring + bore for the mark */}
          <circle className="ag-about-cycle__gear-ring" cx="50" cy="50" r="28" />
          <circle className="ag-about-cycle__gear-bore" cx="50" cy="50" r="21" />
        </svg>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mk-shield.png" alt="" className="ag-about-cycle__hub-mark" />
    </div>
  );
}

/** Strengthened dashed orbit ring behind the steps. */
export function MkCycleOrbit() {
  return (
    <svg className="ag-about-cycle__orbit" viewBox="0 0 100 100" aria-hidden>
      <circle
        className="ag-about-cycle__orbit-track-soft"
        cx="50"
        cy="50"
        r="38"
        fill="none"
        pathLength="100"
      />
      <circle
        className="ag-about-cycle__orbit-track"
        cx="50"
        cy="50"
        r="38"
        fill="none"
        pathLength="100"
      />
    </svg>
  );
}
