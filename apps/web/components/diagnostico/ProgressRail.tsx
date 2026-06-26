'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  pct: number;
  questionIndex?: number | null;
  questionTotal?: number | null;
  moduleTitle?: string | null;
  /** default = in-question; outro = module just finished */
  variant?: 'default' | 'outro';
};

export function ProgressRail({
  pct,
  questionIndex,
  questionTotal,
  moduleTitle,
  variant = 'default',
}: Props) {
  const displayPct = Math.min(100, Math.max(0, Math.round(pct)));
  const isOutro = variant === 'outro';
  const hasCounter = questionIndex != null && questionTotal != null && questionTotal > 0;
  const prevPctRef = useRef(displayPct);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (displayPct > prevPctRef.current) {
      setPulse(true);
      prevPctRef.current = displayPct;
      const timer = window.setTimeout(() => setPulse(false), 650);
      return () => window.clearTimeout(timer);
    }
    prevPctRef.current = displayPct;
  }, [displayPct]);

  const statusLabel = isOutro
    ? 'Completo'
    : hasCounter
      ? `${questionIndex} / ${questionTotal}`
      : null;

  return (
    <div
      className={`dk-progress-rail${isOutro ? ' dk-progress-rail--complete' : ''}`}
      role="progressbar"
      aria-valuenow={displayPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Diagnóstico ${displayPct}% completado`}
    >
      <div className="dk-rail-info">
        <span className="dk-rail-module-name">
          {moduleTitle ?? 'Diagnóstico'}
        </span>
        {statusLabel && (
          <span className={`dk-rail-counter${isOutro ? ' dk-rail-counter--done' : ''}`}>
            {statusLabel}
          </span>
        )}
      </div>

      <div className="dk-rail-track">
        <div
          className={`dk-rail-fill${pulse ? ' dk-rail-fill--pulse' : ''}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>

      <div className="dk-rail-pct" aria-hidden>
        {displayPct}%
      </div>
    </div>
  );
}
