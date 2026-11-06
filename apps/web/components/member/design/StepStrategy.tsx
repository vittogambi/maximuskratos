'use client';

import { useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { territoryLabel } from '@/lib/design-flow';
import { JourneyApiError } from '@/lib/journey-api';
import { patchDesign, type DesignStrategy, type DesignView, type Template, type WorkPattern } from '@/lib/intervention-api';
import { weeksLabel } from '@/lib/plan-design';

type Props = { design: DesignView; onSaved: (view: DesignView) => void; onBack: () => void };

function TemplateCard({
  template,
  selected,
  reasons,
  priorUse,
  onChoose,
}: {
  template: Template;
  selected: boolean;
  reasons?: string[];
  priorUse?: string | null;
  onChoose: () => void;
}) {
  const result = template.indicators.find((row) => row.role === 'RESULT');
  return (
    <article className={selected ? 'is-selected' : undefined}>
      <h3>{template.title}</h3>
      <p>{template.seeks}</p>
      <p className="mk-m-muted">Propone: {template.action}</p>
      {result ? <p className="mk-m-muted">En la revisión semanal, te preguntará: {result.question}</p> : null}
      <p className="mk-m-muted">Suele revisarse a las {weeksLabel(template.horizonWeeks)}.</p>
      {reasons?.length ? (
        <ul className="mk-dp-reasons" aria-label="Por qué te la sugerimos">
          {reasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      ) : null}
      {priorUse ? <p className="mk-m-muted">{priorUse}</p> : null}
      <button type="button" className="mk-mx__action" aria-pressed={selected} onClick={onChoose}>
        {selected ? 'Elegida' : 'Elegir esta estrategia'}
      </button>
    </article>
  );
}

export function StepStrategy({ design, onSaved, onBack }: Props) {
  const { context, recommendations } = design;
  const current = design.strategy;
  const [choice, setChoice] = useState<{ kind: 'CATALOG'; templateId: string } | { kind: 'OWN'; pattern: WorkPattern } | null>(
    current ? (current.kind === 'CATALOG' ? { kind: 'CATALOG', templateId: current.templateId } : { kind: 'OWN', pattern: current.pattern }) : null,
  );
  const [showCatalog, setShowCatalog] = useState(recommendations.basis === 'NONE');
  const [showOwn, setShowOwn] = useState(current?.kind === 'OWN');
  const [focusText, setFocusText] = useState(current?.kind === 'CATALOG' ? current.focusText ?? '' : '');
  const [stageDefinition, setStageDefinition] = useState(current?.kind === 'CATALOG' ? current.stageDefinition ?? '' : '');
  const [ownTitle, setOwnTitle] = useState(current?.kind === 'OWN' ? current.title : '');
  const [approach, setApproach] = useState(current?.kind === 'OWN' ? current.approach ?? '' : '');
  const [conflict, setConflict] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = choice?.kind === 'CATALOG' ? context.catalog.find((row) => row.id === choice.templateId) ?? null : null;
  const recommendedIds = recommendations.items.flatMap((row) => (row.kind === 'CATALOG' ? [row.templateId] : []));

  function chooseTemplate(next: Template) {
    setChoice({ kind: 'CATALOG', templateId: next.id });
    setConflict(null);
    if (next.focusPrompt && !focusText.trim()) setFocusText(design.change.text.slice(0, 140));
    if (next.stagePrompt && !stageDefinition.trim() && design.result.mode === 'RESULT') setStageDefinition(design.result.criterion ?? '');
  }

  function choosePattern(pattern: WorkPattern) {
    setChoice({ kind: 'OWN', pattern });
    setShowOwn(true);
    setConflict(null);
  }

  async function save(resolution?: 'KEEP' | 'REPLACE' | 'ADD') {
    const token = getAccessToken();
    if (!token || !choice) return;
    if (template?.focusPrompt && !focusText.trim()) {
      setError(template.focusPrompt);
      return;
    }
    if (template?.stagePrompt && !stageDefinition.trim()) {
      setError(template.stagePrompt);
      return;
    }
    const strategy: DesignStrategy = choice.kind === 'CATALOG'
      ? { kind: 'CATALOG', templateId: choice.templateId, focusText: focusText.trim() || null, stageDefinition: stageDefinition.trim() || null }
      : { kind: 'OWN', pattern: choice.pattern, title: ownTitle.trim(), approach: approach.trim() || null };
    setBusy(true);
    setError(null);
    try {
      onSaved(await patchDesign(token, design.territory, design.planId, { section: 'strategy', strategy, ...(resolution ? { actionsResolution: resolution } : {}) }));
    } catch (err) {
      if (err instanceof JourneyApiError && err.code === 'ACTIONS_EDITED') {
        setConflict(design.actions.length);
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo guardar la estrategia.');
      }
    } finally {
      setBusy(false);
    }
  }

  const groups = context.goals
    .map((goal) => ({ goal, templates: context.catalog.filter((row) => row.goal === goal.id) }))
    .filter((row) => row.templates.length);

  return (
    <div className="mk-ds-proposal">
      <div>
        <h2 className="mk-ds-question">¿Cómo quieres trabajar en este cambio?</h2>
        <p className="mk-ds-help">La estrategia es la forma de trabajar. En el paso siguiente la conviertes en acciones que puedes cambiar.</p>
      </div>

      {recommendations.basis === 'PERSONAL' ? (
        <section className="mk-dp-group" aria-labelledby="mk-dp-recs">
          <h3 id="mk-dp-recs" className="mk-dp-context__title">Estrategias sugeridas para ti</h3>
          {recommendations.items.map((row) => {
            if (row.kind === 'OWN') {
              const pattern = context.patterns.find((item) => item.id === row.pattern)!;
              return (
                <article key={row.pattern} className={choice?.kind === 'OWN' && choice.pattern === row.pattern ? 'is-selected' : undefined}>
                  <h3>{pattern.label}</h3>
                  <p>{pattern.description}</p>
                  <ul className="mk-dp-reasons" aria-label="Por qué te la sugerimos">{row.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  <button type="button" className="mk-mx__action" aria-pressed={choice?.kind === 'OWN' && choice.pattern === row.pattern} onClick={() => choosePattern(row.pattern)}>
                    {choice?.kind === 'OWN' && choice.pattern === row.pattern ? 'Elegida' : 'Elegir esta forma'}
                  </button>
                </article>
              );
            }
            const item = context.catalog.find((t) => t.id === row.templateId);
            return item ? (
              <TemplateCard key={row.templateId} template={item} selected={choice?.kind === 'CATALOG' && choice.templateId === item.id} reasons={row.reasons} priorUse={row.priorUse} onChoose={() => chooseTemplate(item)} />
            ) : null;
          })}
        </section>
      ) : (
        <p className="mk-ds-need">{recommendations.note}</p>
      )}

      <button type="button" className="mk-mx__textlink" aria-expanded={showCatalog} onClick={() => setShowCatalog((value) => !value)}>
        {showCatalog ? 'Ocultar el catálogo' : `Ver todas las estrategias de ${territoryLabel(design.territory)}`}
      </button>
      {showCatalog ? groups.map(({ goal, templates }) => (
        <section key={goal.id} className="mk-dp-group" aria-label={goal.label}>
          <h3 className="mk-dp-context__title">{goal.label}</h3>
          {templates.map((item) => (
            <TemplateCard
              key={item.id}
              template={item}
              selected={choice?.kind === 'CATALOG' && choice.templateId === item.id}
              priorUse={recommendedIds.includes(item.id) ? 'También te la sugerimos.' : context.priorPlans.find((plan) => plan.templateId === item.id) ? `Ya utilizaste esta estrategia en «${context.priorPlans.find((plan) => plan.templateId === item.id)!.title}».` : null}
              onChoose={() => chooseTemplate(item)}
            />
          ))}
        </section>
      )) : null}

      <button type="button" className="mk-mx__textlink" aria-expanded={showOwn} onClick={() => setShowOwn((value) => !value)}>
        {showOwn ? 'Ocultar mi propia estrategia' : 'Crear mi propia estrategia'}
      </button>
      {showOwn ? (
        <section className="mk-dp-context" aria-labelledby="mk-dp-own">
          <h3 id="mk-dp-own" className="mk-dp-context__title">Tu propia estrategia</h3>
          <fieldset className="mk-ds-choices">
            <legend className="mk-dp-legend">¿Cómo quieres trabajarlo?</legend>
            {context.patterns.map((pattern) => (
              <label key={pattern.id} className={choice?.kind === 'OWN' && choice.pattern === pattern.id ? 'is-selected' : undefined}>
                <input type="radio" name="own-pattern" checked={choice?.kind === 'OWN' && choice.pattern === pattern.id} onChange={() => choosePattern(pattern.id)} />
                <span><strong>{pattern.label}</strong><small>{pattern.description}</small></span>
              </label>
            ))}
          </fieldset>
          {choice?.kind === 'OWN' ? (
            <>
              <label className="mk-ds-field">
                Nombre de tu estrategia (opcional)
                <input maxLength={120} value={ownTitle} onChange={(event) => setOwnTitle(event.target.value)} />
              </label>
              <label className="mk-ds-field">
                ¿Por qué crees que te va a servir? (opcional)
                <textarea rows={2} maxLength={500} value={approach} onChange={(event) => setApproach(event.target.value)} />
              </label>
            </>
          ) : null}
        </section>
      ) : null}

      {template?.focusPrompt ? (
        <label className="mk-ds-field">
          {template.focusPrompt}
          <input maxLength={140} value={focusText} onChange={(event) => setFocusText(event.target.value)} />
          <small>Tomamos lo que escribiste en el paso 1. Ajústalo si hace falta.</small>
        </label>
      ) : null}
      {template?.stagePrompt ? (
        <label className="mk-ds-field">
          {template.stagePrompt}
          <textarea rows={2} maxLength={500} value={stageDefinition} onChange={(event) => setStageDefinition(event.target.value)} />
          {design.result.mode === 'RESULT' ? <small>Partimos de cómo dijiste que reconocerías el resultado.</small> : null}
        </label>
      ) : null}
      {template?.notes.length ? template.notes.map((note) => <p key={note} className="mk-ds-need">{note}</p>) : null}

      {conflict != null ? (
        <section className="mk-m-callout" role="alertdialog" aria-labelledby="mk-dp-conflict">
          <p id="mk-dp-conflict"><strong>Ya ajustaste {conflict === 1 ? 'una acción' : `${conflict} acciones`} de este plan.</strong></p>
          <p className="mk-m-muted">Cambiar de estrategia no borra tu trabajo si no lo pides. ¿Qué hacemos con esas acciones?</p>
          <p className="mk-m-muted">Reemplazar puede eliminar acciones que ya editaste en este borrador.</p>
          <div className="mk-ds-actions">
            <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={() => void save('KEEP')}>Mantener mis acciones</button>
            <button type="button" className="mk-mx__action" disabled={busy} onClick={() => void save('ADD')}>Combinar con las sugeridas</button>
            <button type="button" className="mk-mx__action" disabled={busy} onClick={() => void save('REPLACE')}>Reemplazar mis acciones</button>
            <button type="button" className="mk-mx__textlink" onClick={() => setConflict(null)}>Cancelar</button>
          </div>
        </section>
      ) : null}

      {error ? <p className="mk-ds-error" role="alert">{error}</p> : null}
      {!choice ? <p className="mk-ds-need">Elige una estrategia del catálogo o diseña la tuya para continuar.</p> : null}
      <div className="mk-ds-foot">
        <button type="button" className="mk-mx__action" onClick={onBack}>Anterior</button>
        <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy || !choice || conflict != null} onClick={() => void save()}>
          {busy ? 'Guardando' : 'Continuar con esta estrategia'}
        </button>
      </div>
    </div>
  );
}
