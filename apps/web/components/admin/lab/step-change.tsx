'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, ErrorNote, LabCard, QuestionPicker, RadioCards, SavedNote, Tech } from './primitives';
import {
  labApi,
  type LabChangeOption,
  type LabChangeOptions,
  type LabContracts,
  type LabGuidedChangeResult,
  type LabReplay,
} from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { type ChangePreset } from '@/lib/lab-ui/change-preset';
import {
  changePath,
  DIAGNOSIS_OPTIONS,
  matchesOptionFilter,
  QUESTION_FAULT_OPTIONS,
  seedDiagnosis,
  type ChangeDiagnosis,
  type ChangeKindId,
  type QuestionFault,
} from '@/lib/lab-ui/change-diagnosis';
import { REPLAY_VERDICT_OPTIONS, labUiLabels } from '@/lib/lab-ui/labels';
import { ReplayImpactBoard } from './replay-impact-board';
import { WEIGHT_INTENT_OPTIONS, weightFromIntent } from '@/lib/lab-ui/review-followup';

const AGGREGATION_TARGET = 'LAB-SCORE-01.domain_aggregation';

function formatEsNumber(value: number | string): string {
  return String(value).replace('.', ',');
}

function currentWeightLead(weight: number): string {
  if (weight === 0) return 'Hoy cuenta 0. No entra en el puntaje de su dimensión.';
  if (weight === 1) return 'Hoy cuenta 1, igual que el resto de las preguntas que puntúan.';
  return `Hoy cuenta ${formatEsNumber(weight)}.`;
}

function weightProposalLine(from: number, to: number): string | null {
  if (!Number.isFinite(to) || to === from) return null;
  if (from > 0 && to === from * 2) return `Vas a probar ${formatEsNumber(to)}: el doble que hoy.`;
  if (from > 0 && to === from / 2) return `Vas a probar ${formatEsNumber(to)}: la mitad que hoy.`;
  return `Vas a probar ${formatEsNumber(to)}. Hoy es ${formatEsNumber(from)}.`;
}

function formatCurrent(option: LabChangeOption): string {
  if (option.value_kind === 'RATIO_AS_PERCENT' && typeof option.current === 'number') {
    return `${Math.round(option.current * 100)}%`;
  }
  if (option.value_kind === 'DOMAIN_FIRST' && Array.isArray(option.current)) {
    return (option.current as string[]).map((item) => labUiLabels.domain(item)).join(', ');
  }
  if (option.value_kind === 'DIMENSION_KEY' || option.value_kind === 'CHOICE') {
    const match = option.options?.find((item) => String(item.value) === String(option.current));
    return match?.label ?? String(option.current);
  }
  if (typeof option.current === 'boolean') return option.current ? 'Sí' : 'No';
  return String(option.current);
}

export function StepChange({
  runId,
  options,
  reasonSeed,
  pending,
  onSubmit,
  result,
  onVerdict,
  onDiscard,
  onAdjust,
  preset,
}: {
  runId: string;
  options: LabChangeOptions | null;
  reasonSeed: string;
  pending: boolean;
  onSubmit: (body: { kind: string; target_id: string; to: unknown; reason: string }) => void;
  result: LabGuidedChangeResult | null;
  onVerdict: (verdict: string) => void;
  onDiscard: () => void;
  onAdjust?: () => void;
  preset?: ChangePreset | null;
}) {
  const seeded = seedDiagnosis(preset?.kind, preset?.target_id);
  const [diagnosis, setDiagnosis] = useState<ChangeDiagnosis | ''>(preset?.diagnosis ?? seeded.diagnosis);
  const [questionFault, setQuestionFault] = useState<QuestionFault | ''>(
    preset?.questionFault ?? seeded.fault,
  );
  const [kind, setKind] = useState<ChangeKindId | ''>(
    preset?.target_id === AGGREGATION_TARGET ? 'DOMAIN_AGGREGATION' : (preset?.kind ?? ''),
  );
  const [targetId, setTargetId] = useState(preset?.target_id ?? '');
  const [rawValue, setRawValue] = useState(preset?.value ?? '');
  const [weightIntent, setWeightIntent] = useState('');

  useEffect(() => {
    if (!preset) return;
    const nextSeed = seedDiagnosis(preset.kind, preset.target_id);
    setDiagnosis(preset.diagnosis ?? nextSeed.diagnosis);
    setQuestionFault(preset.questionFault ?? nextSeed.fault);
    setKind(preset.target_id === AGGREGATION_TARGET ? 'DOMAIN_AGGREGATION' : (preset.kind ?? ''));
    setTargetId(preset.target_id);
    setRawValue(preset.value);
  }, [preset]);
  const [reason, setReason] = useState(reasonSeed);
  const [confirming, setConfirming] = useState(false);
  const [verdict, setVerdict] = useState('');
  const [kept, setKept] = useState(false);
  const [crossReplay, setCrossReplay] = useState<LabReplay | null>(null);
  const [contracts, setContracts] = useState<LabContracts | null>(null);
  const [crossBusy, setCrossBusy] = useState(false);
  const [crossError, setCrossError] = useState<string | null>(null);

  const path = changePath(diagnosis, questionFault);
  const catalogOptions = useMemo(() => {
    const rows = options?.options ?? [];
    if (kind === 'DOMAIN_AGGREGATION') {
      return rows.filter((option) => option.target_id === AGGREGATION_TARGET);
    }
    const filter = path?.mode === 'experiment' ? path.optionFilter : undefined;
    return rows.filter((option) => option.kind === kind && matchesOptionFilter(filter, option));
  }, [options, kind, path]);
  const selectedOption = catalogOptions.find((option) => option.target_id === targetId) ?? null;
  const question = options?.questions.find((item) => item.id === targetId) ?? null;

  const isQuestionKind = kind === 'QUESTION_WEIGHT' || kind === 'QUESTION_ACTIVE';
  const weightLine =
    kind === 'QUESTION_WEIGHT' && question ? weightProposalLine(question.weight, Number(rawValue)) : null;
  const currentText = isQuestionKind
    ? kind === 'QUESTION_WEIGHT'
      ? String(question?.weight ?? '')
      : question?.active
        ? 'Incluida'
        : 'Excluida'
    : selectedOption
      ? formatCurrent(selectedOption)
      : '';

  const valueError = validate();
  const experiment = path?.mode === 'experiment';
  const finding = path?.mode === 'finding' ? path : null;
  const ready =
    experiment && Boolean(kind) && Boolean(targetId) && rawValue !== '' && !valueError && reason.trim().length > 0;

  function applyPath(next: ReturnType<typeof changePath>) {
    if (!next || next.mode === 'finding') {
      setKind('');
      setTargetId('');
      setRawValue('');
      return;
    }
    setKind(next.kind);
    setTargetId(next.autoTarget ?? '');
    setRawValue(next.autoValue ?? '');
  }

  function validate(): string | null {
    if (rawValue === '') return null;
    if (kind === 'QUESTION_WEIGHT') {
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) return 'Escribe un número.';
      if (parsed < 0) return 'No puede ser negativo.';
      if (question && parsed === question.weight) return 'Eso es lo que ya tiene. Prueba otro número.';
      return null;
    }
    if (kind === 'QUESTION_ACTIVE') {
      if (question && (rawValue === 'true') === question.active) {
        return 'Ese es el estado actual. Elige el otro.';
      }
      return null;
    }
    if (!selectedOption) return null;
    if (selectedOption.value_kind === 'SCORE_0_100' || selectedOption.value_kind === 'RATIO_AS_PERCENT') {
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) return 'Escribe un número.';
      const min = selectedOption.min ?? 0;
      const max = selectedOption.max ?? 100;
      if (parsed < min || parsed > max) return `El valor debe estar entre ${min} y ${max}.`;
      const current =
        selectedOption.value_kind === 'RATIO_AS_PERCENT'
          ? Math.round((selectedOption.current as number) * 100)
          : (selectedOption.current as number);
      if (parsed === current) return 'Ese es el valor actual. Elige otro.';
      return null;
    }
    if (selectedOption.value_kind === 'DIMENSION_KEY' && rawValue === selectedOption.current) {
      return 'Esa es la dimensión actual. Elige otra.';
    }
    if (selectedOption.value_kind === 'DOMAIN_FIRST') {
      const current = (selectedOption.current as string[])[0];
      if (rawValue === current) return 'Ese ámbito ya va primero. Elige otro.';
    }
    if (selectedOption.value_kind === 'CHOICE' && String(selectedOption.current) === rawValue) {
      return 'Ese es el valor actual. Elige el otro.';
    }
    if (selectedOption.value_kind === 'BOOLEAN' && String(selectedOption.current) === rawValue) {
      return 'Ese es el valor actual. Elige el otro.';
    }
    return null;
  }

  function summaryLine(): string {
    if (isQuestionKind && question) {
      if (kind === 'QUESTION_WEIGHT') {
        return `Esta pregunta pasaría de contar ${formatEsNumber(question.weight)} a contar ${formatEsNumber(rawValue)}.`;
      }
      return `Esta pregunta: ${question.active ? 'incluida' : 'excluida'} a ${
        rawValue === 'true' ? 'incluida' : 'excluida'
      }`;
    }
    if (!selectedOption) return '';
    const to =
      selectedOption.value_kind === 'RATIO_AS_PERCENT'
        ? `${rawValue}%`
        : selectedOption.value_kind === 'DIMENSION_KEY' ||
            selectedOption.value_kind === 'DOMAIN_FIRST' ||
            selectedOption.value_kind === 'CHOICE'
          ? selectedOption.options?.find((item) => String(item.value) === rawValue)?.label ?? rawValue
          : selectedOption.value_kind === 'BOOLEAN'
            ? rawValue === 'true'
              ? 'Sí'
              : 'No'
            : rawValue;
    return `${selectedOption.label}: ${currentText} a ${to}`;
  }

  function submit() {
    const to =
      kind === 'QUESTION_ACTIVE' || selectedOption?.value_kind === 'BOOLEAN'
        ? rawValue === 'true'
        : kind === 'QUESTION_WEIGHT' ||
            selectedOption?.value_kind === 'SCORE_0_100' ||
            selectedOption?.value_kind === 'RATIO_AS_PERCENT'
          ? Number(rawValue)
          : rawValue;
    onSubmit({
      kind: kind === 'DOMAIN_AGGREGATION' ? 'INTERPRETATION' : kind,
      target_id: targetId,
      to,
      reason: reason.trim(),
    });
  }

  if (result) {
    const comparison = result.comparison.results.find((row) => row.run_id === runId) ?? result.comparison.results[0];
    return (
      <div className="lab-stack">
        <div className="lab-ctabar lab-ctabar--dock">
          <p className="lab-ctabar__note">
            ¿Este cambio arregla el problema sin romper otros casos?
          </p>
          <div className="lab-actions">
            <button
              type="button"
              className="lab-btn"
              disabled={
                pending ||
                kept ||
                Boolean(
                  crossReplay?.results.some(
                    (row) => (row.flags as { critical_regression?: boolean }).critical_regression,
                  ),
                )
              }
              onClick={() => {
                labApi
                  .accept(result.changeset_id, { note: 'Conservado desde el Lab' })
                  .then(() => setKept(true))
                  .catch(() => undefined);
              }}
            >
              Conservar cambio
            </button>
            <button type="button" className="lab-btn lab-btn--danger" disabled={pending} onClick={onDiscard}>
              Descartar cambio
            </button>
            <button
              type="button"
              className="lab-btn lab-btn--ghost"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                setKept(false);
                (onAdjust ?? onDiscard)();
              }}
            >
              Quiero ajustarlo
            </button>
            <button
              type="button"
              className="lab-btn lab-btn--ghost"
              disabled={crossBusy}
              onClick={() => {
                setCrossBusy(true);
                setCrossError(null);
                labApi
                  .replayReviewed({ changeset_id: result.changeset_id })
                  .then((next) => {
                    setCrossReplay(next);
                    if (typeof window !== 'undefined') {
                      window.location.assign(`/admin/lab/replays/${next.id}`);
                    }
                    return labApi.contracts(result.candidate_ref);
                  })
                  .then(setContracts)
                  .catch((err) => setCrossError(humanError(err, 'No pudimos completar esta acción.').message))
                  .finally(() => setCrossBusy(false));
              }}
            >
              Necesito revisar los casos afectados
            </button>
          </div>
        </div>
        {kept ? <SavedNote>Este cambio queda como versión en prueba. No se publica solo.</SavedNote> : null}

        <LabCard title="Qué estamos cambiando">
          <p className="lab-muted">{result.summary}</p>
        </LabCard>

        <ReplayImpactBoard rows={result.comparison.results} />

        <LabCard title="¿El cambio mejora la metodología?">
          <RadioCards
            name="replay-verdict"
            value={verdict}
            options={REPLAY_VERDICT_OPTIONS}
            inline
            onChange={(value) => {
              setVerdict(value);
              onVerdict(value);
            }}
          />
          {verdict ? <SavedNote>Veredicto guardado: {labUiLabels.replayVerdict(verdict)}.</SavedNote> : null}
        </LabCard>

        <LabCard title="Revisar los casos afectados">
          <p className="lab-muted">
            Usaremos las mismas respuestas de los casos ya revisados para ver dónde mejora o empeora este cambio.
          </p>
          {crossError ? <p className="lab-error">{crossError}</p> : null}
          {crossReplay ? (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Caso</th>
                  <th>Impacto</th>
                </tr>
              </thead>
              <tbody>
                {crossReplay.results.map((row) => {
                  const flags = row.flags as { impact?: string; critical_regression?: boolean; rafa_said?: string };
                  return (
                    <tr key={row.id}>
                      <td>{(row.flags as { case_label?: string }).case_label ?? 'Caso comparado'}</td>
                      <td>
                        {labUiLabels.impact(flags.impact)}
                        {flags.critical_regression ? '. Contradice un caso que ya habías aceptado' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
          {contracts ? (
            <p className="lab-muted">
              Comprobaciones: {labUiLabels.contract(contracts.overall)}. Alertas:{' '}
              {labUiLabels.contract(contracts.safety_invariants)}.
            </p>
          ) : null}
        </LabCard>

        {crossReplay?.results.some((row) => (row.flags as { critical_regression?: boolean }).critical_regression) ? (
          <Alert tone="danger" title="Regresión crítica">
            Este cambio modifica casos que ya habías aceptado. No se puede conservar en silencio.
          </Alert>
        ) : null}

        <Tech>
          <p>Cambio: {result.changeset_id}</p>
          <p>Candidata: {result.candidate_ref}</p>
          <p>Base: {result.comparison.base_definition_ref}</p>
          <p>Atribución: {comparison?.attribution}</p>
          <pre className="lab-pre">{JSON.stringify(comparison?.flags ?? {}, null, 2)}</pre>
        </Tech>
      </div>
    );
  }

  return (
    <div className="lab-stack">
      {!confirming ? (
        <div className="lab-ctabar lab-ctabar--dock">
          <p className="lab-ctabar__note">
            {finding
              ? 'Esto se anota en el cierre. No se crea una versión en prueba.'
              : ready
                ? 'Revisaremos el resumen antes de crear la versión en prueba.'
                : 'Di qué está mal. Si se puede simular, completa el experimento y el motivo.'}
          </p>
          <button type="button" className="lab-btn" disabled={!ready} onClick={() => setConfirming(true)}>
            Revisar el cambio
          </button>
        </div>
      ) : null}

      <LabCard
        title="Probar un cambio"
        lead="Primero di qué está mal. Ajustar cuánto cuenta una pregunta es el último recurso: solo cuando esa pregunta está bien y pertenece aquí."
      />

      <LabCard title="¿Qué es lo que está mal?">
        <RadioCards
          name="change-diagnosis"
          value={diagnosis}
          options={DIAGNOSIS_OPTIONS}
          onChange={(value) => {
            const next = value as ChangeDiagnosis;
            setDiagnosis(next);
            setQuestionFault('');
            applyPath(changePath(next, ''));
          }}
        />
      </LabCard>

      {diagnosis === 'QUESTION' ? (
        <LabCard title="¿Qué pasa con la pregunta?">
          <RadioCards
            name="question-fault"
            value={questionFault}
            options={QUESTION_FAULT_OPTIONS}
            onChange={(value) => {
              const next = value as QuestionFault;
              setQuestionFault(next);
              applyPath(changePath('QUESTION', next));
            }}
          />
        </LabCard>
      ) : null}

      {finding ? (
        <LabCard title={finding.title}>
          <p className="lab-lead">{finding.body}</p>
        </LabCard>
      ) : null}

      {experiment && kind && !isQuestionKind ? (
        <LabCard title="¿Qué elemento?">
          {diagnosis === 'DIMENSION' ? (
            <p className="lab-hint">
              Esto prueba otro agrupamiento. Si el problema es la definición de la dimensión, anótalo en el
              cierre.
            </p>
          ) : null}
          {catalogOptions.length === 0 ? (
            <p className="lab-muted">Esta definición no ofrece elementos de este tipo para experimentar.</p>
          ) : (
            <RadioCards
              name="change-target"
              value={targetId}
              options={catalogOptions.map((option) => ({
                value: option.target_id,
                label: option.label,
                help: `${option.description} Hoy: ${formatCurrent(option)}.`,
              }))}
              onChange={(value) => {
                setTargetId(value);
                setRawValue('');
              }}
            />
          )}
        </LabCard>
      ) : null}

      {experiment && kind && isQuestionKind ? (
        <LabCard title="Elige la pregunta">
          <QuestionPicker
            single
            label="Pregunta"
            help="Busca por palabras de la pregunta."
            questions={(options?.questions ?? []).map((item) => ({
              id: item.id,
              text: item.text,
              domain: item.domain,
              answer: `${labUiLabels.domain(item.domain)} · ${item.dimension_label}`,
            }))}
            picked={targetId ? [targetId] : []}
            onChange={(next) => {
              setTargetId(next[0] ?? '');
              setRawValue(path?.mode === 'experiment' && path.autoValue != null ? path.autoValue : '');
            }}
          />
        </LabCard>
      ) : null}

      {experiment && targetId && kind === 'QUESTION_WEIGHT' && question ? (
        <LabCard
          title="La pregunta está bien, pero influye demasiado o demasiado poco"
          lead={currentWeightLead(question.weight)}
        >
          <RadioCards
            name="weight-intent"
            value={weightIntent}
            options={WEIGHT_INTENT_OPTIONS}
            compact
            onChange={(value) => {
              setWeightIntent(value);
              if (value === 'OK') setRawValue(String(question.weight));
              else if (value === 'LESS' || value === 'MORE') setRawValue(weightFromIntent(question.weight, value));
            }}
          />
          <p className="lab-hint">
            El número no es un puntaje. Es cuánto cuenta esta pregunta dentro de su dimensión al calcular el
            estado. 2 es el doble que una pregunta normal. 0,5 es la mitad.
          </p>
          {question.weight > 0 ? (
            <div className="lab-seg" role="group" aria-label="Atajos">
              <button
                type="button"
                className={Number(rawValue) === question.weight / 2 ? 'lab-chip is-active' : 'lab-chip'}
                onClick={() => {
                  setWeightIntent('LESS');
                  setRawValue(String(question.weight / 2));
                }}
              >
                Que cuente la mitad
              </button>
              <button
                type="button"
                className={Number(rawValue) === question.weight * 2 ? 'lab-chip is-active' : 'lab-chip'}
                onClick={() => {
                  setWeightIntent('MORE');
                  setRawValue(String(question.weight * 2));
                }}
              >
                Que cuente el doble
              </button>
            </div>
          ) : null}
          {weightIntent === 'CUSTOM' || (rawValue !== '' && weightIntent !== 'LESS' && weightIntent !== 'MORE' && weightIntent !== 'OK') ? (
            <label className="lab-field">
              <span className="lab-label">Número que quieres probar</span>
              <input
                className="lab-input"
                type="number"
                min={0}
                step={0.1}
                value={rawValue}
                onChange={(event) => {
                  setWeightIntent('CUSTOM');
                  setRawValue(event.target.value);
                }}
              />
            </label>
          ) : null}
          {weightLine ? <p className="lab-muted">{weightLine}</p> : null}
          {valueError ? <p className="lab-error">{valueError}</p> : null}
        </LabCard>
      ) : null}

      {experiment && targetId && kind && kind !== 'QUESTION_WEIGHT' ? (
        <LabCard title="Valor nuevo">
          <p className="lab-muted">
            Valor actual: <strong>{currentText}</strong>
          </p>

          {kind === 'QUESTION_ACTIVE' ? (
            <RadioCards
              name="question-active"
              value={rawValue}
              options={[
                { value: 'true', label: 'Incluir esta pregunta en el cálculo' },
                { value: 'false', label: 'Excluirla de este candidato' },
              ]}
              onChange={setRawValue}
            />
          ) : null}

          {selectedOption &&
          (selectedOption.value_kind === 'SCORE_0_100' || selectedOption.value_kind === 'RATIO_AS_PERCENT') ? (
            <>
              <p className="lab-hint">{selectedOption.range_note}</p>
              <input
                className="lab-input"
                type="number"
                min={selectedOption.min}
                max={selectedOption.max}
                step={selectedOption.step}
                value={rawValue}
                aria-label={`Nuevo valor de ${selectedOption.label}`}
                onChange={(event) => setRawValue(event.target.value)}
              />
              {selectedOption.value_kind === 'RATIO_AS_PERCENT' ? (
                <p className="lab-hint">Se expresa en porcentaje de preguntas respondidas.</p>
              ) : null}
            </>
          ) : null}

          {selectedOption &&
          (selectedOption.value_kind === 'DIMENSION_KEY' ||
            selectedOption.value_kind === 'DOMAIN_FIRST' ||
            selectedOption.value_kind === 'BOOLEAN' ||
            selectedOption.value_kind === 'CHOICE') ? (
            <>
              <RadioCards
                name="change-value"
                value={rawValue}
                options={(selectedOption.options ?? []).map((item) => ({
                  value: String(item.value),
                  label: item.label,
                  help: item.help,
                }))}
                onChange={setRawValue}
              />
              {selectedOption.value_kind === 'DIMENSION_KEY' ? (
                <p className="lab-hint">
                  Esto no cambia las respuestas. Cambia en qué dimensión se agrupan para el cálculo.
                </p>
              ) : null}
              {selectedOption.value_kind === 'DOMAIN_FIRST' ? (
                <p className="lab-hint">
                  El ámbito elegido pasa al primer lugar del orden de desempate. Los demás conservan su orden
                  relativo.
                </p>
              ) : null}
            </>
          ) : null}

          {valueError ? <p className="lab-error">{valueError}</p> : null}
        </LabCard>
      ) : null}

      {experiment && targetId ? (
        <LabCard title="¿Por qué quieres probar esto?">
          <textarea
            className="lab-textarea"
            value={reason}
            aria-label="Motivo del cambio"
            onChange={(event) => setReason(event.target.value)}
          />
          {reason.trim() ? null : <p className="lab-hint">Necesitamos el motivo para poder estudiarlo después.</p>}
        </LabCard>
      ) : null}

      {confirming ? (
        <LabCard tone="accent" title="Vas a probar">
          <h3 className="lab-h4">Antes</h3>
          <p className="lab-muted">
            {kind === 'QUESTION_WEIGHT' && question?.weight === 1
              ? 'Esta pregunta cuenta igual que las demás.'
              : `Hoy: ${currentText || 'sin valor'}.`}
          </p>
          <h3 className="lab-h4">Prueba</h3>
          <p className="lab-lead">{summaryLine()}</p>
          <h3 className="lab-h4">Motivo</h3>
          <p className="lab-muted">{reason.trim()}</p>
          <p className="lab-hint">
            Los casos ayudan a encontrar problemas, no a ajustar la Matriz para que un caso entregue el
            resultado esperado.
          </p>
          <p className="lab-muted">
            Esto no modifica la Matriz original. Crea una versión en prueba y vuelve a usar las mismas
            respuestas para comparar.
          </p>
          <div className="lab-actions">
            <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setConfirming(false)}>
              Volver
            </button>
            <button type="button" className="lab-btn" disabled={pending} onClick={submit}>
              Probar este cambio
            </button>
          </div>
        </LabCard>
      ) : null}

      {options ? (
        <Tech>
          <p className="lab-muted">
            Definición base {options.definition_ref}. Las operaciones se construyen en el servidor a partir de
            la definición, así que la interfaz no envía valores anteriores.
          </p>
          {options.inert_interpretation_params.length ? (
            <>
              <p className="lab-hint">
                Parámetros guardados en la definición que el motor todavía no lee. No se pueden experimentar
                aquí. Este cambio necesita una nueva definición de contenido.
              </p>
              <pre className="lab-pre">
                {JSON.stringify(options.inert_interpretation_params, null, 2)}
              </pre>
            </>
          ) : null}
        </Tech>
      ) : null}
    </div>
  );
}

export function changeErrorNote(error: unknown) {
  return <ErrorNote error={humanError(error, 'No pudimos crear este cambio.')} />;
}
