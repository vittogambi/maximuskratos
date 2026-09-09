'use client';

import { useState, type ReactNode } from 'react';
import { AppIcon } from '@/components/app-icon';
import { DomainChip } from './domain-chip';
import { OriginChip } from './origin-chip';
import { ObserveButton } from './question-observe';
import type { LabItemTrace, LabQuestion } from '@/lib/lab-api';
import { domainToken, humanDimensionLabel } from '@/lib/lab-ui/domain';
import { answerIsInterpreted, countNoun, formatAnswer } from '@/lib/lab-ui/format';
import {
  PENDING_EQUIVALENCE_COPY,
  PENDING_ORIGIN_COPY,
  isPendingOriginWhy,
  labUiLabels,
} from '@/lib/lab-ui/labels';
import { Tech } from './primitives';

export function LabDomainBadge({
  domain,
  compact,
}: {
  domain: string | null | undefined;
  compact?: boolean;
}) {
  return <DomainChip domain={domain} compact={compact} />;
}

export function LabSafetyBadge({ triggered }: { triggered?: boolean }) {
  return (
    <span
      className={triggered ? 'lab-qc__safety is-on' : 'lab-qc__safety'}
      title={triggered ? 'Esta respuesta disparó una alerta.' : 'Pregunta de seguridad. Puede disparar una alerta.'}
    >
      <AppIcon name={triggered ? 'shield-alert' : 'shield'} size={13} />
      {triggered ? 'Alerta activa' : 'Seguridad'}
    </span>
  );
}

export function LabAnswer({
  question,
  children,
  compact,
}: {
  question: LabQuestion;
  children?: ReactNode;
  compact?: boolean;
}) {
  const labelClass = children ? 'lab-qc__answer-label' : 'sr-only';
  if (children) {
    return (
      <div className="lab-qc__answer">
        <span className={labelClass}>Respuesta</span>
        {children}
      </div>
    );
  }
  const unanswered = question.status === 'UNANSWERED';
  const omitted = question.status === 'SKIPPED_BY_USER';
  return (
    <div className={unanswered ? 'lab-qc__answer is-empty' : 'lab-qc__answer'}>
      <span className={labelClass}>Respuesta</span>
      <span
        className={
          omitted
            ? 'lab-qc__omit'
            : unanswered
              ? 'lab-qc__answer-value is-muted'
              : 'lab-qc__answer-value'
        }
        title={omitted ? 'Esta pregunta no fue respondida en este caso.' : undefined}
      >
        {formatAnswer(question)}
      </span>
      {!compact && question.status === 'ANSWERED' && question.answer_scale_hint ? (
        <span className="lab-hint">{question.answer_scale_hint}</span>
      ) : null}
      {!compact && question.status === 'ANSWERED' && !answerIsInterpreted(question) ? (
        <span className="lab-hint">Esta escala no tiene etiquetas en la definición.</span>
      ) : null}
    </div>
  );
}

export function LabQuestionActions({
  runId,
  question,
  onSaved,
  revealed = true,
  score,
  onTryChange,
  defaultOpen = false,
  openTick = 0,
}: {
  runId: string;
  question: LabQuestion;
  onSaved?: () => void;
  revealed?: boolean;
  score?: number | null;
  onTryChange?: (preset: { kind: string; target_id: string; value: string }) => void;
  defaultOpen?: boolean;
  openTick?: number;
}) {
  return (
    <div className="lab-qc__actions">
      <ObserveButton
        runId={runId}
        question={question}
        onSaved={onSaved}
        revealed={revealed}
        score={score}
        onTryChange={onTryChange}
        defaultOpen={defaultOpen}
        openTick={openTick}
      />
    </div>
  );
}

export function LabQuestionObservation({
  question,
  open,
  onToggle,
}: {
  question: LabQuestion;
  open: boolean;
  onToggle: () => void;
}) {
  const notes = question.other_notes ?? [];
  if (!question.flagged_here && !notes.length) return null;
  return (
    <div className="lab-qc__obs">
      {question.flagged_here ? (
        <span className="lab-qc__marked" title="Marcaste esta pregunta para revisarla después.">
          <AppIcon name="flag" size={13} />
          Para revisar
        </span>
      ) : null}
      {question.flagged_here || notes.length ? (
        <button type="button" className="lab-qc__obs-toggle" onClick={onToggle}>
          {open ? 'Ocultar observación' : 'Ver observación'}
        </button>
      ) : null}
      {open ? (
        <div className="lab-qc__obs-body">
          {question.flagged_here ? (
            <p className="lab-muted">Marcaste esta pregunta para revisarla después.</p>
          ) : null}
          {notes.map((item) => (
            <p key={item.id} className="lab-muted">
              {item.issue_types.map((code) => labUiLabels.issueType(code)).join(', ')}. {item.note}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LabDomainSection({
  domain,
  title,
  count,
  children,
}: {
  domain?: string | null;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const token = domainToken(domain);
  return (
    <section className={`lab-qc-section lab-qc-section--${token?.css ?? 'plain'}`}>
      <div className="lab-qc-section__head">
        <h3 className="lab-qc-section__title">
          {token ? <AppIcon name={token.icon} size={16} /> : null}
          {title}
        </h3>
        <span className="lab-qc-section__count">{countNoun(count, 'respuesta', 'respuestas')}</span>
      </div>
      {children}
    </section>
  );
}

export function LabQuestionCard({
  question,
  runId,
  revealed,
  fired,
  onReload,
  answer,
  itemTrace,
  onOpenWhy,
  onTryChange,
  hideDomain,
  hideDimension,
}: {
  question: LabQuestion;
  runId: string;
  revealed: boolean;
  fired?: boolean;
  onReload?: () => void;
  answer?: ReactNode;
  itemTrace?: LabItemTrace | null;
  onOpenWhy?: (domain: string) => void;
  onTryChange?: (preset: { kind: string; target_id: string; value: string }) => void;
  hideDomain?: boolean;
  hideDimension?: boolean;
}) {
  const [openObs, setOpenObs] = useState(false);
  const [openReview, setOpenReview] = useState(0);
  const token = domainToken(question.domain);
  const accent = token?.css ?? 'plain';
  const readMode = !answer;
  const showDomain = !hideDomain;
  const showDimension = Boolean(question.dimension_label) && !hideDimension;
  const showIdentity = showDomain || showDimension || question.is_risk || Boolean(question.flagged_here);
  const showOrigin =
    revealed &&
    Boolean(question.source_mapping) &&
    question.source_mapping?.transformation_type !== 'UNCLEAR' &&
    !isPendingOriginWhy(question.source_mapping?.why_changed);
  const classes = [
    'lab-qc',
    `lab-qc--${accent}`,
    readMode ? 'lab-qc--read' : '',
    question.flagged_here ? 'is-marked' : '',
    fired ? 'is-fired' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const actions = (
    <LabQuestionActions
      runId={runId}
      question={question}
      onSaved={onReload}
      revealed={revealed}
      score={itemTrace?.normalized_score}
      onTryChange={onTryChange}
      defaultOpen={openReview > 0}
      openTick={openReview}
    />
  );

  return (
    <article className={classes}>
      {showIdentity || !readMode ? (
        <header className="lab-qc__header">
          <div className="lab-qc__identity">
            {showDomain ? <LabDomainBadge domain={question.domain} /> : null}
            {showDimension ? (
              <span className="lab-qc__dimension">{humanDimensionLabel(question.dimension_label)}</span>
            ) : null}
            {question.is_risk ? <LabSafetyBadge triggered={fired} /> : null}
            {question.flagged_here ? <span className="lab-qc__reviewed">Revisada</span> : null}
          </div>
          {readMode ? null : actions}
        </header>
      ) : null}

      <div className="lab-qc__body">
        <p className="lab-qc__question">{question.text}</p>
        {readMode ? (
          <div className="lab-qc__side">
            <LabAnswer question={question} compact />
            {actions}
          </div>
        ) : (
          <LabAnswer question={question}>{answer}</LabAnswer>
        )}
      </div>

      {fired ? (
        <div className="lab-qc__alert" role="status">
          <strong>Alerta activada</strong>
          <p>Esta respuesta disparó una alerta de la Matriz.</p>
        </div>
      ) : null}

      {question.flagged_here || (revealed && (question.other_notes?.length ?? 0) > 0) ? (
        <footer className="lab-qc__footer">
          <LabQuestionObservation
            question={question}
            open={openObs}
            onToggle={() => setOpenObs((value) => !value)}
          />
        </footer>
      ) : null}

      {showOrigin ? (
        <details className="lab-qc__trace">
          <summary>Ver de dónde viene esta pregunta</summary>
          <LabProvenance mapping={question.source_mapping} onEvaluate={() => setOpenReview((n) => n + 1)} />
        </details>
      ) : null}
      {revealed ? (
        <details className="lab-qc__trace">
          <summary>Cómo la leyó la Matriz</summary>
          <MatrixReading itemTrace={itemTrace} question={question} onOpenWhy={onOpenWhy} />
        </details>
      ) : null}
    </article>
  );
}

export function LabProvenance({
  mapping,
  onEvaluate,
}: {
  mapping?: LabQuestion['source_mapping'];
  onEvaluate?: () => void;
}) {
  if (!mapping) return null;
  const pending =
    mapping.transformation_type === 'UNCLEAR' || isPendingOriginWhy(mapping.why_changed);
  const original = mapping.source_question?.trim() || '';
  const origin =
    mapping.transformation_type === 'UNCHANGED' ? 'EXCEL_SOURCE' : 'MATRIX_V2';
  return (
    <div className="lab-provenance">
      <div className="lab-stack lab-stack--tight">
        <h3 className="lab-h4">Origen y cambios</h3>
        <p>
          <OriginChip origin={origin} />
        </p>
        {pending ? (
          <>
            <p>
              <strong>Origen pendiente de confirmar</strong>
            </p>
            <p className="lab-muted">{PENDING_ORIGIN_COPY}</p>
            <p className="lab-muted">{PENDING_EQUIVALENCE_COPY}</p>
          </>
        ) : mapping.transformation_type === 'NEW_IN_V2' ? (
          <p className="lab-muted">Es nueva. No había una pregunta equivalente en el formulario anterior.</p>
        ) : (
          <dl className="lab-prov">
            <dt>Fuente exacta</dt>
            <dd>
              {[mapping.source_form, mapping.source_section, mapping.source_question_number]
                .filter(Boolean)
                .join('. ') || 'Sin referencia'}
            </dd>
            <dt>Qué había antes</dt>
            <dd>{original || PENDING_EQUIVALENCE_COPY}</dd>
            <dt>Qué existe ahora</dt>
            <dd>{mapping.v2_question || 'Sin texto registrado'}</dd>
            <dt>Qué cambió</dt>
            <dd>{labUiLabels.transformation(mapping.transformation_type)}</dd>
            {isPendingOriginWhy(mapping.why_changed) ? null : (
              <>
                <dt>Por qué cambió</dt>
                <dd>{mapping.why_changed}</dd>
              </>
            )}
          </dl>
        )}
        {onEvaluate ? (
          <button type="button" className="lab-btn lab-btn--ghost" onClick={onEvaluate}>
            Revisar el origen
          </button>
        ) : null}
        <Tech>
          <p className="lab-mono">{mapping.v2_question_id}</p>
        </Tech>
      </div>
    </div>
  );
}

function MatrixReading({
  itemTrace,
  question,
  onOpenWhy,
}: {
  itemTrace?: LabItemTrace | null;
  question: LabQuestion;
  onOpenWhy?: (domain: string) => void;
}) {
  const purpose =
    question.domain === 'PROPÓSITO' || question.domain === 'PURPOSE' || question.domain === 'PROPOSITO';
  if (purpose) {
    return (
      <p className="lab-muted">
        Rol: Dirección. Se usa en la lectura de dirección y la revisión metodológica. No modifica puntaje,
        estado, cobertura diagnóstica, alertas ni ámbito prioritario.
      </p>
    );
  }
  if (!itemTrace) {
    return (
      <p className="lab-muted">
        {question.is_risk
          ? 'Rol: Pregunta de seguridad. Se usa en reglas de safety. No modifica el puntaje por sí sola.'
          : 'Esta información no tiene un consumidor en el cálculo de este caso.'}
      </p>
    );
  }
  if (itemTrace.excluded_reason) {
    return (
      <p className="lab-muted">
        No entró en el cálculo: {labUiLabels.excludedReason(itemTrace.excluded_reason)}.
      </p>
    );
  }
  return (
    <div className="lab-qc__trace-body">
      <p className="lab-muted">
        {itemTrace.normalized_score == null
          ? `Entra al cálculo de ${labUiLabels.domain(itemTrace.domain)}, sin puntaje.`
          : `Entra al cálculo de ${labUiLabels.domain(itemTrace.domain)} con ${itemTrace.normalized_score} de 100.`}
      </p>
      {onOpenWhy && itemTrace.domain ? (
        <button type="button" className="lab-btn lab-btn--ghost" onClick={() => onOpenWhy(itemTrace.domain)}>
          Ver el cálculo de {labUiLabels.domain(itemTrace.domain)}
        </button>
      ) : null}
      <Tech>
        <p className="lab-mono">weight {itemTrace.weight}</p>
        <p className="lab-mono">contribution_to_dimension {itemTrace.contribution_to_dimension}</p>
        <p className="lab-mono">contribution_to_domain {itemTrace.contribution_to_domain}</p>
        <p className="lab-mono">{question.id}</p>
      </Tech>
    </div>
  );
}
