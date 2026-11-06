'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AppIcon } from '@/components/app-icon';
import { useAuthSession } from '@/components/auth-session-provider';
import { getAccessToken } from '@/lib/auth-storage';
import { TERRITORY_OPTIONS, territoryLabel } from '@/lib/design-flow';
import { fetchDashboard, journeyPlans, type MatrixRow, type PlanRow } from '@/lib/journey-api';
import { territoryDesignPickerSubline, territoryIcon } from '@/lib/territory-ui-copy';
import { PlanDesignFlow } from './design/PlanDesignFlow';

const TERRITORIES = new Set<string>(TERRITORY_OPTIONS.map(([value]) => value));

function stageOf(row: PlanRow): string {
  if (row.stage) return row.stage;
  if (row.status === 'ACTIVE') return 'ACTIVE';
  if (row.status === 'ARCHIVED') return 'CLOSED';
  return 'PREPARING';
}

function TerritoryPicker({ drafts, onPick }: { drafts: PlanRow[]; onPick: (territory: string) => void }) {
  const { user } = useAuthSession();
  const [coverage, setCoverage] = useState<MatrixRow[] | null>(null);
  const [territory, setTerritory] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    fetchDashboard(token).then((board) => setCoverage(board.matrix ?? [])).catch(() => setCoverage([]));
  }, [user?.id]);

  const rows = TERRITORY_OPTIONS.map(([value, label]) => ({
    territory: value,
    label,
    discover: coverage?.find((row) => row.territory === value)?.discover ?? null,
  }));

  return (
    <form
      className="mk-ds-card mk-ds-start"
      onSubmit={(event) => {
        event.preventDefault();
        if (!territory) {
          setError('Elige un ámbito para empezar.');
          return;
        }
        onPick(territory);
      }}
    >
      {drafts.length ? (
        <section className="mk-ds-proposal" aria-labelledby="mk-ds-drafts">
          <h2 id="mk-ds-drafts" className="mk-ds-question">Tienes planes guardados</h2>
          <p className="mk-m-muted">Puedes continuar uno de tus planes o empezar uno nuevo.</p>
          <ul className="mk-ds-draft-list">
            {drafts.map((row) => (
              <li key={row.id}>
                <Link className="mk-mx__action" href={`/disenar/${row.id}${row.territory ? `?territorio=${row.territory}` : ''}`}>
                  <strong>{row.title?.trim() || 'Plan sin título'}</strong>
                  <small>{territoryLabel(row.territory)}, en preparación</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <fieldset className="mk-ds-territories">
        <legend className="mk-ds-question">{drafts.length ? '¿En qué ámbito quieres empezar un nuevo plan?' : '¿En qué ámbito quieres trabajar?'}</legend>
        {rows.map((row) => (
          <label key={row.territory} className={territory === row.territory ? 'is-selected' : undefined}>
            <input type="radio" name="ambito" value={row.territory} checked={territory === row.territory} onChange={() => setTerritory(row.territory)} />
            <AppIcon name={territoryIcon(row.territory)} size={18} />
            <span>
              <strong>{row.label}</strong>
              <small>{territoryDesignPickerSubline(row.territory, row.discover)}</small>
            </span>
          </label>
        ))}
      </fieldset>
      {error ? <p className="mk-ds-error" role="alert">{error}</p> : null}
      <div className="mk-ds-foot">
        <button className="mk-mx__action mk-mx__action--primary" type="submit">Empezar</button>
      </div>
    </form>
  );
}

export function DesignStudio({ planId, territory: territoryFromRoute }: { planId?: string; territory?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthSession();
  const fromQuery = (territoryFromRoute || searchParams.get('territorio') || '').toUpperCase();
  const choosing = searchParams.get('elegir') === '1';
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    journeyPlans(token).then(setPlans).catch(() => setPlans([]));
  }, [user?.id, planId]);

  const plan = planId ? plans?.find((row) => row.id === planId) ?? null : null;
  const drafts = (plans ?? []).filter((row) => stageOf(row) === 'PREPARING' && row.id !== planId);
  const planTerritory = (plan?.territory ?? '').toUpperCase();
  const territory = picked ?? (TERRITORIES.has(planTerritory) ? planTerritory : TERRITORIES.has(fromQuery) && !choosing ? fromQuery : '');
  const sameTerritoryDraft = !planId && territory ? drafts.find((row) => row.territory === territory) : null;

  let body: ReactNode;
  if (planId && plans && !plan) {
    body = <section className="mk-ds-card" role="alert"><p>No encontramos ese borrador en esta cuenta.</p><Link className="mk-mx__action" href="/disenar">Diseñar otro plan</Link></section>;
  } else if (planId && !plans) {
    body = <p className="mk-ds-card" aria-busy="true">Cargando tu plan…</p>;
  } else if (!territory) {
    body = (
      <>
        {planId ? <p className="mk-ds-need">Este borrador todavía no tiene ámbito. Elige uno para seguir; lo que escribiste se conserva.</p> : null}
        <TerritoryPicker
          drafts={planId ? [] : drafts}
          onPick={(value) => {
            if (planId) setPicked(value);
            else router.replace(`/disenar?territorio=${value}`);
          }}
        />
      </>
    );
  } else {
    body = (
      <>
        {sameTerritoryDraft ? (
          <p className="mk-ds-need">
            Ya tienes un plan en preparación en {territoryLabel(territory)}: {sameTerritoryDraft.title}.{' '}
            <Link className="mk-mx__textlink" href={`/disenar/${sameTerritoryDraft.id}?territorio=${territory}`}>Continuarlo</Link>
          </p>
        ) : null}
        <PlanDesignFlow key={`${planId ?? 'new'}-${territory}`} territory={territory} planId={planId} />
      </>
    );
  }

  return (
    <div className="mk-ds mk-ds--focus">
      <header className="mk-ds-head">
        <div>
          <h1>Diseña tu plan</h1>
          <p className="mk-ds-kicker">{territory ? territoryLabel(territory) : 'Un cambio concreto, un plan que puedas sostener.'}</p>
        </div>
        {plans?.length ? <Link className="mk-mx__action" href="/planes">Ver mis planes</Link> : null}
      </header>
      {body}
    </div>
  );
}
