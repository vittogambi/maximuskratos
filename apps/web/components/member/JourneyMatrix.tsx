'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { apiDiagnosticStartTerritory } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { routeDiagnosticFromState } from '@/lib/diagnostic-continue';
import {
  actActionLabel,
  actStatusCopy,
  actWeekDetail,
  designActionLabel,
  designStageBrief,
  discoverActionLabel,
  territoryCoveragePercent,
} from '@/lib/territory-ui-copy';
import { civilDayLabel } from '@/lib/dashboard-next';
import type { MatrixRow } from '@/lib/journey-api';

const ICONS: Record<string, string> = {
  MENTALIDAD: 'brain',
  FINANZAS: 'wallet',
  RELACIONES: 'users',
  SALUD_FISICA: 'dumbbell',
};

function discoverHref(territory: string) {
  return `/ambito/${encodeURIComponent(territory)}?fase=descubre`;
}

function designHref(row: MatrixRow) {
  if (!row.plan) return `/disenar?territorio=${encodeURIComponent(row.territory)}`;
  if (row.plan.stage === 'PREPARING') return `/disenar/${row.plan.id}`;
  return `/planes/${row.plan.id}`;
}

function matrixDesignActionLabel(stage: string | null | undefined): string {
  if (stage === 'PREPARING') return 'Continuar plan';
  return designActionLabel(stage);
}

function discoverPrimaryLine(state: string | undefined, settled: number, required: number): string | null {
  if (state === 'EXPLORED') return 'Explorado';
  if (state === 'PARTIAL' && required > 0 && settled > 0) {
    return `${territoryCoveragePercent(settled, required)}% completado`;
  }
  return null;
}

function exceptionProgressLabel(count: number): string {
  if (count === 1) return '1 respuesta sin respuesta directa';
  return `${count} respuestas sin respuesta directa`;
}

function actHref(row: MatrixRow) {
  if (!row.plan || row.plan.stage === 'PREPARING') return null;
  if (row.plan.stage === 'CLOSED' || row.plan.stage === 'PAUSED') return `/planes/${row.plan.id}`;
  return `/semana?planId=${encodeURIComponent(row.plan.id)}`;
}

function MatrixCellAction({
  href,
  onClick,
  busy,
  disabled,
  children,
  ariaLabel,
}: {
  href?: string;
  onClick?: () => void;
  busy?: boolean;
  disabled?: boolean;
  children: string;
  ariaLabel: string;
}) {
  const content = (
    <>
      <span className="mk-mx-matrix__action-label">{children}</span>
      <span className="mk-mx-matrix__action-arrow" aria-hidden>
        ↗
      </span>
    </>
  );
  if (href) {
    return (
      <Link className="mk-mx-matrix__action" href={href} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="mk-mx-matrix__action"
      disabled={disabled || busy}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

function DiscoverStart({ territory, label, state }: { territory: string; label: string; state: string | undefined }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = discoverActionLabel(state);
  if (state === 'EXPLORED') {
    return (
      <MatrixCellAction href={discoverHref(territory)} ariaLabel={`${action} Descubre en ${label}`}>
        {action}
      </MatrixCellAction>
    );
  }
  return (
    <div className="mk-mx-matrix__action-wrap">
      <MatrixCellAction
        busy={busy}
        ariaLabel={`${action} Descubre en ${label}`}
        onClick={() => {
          const token = getAccessToken();
          if (!token) {
            window.location.href = '/login';
            return;
          }
          setError(null);
          setBusy(true);
          void apiDiagnosticStartTerritory(token, territory)
            .then((next) => routeDiagnosticFromState(next, { replace: (path) => { window.location.assign(path); } }))
            .catch(() => {
              setBusy(false);
              setError('No pudimos abrir el cuestionario. Inténtalo nuevamente.');
            });
        }}
      >
        {busy ? 'Abriendo' : action}
      </MatrixCellAction>
      {error ? (
        <p className="mk-mx-matrix__inline-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CellLink({ href, children, ariaLabel }: { href: string; children: string; ariaLabel: string }) {
  return (
    <MatrixCellAction href={href} ariaLabel={ariaLabel}>
      {children}
    </MatrixCellAction>
  );
}

export function JourneyMatrix({
  rows,
  weekStart: _weekStart,
  showActNote = true,
}: {
  rows: MatrixRow[];
  weekStart?: string | null;
  showActNote?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [compact, setCompact] = useState(true);

  const syncScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCompact(max > 8);
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    syncScroll();
    const el = scrollRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => syncScroll());
    ro.observe(el);
    el.addEventListener('scroll', syncScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', syncScroll);
    };
  }, [syncScroll, rows.length]);

  function scrollPhase(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const sticky = el.querySelector<HTMLElement>('.mk-mx-table__corner');
    const gutter = sticky?.getBoundingClientRect().width ?? 0;
    const phases = [...el.querySelectorAll<HTMLElement>('.mk-mx-table thead th:not(.mk-mx-table__corner)')];
    if (!phases.length) return;
    const box = el.getBoundingClientRect();
    const starts = phases.map((node) => node.getBoundingClientRect().left - box.left + el.scrollLeft);
    const view = el.scrollLeft + gutter + 8;
    let index = 0;
    starts.forEach((start, i) => {
      if (start <= view) index = i;
    });
    const next = Math.min(phases.length - 1, Math.max(0, index + direction));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: Math.max(0, starts[next] - gutter), behavior: reduced ? 'auto' : 'smooth' });
  }

  const actFootnoteNeeded = rows.some((row) => !actHref(row));

  return (
    <section id="recorrido" tabIndex={-1} className="mk-mx-surface mk-mx-matrix" aria-labelledby="mk-mx-matrix-title">
      <header className="mk-mx-matrix__head">
        <div className="mk-mx-matrix__head-row">
          <h2 id="mk-mx-matrix-title" className="mk-mx-section-title">
            Tus ámbitos
          </h2>
          {compact ? (
            <div className="mk-mx-matrix__nav">
              <button
                type="button"
                className="mk-mx-scroll-btn"
                disabled={!canPrev}
                aria-label="Ver fases anteriores"
                onClick={() => scrollPhase(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="mk-mx-scroll-btn"
                disabled={!canNext}
                aria-label="Ver fases siguientes"
                onClick={() => scrollPhase(1)}
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
        {compact ? <p className="mk-mx-scroll-hint">Desliza para ver las otras fases</p> : null}
      </header>
      <div ref={scrollRef} className="mk-mx-scroll" tabIndex={0}>
        <table className="mk-mx-table" aria-label="Tus ámbitos por fase">
          <thead>
            <tr>
              <th scope="col" className="mk-mx-table__corner">
                <span className="mk-mx-sr-only">Ámbito</span>
              </th>
              <th scope="col">Descubre</th>
              <th scope="col">Diseña</th>
              <th scope="col">Actúa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const actLink = actHref(row);
              const designLink = designHref(row);
              const week = row.plan?.week ?? null;
              const actDetail = actWeekDetail(week);
              const discoverLine = discoverPrimaryLine(row.discover.state, row.discover.settled, row.discover.required);
              const discoverPercent = territoryCoveragePercent(row.discover.settled, row.discover.required);
              const discoverShowProgress = row.discover.state === 'PARTIAL' && row.discover.settled > 0 && row.discover.required > 0;
              const discoverHasExtra = Boolean(discoverLine || discoverShowProgress || row.discover.exceptionCount > 0);
              const nextDay = row.plan?.nextOccasion ? civilDayLabel(row.plan.nextOccasion.day) : null;
              const designStage = row.plan?.stage ?? null;
              const designHasExtra = Boolean(designStage || row.planCount > 1);
              const actHasPlan = Boolean(row.plan && row.plan.stage !== 'PREPARING');

              return (
                <tr key={row.territory} className={row.plan?.isFocus ? 'is-focus' : undefined}>
                  <th scope="row" className="mk-mx-table__territory">
                    <div className="mk-mx-table__cell mk-mx-table__cell--territory">
                      <div className="mk-mx-table__cell-main">
                        <span className="mk-mx__name">
                          <AppIcon name={ICONS[row.territory] ?? 'activity'} size={18} />
                          <span>{row.label}</span>
                          {row.plan?.isFocus ? <span className="mk-mx__chip">Plan principal</span> : null}
                        </span>
                      </div>
                    </div>
                  </th>
                  <td>
                    <div className="mk-mx-table__cell">
                      {discoverHasExtra ? (
                        <div className="mk-mx-table__cell-extra">
                          {discoverLine ? <p className="mk-mx__state">{discoverLine}</p> : null}
                          {discoverShowProgress ? (
                            <div className="mk-mx-matrix__progress" aria-hidden>
                              <div className="mk-mx-matrix__progress-track">
                                <div className="mk-mx-matrix__progress-fill" style={{ width: `${discoverPercent}%` }} />
                              </div>
                            </div>
                          ) : null}
                          {row.discover.exceptionCount > 0 ? (
                            <p className="mk-mx__meta">
                              <Link className="mk-mx-matrix__meta-link" href={`${discoverHref(row.territory)}&excepciones=1`}>
                                {exceptionProgressLabel(row.discover.exceptionCount)}
                              </Link>
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="mk-mx-table__cell-main">
                        <DiscoverStart territory={row.territory} label={row.label} state={row.discover.state} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="mk-mx-table__cell">
                      {designHasExtra ? (
                        <div className="mk-mx-table__cell-extra">
                          {designStage ? <p className="mk-mx__state">{designStageBrief(designStage)}</p> : null}
                          {row.planCount > 1 ? <p className="mk-mx__meta">{`${row.planCount} planes`}</p> : null}
                        </div>
                      ) : null}
                      <div className="mk-mx-table__cell-main">
                        <CellLink
                          href={designLink}
                          ariaLabel={`${matrixDesignActionLabel(designStage)} de ${row.label}`}
                        >
                          {matrixDesignActionLabel(designStage)}
                        </CellLink>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="mk-mx-table__cell">
                      {actHasPlan ? (
                        <div className="mk-mx-table__cell-extra">
                          <p className="mk-mx__state">{actStatusCopy(row.plan?.stage, row.plan?.nextOccasion?.title ?? null, week)}</p>
                          {actDetail ? <p className="mk-mx__meta">{actDetail}</p> : null}
                          {nextDay ? <p className="mk-mx__meta">{nextDay}</p> : null}
                        </div>
                      ) : null}
                      <div className="mk-mx-table__cell-main">
                        {actLink ? (
                          <CellLink href={actLink} ariaLabel={`${actActionLabel(row.plan?.stage)} en ${row.label}, fase Actúa`}>
                            {actActionLabel(row.plan?.stage)}
                          </CellLink>
                        ) : (
                          <span className="mk-mx-matrix__empty" aria-label="Actúa estará disponible cuando tengas un plan activo">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showActNote && actFootnoteNeeded ? (
        <p className="mk-mx-matrix__footnote">En Actúa podrás seguir tus acciones cuando actives un plan.</p>
      ) : null}
    </section>
  );
}
