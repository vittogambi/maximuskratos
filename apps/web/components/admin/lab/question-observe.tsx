'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppIcon } from '@/components/app-icon';
import { labApi, type LabQuestion } from '@/lib/lab-api';
import { flaggedQuestionHref } from '@/lib/lab-ui/format';
import {
  FIDELITY_REVIEW_OPTIONS,
  labUiLabels,
} from '@/lib/lab-ui/labels';

const DOMAINS = [
  { value: 'MENTALIDAD', label: 'Mentalidad' },
  { value: 'RELACIONES', label: 'Relaciones' },
  { value: 'FINANZAS', label: 'Finanzas' },
  { value: 'CUERPO', label: 'Cuerpo' },
];

const YES_NO_UNSURE = [
  { value: 'YES', label: 'Sí' },
  { value: 'NO', label: 'No' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

const WORDING_PROBLEMS = [
  { value: 'WORDING_UNCLEAR', label: 'No se entiende bien' },
  { value: 'WORDING_AMBIGUOUS', label: 'Puede entenderse de más de una forma' },
  { value: 'WORDING_DOUBLE', label: 'Pregunta dos cosas' },
  { value: 'WORDING_UNNATURAL', label: 'La escribiría de otra manera' },
  { value: 'WORDING_OTHER', label: 'Otro' },
];

const SCALE_PROBLEMS = [
  { value: 'SCALE_MISSING_OPTIONS', label: 'Faltan opciones' },
  { value: 'SCALE_MISMATCH', label: 'La escala no corresponde' },
  { value: 'SCALE_BAD_ANCHORS', label: 'Las opciones son poco claras' },
  { value: 'SCALE_NOT_REALITY', label: 'Una respuesta real podría no caber aquí' },
  { value: 'SCALE_OTHER', label: 'Otro' },
];

const PLACE_PROBLEMS = [
  { value: 'DOMAIN', label: 'Cambiaría de ámbito' },
  { value: 'DIMENSION', label: 'Cambiaría de dimensión' },
];

const INFLUENCE_OPTIONS = [
  { value: 'OK', label: 'Sí' },
  { value: 'WEIGHT_MORE', label: 'Pesa demasiado' },
  { value: 'WEIGHT_LESS', label: 'Pesa muy poco' },
  { value: 'SCORE_NONE', label: 'No debería puntuar' },
  { value: 'SCORE_INVERSE', label: 'Debería puntuar al revés' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export type ObservationPreset = { kind: string; target_id: string; value: string };

type Choice = { value: string; label: string };

function ChoiceSeg({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: Choice[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="lab-seg" role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? 'lab-chip is-active' : 'lab-chip'}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ObserveRow({
  question,
  children,
  extra,
}: {
  question: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="lab-obs-row">
      <p className="lab-obs-row__q">{question}</p>
      <div className="lab-obs-row__choices">{children}</div>
      {extra ? <div className="lab-obs-row__more">{extra}</div> : null}
    </div>
  );
}

export function ObserveButton({
  runId,
  question,
  onSaved,
  revealed = true,
  score,
  dimensions = [],
  onTryChange,
  defaultOpen = false,
  openTick = 0,
}: {
  runId: string;
  question: LabQuestion;
  onSaved?: () => void;
  revealed?: boolean;
  score?: number | null;
  dimensions?: Array<{ key: string; label: string; domain: string }>;
  onTryChange?: (preset: ObservationPreset) => void;
  defaultOpen?: boolean;
  openTick?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [saved, setSaved] = useState<{
    content: boolean;
    engine: boolean;
    operation: { kind: string; target_id: string; value: string } | null;
  } | null>(question.flagged_here ? { content: true, engine: false, operation: null } : null);
  const [wordingOk, setWordingOk] = useState('');
  const [wording, setWording] = useState('');
  const [scaleOk, setScaleOk] = useState('');
  const [scale, setScale] = useState('');
  const [placeOk, setPlaceOk] = useState('');
  const [placeProblem, setPlaceProblem] = useState('');
  const [domainOther, setDomainOther] = useState('');
  const [dimensionOther, setDimensionOther] = useState('');
  const [influence, setInfluence] = useState('');
  const [safety, setSafety] = useState('');
  const [note, setNote] = useState('');
  const [proposed, setProposed] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [others, setOthers] = useState(false);
  const [fidelity, setFidelity] = useState('');
  const mapping = question.source_mapping ?? null;
  const showFidelity =
    Boolean(mapping) &&
    mapping?.transformation_type !== 'NEW_IN_V2' &&
    mapping?.transformation_type !== 'UNCLEAR';

  useEffect(() => {
    if (defaultOpen || openTick > 0) setOpen(true);
  }, [defaultOpen, openTick]);
  const otherNotes = question.other_notes ?? [];
  const dimOptions = useMemo(
    () =>
      dimensions
        .filter((item) => !domainOther || item.domain === domainOther)
        .map((item) => ({ value: item.key, label: item.label })),
    [dimensions, domainOther],
  );

  const aspects = {
    wording: wordingOk === 'YES' ? 'WORDING_OK' : wordingOk === 'NO' ? wording || null : null,
    scale: scaleOk === 'YES' ? 'SCALE_OK' : scaleOk === 'NO' ? scale || null : null,
    score:
      influence === 'OK'
        ? 'SCORE_OK'
        : influence === 'SCORE_NONE'
          ? 'SCORE_NONE'
          : influence === 'SCORE_INVERSE'
            ? 'SCORE_INVERSE'
            : influence === 'UNSURE'
              ? 'SCORE_UNSURE'
              : null,
    domain:
      placeOk === 'YES' ? 'DOMAIN_OK' : placeProblem === 'DOMAIN' ? 'DOMAIN_OTHER' : null,
    domain_other: placeProblem === 'DOMAIN' ? domainOther || null : null,
    dimension:
      placeOk === 'YES' ? 'DIMENSION_OK' : placeProblem === 'DIMENSION' ? 'DIMENSION_OTHER' : null,
    dimension_other: placeProblem === 'DIMENSION' ? dimensionOther || null : null,
    weight:
      influence === 'OK'
        ? 'WEIGHT_OK'
        : influence === 'WEIGHT_MORE'
          ? 'WEIGHT_MORE'
          : influence === 'WEIGHT_LESS'
            ? 'WEIGHT_LESS'
            : influence === 'SCORE_NONE'
              ? 'WEIGHT_EXCLUDE'
              : null,
    safety:
      question.is_risk
        ? safety === 'YES'
          ? 'SAFETY_OK'
          : safety === 'NO'
            ? 'SAFETY_FALSE_POSITIVE'
            : safety === 'UNSURE'
              ? 'SAFETY_UNSURE'
              : null
        : null,
  };
  const canSave = Boolean(wordingOk || scaleOk || placeOk || influence || safety || note.trim() || fidelity);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <span className="lab-qc__observe">
        <button
          type="button"
          className={question.flagged_here || saved ? 'lab-qc__mark is-on' : 'lab-qc__mark'}
          aria-label={question.flagged_here || saved ? 'Revisada' : 'Revisar pregunta'}
          title={question.flagged_here || saved ? 'Ya revisaste esta pregunta.' : 'Revisar pregunta'}
          onClick={() => setOpen(true)}
        >
          <AppIcon name="flag" size={14} />
          {question.flagged_here || saved ? 'Revisada' : 'Revisar pregunta'}
        </button>
        {revealed && question.other_observations ? (
          <button type="button" className="lab-qc__mark" onClick={() => setOthers(true)}>
            {question.other_observations} en otros casos
          </button>
        ) : null}
      </span>
      {open ? (
        <div className="lab-sheet" role="dialog" aria-labelledby="lab-sheet-title">
          <div className="lab-sheet__scrim" onClick={close} />
          <div className="lab-sheet__panel">
            <header className="lab-sheet__head">
              <h2 id="lab-sheet-title" className="lab-sheet__title">
                Revisar pregunta
              </h2>
              <p className="lab-sheet__q">{question.text}</p>
            </header>

            {saved ? (
              <div className="lab-sheet__body">
                <div className="lab-stack lab-stack--tight">
                  <p className="lab-lead">Registrado</p>
                  {saved.engine && saved.operation && onTryChange ? (
                    <button
                      type="button"
                      className="lab-btn lab-btn--ghost"
                      onClick={() => {
                        onTryChange(saved.operation!);
                        close();
                      }}
                    >
                      Probar un cambio
                    </button>
                  ) : null}
                  <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setSaved(null)}>
                    Seguir editando
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="lab-sheet__body">
                  <ObserveRow
                    question="¿La pregunta está bien planteada?"
                    extra={
                      wordingOk === 'NO' ? (
                        <ChoiceSeg name="obs-wording" value={wording} options={WORDING_PROBLEMS} onChange={setWording} />
                      ) : null
                    }
                  >
                    <ChoiceSeg name="obs-wording-ok" value={wordingOk} options={YES_NO_UNSURE} onChange={setWordingOk} />
                  </ObserveRow>
                  <ObserveRow
                    question="¿Las opciones de respuesta funcionan?"
                    extra={
                      scaleOk === 'NO' ? (
                        <ChoiceSeg name="obs-scale" value={scale} options={SCALE_PROBLEMS} onChange={setScale} />
                      ) : null
                    }
                  >
                    <ChoiceSeg name="obs-scale-ok" value={scaleOk} options={YES_NO_UNSURE} onChange={setScaleOk} />
                  </ObserveRow>
                  <ObserveRow
                    question="¿Está bien ubicada?"
                    extra={
                      placeOk === 'NO' ? (
                        <>
                          <ChoiceSeg
                            name="obs-place"
                            value={placeProblem}
                            options={PLACE_PROBLEMS}
                            onChange={setPlaceProblem}
                          />
                          {placeProblem === 'DOMAIN' ? (
                            <select
                              className="lab-select"
                              value={domainOther}
                              onChange={(event) => setDomainOther(event.target.value)}
                            >
                              <option value="">Ámbito</option>
                              {DOMAINS.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          ) : null}
                          {placeProblem === 'DIMENSION' ? (
                            <select
                              className="lab-select"
                              value={dimensionOther}
                              onChange={(event) => setDimensionOther(event.target.value)}
                            >
                              <option value="">Dimensión</option>
                              {dimOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </>
                      ) : null
                    }
                  >
                    <ChoiceSeg name="obs-place-ok" value={placeOk} options={YES_NO_UNSURE} onChange={setPlaceOk} />
                  </ObserveRow>
                  <ObserveRow question="¿Influye en el resultado como debería?">
                    <ChoiceSeg name="obs-influence" value={influence} options={INFLUENCE_OPTIONS} onChange={setInfluence} />
                  </ObserveRow>
                  {question.is_risk ? (
                    <ObserveRow question="¿La forma en que esta pregunta participa en las alertas te hace sentido?">
                      <ChoiceSeg name="obs-safety" value={safety} options={YES_NO_UNSURE} onChange={setSafety} />
                    </ObserveRow>
                  ) : null}
                  {showFidelity ? (
                    <ObserveRow question="¿Se conservó la intención original?">
                      <ChoiceSeg
                        name="obs-fidelity"
                        value={fidelity}
                        options={FIDELITY_REVIEW_OPTIONS}
                        onChange={setFidelity}
                      />
                    </ObserveRow>
                  ) : null}
                  <label className="lab-field lab-obs-notes">
                    <span className="lab-label">Nota</span>
                    <textarea
                      className="lab-textarea"
                      value={note}
                      placeholder="Opcional."
                      onChange={(event) => setNote(event.target.value)}
                    />
                  </label>
                  <label className="lab-field lab-obs-notes">
                    <span className="lab-label">Propuesta concreta</span>
                    <textarea
                      className="lab-textarea"
                      value={proposed}
                      placeholder="Redacción o cambio concreto, si lo tienes."
                      onChange={(event) => setProposed(event.target.value)}
                    />
                  </label>
                  {error ? <p className="lab-error">{error}</p> : null}
                </div>
                <div className="lab-sheet__foot">
                  <button type="button" className="lab-btn lab-btn--ghost" onClick={close}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="lab-btn"
                    disabled={busy || !canSave}
                    onClick={() => {
                      setBusy(true);
                      setError(null);
                      labApi
                        .createObservation(runId, {
                          question_id: question.id,
                          aspects,
                          note: note.trim() || undefined,
                          proposed_wording: proposed.trim() || null,
                          fidelity: fidelity
                            ? {
                                verdict: fidelity,
                                change_targets: [],
                                intended_measure:
                                  fidelity === 'FIDELITY_YES'
                                    ? null
                                    : proposed.trim() || note.trim() || 'Registrado en la revisión de la pregunta.',
                              }
                            : undefined,
                        })
                        .then((row) => {
                          const operation = row.suggested_operation;
                          const preset =
                            operation?.op === 'SET_QUESTION_WEIGHT'
                              ? {
                                  diagnosis: 'QUESTION',
                                  questionFault: 'WEIGHT',
                                  kind: 'QUESTION_WEIGHT',
                                  target_id: question.id,
                                  value: String(operation.to),
                                }
                              : operation?.op === 'SET_QUESTION_ACTIVE'
                                ? {
                                    diagnosis: 'QUESTION',
                                    questionFault: 'REDUNDANT',
                                    kind: 'QUESTION_ACTIVE',
                                    target_id: question.id,
                                    value: 'false',
                                  }
                                : operation?.op === 'SET_DIMENSION_ALIAS'
                                  ? {
                                      diagnosis: 'DIMENSION',
                                      kind: 'DIMENSION_ALIAS',
                                      target_id: String((operation as { label?: string }).label ?? ''),
                                      value: String(operation.to),
                                    }
                                  : null;
                          setSaved({
                            content:
                              Boolean(aspects.wording && aspects.wording !== 'WORDING_OK') ||
                              Boolean(aspects.scale && aspects.scale !== 'SCALE_OK'),
                            engine: row.kind === 'ENGINE',
                            operation: preset,
                          });
                          onSaved?.();
                        })
                        .catch(() => setError('No pudimos guardar la revisión.'))
                        .finally(() => setBusy(false));
                    }}
                  >
                    Guardar revisión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      {others ? (
        <div className="lab-sheet" role="dialog" aria-label="Observaciones en otros casos">
          <div className="lab-sheet__scrim" onClick={() => setOthers(false)} />
          <div className="lab-sheet__panel">
            <header className="lab-sheet__head">
              <h2 className="lab-sheet__title">Observaciones en otros casos</h2>
            </header>
            <div className="lab-sheet__body">
              {otherNotes.length === 0 ? (
                <p className="lab-muted">
                  Esta pregunta está marcada en {question.other_observations}{' '}
                  {question.other_observations === 1 ? 'caso más' : 'casos más'}.
                </p>
              ) : (
                otherNotes.map((item) => (
                  <p key={item.id} className="lab-muted">
                    {item.case_label ? `${item.case_label}. ` : ''}
                    {item.issue_types.map((code) => labUiLabels.issueType(code)).join(', ')}. {item.note}
                  </p>
                ))
              )}
            </div>
            <div className="lab-sheet__foot">
              <a className="lab-btn lab-btn--ghost" href={flaggedQuestionHref(question.id, runId)}>
                Ver pregunta
              </a>
              <button type="button" className="lab-btn" onClick={() => setOthers(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
