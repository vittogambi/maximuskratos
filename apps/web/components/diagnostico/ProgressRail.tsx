'use client';

import { useEffect, useRef, useState } from 'react';
import { AppIcon } from '@/components/app-icon';

/** Local presentation of the global completion value. Does not change how it is calculated. */
export function presentProgress(pct: number): { width: number; text: string; amount: string } {
  if (!Number.isFinite(pct) || pct <= 0) return { width: 0, text: 'Progreso total: 0 %', amount: '0 %' };
  if (pct >= 100) return { width: 100, text: 'Progreso total: 100 %', amount: '100 %' };
  const width = Math.min(100, Math.max(0, pct));
  let shown = Math.round(pct * 10) / 10;
  if (shown < 0.1) shown = 0.1;
  if (shown > 99.9) shown = 99.9;
  const amount = `${shown.toFixed(1).replace('.', ',')} %`;
  return { width, text: `Progreso total: ${amount}`, amount };
}

/** Name of the pass from the section id. Unknown sections stay with the general name. */
export function questionnaireStageLabel(slug: string | null | undefined): string {
  if (slug?.startsWith('e-aud')) return 'Auditoría inicial';
  if (slug?.startsWith('f-rad')) return 'Radiografía';
  if (slug?.startsWith('e-per')) return 'Perfil';
  return 'Cuestionario inicial';
}

type Props = {
  pct: number;
  questionIndex?: number | null;
  questionTotal?: number | null;
  moduleTitle?: string | null;
  /** Short name of this pass, shown with the exit action. */
  contextLabel?: string | null;
  /** default = in-question; outro = module just finished */
  variant?: 'default' | 'outro';
  exitLabel?: string | null;
  exitDisabled?: boolean;
  onExit?: () => void;
  /** Replaces the percent on screens that already state their own context, such as a module intro. */
  aside?: string | null;
  back?: { onClick: () => void; disabled?: boolean } | null;
};

export function ProgressRail({
  pct,
  questionIndex,
  questionTotal,
  moduleTitle,
  contextLabel,
  variant = 'default',
  exitLabel,
  exitDisabled,
  onExit,
  aside,
  back,
}: Props) {
  const progress = presentProgress(pct);
  const isOutro = variant === 'outro';
  const hasCounter = questionIndex != null && questionTotal != null && questionTotal > 0;
  const prevPctRef = useRef(progress.width);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (progress.width > prevPctRef.current) {
      setPulse(true);
      prevPctRef.current = progress.width;
      const timer = window.setTimeout(() => setPulse(false), 650);
      return () => window.clearTimeout(timer);
    }
    prevPctRef.current = progress.width;
  }, [progress.width]);

  const statusLabel = aside
    ? aside
    : isOutro
      ? 'Completo'
      : hasCounter
        ? `Pregunta ${questionIndex} de ${questionTotal}`
        : progress.text;

  return (
    <div className={`dk-progress-rail${isOutro ? ' dk-progress-rail--complete' : ''}`}>
      <div className="dk-rail-top">
        {back ? (
          <button
            type="button"
            className="dk-rail-back"
            aria-label="Anterior"
            onClick={back.onClick}
            disabled={back.disabled}
          >
            <AppIcon name="arrow-right" className="dk-rail-back__icon" size={18} aria-hidden />
          </button>
        ) : <span className="dk-rail-side" aria-hidden />}
        {contextLabel ? <p className="dk-rail-context">{contextLabel}</p> : null}
        {exitLabel && onExit ? (
          <button
            type="button"
            className="dk-exit-link"
            aria-label="Guardar y salir"
            onClick={onExit}
            disabled={exitDisabled}
          >
            Salir
            <AppIcon name="x" size={14} aria-hidden />
          </button>
        ) : <span className="dk-rail-side" aria-hidden />}
      </div>
      {(moduleTitle || aside || (isOutro && !hasCounter)) && (
        <div className="dk-rail-info">
          <span className="dk-rail-module-name">{moduleTitle ?? ''}</span>
          {aside || isOutro ? (
            <span className={`dk-rail-counter${isOutro ? ' dk-rail-counter--done' : ''}`}>{statusLabel}</span>
          ) : null}
        </div>
      )}

      <div className="dk-rail-meter">
        <span>Progreso total</span>
        <span>{progress.amount}</span>
      </div>
      <div
        className="dk-rail-track"
        role="progressbar"
        aria-valuenow={progress.width}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={progress.text}
      >
        <div
          className={`dk-rail-fill${pulse ? ' dk-rail-fill--pulse' : ''}`}
          style={{ width: `${progress.width}%` }}
        />
      </div>
    </div>
  );
}
