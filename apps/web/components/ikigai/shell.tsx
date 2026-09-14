'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { EXIT_BODY, EXIT_LEAVE, EXIT_STAY, EXIT_TITLE, REVIEW_LABEL, BACK_LABEL } from '@/lib/ikigai-ui/copy';

export type IkigaiStopState = 'done' | 'current' | 'todo';

/** Stops of the whole experience: four lenses, conectar, contrastar, mapa. */
export const TRACK_LENGTH = 7;

export function trackStops(position: number): IkigaiStopState[] {
  return Array.from({ length: TRACK_LENGTH }, (_, index) =>
    index < position ? 'done' : index === position ? 'current' : 'todo',
  );
}

export function IkigaiTrack({ stops, label }: { stops: IkigaiStopState[]; label?: string }) {
  const position = stops.indexOf('current');
  const at = position < 0 ? stops.filter((stop) => stop === 'done').length : position + 1;
  return (
    <div
      className="ik-track"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={stops.length}
      aria-valuenow={at}
      aria-valuetext={`${label ?? 'Mapa'}, tramo ${at} de ${stops.length}`}
    >
      {stops.map((state, index) => (
        <span key={index} className={`ik-track__stop is-${state}`} aria-hidden />
      ))}
    </div>
  );
}

export function IkigaiShell({
  moment,
  momentStep,
  stops,
  banner,
  onRetry,
  onExit,
  exitLabel = 'Salir',
  confirmExit = false,
  onBack,
  actions,
  ctaHint,
  stackActions = false,
  children,
}: {
  moment?: string;
  momentStep?: string;
  stops?: IkigaiStopState[];
  banner?: string | null;
  onRetry?: () => void;
  onExit: () => void;
  exitLabel?: string;
  confirmExit?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
  ctaHint?: string | null;
  stackActions?: boolean;
  children: ReactNode;
}) {
  const [exitOpen, setExitOpen] = useState(false);

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

  useEffect(() => {
    if (!exitOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExitOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exitOpen]);

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
        <div className="ik-top__lead">
          {onBack ? (
            <button type="button" className="ik-back" onClick={onBack} aria-label={BACK_LABEL}>
              <span aria-hidden>‹</span>
            </button>
          ) : null}
          <p className="ik-top__id">
            <span className="ik-brand">MK</span>
            {moment ? (
              <span className="ik-moment">
                {moment}
                {momentStep ? <span className="ik-moment__step">{momentStep}</span> : null}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className="ik-exit"
          onClick={() => (confirmExit ? setExitOpen(true) : onExit())}
        >
          {exitLabel}
        </button>
      </header>
      <div className="ik-status">
        {stops ? <IkigaiTrack stops={stops} label={moment} /> : null}
        <p className="ik-review">{REVIEW_LABEL}</p>
      </div>
      <div className="ik-main">{children}</div>
      {actions ? (
        <div className="ik-cta">
          {ctaHint ? <p className="ik-cta__hint">{ctaHint}</p> : null}
          <div className={`ik-cta-bar${stackActions ? ' ik-cta-bar--stack' : ''}`}>{actions}</div>
        </div>
      ) : null}
      {exitOpen ? (
        <div className="ik-modal" role="dialog" aria-modal aria-labelledby="ik-exit-title">
          <button type="button" className="ik-modal__scrim" aria-label="Cerrar" onClick={() => setExitOpen(false)} />
          <div className="ik-modal__panel">
            <h2 id="ik-exit-title" className="ik-question font-body">
              {EXIT_TITLE}
            </h2>
            <p className="font-body-md ik-support">{EXIT_BODY}</p>
            <div className="ik-inline-actions">
              <button type="button" className="ag-btn-primary font-label-lg" onClick={() => setExitOpen(false)}>
                {EXIT_STAY}
              </button>
              <button type="button" className="ik-btn-quiet" onClick={onExit}>
                {EXIT_LEAVE}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
