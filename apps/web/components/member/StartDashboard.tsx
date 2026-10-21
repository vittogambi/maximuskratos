'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchDashboard, fetchReturnReading, type MemberDashboard, type ReturnReading } from '@/lib/journey-api';
import { MemberPage } from './MemberPage';
import { ChoiceCard } from './ChoiceCard';

function territoryHref(territory: string) {
  return `/ambito/${encodeURIComponent(territory)}`;
}

export function StartDashboard() {
  const [data, setData] = useState<MemberDashboard | null>(null);
  const [retorno, setRetorno] = useState<ReturnReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Inicia sesión para ver tu inicio.');
      return;
    }
    Promise.all([
      fetchDashboard(token),
      fetchReturnReading(token).catch(() => null),
    ])
      .then(([dashboard, reading]) => {
        setData(dashboard);
        setRetorno(reading);
      })
      .catch(() => setError('No se pudo leer el inicio.'));
  }, []);

  if (error) {
    return (
      <MemberPage title="Inicio" intro={error}>
        <p className="mk-m-muted">Reintenta en un momento.</p>
      </MemberPage>
    );
  }

  if (!data) {
    return (
      <MemberPage title="Inicio" intro="Leyendo tu mapa.">
        <div className="mk-m-skeleton" aria-hidden />
      </MemberPage>
    );
  }

  const week = data.focusPlan?.week;

  return (
    <MemberPage
      eyebrow="MK · INICIO"
      title={data.chooseStart ? '¿Cómo quieres empezar?' : 'Tu mapa'}
      intro={
        data.chooseStart
          ? 'Elige un ámbito o continúa donde ya hay trabajo.'
          : 'Cuatro ámbitos, tres fases. El foco de esta semana está abajo.'
      }
    >
      {retorno?.headline && (retorno.daysAway ?? 0) >= 7 ? (
        <section className="mk-m-focus-card" aria-label="Retorno">
          <p className="mk-m-focus-card__title">Retomas: {retorno.headline}</p>
          {retorno.protectedNote ? <p className="mk-m-muted">{retorno.protectedNote}</p> : null}
          <Link href="/semana" className="mk-m-btn">
            Ver la semana
          </Link>
        </section>
      ) : null}

      {data.chooseStart ? (
        <section className="mk-m-section" aria-label="Formas de empezar">
          <ChoiceCard
            title="Diseñar un plan"
            description="Elige meta, tiempo y una acción concreta."
            onSelect={() => { window.location.href = '/disenar'; }}
          />
          <ChoiceCard
            title="Explorar un ámbito"
            description="Descubre con el cuestionario y vuelve con propuestas."
            onSelect={() => {
              const first = data.territories[0];
              if (first) window.location.href = territoryHref(first.territory);
            }}
          />
          <Link href="/proposito" className="mk-m-link">
            Ver propósito
          </Link>
        </section>
      ) : null}

      <section className="mk-m-section" aria-labelledby="mk-m-territories">
        <h2 id="mk-m-territories" className="mk-m-section-title">
          Ámbitos
        </h2>
        <ul className="mk-m-territory-list">
          {data.territories.map((row) => (
            <li key={row.territory}>
              <Link href={territoryHref(row.territory)} className="mk-m-territory-card">
                <span className="mk-m-territory-card__label">{row.label}</span>
                <span className="mk-m-territory-card__state">{row.state}</span>
                <span className="mk-m-territory-card__meta">
                  {row.settled} de {row.required} respuestas
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {data.focusPlan ? (
        <section className="mk-m-section" aria-labelledby="mk-m-focus">
          <h2 id="mk-m-focus" className="mk-m-section-title">
            Foco de la semana
          </h2>
          <div className="mk-m-focus-card">
            <p className="mk-m-focus-card__title">{data.focusPlan.title}</p>
            <p className="mk-m-muted">Etapa: {data.focusPlan.stage}</p>
            {week ? (
              <p className="mk-m-focus-card__counts">
                {week.done} hechas, {week.upcoming} próximas
                {week.percent != null ? `. ${week.percent}% de la semana resuelta.` : '. Sin porcentaje todavía.'}
              </p>
            ) : null}
            <Link href="/semana" className="mk-m-btn">
              Ir a la semana
            </Link>
          </div>
        </section>
      ) : null}

      {data.otherActivePlans > 0 ? (
        <p className="mk-m-muted">
          Tienes {data.otherActivePlans} plan{data.otherActivePlans === 1 ? '' : 'es'} activo
          {data.otherActivePlans === 1 ? '' : 's'} además del foco.{' '}
          <Link href="/planes" className="mk-m-link">
            Ver planes
          </Link>
        </p>
      ) : null}
    </MemberPage>
  );
}
