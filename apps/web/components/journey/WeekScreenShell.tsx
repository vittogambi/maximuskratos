'use client';

import Link from 'next/link';
import { formatWeekRange } from '@/lib/week-screen';

type Props = {
  view: 'actions' | 'review';
  viewedWeek: string;
  weekEnd: string;
  query: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  children: React.ReactNode;
};

export function WeekScreenShell({
  view,
  viewedWeek,
  weekEnd,
  query,
  onPrevWeek,
  onNextWeek,
  onToday,
  children,
}: Props) {
  const actionsHref = `/semana${query}`;
  const reviewHref = `/semana/revision${query}`;

  return (
    <div className="mk-week-wrap">
      <header className="mk-week-head">
        <div className="mk-week-head__title">
          <h1 className="mk-week-head__name">Tu semana</h1>
          <p className="mk-week-head__range">{formatWeekRange(viewedWeek, weekEnd)}</p>
        </div>
        <div className="mk-week-period" aria-label="Navegación del período">
          <button type="button" className="mk-mx__action" onClick={onPrevWeek}>
            Anterior
          </button>
          <button type="button" className="mk-mx__action" onClick={onToday}>
            Hoy
          </button>
          <button type="button" className="mk-mx__action" onClick={onNextWeek}>
            Siguiente
          </button>
        </div>
      </header>

      <nav className="mk-week-tabs" aria-label="Vistas de la semana">
        <Link
          href={actionsHref}
          className={view === 'actions' ? 'mk-week-tabs__tab is-active' : 'mk-week-tabs__tab'}
          aria-current={view === 'actions' ? 'page' : undefined}
        >
          Acciones
        </Link>
        <Link
          href={reviewHref}
          className={view === 'review' ? 'mk-week-tabs__tab is-active' : 'mk-week-tabs__tab'}
          aria-current={view === 'review' ? 'page' : undefined}
        >
          Revisión
        </Link>
      </nav>

      {children}
    </div>
  );
}
