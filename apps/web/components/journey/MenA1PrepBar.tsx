'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchMenA1WeekPrep, type MenA1WeekPrepView } from '@/lib/intervention-api';

const PREP_COPY: Record<string, { label: string; cta: string }> = {
  EMPTY: { label: 'Prepara tus prioridades', cta: 'Preparar mis prioridades' },
  DRAFT: { label: 'Continúa tu preparación', cta: 'Continuar borrador' },
  CONFIRMED: { label: 'Prioridades acordadas', cta: 'Ver prioridades acordadas' },
  FROZEN: { label: 'Semana cerrada', cta: 'Ver preparación' },
};

export function MenA1PrepBar({ territory, planId, weekStart, planTitle }: { territory: string; planId: string; weekStart: string; planTitle?: string }) {
  const [prep, setPrep] = useState<MenA1WeekPrepView | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    void fetchMenA1WeekPrep(token, territory, planId, weekStart)
      .then(setPrep)
      .catch(() => setPrep(null));
  }, [territory, planId, weekStart]);

  if (!prep || prep.weekClosed) return null;

  const copy = PREP_COPY[prep.status] ?? { label: 'Preparación', cta: 'Ver preparación' };
  const href = `/planes/${planId}/preparar?territorio=${encodeURIComponent(territory)}&weekStart=${encodeURIComponent(weekStart)}`;

  return (
    <section className="mk-week-prep" aria-label="Preparación de la semana">
      {planTitle ? <p className="mk-week-prep__plan">{planTitle}</p> : null}
      <div className="mk-week-prep__row">
        <p className="mk-week-prep__text">{copy.label}</p>
        <Link className="mk-mx__textlink" href={href}>
          {copy.cta}
          <span aria-hidden> →</span>
        </Link>
      </div>
    </section>
  );
}
