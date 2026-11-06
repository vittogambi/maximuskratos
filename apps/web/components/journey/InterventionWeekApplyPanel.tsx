'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { civilDayLabel } from '@/lib/dashboard-next';
import { weekLabel } from '@/lib/action-review';
import { getAccessToken } from '@/lib/auth-storage';
import {
  applyInterventionWeekReview,
  fetchPendingInterventionWeek,
  newCommandKey,
} from '@/lib/intervention-api';

export function InterventionWeekApplyPanel({ weekStart, onApplied, refreshToken = 0 }: { weekStart: string; onApplied?: () => void; refreshToken?: number }) {
  const [pending, setPending] = useState<Awaited<ReturnType<typeof fetchPendingInterventionWeek>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const applyKeyRef = useRef<string | null>(null);

  const load = useCallback(async (options?: { keepDone?: boolean }) => {
    const token = getAccessToken();
    if (!token || !weekStart) return;
    setPending(await fetchPendingInterventionWeek(token, weekStart));
    if (!options?.keepDone) setDone(false);
  }, [weekStart]);

  useEffect(() => { void load().catch(() => undefined); }, [load, refreshToken]);

  async function apply() {
    const token = getAccessToken();
    if (!token || !pending?.pending.length) return;
    applyKeyRef.current = applyKeyRef.current ?? newCommandKey('week-apply');
    setBusy(true);
    setError(null);
    try {
      await applyInterventionWeekReview(token, { weekStart: pending.weekStart, commandKey: applyKeyRef.current });
      setDone(true);
      onApplied?.();
      await load({ keepDone: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos aplicar los cambios. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  if (pending?.weekClosed && !done) return null;
  if (!pending?.pending.length && !done) return null;

  const appliesFromIso = pending?.appliesFrom ?? null;
  const fromWeekLabel = appliesFromIso ? weekLabel(appliesFromIso) : 'próximo lunes';
  const laterClose = pending?.laterCloseWeek ? civilDayLabel(pending.laterCloseWeek) : null;

  return (
    <section className="mk-mx-surface mk-week-review-section mk-week-apply" aria-label="Revisar y aplicar">
      <h3 className="mk-week-review-section__title">Revisar y aplicar</h3>
      {done ? (
        <>
          <p className="mk-mx-next__body" role="status">
            Cambios aplicados. Tu plan quedó actualizado desde la {fromWeekLabel}.
          </p>
          <Link className="mk-mx__action" href="/semana">
            Ir a la semana siguiente
          </Link>
        </>
      ) : (
        <>
          {laterClose ? (
            <p className="mk-mx-next__body">
              Hay un cierre el {laterClose}, posterior a esta semana. Confirmar aquí no cambia las acciones ni los criterios que ya se usaron después.
            </p>
          ) : (
            <p className="mk-mx-next__body">Revisa los cambios antes de cerrar la semana. Se aplicarán desde la {fromWeekLabel}.</p>
          )}
          <ul className="mk-week-apply__list">
            {pending?.pending.map((row) => (
              <li key={row.planId}>
                <strong>{row.planTitle}</strong>
                {row.actions ? (
                  <ul>
                    {row.actions.map((item) => <li key={item.actionId}>{item.summary}</li>)}
                    {(row.additions ?? []).map((item) => <li key={item.summary}>{item.summary}</li>)}
                  </ul>
                ) : row.previewSummary ? `: ${row.previewSummary}` : ''}
              </li>
            ))}
          </ul>
          {error ? <p role="alert">{error}</p> : null}
          {laterClose ? null : (
            <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={() => void apply()}>
              {busy ? 'Aplicando' : 'Aplicar cambios de la semana'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
