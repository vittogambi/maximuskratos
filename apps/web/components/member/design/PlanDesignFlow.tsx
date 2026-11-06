'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchDesign, fetchDesignContext, type DesignContext, type DesignView } from '@/lib/intervention-api';
import { DESIGN_STEPS } from '@/lib/plan-design';
import { StepActions } from './StepActions';
import { StepChange } from './StepChange';
import { StepResult } from './StepResult';
import { StepReview } from './StepReview';
import { StepStrategy } from './StepStrategy';

function Progress({ step, reachable, onGo }: { step: number; reachable: number; onGo: (n: number) => void }) {
  return (
    <nav className="mk-ds-progress" aria-label="Pasos del plan">
      <p className="mk-ds-progress__now">{`Paso ${step} de ${DESIGN_STEPS.length}: ${DESIGN_STEPS[step - 1]}`}</p>
      <ol className="mk-ds-progress__bars">
        {DESIGN_STEPS.map((name, index) => {
          const number = index + 1;
          const enabled = number <= reachable || number === step;
          return (
            <li key={name}>
              <button
                type="button"
                disabled={!enabled}
                aria-current={number === step ? 'step' : undefined}
                aria-label={`Paso ${number}: ${name}`}
                data-state={number === step ? 'current' : enabled ? 'reached' : 'ahead'}
                onClick={() => {
                  if (enabled && number !== step) onGo(number);
                }}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PlanDesignFlow({ territory, planId }: { territory: string; planId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [context, setContext] = useState<DesignContext | null>(null);
  const [design, setDesign] = useState<DesignView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paso = Number(searchParams.get('paso') || 0);
  const pasoAtOpen = useRef(paso);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      if (planId) {
        const view = await fetchDesign(token, territory, planId);
        setDesign(view);
        setContext(view.context);
        if (!(pasoAtOpen.current >= 1 && pasoAtOpen.current <= 5)) {
          router.replace(`${pathname}?paso=${view.resumeStep}&territorio=${view.territory}`, { scroll: false });
        }
      } else {
        setContext(await fetchDesignContext(token, territory));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar tu plan. Inténtalo nuevamente.');
    }
  }, [planId, territory, pathname, router]);

  useEffect(() => { void load(); }, [load]);

  const step = planId ? (paso >= 1 && paso <= 5 ? paso : design?.resumeStep ?? 1) : 1;
  const reachable = design ? (design.resumeStep >= 4 ? 5 : design.resumeStep) : 1;

  useEffect(() => {
    document.querySelector('.mk-app-content')?.scrollTo({ top: 0 });
  }, [step]);

  function go(next: number, view?: DesignView) {
    const target = view ?? design;
    if (!target) return;
    router.replace(`/disenar/${target.planId}?paso=${next}&territorio=${target.territory}`, { scroll: false });
  }

  function saved(view: DesignView, next?: number) {
    setDesign(view);
    setContext(view.context);
    if (next) go(next, view);
  }

  if (error) {
    return (
      <section className="mk-ds-card" role="alert">
        <p>{error}</p>
        <button type="button" className="mk-mx__action" onClick={() => void load()}>Reintentar</button>
      </section>
    );
  }
  if (!context || (planId && !design)) return <p className="mk-ds-card" aria-busy="true">Cargando tu plan…</p>;

  if (design && design.stage !== 'PREPARING') {
    return (
      <section className="mk-ds-card">
        <h2 className="mk-ds-question">Este plan ya no está en preparación</h2>
        <p>Un plan activo no se rediseña aquí, para no cambiar lo que ya registraste. Las acciones y la carga se ajustan en la revisión de la semana. El resultado se ajusta desde la ficha del plan y queda como una versión nueva.</p>
        <div className="mk-ds-actions">
          <Link className="mk-mx__action mk-mx__action--primary" href={`/semana/revision?planId=${design.planId}`}>Ir a la revisión</Link>
          <Link className="mk-mx__action" href={`/planes/${design.planId}`}>Ver la ficha</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mk-ds-card mk-dp">
      <Progress step={step} reachable={reachable} onGo={(n) => go(n)} />
      {step === 1 ? (
        <StepChange
          territory={territory}
          context={context}
          design={design}
          onContext={setContext}
          onSaved={(view) => {
            if (!planId) {
              router.push(`/disenar/${view.planId}?paso=2&territorio=${view.territory}`);
              return;
            }
            saved(view, 2);
          }}
        />
      ) : null}
      {design && step === 2 ? <StepResult design={design} onSaved={(view) => saved(view, 3)} onBack={() => go(1)} /> : null}
      {design && step === 3 ? <StepStrategy design={design} onSaved={(view) => saved(view, 4)} onBack={() => go(2)} /> : null}
      {design && step === 4 ? <StepActions design={design} onSaved={(view, next) => saved(view, next)} onBack={() => go(3)} /> : null}
      {design && step === 5 ? <StepReview design={design} onGo={(n) => go(n)} onReload={() => void load()} /> : null}
    </div>
  );
}
