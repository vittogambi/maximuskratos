'use client';

import { useMemo, useState } from 'react';
import { LabCard, RadioCards, SavedNote } from './primitives';
import type { LabCatalog, LabExpectation, LabRunSummary } from '@/lib/lab-api';
import {
  CRITERION_STANCE_OPTIONS,
  canRevealCriterion,
  stanceFromRecord,
  type CriterionStance,
} from '@/lib/lab-ui/criterion-compare';
import {
  EXPECTED_PRIORITY_OPTIONS,
  EXPECTED_STATE_OPTIONS,
  labUiLabels,
} from '@/lib/lab-ui/labels';

const DOMAINS = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

export interface ExpectationDraft {
  open_what_is_happening: string;
  open_main_concern: string;
  open_first_focus: string;
  open_first_action: string;
  personal_first_domain: string;
  expected_states: Record<string, string>;
  expected_priority_domain: string;
  expected_plan_id: string;
  expected_purpose_stage: string;
  confidence: string;
  notes: string;
  expected_alerts: string[];
}

export const emptyExpectationDraft: ExpectationDraft = {
  open_what_is_happening: '',
  open_main_concern: '',
  open_first_focus: '',
  open_first_action: '',
  personal_first_domain: '',
  expected_states: { MENTALIDAD: 'UNSURE', RELACIONES: 'UNSURE', FINANZAS: 'UNSURE', CUERPO: 'UNSURE' },
  expected_priority_domain: '',
  expected_plan_id: '',
  expected_purpose_stage: 'UNSURE',
  confidence: 'MEDIA',
  notes: '',
  expected_alerts: [],
};

const DOMAIN_ONLY_OPTIONS = EXPECTED_PRIORITY_OPTIONS.filter(
  (item) => item.value !== 'UNSURE' && item.value !== 'NONE',
);

export function StepPrediction({
  run,
  catalog,
  saved,
  draft,
  onDraft,
  pending,
  onSubmit,
}: {
  run: LabRunSummary;
  catalog: LabCatalog | null;
  saved: LabExpectation | null;
  draft: ExpectationDraft;
  onDraft: (next: ExpectationDraft) => void;
  pending: boolean;
  onSubmit: () => void;
  onRevealWithout: () => void;
}) {
  const [anticipate, setAnticipate] = useState(false);
  const stance = stanceFromRecord(draft);
  const needsDomain = stance === 'ROUTE' || stance === 'DOMAIN_ONLY';
  const ready = canRevealCriterion(draft);

  const plansForDomain = useMemo(() => {
    const domain = draft.expected_priority_domain || draft.personal_first_domain;
    if (!domain || domain === 'UNSURE' || domain === 'NONE') return [];
    return (catalog?.plans ?? []).filter((plan) => plan.domain === domain);
  }, [catalog, draft.expected_priority_domain, draft.personal_first_domain]);

  if (saved) {
    const savedStance = stanceFromRecord({
      openFirstAction: saved.openFirstAction,
      personalFirstDomain: saved.personalFirstDomain,
    });
    const stanceLabel =
      CRITERION_STANCE_OPTIONS.find((item) => item.value === savedStance)?.label ?? 'Criterio registrado';
    const personal = saved.personalFirstDomain
      ? labUiLabels.expectedPriority(saved.personalFirstDomain)
      : 'Sin ámbito';
    return (
      <div className="lab-stack">
        <LabCard title="Tu lectura" lead="Esta lectura quedó registrada antes de ver el resultado.">
          <SavedNote>Lectura guardada.</SavedNote>
          <p className="lab-lead">{stanceLabel}</p>
          {savedStance === 'ROUTE' || savedStance === 'DOMAIN_ONLY' ? (
            <p className="lab-muted">Primero: {personal}.</p>
          ) : null}
          {saved.notes ? <p className="lab-muted">{saved.notes}</p> : null}
        </LabCard>
      </div>
    );
  }

  function set<K extends keyof ExpectationDraft>(key: K, value: ExpectationDraft[K]) {
    onDraft({ ...draft, [key]: value });
  }

  function applyStance(value: CriterionStance) {
    const nextDomain =
      value === 'NO_DOMAIN' ? 'NONE' : value === 'UNSURE' ? 'UNSURE' : draft.personal_first_domain === 'NONE' || draft.personal_first_domain === 'UNSURE'
        ? ''
        : draft.personal_first_domain;
    onDraft({
      ...draft,
      open_first_action: value,
      personal_first_domain: nextDomain,
      expected_plan_id: value === 'ROUTE' ? draft.expected_plan_id : '',
    });
  }

  const anticipatedStateDomain =
    draft.expected_priority_domain && !['UNSURE', 'NONE', ''].includes(draft.expected_priority_domain)
      ? draft.expected_priority_domain
      : draft.personal_first_domain && !['UNSURE', 'NONE', ''].includes(draft.personal_first_domain)
        ? draft.personal_first_domain
        : '';

  return (
    <div className="lab-stack">
      <div className="lab-ctabar lab-ctabar--dock lab-ctabar--slim">
        <p className="lab-ctabar__note">
          {ready
            ? 'Al guardar, verás lo que concluyó la Matriz.'
            : 'Elige qué harías con la información disponible.'}
        </p>
        <button
          type="button"
          className="lab-btn"
          disabled={pending || run.status === 'COLLECTING' || !ready}
          onClick={onSubmit}
        >
          Guardar mi lectura y revelar la Matriz
        </button>
      </div>

      <LabCard title="Sin ver el resultado de la Matriz, ¿qué destacarías de este caso?">
        <RadioCards
          name="criterion-stance"
          value={stance || null}
          options={[...CRITERION_STANCE_OPTIONS]}
          onChange={(value) => applyStance(value as CriterionStance)}
        />
      </LabCard>

      {needsDomain ? (
        <LabCard title="¿Cuál trabajarías primero?">
          <RadioCards
            name="personal-first"
            value={draft.personal_first_domain || null}
            options={[...DOMAIN_ONLY_OPTIONS, { value: 'MULTI', label: 'Más de una' }]}
            onChange={(value) => set('personal_first_domain', value)}
          />
        </LabCard>
      ) : null}

      {stance === 'ROUTE' && draft.personal_first_domain ? (
        <LabCard title="Ruta, si ya tienes una en mente">
          <p className="lab-hint">Opcional. No hace falta elegir una para continuar.</p>
          <label className="lab-field">
            <span className="lab-label">Ruta</span>
            <select
              className="lab-select"
              value={draft.expected_plan_id}
              onChange={(event) => set('expected_plan_id', event.target.value)}
            >
              <option value="">Todavía no propondría una ruta concreta</option>
              {(catalog?.plans ?? [])
                .filter((plan) => plan.domain === draft.personal_first_domain)
                .map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
            </select>
          </label>
        </LabCard>
      ) : null}

      <LabCard title="Safety">
        <RadioCards
          name="safety-read"
          value={draft.expected_alerts?.[0] ?? 'NONE'}
          options={[
            { value: 'NONE', label: 'No veo una alerta' },
            { value: 'SHOULD_TREAT', label: 'Veo una señal que debería cambiar el tratamiento' },
            { value: 'UNSURE', label: 'No estoy seguro' },
          ]}
          onChange={(value) =>
            set('expected_alerts', value === 'NONE' ? [] : [value])
          }
        />
      </LabCard>
      <LabCard title="¿Hay algo importante que quieras dejar registrado?">
        <label className="lab-field">
          <span className="sr-only">Nota opcional</span>
          <textarea
            className="lab-textarea lab-textarea--short"
            placeholder="Opcional."
            value={draft.notes}
            onChange={(event) => set('notes', event.target.value)}
          />
        </label>
      </LabCard>

      <details className="lab-optional" open={anticipate} onToggle={(event) => setAnticipate(event.currentTarget.open)}>
        <summary>Quiero anticipar qué hará la Matriz</summary>
        <div className="lab-stack lab-stack--tight">
          <p className="lab-hint">Qué hará la Matriz, no lo que harías tú. Completa solo lo que quieras comparar.</p>
          <div>
            <p className="lab-label">Ámbito prioritario que crees que elegirá la Matriz</p>
            <RadioCards
              name="anticipate-priority"
              value={
                !draft.expected_priority_domain || draft.expected_priority_domain === 'UNSURE'
                  ? null
                  : draft.expected_priority_domain
              }
              options={[
                ...DOMAINS.map((domain) => ({ value: domain, label: labUiLabels.domain(domain) })),
                { value: 'NONE', label: 'Ninguno todavía' },
              ]}
              onChange={(value) => set('expected_priority_domain', value)}
            />
          </div>
          {anticipatedStateDomain ? (
            <label className="lab-field">
              <span className="lab-label">
                Estado que crees que dará a {labUiLabels.domain(anticipatedStateDomain)}
              </span>
              <select
                className="lab-select"
                value={
                  !draft.expected_states[anticipatedStateDomain] ||
                  draft.expected_states[anticipatedStateDomain] === 'UNSURE'
                    ? ''
                    : draft.expected_states[anticipatedStateDomain]
                }
                onChange={(event) =>
                  set('expected_states', {
                    ...draft.expected_states,
                    [anticipatedStateDomain]: event.target.value || 'UNSURE',
                  })
                }
              >
                <option value="">Elegí un estado</option>
                {EXPECTED_STATE_OPTIONS.filter((item) => item.value !== 'UNSURE').map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div>
            <p className="lab-label">¿Esperas que proponga una ruta?</p>
            <RadioCards
              name="anticipate-route"
              value={
                draft.open_first_focus === 'NO_ROUTE'
                  ? 'NO'
                  : draft.open_first_focus === 'EXPECT_ROUTE' || draft.expected_plan_id
                    ? 'YES'
                    : null
              }
              options={[
                { value: 'YES', label: 'Sí' },
                { value: 'NO', label: 'No' },
              ]}
              onChange={(value) =>
                onDraft({
                  ...draft,
                  open_first_focus: value === 'NO' ? 'NO_ROUTE' : 'EXPECT_ROUTE',
                  expected_plan_id: value === 'YES' ? draft.expected_plan_id : '',
                })
              }
            />
          </div>
          {(draft.open_first_focus === 'EXPECT_ROUTE' || draft.expected_plan_id) &&
          plansForDomain.length &&
          draft.open_first_focus !== 'NO_ROUTE' ? (
            <label className="lab-field">
              <span className="lab-label">Ruta concreta, si ya la tienes</span>
              <select
                className="lab-select"
                value={draft.expected_plan_id}
                onChange={(event) => set('expected_plan_id', event.target.value)}
              >
                <option value="">Sin ruta concreta</option>
                {plansForDomain.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </details>

    </div>
  );
}
