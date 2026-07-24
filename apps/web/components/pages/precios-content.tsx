'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { AuthCta } from '@/components/auth-cta';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { FaqAccordionItem } from '@/components/pages/faq-accordion-item';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { apiBillingPlans, type Plan } from '@/lib/api';
import { LANDING_IMAGES } from '@/lib/assets';
import {
  findMonthlyAnchor,
  formatBillingCadence,
  formatCurrency,
  formatPeriod,
  periodSavingsVsMonthly,
} from '@/lib/billing-format';
import { getPreciosFaqItems } from '@/lib/precios-faq';
import { DEFAULT_TRIAL_DAYS } from '@/lib/use-trial-days';

const TRIAL_STEPS: ReadonlyArray<{ num: string; title: string; body: (days: number) => string }> = [
  {
    num: '01',
    title: 'Te registras hoy',
    body: () => 'Creas tu cuenta de fundador y reservas tu acceso anticipado.',
  },
  {
    num: '02',
    title: 'Esperas el lanzamiento',
    body: () =>
      'Cuando abramos la plataforma, usas diagnóstico, Perfil Maestro y Ruta bajo la misma cuenta.',
  },
  {
    num: '03',
    title: 'Eliges cómo pagar',
    body: (days) =>
      `Al activarse la plataforma, dispones de ${days} días de prueba y eliges la frecuencia de cobro. Sin renovación sorpresa.`,
  },
];

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

function tabSaveLabel(plan: Plan, monthlyAnchor: Plan | null): string | null {
  if (!monthlyAnchor || plan.periodMonths <= 1) return null;
  if (isTargetPlan(plan) && plan.highlightLabel) return plan.highlightLabel;
  if (plan.discountPct && plan.discountPct > 0) {
    return `Ahorra ${Math.round(plan.discountPct)}%`;
  }
  return null;
}

export function PreciosContent() {
  const reduced = useReducedMotion();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trialDays, setTrialDays] = useState(DEFAULT_TRIAL_DAYS);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    apiBillingPlans()
      .then((res) => {
        setPlans(res.plans);
        setTrialDays(res.trialDays);
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
  const faqItems = useMemo(() => getPreciosFaqItems(trialDays), [trialDays]);

  const benefits = selected?.benefits ?? [];

  const savings = useMemo(() => {
    if (!selected || !monthlyAnchor || selected.periodMonths <= 1) return 0;
    return periodSavingsVsMonthly(selected, monthlyAnchor.priceAmount);
  }, [selected, monthlyAnchor]);

  const showAnchor =
    Boolean(selected && monthlyAnchor && selected.periodMonths > 1 && selected.id !== monthlyAnchor.id);

  return (
    <div className="ag-landing ag-page ag-precios-page flex min-h-full flex-col antialiased">
      <section className="ag-about-hero ag-precios-hero relative overflow-hidden">
        <div className="ag-about-hero__bg-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LANDING_IMAGES.bgCtaGateway} alt="" className="ag-about-hero__bg" />
        </div>
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal className="ag-about-hero__intro text-center" distance={16}>
            <p className="hud-text text-action-red">PRECIOS</p>
            <h1 className="ag-about-hero__title ag-type-display text-white">
              Acceso anticipado de fundador.
            </h1>
            <p className="ag-about-hero__origin font-body-lg">
              Reserva tu cuenta hoy. La plataforma y la prueba se activan en el lanzamiento.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block" aria-labelledby="planes-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="ACCESO"
            title="Un acceso. Elige cada cuánto pagas."
            lead="El contenido es el mismo. Si pagas por adelantado, el precio por mes baja."
            headingId="planes-heading"
          />

          {loading ? (
            <p className="ag-precios-loading font-body-md text-center">Cargando…</p>
          ) : !selected ? (
            <p className="ag-precios-loading font-body-md text-center">No hay precios disponibles.</p>
          ) : (
            <ScrollReveal className="ag-precios-offer" distance={14}>
              <div
                className="ag-precios-freq"
                role="radiogroup"
                aria-label="Frecuencia de cobro"
              >
                {plans.map((plan) => {
                  const active = plan.id === selected.id;
                  const target = isTargetPlan(plan);
                  const save = tabSaveLabel(plan, monthlyAnchor);
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
                        {formatCurrency(plan.monthlyEquivalent, plan.currency)}
                        <span>/mes</span>
                      </span>
                      {save ? <span className="ag-precios-freq__save">{save}</span> : (
                        <span className="ag-precios-freq__save ag-precios-freq__save--empty" aria-hidden>
                          &nbsp;
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <article className={`ag-precios-card${isTargetPlan(selected) ? ' is-target' : ''}`}>
                <header className="ag-precios-card__head">
                  <p className="ag-precios-card__product hud-text text-action-red">MAXIMUS KRATOS</p>
                  {isTargetPlan(selected) && selected.highlightLabel ? (
                    <p className="ag-precios-card__nudge">{selected.highlightLabel}</p>
                  ) : (
                    <p className="ag-precios-card__nudge ag-precios-card__nudge--quiet">
                      {formatPeriod(selected.periodMonths)}
                    </p>
                  )}
                </header>

                <div className="ag-precios-card__amount">
                  {showAnchor && monthlyAnchor ? (
                    <p className="ag-precios-card__compare font-body-md">
                      Antes{' '}
                      <span className="ag-precios-card__anchor">
                        {formatCurrency(monthlyAnchor.monthlyEquivalent, monthlyAnchor.currency)}/mes
                      </span>
                    </p>
                  ) : null}
                  <p className="ag-precios-card__price">
                    {formatCurrency(selected.monthlyEquivalent, selected.currency)}
                    <span className="ag-precios-card__period">/mes</span>
                  </p>
                </div>

                <div className="ag-precios-card__meta">
                  <p className="ag-precios-card__bill font-body-md">
                    {formatCurrency(selected.priceAmount, selected.currency)}{' '}
                    {formatBillingCadence(selected.periodMonths).toLowerCase()}.
                  </p>
                  {savings > 0 && monthlyAnchor ? (
                    <p className="ag-precios-card__savings font-body-md">
                      Ahorras {formatCurrency(savings, selected.currency)} en el plazo vs pagar mes a
                      mes.
                    </p>
                  ) : (
                    <p className="ag-precios-card__savings ag-precios-card__savings--muted font-body-md">
                      Flexibilidad máxima. Sin descuento por adelanto.
                    </p>
                  )}
                </div>

                <ul className="ag-precios-card__benefits">
                  {benefits.map((benefit) => (
                    <li key={benefit}>
                      <AppIcon name="check" size={14} aria-hidden />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <AuthCta href="/register" className="ag-btn-cta ag-precios-card__cta font-label-lg">
                  Crear cuenta de fundador
                </AuthCta>

                <p className="ag-precios-card__conditions">
                  {selected.conditions ??
                    `${trialDays} días de prueba al lanzamiento. Sin tarjeta hoy.`}
                </p>
              </article>
            </ScrollReveal>
          )}
        </div>
      </section>

      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="prueba-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="LA PRUEBA"
            title="Sin letra chica."
            headingId="prueba-heading"
          />
          <ol className="ag-base-bridge__list">
            {TRIAL_STEPS.map((step, index) => (
              <ScrollReveal key={step.num} className="ag-base-bridge__item" distance={12}>
                <span className="ag-base-bridge__node" aria-hidden />
                <p className="ag-base-bridge__step-num hud-text text-action-red">{step.num}</p>
                {index < TRIAL_STEPS.length - 1 ? (
                  <span className="ag-base-bridge__line" aria-hidden />
                ) : null}
                <div className="ag-base-bridge__detail">
                  <h3 className="ag-base-bridge__title ag-type-item text-white">{step.title}</h3>
                  <p className="ag-base-bridge__body font-body-md">{step.body(trialDays)}</p>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="ag-faq-section ag-section-inner" aria-labelledby="precios-faq-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="PREGUNTAS"
            title="Cobro, prueba y plazos."
            lead="Lo esencial antes de reservar tu acceso."
            headingId="precios-faq-heading"
          />
          <ScrollStaggerContainer className="ag-faq-list" stagger={0.06}>
            {faqItems.map((item, index) => (
              <StaggerItem key={item.id} distance={10}>
                <FaqAccordionItem
                  id={`precios-${item.id}`}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openFaqIndex === index}
                  reduced={reduced ?? false}
                  onToggle={() =>
                    setOpenFaqIndex((current) => (current === index ? null : index))
                  }
                />
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      <SubpageCta
        title="Reserva tu acceso de fundador."
        lead="Crea tu cuenta hoy. El diagnóstico y el sistema completo se activan en el lanzamiento."
      />
    </div>
  );
}
