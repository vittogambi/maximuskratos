'use client';

import { useEffect, type ReactNode } from 'react';
import { REVIEW_LABEL } from '@/lib/ikigai-ui/copy';

export function IkigaiProgress({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  return (
    <div className="ik-progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <span className="ik-progress__fill" style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

export function IkigaiShell({
  stepLabel,
  progress,
  progressMax = 4,
  banner,
  onRetry,
  onExit,
  exitLabel = 'Salir',
  actions,
  stackActions = false,
  children,
}: {
  stepLabel?: string;
  progress?: number;
  progressMax?: number;
  banner?: string | null;
  onRetry?: () => void;
  onExit: () => void;
  exitLabel?: string;
  actions?: ReactNode;
  stackActions?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function sync() {
      const viewport = window.visualViewport;
      if (!viewport) return;
      document.documentElement.style.setProperty('--ik-vvh', `${viewport.height}px`);
    }
    vv.addEventListener('resize', sync);
    sync();
    return () => vv.removeEventListener('resize', sync);
  }, []);

  return (
    <div className="ik-shell">
      {banner ? (
        <div className="ik-banner" role="alert">
          <span>{banner}</span>
          {onRetry ? (
            <button type="button" className="ik-text" onClick={onRetry}>
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}
      <header className="ik-top">
        <div className="ik-brand-block">
          <p className="ik-brand">MK</p>
          <p className="ik-review">{REVIEW_LABEL}</p>
        </div>
        <button type="button" className="ik-text" onClick={onExit}>
          {exitLabel}
        </button>
      </header>
      {stepLabel ? <p className="ik-kicker ik-moment">{stepLabel}</p> : null}
      {progress !== undefined ? <IkigaiProgress value={progress} max={progressMax} /> : null}
      <div className="ik-main">{children}</div>
      {actions ? (
        <div className={`ik-cta-bar${stackActions ? ' ik-cta-bar--stack' : ''}`}>{actions}</div>
      ) : null}
    </div>
  );
}
