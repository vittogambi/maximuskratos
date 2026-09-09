'use client';

import { useMemo, useState } from 'react';
import { Alert, LabCard, RadioCards, SavedNote, Tech } from './primitives';
import type { LabExperience, LabResult } from '@/lib/lab-api';
import { formatDay, formatState } from '@/lib/lab-ui/format';
import {
  DIRECTION_SOURCE_OPTIONS,
  PRODUCT_DIVERGENCE_OPTIONS,
  PRODUCT_REVIEW_SECTIONS,
  PURPOSE_FEELS_OPTIONS,
  STILL_MK_OPTIONS,
  VERDICT_OPTIONS,
  labUiLabels,
  type Option,
} from '@/lib/lab-ui/labels';

const DOMAIN_OPTIONS: Option[] = [
  { value: 'MENTALIDAD', label: 'Mentalidad' },
  { value: 'RELACIONES', label: 'Relaciones' },
  { value: 'FINANZAS', label: 'Finanzas' },
  { value: 'CUERPO', label: 'Cuerpo' },
];

export interface ExperienceDraft {
  focusChoice: string;
  otherDomain: string;
  selectionReason: string;
  direction: string;
  directionSource: string;
  objectiveId: string;
  customObjective: string;
  actionText: string;
  cadence: 'MONTHLY' | 'QUARTERLY';
}

export const emptyExperienceDraft: ExperienceDraft = {
  focusChoice: '',
  otherDomain: '',
  selectionReason: '',
  direction: '',
  directionSource: 'RAFA_JUDGMENT',
  objectiveId: '',
  customObjective: '',
  actionText: '',
  cadence: 'MONTHLY',
};

export interface ProductReviewDraft {
  verdicts: Record<string, string>;
  purposeFeels: string;
  stillMk: string;
  divergence: string;
  wouldChange: string;
  missing: string;
}

export const emptyProductReviewDraft: ProductReviewDraft = {
  verdicts: Object.fromEntries(PRODUCT_REVIEW_SECTIONS.map((section) => [section.key, 'UNCERTAIN'])),
  purposeFeels: 'UNCERTAIN',
  stillMk: 'UNSURE',
  divergence: 'UNSURE',
  wouldChange: '',
  missing: '',
};

export function StepExperience({
  result,
  experience,
  purposeStage,
  draft,
  onDraft,
  productDraft,
  onProductDraft,
  productSaved,
  pending,
  onProject,
  onSaveProductReview,
}: {
  result: LabResult;
  experience: LabExperience | null;
  purposeStage: string | null;
  draft: ExperienceDraft;
  onDraft: (next: ExperienceDraft) => void;
  productDraft: ProductReviewDraft;
  onProductDraft: (next: ProductReviewDraft) => void;
  productSaved: boolean;
  pending: boolean;
  onProject: () => void;
  onSaveProductReview: () => void;
}) {
  const [showUserView, setShowUserView] = useState(true);
  const snapshot = result.snapshot;
  const candidate = snapshot.priority.domain;
  const tie = experience?.projection.focus.tie_break_provisional ?? false;
  const blocked = snapshot.recommendations.primary?.executable_recommendation === 'BLOCKED';
  const insufficient = snapshot.domains
    .filter((domain) => domain.key !== 'PROPÓSITO')
    .every((domain) => domain.classification === 'NO_CLASIFICADO');

  const focusOptions = useMemo(() => {
    const options: Option[] = [];
    if (candidate) {
      options.push({
        value: 'CONFIRM_MATRIX',
        label: `Confirmar ${labUiLabels.domain(candidate)}, el que propone la Matriz`,
        help: tie ? 'Recuerda que quedó primero por desempate provisional.' : undefined,
      });
    }
    options.push({ value: 'OTHER', label: 'Elegir otro ámbito' });
    options.push({
      value: 'PURPOSE',
      label: 'Trabajar dirección y propósito',
      help: 'No es una ruta de la Matriz. Queda marcada como hipótesis de producto.',
    });
    options.push({ value: 'NONE', label: 'Todavía no elegir ningún foco' });
    options.push({ value: 'UNSURE', label: 'No estoy seguro' });
    return options;
  }, [candidate, tie]);

  const availableObjectives = useMemo(() => {
    const ids = experience?.projection.objective.available.map((item) => item.id) ?? [];
    return ids.map((id) => ({
      id,
      text: result.catalog.objectives.find((objective) => objective.id === id)?.text ?? 'Objetivo sin nombre',
    }));
  }, [experience, result.catalog.objectives]);

  function set<K extends keyof ExperienceDraft>(key: K, value: ExperienceDraft[K]) {
    onDraft({ ...draft, [key]: value });
  }

  const projection = experience?.projection ?? null;
  const routePlan = result.catalog.plans.find((plan) => plan.id === projection?.route.matrix_plan_id);
  const matrixPlan = result.catalog.plans.find(
    (plan) => plan.id === snapshot.recommendations.primary?.plan_id,
  );
  const selectedObjectiveText =
    result.catalog.objectives.find((objective) => objective.id === projection?.objective.selected_id)?.text ??
    null;

  return (
    <div className="lab-stack">
      <div className="lab-ctabar lab-ctabar--dock">
        <p className="lab-ctabar__note">
          Esto sirve para imaginar cómo se traduciría este caso a la experiencia de MK. No cambia la Matriz.
        </p>
        <button
          type="button"
          className="lab-btn"
          disabled={pending || !draft.focusChoice}
          onClick={onProject}
        >
          Generar vista de la persona
        </button>
      </div>

      <LabCard
        eyebrow="Cambio de foco"
        title="Experiencia de la persona"
        lead="Ahora comparamos la recomendación de la Matriz con la Dirección de esta persona, para decidir el foco de este ciclo. Eso es el plan de MK. No es lo mismo que la ruta sugerida por la Matriz."
      />

      {blocked ? (
        <Alert tone="danger" title="No se puede entregar una acción ejecutable">
          Existe una alerta crítica que impide entregar una recomendación ejecutable. Aunque elijas otro foco,
          la experiencia no propone acción de la semana.
        </Alert>
      ) : null}

      <div className="lab-grid-2">
        <LabCard title="Lo que sabemos">
          <table className="lab-table">
            <tbody>
              <tr>
                <th scope="row">Dirección</th>
                <td>{projection?.direction.display ?? 'Todavía está en construcción.'}</td>
              </tr>
              <tr>
                <th scope="row">Propuesta de la Matriz</th>
                <td>
                  {insufficient || !candidate
                    ? 'Nada, faltan datos para clasificar'
                    : labUiLabels.domain(candidate)}
                </td>
              </tr>
              <tr>
                <th scope="row">¿Por qué?</th>
                <td>
                  {insufficient
                    ? 'Cobertura insuficiente'
                    : tie
                      ? 'Empate entre ámbitos, con desempate provisional'
                      : 'Estado y puntaje del ámbito'}
                </td>
              </tr>
              <tr>
                <th scope="row">Alertas</th>
                <td>{blocked ? 'Recomendación bloqueada' : 'Sin bloqueo'}</td>
              </tr>
              <tr>
                <th scope="row">Tu criterio de Propósito</th>
                <td>{purposeStage ? labUiLabels.purposeStage(purposeStage) : 'Todavía sin registrar'}</td>
              </tr>
            </tbody>
          </table>
        </LabCard>

        <LabCard title="Qué decidiríamos para este ciclo">
          <p className="lab-hint">
            Esto es la Ruta MK: foco, objetivo y acción de la semana. El Manifiesto es el relato de Dirección; no se
            calcula aquí.
          </p>
          <table className="lab-table">
            <tbody>
              <tr>
                <th scope="row">Foco del ciclo</th>
                <td>
                  {projection?.focus.selected_focus
                    ? labUiLabels.domain(projection.focus.selected_focus)
                    : 'Aún no decidido'}
                </td>
              </tr>
              <tr>
                <th scope="row">Objetivo</th>
                <td>{selectedObjectiveText ?? 'Aún no decidido'}</td>
              </tr>
              <tr>
                <th scope="row">Acción semanal</th>
                <td>{projection?.action.text ?? 'Aún no definida'}</td>
              </tr>
              <tr>
                <th scope="row">Ciclo proyectado</th>
                <td>
                  {projection
                    ? `${formatDay(projection.cycle.start)} a ${formatDay(projection.cycle.end)}`
                    : 'Aún no proyectado'}
                </td>
              </tr>
            </tbody>
          </table>
          {projection?.restrictions.length ? (
            <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
              {projection.restrictions.map((code) => (
                <li key={code}>{labUiLabels.restriction(code)}</li>
              ))}
            </ul>
          ) : null}
        </LabCard>
      </div>

      <LabCard title="¿Qué foco tendría este ciclo?">
        <RadioCards
          name="focus-choice"
          value={draft.focusChoice}
          options={focusOptions}
          onChange={(value) => set('focusChoice', value)}
        />
        {draft.focusChoice === 'OTHER' ? (
          <div className="lab-field">
            <span className="lab-label">¿Qué ámbito?</span>
            <RadioCards
              name="focus-other"
              value={draft.otherDomain}
              options={DOMAIN_OPTIONS}
              inline
              onChange={(value) => set('otherDomain', value)}
            />
          </div>
        ) : null}
        {draft.focusChoice && draft.focusChoice !== 'UNSURE' ? (
          <label className="lab-field">
            <span className="lab-label">¿Por qué ese foco?</span>
            <span className="lab-hint">Opcional. Queda registrado como tu criterio.</span>
            <textarea
              className="lab-textarea"
              value={draft.selectionReason}
              onChange={(event) => set('selectionReason', event.target.value)}
            />
          </label>
        ) : null}
        {projection?.focus.selected_focus ? (
          <div className="lab-stack lab-stack--tight">
            <p className="lab-muted">
              Foco elegido: {labUiLabels.domain(projection.focus.selected_focus)}
            </p>
            <p className="lab-muted">
              Fuente: {labUiLabels.source(projection.focus.selection_source)}
            </p>
            <p className="lab-muted">
              Propuesta de la Matriz:{' '}
              {candidate ? labUiLabels.domain(candidate) : 'ningún ámbito'}
            </p>
            <p className="lab-muted">
              Motivo:{' '}
              {projection.focus.selection_reason?.trim() ||
                'No se registró una justificación para esta elección.'}
            </p>
          </div>
        ) : null}
      </LabCard>

      <LabCard title="Dirección actual">
        <label className="lab-field">
          <span className="lab-label">Dirección de esta persona</span>
          <span className="lab-hint">
            Si la dejas vacía, la experiencia dirá que todavía está en construcción.
          </span>
          <textarea
            className="lab-textarea"
            value={draft.direction}
            placeholder="Ej.: Construir una vida profesional con más autonomía sin desaparecer de mi familia."
            onChange={(event) => set('direction', event.target.value)}
          />
        </label>
        <div className="lab-field">
          <span className="lab-label">Fuente de la dirección</span>
          <RadioCards
            name="direction-source"
            value={draft.directionSource}
            options={DIRECTION_SOURCE_OPTIONS}
            inline
            onChange={(value) => set('directionSource', value)}
          />
        </div>
      </LabCard>

      {projection ? (
        <LabCard
          title={
            projection.route.kind === 'PRODUCT_ROUTE'
              ? 'Ruta de producto experimental'
              : projection.route.matrix_plan_id === snapshot.recommendations.primary?.plan_id
                ? 'Ruta sugerida por la Matriz'
                : 'Ruta de este ciclo'
          }
        >
          {projection.route.kind === null ? (
            <p className="lab-muted">
              Todavía no hay ruta. Elige un foco y proyecta la experiencia para verla.
            </p>
          ) : (
            <>
              <p className="lab-muted">
                La Matriz recomendó: {matrixPlan?.name ?? 'ninguna ruta'}
              </p>
              <p className="lab-domain__score">
                {routePlan?.name ?? projection.route.title ?? 'Sin nombre de ruta'}
              </p>
              {projection.route.kind === 'PRODUCT_ROUTE' ? (
                <span className="lab-badge lab-badge--amber">Ruta experimental de producto</span>
              ) : projection.route.source === 'CATALOG' &&
                projection.route.matrix_plan_id !== snapshot.recommendations.primary?.plan_id ? (
                <p className="lab-muted">
                  Ruta disponible en catálogo para{' '}
                  {labUiLabels.domain(projection.focus.selected_focus)} /{' '}
                  {formatState(
                    snapshot.domains.find((item) => item.key === projection.focus.selected_focus)?.state_final,
                  )}
                </p>
              ) : (
                <p className="lab-muted">Ruta disponible en catálogo</p>
              )}
              {projection.route.needs_curation ? (
                <p className="lab-muted">Esta ruta necesita curaduría humana antes de usarse.</p>
              ) : null}
            </>
          )}
        </LabCard>
      ) : null}

      <LabCard title="Objetivo">
        {availableObjectives.length ? (
          <RadioCards
            name="objective"
            value={draft.objectiveId}
            options={availableObjectives.map((objective) => ({
              value: objective.id,
              label: objective.text,
            }))}
            onChange={(value) => set('objectiveId', value)}
          />
        ) : (
          <>
            <p className="lab-muted">
              No hay un objetivo definido por la Matriz para este foco.
            </p>
            <label className="lab-field">
              <span className="lab-label">Escribir objetivo para esta simulación</span>
              <span className="lab-hint">Queda registrado como hipótesis de producto, no como Matriz.</span>
              <input
                className="lab-input"
                value={draft.customObjective}
                onChange={(event) => set('customObjective', event.target.value)}
              />
            </label>
          </>
        )}
      </LabCard>

      <LabCard title="¿Qué haría esta persona esta semana?">
        <label className="lab-field">
          <span className="lab-label">Acción de la semana</span>
          <span className="lab-hint">
            Una acción concreta que pueda realizar esta semana. No buscamos crear todo el plan.
          </span>
          <textarea
            className="lab-textarea"
            value={draft.actionText}
            onChange={(event) => set('actionText', event.target.value)}
          />
        </label>
      </LabCard>

      {experience ? (
        <>
          <div className="lab-filters">
            <button
              type="button"
              className={showUserView ? 'lab-chip is-active' : 'lab-chip'}
              aria-pressed={showUserView}
              onClick={() => setShowUserView(true)}
            >
              Vista de la persona
            </button>
            <button
              type="button"
              className={!showUserView ? 'lab-chip is-active' : 'lab-chip'}
              aria-pressed={!showUserView}
              onClick={() => setShowUserView(false)}
            >
              Lectura del laboratorio
            </button>
          </div>

          {showUserView ? (
            <UserView experience={experience} result={result} />
          ) : (
            <LabCard title="Lectura del laboratorio">
              <table className="lab-table">
                <tbody>
                  <tr>
                    <th scope="row">Propuesta de la Matriz</th>
                    <td>
                      {experience.projection.focus.matrix_candidate
                        ? labUiLabels.domain(experience.projection.focus.matrix_candidate)
                        : 'Ninguno'}
                      {experience.projection.focus.tie_break_provisional ? ' · desempate provisional' : ''}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Foco del producto</th>
                    <td>
                      {experience.projection.focus.selected_focus
                        ? labUiLabels.domain(experience.projection.focus.selected_focus)
                        : 'Aún no decidido'}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Mapa de ámbitos</th>
                    <td>
                      {experience.projection.profile.domains
                        .map(
                          (domain) =>
                            `${labUiLabels.domain(domain.key)}: ${formatState(domain.state)}, ${
                              domain.score_display ?? 'sin puntaje'
                            }`,
                        )
                        .join(' · ')}
                    </td>
                  </tr>
                </tbody>
              </table>
              <Tech>
                <pre className="lab-pre">{JSON.stringify(experience.projection, null, 2)}</pre>
              </Tech>
            </LabCard>
          )}

          <div className="lab-ctabar">
            <div>{productSaved ? <SavedNote>Evaluación del producto guardada.</SavedNote> : null}</div>
            <button type="button" className="lab-btn" disabled={pending} onClick={onSaveProductReview}>
              Guardar evaluación
            </button>
          </div>

          <LabCard
            title="¿Esta experiencia representa MK?"
            lead="Esta evaluación es del producto. No modifica tu evaluación de la Matriz."
          >
            {PRODUCT_REVIEW_SECTIONS.map((section) => (
              <div key={section.key} className="lab-stack lab-stack--tight">
                <h3 className="lab-h4">{section.label}</h3>
                <p className="lab-hint">{section.help}</p>
                <RadioCards
                  name={`product-${section.key}`}
                  value={productDraft.verdicts[section.key] ?? 'UNCERTAIN'}
                  options={VERDICT_OPTIONS}
                  inline
                  onChange={(value) =>
                    onProductDraft({
                      ...productDraft,
                      verdicts: { ...productDraft.verdicts, [section.key]: value },
                    })
                  }
                />
              </div>
            ))}
          </LabCard>

          <LabCard title="¿Qué lugar ocupa Propósito en esta experiencia?">
            <RadioCards
              name="purpose-feels"
              value={productDraft.purposeFeels}
              options={PURPOSE_FEELS_OPTIONS}
              onChange={(value) => onProductDraft({ ...productDraft, purposeFeels: value })}
            />
          </LabCard>

          <LabCard title="En conjunto, ¿esto se siente como Maximus Kratos?">
            <RadioCards
              name="still-mk"
              value={productDraft.stillMk}
              options={STILL_MK_OPTIONS}
              inline
              onChange={(value) => onProductDraft({ ...productDraft, stillMk: value })}
            />
          </LabCard>

          <LabCard title="¿Dónde empieza a separarse de MK?">
            <RadioCards
              name="product-divergence"
              value={productDraft.divergence}
              options={PRODUCT_DIVERGENCE_OPTIONS}
              onChange={(value) => onProductDraft({ ...productDraft, divergence: value })}
            />
            <label className="lab-field">
              <span className="lab-label">¿Qué cambiarías?</span>
              <textarea
                className="lab-textarea"
                value={productDraft.wouldChange}
                onChange={(event) => onProductDraft({ ...productDraft, wouldChange: event.target.value })}
              />
            </label>
            <label className="lab-field">
              <span className="lab-label">¿Qué información falta?</span>
              <textarea
                className="lab-textarea"
                value={productDraft.missing}
                onChange={(event) => onProductDraft({ ...productDraft, missing: event.target.value })}
              />
            </label>
          </LabCard>
        </>
      ) : (
        <div className="lab-empty">
          <p style={{ margin: 0 }}>
            Todavía no has generado la vista de la persona. Elige un foco y genérala para poder evaluarla.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * The person's surface. No ids, no Matrix vocabulary, no tie break: when the focus is not
 * decided yet we say exactly that instead of naming the Matrix candidate.
 */
function UserView({ experience, result }: { experience: LabExperience; result: LabResult }) {
  const view = experience.user_view;
  const focusPending =
    experience.projection.focus.awaiting_selection && Boolean(experience.projection.focus.matrix_candidate);
  const objectiveText =
    result.catalog.objectives.find(
      (objective) => objective.id === experience.projection.objective.selected_id,
    )?.text ?? view.objective;
  const routeName =
    result.catalog.plans.find((plan) => plan.id === experience.projection.route.matrix_plan_id)?.name ??
    (experience.projection.route.kind === 'PRODUCT_ROUTE' ? experience.projection.route.title : null);

  return (
    <article className="lab-user" aria-label="Vista de la persona">
      <div className="lab-user__block">
        <span className="lab-user__label">Tu dirección</span>
        <span className="lab-user__value lab-user__value--lead">{view.direction}</span>
      </div>
      <div className="lab-user__block">
        <span className="lab-user__label">Tu foco este ciclo</span>
        <span className="lab-user__value">
          {focusPending ? 'Todavía no confirmamos un foco.' : view.focus}
        </span>
      </div>
      <div className="lab-user__block">
        <span className="lab-user__label">Por qué ahora</span>
        <span className="lab-user__value">
          {focusPending ? 'Cuando confirmes tu foco, aquí verás por qué.' : view.why_now}
        </span>
      </div>
      {routeName ? (
        <div className="lab-user__block">
          <span className="lab-user__label">Tu camino</span>
          <span className="lab-user__value">{routeName}</span>
        </div>
      ) : null}
      <div className="lab-user__block">
        <span className="lab-user__label">Tu objetivo</span>
        <span className="lab-user__value">{objectiveText}</span>
      </div>
      <div className="lab-user__block">
        <span className="lab-user__label">Esta semana</span>
        <span className="lab-user__value">{view.this_week}</span>
      </div>
      <div className="lab-user__block">
        <span className="lab-user__label">{view.cycle.label}</span>
        <div className="lab-user__map">
          {view.map.map((item) => (
            <span key={item.key} className="lab-user__pill">
              {item.key}: {item.state ? formatState(item.state) : 'sin clasificar'}
            </span>
          ))}
        </div>
      </div>
      <span className="lab-user__cta">Ver mi diagnóstico</span>
    </article>
  );
}

/** Turns the human focus choice into the projection request. */
export function projectionPayload(draft: ExperienceDraft, hasObjectives: boolean) {
  const confirmMatrix = draft.focusChoice === 'CONFIRM_MATRIX';
  let selected: string | null = null;
  if (draft.focusChoice === 'OTHER') selected = draft.otherDomain || null;
  if (draft.focusChoice === 'PURPOSE') selected = 'PURPOSE';
  if (draft.focusChoice === 'NONE') selected = 'NONE';
  return {
    selected_focus: selected,
    selection_source: selected ? 'RAFA_JUDGMENT' : null,
    selection_reason: draft.selectionReason || null,
    objective_id: (hasObjectives ? draft.objectiveId : draft.customObjective) || null,
    action_text: draft.actionText || null,
    billing_cadence: draft.cadence,
    confirm_matrix_focus: confirmMatrix,
  };
}
