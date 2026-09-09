'use client';

import { LabCoverageStrip } from './domain-chip';
import { KeyValues, LabCard, Tech } from './primitives';
import type { LabQuestion, LabRunSummary } from '@/lib/lab-api';
import { parseFacilitatorBrief } from '@/lib/lab-ui/facilitator';
import { labUiLabels } from '@/lib/lab-ui/labels';

export function StepCase({
  run,
  questions,
  focusFamilyId,
  onContinue,
}: {
  run: LabRunSummary;
  questions?: LabQuestion[];
  focusFamilyId?: string | null;
  onContinue: () => void;
}) {
  const families = run.method_families ?? [];
  const focus = families.find((item) => item.id === focusFamilyId) ?? null;
  return (
    <div className="lab-stack">
      <div className="lab-ctabar lab-ctabar--dock">
        <p className="lab-ctabar__note">
          {run.status === 'REVEALED'
            ? 'Las respuestas y el resultado de la Matriz ya están disponibles.'
            : 'Las respuestas están disponibles. El resultado se revela después de registrar tu criterio.'}
        </p>
        <button type="button" className="lab-btn" onClick={onContinue}>
          Continuar
        </button>
      </div>

      {focus?.question ? (
        <LabCard title="En esta revisión">
          <p className="lab-lead">{focus.question}</p>
        </LabCard>
      ) : null}

      <LabCard title="Este caso">
        {run.casebook_key ? <p className="lab-muted">Caso de prueba</p> : null}
        {run.expert_context?.trim() ? (
          <p className="lab-lead lab-case__story">{run.expert_context.trim()}</p>
        ) : (
          <p className="lab-muted">
            {run.casebook_key
              ? 'Este caso todavía no tiene historia cargada.'
              : 'Caso propio. Revisa las respuestas y registra tu criterio.'}
          </p>
        )}
        {families.length > 1 ? (
          <div>
            <p>Este caso participa en {families.length} pruebas metodológicas:</p>
            <ul style={{ paddingLeft: '1.1rem' }}>
              {families.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          </div>
        ) : families.length === 1 ? (
          <p className="lab-muted">{families[0]?.question}</p>
        ) : null}

        {run.evidence ? (
          <div className="lab-case__cov">
            <h3 className="lab-h4">Respuestas disponibles</h3>
            <LabCoverageStrip evidence={run.evidence} questions={questions} />
          </div>
        ) : (
          <p className="lab-muted">Abre las preguntas para ver cuántas respuestas hay en cada ámbito.</p>
        )}
      </LabCard>

      {run.status === 'REVEALED' && run.facilitator_note ? (
        <FacilitatorBrief note={run.facilitator_note} />
      ) : null}

      <Tech>
        <KeyValues
          rows={[
            ['Caso', run.case_id],
            ['Run', run.id],
            ['Estado interno', run.status],
            ['Política', run.policy_id],
            ['Evaluación', labUiLabels.policy(run.policy_id)],
            ['Tipo de caso', labUiLabels.caseKind(run.case_kind)],
            ['Preguntas presentadas', String(run.served)],
            ['Respondidas', `${run.answered} de ${run.served}`],
            ['Definición', run.definition_ref],
            ['Hash de definición', run.definition_sha256],
            ['Motor', run.engine_semver],
            ['Casebook', run.casebook_key ?? 'sin clave'],
            ['Par', run.pair_side ? `Caso ${run.pair_side}` : 'no'],
          ]}
        />
      </Tech>
    </div>
  );
}

export function FacilitatorBrief({ note }: { note: string }) {
  const blocks = parseFacilitatorBrief(note);
  return (
    <LabCard title="Para qué creamos este caso">
      {blocks ? (
        <div className="lab-stack lab-stack--tight">
          {blocks.map((block) => (
            <div key={block.heading}>
              <h3 className="lab-h4">{block.heading}</h3>
              <p className="lab-muted">{block.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="lab-muted" style={{ whiteSpace: 'pre-line' }}>
          {note}
        </p>
      )}
    </LabCard>
  );
}
