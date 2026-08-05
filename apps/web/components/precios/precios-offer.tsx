'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { AuthCta } from '@/components/auth-cta';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import {
  INTERACTION_SPRING,
  MOTION_DISTANCE,
  interactionContentTransition,
} from '@/components/motion/tokens';
import { apiBillingPlans, type Plan } from '@/lib/api';
import {
  findMonthlyAnchor,
  formatChargedEvery,
  formatPeriod,
  formatPricePlain,
  monthlyEquivalentFromTotal,
  periodSavingsPctVsMonthly,
} from '@/lib/billing-format';
import { LANDING_FOUNDER_CTA_NOTE, LANDING_PRIMARY_CTA } from '@/lib/landing-copy';

/** Target comercial: semestral (o el marcado como recomendado/elegido). */
function defaultPlanId(plans: Plan[]): string | null {
  if (plans.length === 0) return null;
  const recommended = plans.find((p) => {
    const label = p.highlightLabel?.toLowerCase() ?? '';
    return label.includes('recomend') || label.includes('elegido');
  });
  if (recommended) return recommended.id;
  const semestral = plans.find((p) => p.periodMonths === 6);
  return (semestral ?? plans[0]).id;
}

function isTargetPlan(plan: Plan): boolean {
  const label = plan.highlightLabel?.toLowerCase() ?? '';
  return label.includes('recomend') || label.includes('elegido') || plan.periodMonths === 6;
}

/** Badge corto en el selector (estilo SaaS: Save 20%). */
function tabSaveLabel(plan: Plan, monthlyAnchor: Plan | null): string | null {
  if (!monthlyAnchor || plan.periodMonths <= 1) return null;
  const pct = periodSavingsPctVsMonthly(plan, monthlyAnchor.priceAmount);
  return pct > 0 ? `−${pct}%` : null;
}

type PreciosOfferProps = {
  /** Home landing: precio + CTA. Detalle en /precios. */
  compact?: boolean;
  ctaLabel?: string;
};

export function PreciosOffer({ compact = false, ctaLabel }: PreciosOfferProps) {
  const reduced = useReducedMotion();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const layoutId = compact ? 'precios-freq-indicator-home' : 'precios-freq-indicator-page';

  useEffect(() => {
    apiBillingPlans()
      .then((res) => {
        setPlans(res.plans);
        setSelectedId(defaultPlanId(res.plans));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? plans[0] ?? null,
    [plans, selectedId],
  );

  const monthlyAnchor = useMemo(() => findMonthlyAnchor(plans) as Plan | null, [plans]);

  const benefits = useMemo(() => {
    if (compact) return [];
    return selected?.benefits ?? [];
  }, [selected, compact]);

  const selectedMonthly = selected
    ? monthlyEquivalentFromTotal(selected.priceAmount, selected.periodMonths)
    : 0;

  if (loading) {
    return <p className="ag-precios-loading font-body-md text-center">Cargando…</p>;
  }

  if (!selected) {
    return (
      <p className="ag-precios-loading font-body-md text-center">No hay precios disponibles.</p>
    );
  }

  return (
    <ScrollReveal className={`ag-precios-offer${compact ? ' ag-precios-offer--compact' : ''}`} density="default">
      <div className="ag-precios-freq" role="radiogroup" aria-label="Frecuencia de cobro">
        {plans.map((plan) => {
          const active = plan.id === selected.id;
          const target = isTargetPlan(plan);
          const save = tabSaveLabel(plan, monthlyAnchor);
          const rate = monthlyEquivalentFromTotal(plan.priceAmount, plan.periodMonths);
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`ag-precios-freq__option${active ? ' is-active' : ''}${target ? ' is-target' : ''}`}
              onClick={() => setSelectedId(plan.id)}
            >
              <span className="ag-precios-freq__name">{formatPeriod(plan.periodMonths)}</span>
              <span className="ag-precios-freq__rate">
                {formatPricePlain(rate)}
                <span>/mes</span>
              </span>
              {save ? (
                <span className="ag-precios-freq__save">{save}</span>
              ) : (
                <span className="ag-precios-freq__save ag-precios-freq__save--empty" aria-hidden>
                  &nbsp;
                </span>
              )}
              {active && !reduced ? (
                <motion.span
                  layoutId={layoutId}
                  className="ag-precios-freq__indicator"
                  transition={INTERACTION_SPRING}
                  aria-hidden
                />
              ) : active ? (
                <span className="ag-precios-freq__indicator" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      <article className={`ag-precios-card${isTargetPlan(selected) ? ' is-target' : ''}`}>
        <div className="ag-precios-card__dynamic-slot">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected.id}
              className="ag-precios-card__dynamic"
              initial={reduced ? false : { opacity: 0, y: MOTION_DISTANCE.micro }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -MOTION_DISTANCE.micro }}
              transition={reduced ? { duration: 0 } : interactionContentTransition}
            >
              <div className="ag-precios-card__amount">
                <p className="ag-precios-card__price">
                  {formatPricePlain(selectedMonthly)}
                  <span className="ag-precios-card__period">/mes</span>
                </p>
                {selected.periodMonths > 1 ? (
                  <p className="ag-precios-card__bill-cadence font-body-md">
                    {formatPricePlain(selected.priceAmount)}{' '}
                    {formatChargedEvery(selected.periodMonths)}
                  </p>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {benefits.length > 0 ? (
          <ul className="ag-precios-card__benefits">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <AppIcon name="check" size={14} aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
        ) : null}

        <AuthCta href={LANDING_PRIMARY_CTA.href} className="ag-btn-cta ag-precios-card__cta font-label-lg">
          {ctaLabel ?? LANDING_PRIMARY_CTA.labelAlt}
        </AuthCta>

        {!compact ? (
          <p className="ag-precios-card__founder-note font-body-sm">{LANDING_FOUNDER_CTA_NOTE}</p>
        ) : (
          <p className="ag-precios-offer__more font-body-md text-center">
            <Link href="/precios" className="ag-inline-link font-label-lg">
              Ver condiciones y prueba
            </Link>
          </p>
        )}
      </article>
    </ScrollReveal>
  );
}
