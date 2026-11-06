'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { getAccessToken } from '@/lib/auth-storage';
import { dashboardNextStep, directionPreview } from '@/lib/dashboard-next';
import { fetchDashboard, fetchReturnReading, transitionPlanStage, type MemberDashboard, type ReturnReading } from '@/lib/journey-api';
import { AppIcon } from '@/components/app-icon';
import { JourneyMatrix } from './JourneyMatrix';

export function StartDashboard() {
  const { user } = useAuthSession();
  const [data, setData] = useState<MemberDashboard | null>(null);
  const [retorno, setRetorno] = useState<ReturnReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resuming, setResuming] = useState(false);

  const load = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      setData(null);
      setRetorno(null);
      setError('Inicia sesión para ver tu recorrido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      fetchDashboard(token),
      fetchReturnReading(token).catch(() => null),
    ])
      .then(([dashboard, reading]) => {
        setData(dashboard);
        setRetorno(reading);
      })
      .catch(() => {
        setData(null);
        setRetorno(null);
        setError('No se pudo leer tu recorrido.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setData(null);
    setRetorno(null);
    load();
  }, [load, user?.id]);

  function focusMatrix() {
    const node = document.getElementById('recorrido');
    node?.scrollIntoView({ block: 'start' });
    node?.focus();
  }

  if (loading) {
    return (
      <div className="mk-mx-wrap" aria-busy="true" aria-live="polite">
        <div className="mk-mx-skeleton" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (error || !data?.matrix) {
    const detail =
      error === 'Inicia sesión para ver tu recorrido.'
        ? error
        : 'No pudimos leer tu recorrido. Revisa tu conexión e inténtalo de nuevo.';
    return (
      <div className="mk-mx-wrap">
        <section className="mk-mx-next" role="alert">
          <h2 className="mk-mx-next__title">No pudimos cargar tu inicio. Inténtalo nuevamente.</h2>
          <p>{detail}</p>
          <button type="button" className="mk-mx__action mk-mx__action--primary" onClick={load}>
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  const next = dashboardNextStep(data.matrix, retorno, { reviewAt: data.cycle?.reviewAt ?? null });
  const direction = directionPreview(data.cycle?.directionStatement);

  return (
    <div className="mk-mx-wrap">
      <section className="mk-mx-next" aria-label="Siguiente paso">
        {next.eyebrow ? <p className="mk-mx-next__eyebrow">{next.eyebrow}</p> : null}
        <h2 className="mk-mx-next__title">{next.title}</h2>
        <p className="mk-mx-next__body">{next.description}</p>
        {next.meta ? <p className="mk-mx-next__meta">{next.meta}</p> : null}
        <div className="mk-mx-next__actions">
          {next.resumePaused && next.planId ? (
            <>
              <button
                type="button"
                className="mk-mx__action mk-mx__action--primary"
                disabled={resuming}
                onClick={() => {
                  const token = getAccessToken();
                  const planId = next.planId;
                  if (!token || !planId) return;
                  setResuming(true);
                  void transitionPlanStage(token, planId, { toStage: 'ACTIVE', reason: 'RETURN' })
                    .then(() => load())
                    .catch(() => setError('No se pudo retomar el plan. Sigue en pausa.'))
                    .finally(() => setResuming(false));
                }}
              >
                {resuming ? 'Retomando' : next.primaryAction}
              </button>
              {next.secondaryHref ? (
                <Link className="mk-mx__action" href={next.secondaryHref}>
                  {next.secondaryAction}
                </Link>
              ) : null}
            </>
          ) : next.primaryHref ? (
            <Link className="mk-mx__action mk-mx__action--primary" href={next.primaryHref}>
              {next.primaryAction}
            </Link>
          ) : (
            <button type="button" className="mk-mx__action mk-mx__action--primary" onClick={focusMatrix}>
              {next.primaryAction}
            </button>
          )}
          {!next.resumePaused && next.secondaryHref ? (
            <Link className="mk-mx__action" href={next.secondaryHref}>
              {next.secondaryAction}
            </Link>
          ) : null}
        </div>
      </section>

      <JourneyMatrix
        rows={data.matrix}
        weekStart={data.weekStart}
        showActNote={next.kind !== 'empty' && next.kind !== 'choose'}
      />

      <section className="mk-mx-purpose-wrap" aria-label="Propósito">
        <Link
          href="/proposito"
          className={`mk-mx-purpose${direction ? ' mk-mx-purpose--defined' : ''}`}
        >
          <span className="mk-mx-purpose__main">
            <span className="mk-mx-purpose__head">
              <span className="mk-mx-purpose__title">Propósito</span>
              {direction ? null : <span className="mk-mx-purpose__badge">Opcional</span>}
            </span>
            <span
              className={`mk-mx-purpose__detail${direction ? ' mk-mx-purpose__detail--preview' : ''}`}
            >
              {direction ?? 'Dale una dirección a lo que quieres construir.'}
            </span>
          </span>
          <span className="mk-mx-purpose__action">
            {direction ? 'Ver o editar' : 'Definir'}
            <AppIcon name="arrow-right" size={14} className="mk-mx-purpose__action-icon" aria-hidden />
          </span>
        </Link>
      </section>
    </div>
  );
}
