'use client';

import { useState } from 'react';
import { Alert, LabCard, QuestionPicker, RadioCards, SavedNote, Tech } from './primitives';
import type { LabAssessments, LabQuestion, LabResult } from '@/lib/lab-api';
import { formatAnswer } from '@/lib/lab-ui/format';
import { CONFIDENCE_OPTIONS, PURPOSE_STAGES, labUiLabels } from '@/lib/lab-ui/labels';

export interface PurposeDraft {
  stage: string;
  evidence: string[];
  confidence: string;
  notes: string;
}

export const emptyPurposeDraft: PurposeDraft = {
  stage: 'UNSURE',
  evidence: [],
  confidence: 'MEDIA',
  notes: '',
};

export function StepPurpose({
  result,
  questions,
  assessments,
  direction,
  draft,
  onDraft,
  pending,
  onSubmit,
  onContinue,
}: {
  result: LabResult | null;
  questions: LabQuestion[];
  assessments: LabAssessments | null;
  direction: string | null;
  draft: PurposeDraft;
  onDraft: (next: PurposeDraft) => void;
  pending: boolean;
  onSubmit: () => void;
  onContinue: () => void;
}) {
  const latest = assessments?.purpose[0] ?? null;
  const [editing, setEditing] = useState(!latest);
  const purposeQuestions = questions.filter(
    (question) => question.domain === 'PROPÓSITO' || question.domain === 'PURPOSE' || question.domain === 'PROPOSITO',
  );
  const answeredPurpose = purposeQuestions.filter((question) => question.status === 'ANSWERED');
  const pool = answeredPurpose;

  function purposeModuleCounts(rows: LabQuestion[]) {
    const names: Array<{ test: (dimension: string) => boolean; name: string }> = [
      { test: (dimension) => dimension.includes('historia') || dimension.includes('linaje'), name: 'Historia y linaje' },
      { test: (dimension) => dimension.includes('vision'), name: 'Futuro deseado' },
      { test: (dimension) => dimension.includes('valor') && !dimension.includes('economico'), name: 'Criterios morales' },
      { test: (dimension) => dimension.includes('estandar'), name: 'Mínimos no negociables' },
      { test: (dimension) => dimension.includes('identidad'), name: 'Quién estoy construyendo' },
      { test: (dimension) => dimension.includes('interferencia'), name: 'Patrones que bloquean' },
      { test: (dimension) => dimension.includes('integracion'), name: 'Recursos internos' },
      { test: (dimension) => dimension.includes('tendencia'), name: 'Preferencias personales' },
      { test: (dimension) => dimension.includes('ikigai'), name: 'Posibles propósitos' },
      { test: (dimension) => dimension.includes('hipotesis'), name: 'Experimento real' },
      { test: (dimension) => dimension.includes('huella'), name: 'Legado y beneficiarios' },
    ];
    return names
      .map((item) => {
        const matched = rows.filter((row) => item.test((row.dimension ?? '').toLowerCase()));
        return {
          name: item.name,
          total: matched.length,
          answered: matched.filter((row) => row.status === 'ANSWERED').length,
        };
      })
      .filter((item) => item.total > 0);
  }

  function set<K extends keyof PurposeDraft>(key: K, value: PurposeDraft[K]) {
    onDraft({ ...draft, [key]: value });
  }

  if (answeredPurpose.length === 0) {
    return (
      <div className="lab-stack">
        <div className="lab-ctabar lab-ctabar--dock">
          <p className="lab-ctabar__note">Esto no queda pendiente. Este caso no incluye Propósito.</p>
          <button type="button" className="lab-btn" onClick={onContinue}>
            Volver al caso
          </button>
        </div>
        <LabCard title="Propósito y dirección">
          <p className="lab-lead">Este caso no tiene información de Propósito. Fue creado para probar la Matriz de situación actual.</p>
          <p className="lab-muted">Puedes revisar Propósito en R15 o crear un caso propio con esas respuestas.</p>
        </LabCard>
      </div>
    );
  }

  return (
    <div className="lab-stack">
      <div className="lab-ctabar lab-ctabar--dock">
        <div>
          {latest ? (
            <SavedNote>
              Criterio guardado: {labUiLabels.purposeStage(latest.stage)}. Revisión {latest.revision}.
            </SavedNote>
          ) : null}
          <p className="lab-ctabar__note">
            Este criterio no cambia el resultado de la Matriz. Cambia cómo interpretamos qué hacer
            con ese resultado.
          </p>
        </div>
        <div className="lab-actions">
          {editing ? (
            <button
              type="button"
              className="lab-btn"
              disabled={pending || !draft.stage}
              onClick={onSubmit}
            >
              Guardar mi criterio de Propósito
            </button>
          ) : null}
          <button type="button" className="lab-btn lab-btn--ghost" onClick={onContinue}>
            Ver experiencia de la persona
          </button>
        </div>
      </div>

      <LabCard title="Propósito y dirección">
        <p className="lab-muted">
          La Matriz no usa Propósito para calcular puntajes, estados ni su recomendación. Aquí
          registramos hacia dónde quiere ir esta persona, para usarlo después al decidir el foco
          del ciclo.
        </p>
        <p className="lab-hint">
          La Matriz dice dónde estoy. Propósito y Dirección dicen hacia dónde voy. MK decide qué
          hacer ahora para reducir esa distancia.
        </p>
      </LabCard>

      <LabCard title="Dirección actual">
        <p className="lab-lead">{direction?.trim() || 'Todavía está en construcción.'}</p>
      </LabCard>

      <LabCard title="Respuestas de Propósito">
        <p className="lab-hint">
          Para estudiar Dirección hacen falta al menos: Visión, Valores, Estándares, Identidad. Origen,
          Interferencia, Integración, Tendencias, Hipótesis, Contraste y Huella son opcionales en un caso de
          prueba.
        </p>
        <p className="lab-muted">{answeredPurpose.length} respondidas.</p>
        {purposeModuleCounts(purposeQuestions).map((item) => (
          <p key={item.name} className="lab-muted">
            {item.name}: {item.answered} de {item.total} respondidas
          </p>
        ))}
        <button
          type="button"
          className="lab-btn"
          onClick={() =>
            onDraft({
              ...draft,
              stage: 'UNSURE',
              notes: draft.notes.trim() || 'No tengo información suficiente',
            })
          }
        >
          No tengo información suficiente
        </button>
      </LabCard>

      {latest && !editing ? (
        <LabCard title="Registrado">
          <p>
            Etapa: {labUiLabels.purposeStage(latest.stage)}. Evidencias:{' '}
            {(latest.evidenceRefs ?? []).join(', ') || 'ninguna'}. Confianza:{' '}
            {labUiLabels.confidence(latest.confidence)}. {latest.notes || ''}
          </p>
          <button type="button" className="lab-btn" onClick={() => setEditing(true)}>
            Editar
          </button>
        </LabCard>
      ) : null}

      {editing ? (
        <>
          <LabCard title="¿Cómo describirías su dirección?">
            <RadioCards
              name="purpose-stage"
              value={draft.stage}
              options={PURPOSE_STAGES}
              onChange={(value) => set('stage', value)}
            />
          </LabCard>

          <LabCard title="¿En qué respuestas te apoyas?">
            <QuestionPicker
              label="Respuestas"
              help="Selecciona hasta 3 respuestas de Propósito que existan en este caso."
              max={3}
              questions={pool.map((question) => ({
                id: question.id,
                text: question.text,
                domain: question.domain,
                answer: formatAnswer(question),
              }))}
              picked={draft.evidence}
              onChange={(next) => set('evidence', next)}
            />
          </LabCard>

          <LabCard title="¿Qué tan seguro estás de este criterio?">
            <RadioCards
              name="purpose-confidence"
              value={draft.confidence}
              options={CONFIDENCE_OPTIONS}
              inline
              onChange={(value) => set('confidence', value)}
            />
            <label className="lab-field">
              <span className="lab-label">Nota</span>
              <span className="lab-hint">Opcional.</span>
              <textarea
                className="lab-textarea"
                value={draft.notes}
                onChange={(event) => set('notes', event.target.value)}
              />
            </label>
          </LabCard>
        </>
      ) : null}

      <Alert tone="info" title="Propósito">
        Rol: Dirección. Se usa en la lectura de dirección y la revisión metodológica. No modifica puntaje,
        estado, cobertura diagnóstica, alertas ni ámbito prioritario.
      </Alert>

      <Tech>
        <p className="lab-mono">purpose.stage_reason {result?.snapshot.purpose.stage_reason}</p>
        <p className="lab-hint">
          Dato interno de Lab. No constituye un puntaje de Propósito y no se muestra a la persona.
        </p>
        <p className="lab-muted">
          Cobertura de módulos de Propósito:{' '}
          {purposeQuestions.filter((item) => item.status === 'ANSWERED').length} de {purposeQuestions.length}{' '}
          respondidas
        </p>
      </Tech>
    </div>
  );
}
