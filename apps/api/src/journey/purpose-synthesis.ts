import { ambitsOf, IKIGAI_FIELDS, isIkigaiField, type IkigaiField } from '../instrumentos/ikigai-lists';

export const SYNTHESIS_VERSION = 'cruce-cualitativo@1';
export const SYNTHESIS_VERSION_V2 = 'cruce-cualitativo@2';

/**
 * Form fields are not the same labels as the four perspectives.
 * pasión se usa como interés o significado, vocación como facilidad o capacidad,
 * misión como contribución y profesión como sostenibilidad o pago.
 * La fuente también define vocación entre necesidad y pago. No se tratan como equivalentes.
 */
export const FIELD_STANCES = ['RECOGNIZE', 'DOUBT', 'UNKNOWN'] as const;
export type FieldStance = (typeof FIELD_STANCES)[number];
export type SynthesisVersion = typeof SYNTHESIS_VERSION | typeof SYNTHESIS_VERSION_V2;

export const VALUATIONS = ['RECOGNIZED', 'PARTIAL', 'NOT_RECOGNIZED', 'INSUFFICIENT'] as const;
export type Valuation = (typeof VALUATIONS)[number];

export const PURPOSE_STATUSES = ['UNWORKED', 'EXPLORANDO', 'PROVISIONAL', 'CONFIRMADO_POR_USUARIO'] as const;
export type PurposeStatus = (typeof PURPOSE_STATUSES)[number];

const OPEN_QUESTION: Record<IkigaiField, string> = {
  pasion: 'Qué actividad alimenta la pasión',
  vocacion: 'Qué actividad alimenta la vocación',
  mision: 'Qué actividad alimenta la misión',
  profesion: 'Qué actividad alimenta la profesión',
};

export type Activity = {
  sourceRef: string;
  field: IkigaiField;
  ambit: string;
  option: string;
  answer: string;
  fieldReview?: string | null;
  valuation?: Valuation | null;
};

export type CrossLink = {
  id: string;
  fromRef: string;
  toRef: string;
  combinationId: string;
  reason: string;
  status: 'ACTIVE' | 'NEEDS_REVIEW' | 'RETIRED';
};

export type Combination = {
  id: string;
  reason: string;
  valuation: Valuation | null;
  valuationReason: string;
  experiment: string;
  /** Per field. A global valuation is not copied here. */
  fieldStance?: Partial<Record<IkigaiField, FieldStance>>;
  unknownNote?: string;
  learningQuestion?: string;
  observed?: string;
};

export type PurposeChoice = {
  status: PurposeStatus;
  parts: Partial<Record<IkigaiField, string>>;
  generated: string;
  edited: string | null;
  open: string[];
};

export type SynthesisState = {
  version: SynthesisVersion;
  activities: Activity[];
  links: CrossLink[];
  combinations: Combination[];
  purpose: PurposeChoice;
};

export function emptyPurpose(): PurposeChoice {
  return { status: 'UNWORKED', parts: {}, generated: '', edited: null, open: IKIGAI_FIELDS.map((field) => OPEN_QUESTION[field]) };
}

export function emptySynthesis(): SynthesisState {
  return { version: SYNTHESIS_VERSION, activities: [], links: [], combinations: [], purpose: emptyPurpose() };
}

export function activityFromStored(input: {
  sourceRef: string;
  field: IkigaiField;
  freeText: string | null;
  exceptionKind: string | null;
}): Activity | null {
  if (input.exceptionKind) return null;
  const text = input.freeText?.trim() ?? '';
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as { answer?: unknown; activity?: unknown; ambit?: unknown; option?: unknown };
    const answer = typeof parsed.answer === 'string' ? parsed.answer.trim()
      : typeof parsed.activity === 'string' ? parsed.activity.trim() : '';
    if (!answer) return null;
    return {
      sourceRef: input.sourceRef,
      field: input.field,
      ambit: typeof parsed.ambit === 'string' ? parsed.ambit.trim() : '',
      option: typeof parsed.option === 'string' ? parsed.option.trim() : '',
      answer,
    };
  } catch {
    return { sourceRef: input.sourceRef, field: input.field, ambit: '', option: '', answer: text };
  }
}

export function validateActivityFields(activity: Activity): string | null {
  if (!activity.answer.trim()) return 'Falta la respuesta específica.';
  if (!activity.ambit && !activity.option) return null;
  const ambits = ambitsOf(activity.field);
  const ambit = ambits.find((item) => item.label === activity.ambit);
  if (!ambit) return 'Elige un ámbito de la lista de ese campo.';
  if (!ambit.options.includes(activity.option)) {
    return 'Revisa el desarrollo de idea: no corresponde a ese ámbito.';
  }
  return null;
}

export function composePurpose(answers: Partial<Record<IkigaiField, string>>): { generated: string; open: string[] } {
  const open = IKIGAI_FIELDS.filter((field) => !answers[field]?.trim()).map((field) => OPEN_QUESTION[field]);
  const pasion = answers.pasion?.trim() ?? '';
  const vocacion = answers.vocacion?.trim() ?? '';
  const mision = answers.mision?.trim() ?? '';
  const profesion = answers.profesion?.trim() ?? '';
  if (pasion && vocacion && mision && profesion) {
    return {
      generated: `Mi propósito es poner mi ${pasion} y mi talento en ${vocacion} al servicio de ${mision}, generando valor a través de ${profesion}.`,
      open: [],
    };
  }
  const known = [
    pasion ? `pasión: ${pasion}` : '',
    vocacion ? `vocación: ${vocacion}` : '',
    mision ? `misión: ${mision}` : '',
    profesion ? `profesión: ${profesion}` : '',
  ].filter(Boolean);
  if (known.length === 0) return { generated: '', open };
  return { generated: `Por ahora: ${known.join('. ')}.`, open };
}

export function visiblePurpose(purpose: PurposeChoice): string | null {
  const edited = purpose.edited?.trim() ?? '';
  if (edited) return edited;
  const generated = purpose.generated.trim();
  return generated || null;
}

function fingerprint(activity: Activity): string {
  return `${activity.ambit}\n${activity.option}\n${activity.answer}`;
}

function asActivity(value: unknown): Activity | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<Activity>;
  if (typeof row.sourceRef !== 'string' || !row.sourceRef.trim()) return null;
  if (typeof row.field !== 'string' || !isIkigaiField(row.field)) return null;
  if (typeof row.answer !== 'string' || !row.answer.trim()) return null;
  const valuation = VALUATIONS.includes(row.valuation as Valuation) ? row.valuation as Valuation : null;
  return {
    sourceRef: row.sourceRef,
    field: row.field,
    ambit: typeof row.ambit === 'string' ? row.ambit.trim() : '',
    option: typeof row.option === 'string' ? row.option.trim() : '',
    answer: row.answer.trim(),
    ...(valuation ? { valuation } : {}),
  };
}

function readPurpose(value: unknown, answers: Partial<Record<IkigaiField, string>>): PurposeChoice {
  const composed = composePurpose(answers);
  const row = value && typeof value === 'object' ? value as Partial<PurposeChoice> : {};
  const status = PURPOSE_STATUSES.includes(row.status as PurposeStatus) ? row.status as PurposeStatus : 'UNWORKED';
  const edited = typeof row.edited === 'string' ? row.edited : null;
  return { status, parts: {}, generated: composed.generated, edited, open: composed.open };
}

/**
 * Accepts the working copy the person saved.
 * Links are never inferred from row number or similar words.
 * A changed activity keeps old links and marks the current ones for review.
 * A free edit of the purpose sentence is not replaced by the generated line.
 */
export function reconcileSynthesis(
  previous: SynthesisState,
  incoming: unknown,
  known: Activity[],
): { ok: true; state: SynthesisState } | { ok: false; message: string } {
  if (!incoming || typeof incoming !== 'object') return { ok: false, message: 'El cruce no tiene una forma válida.' };
  const body = incoming as Partial<SynthesisState>;
  const knownByRef = new Map(known.map((activity) => [activity.sourceRef, activity]));
  const activities: Activity[] = [];
  for (const item of Array.isArray(body.activities) ? body.activities : []) {
    const activity = asActivity(item);
    if (!activity || !knownByRef.has(activity.sourceRef)) {
      return { ok: false, message: 'Hay una actividad que no salió del cuestionario.' };
    }
    const base = knownByRef.get(activity.sourceRef) as Activity;
    const next = { ...activity, field: base.field, sourceRef: base.sourceRef };
    const problem = validateActivityFields(next);
    if (problem) return { ok: false, message: problem };
    activities.push(next);
  }
  for (const base of known) {
    if (!activities.some((activity) => activity.sourceRef === base.sourceRef)) activities.push(base);
  }

  const byRef = new Map(activities.map((activity) => [activity.sourceRef, activity]));
  const previousByRef = new Map(previous.activities.map((activity) => [activity.sourceRef, activity]));
  const changed = new Set(activities.filter((activity) => {
    const prior = previousByRef.get(activity.sourceRef);
    return prior ? fingerprint(prior) !== fingerprint(activity) : false;
  }).map((activity) => activity.sourceRef));

  const combinationIds = new Set<string>();
  const combinations: Combination[] = [];
  for (const item of Array.isArray(body.combinations) ? body.combinations : []) {
    if (!item || typeof item !== 'object') return { ok: false, message: 'Hay una combinación ilegible.' };
    const row = item as Partial<Combination>;
    if (typeof row.id !== 'string' || !row.id.trim()) return { ok: false, message: 'Falta el identificador de una combinación.' };
    if (combinationIds.has(row.id)) return { ok: false, message: 'Hay una combinación repetida.' };
    const valuation = row.valuation == null ? null : row.valuation;
    if (valuation != null && !VALUATIONS.includes(valuation)) {
      return { ok: false, message: 'La valoración no está en la escala cualitativa.' };
    }
    combinationIds.add(row.id);
    const fieldStance: Partial<Record<IkigaiField, FieldStance>> = {};
    if (row.fieldStance && typeof row.fieldStance === 'object') {
      for (const field of IKIGAI_FIELDS) {
        const stance = row.fieldStance[field];
        if (stance == null) continue;
        if (!FIELD_STANCES.includes(stance)) return { ok: false, message: 'El reconocimiento de un campo no es válido.' };
        fieldStance[field] = stance;
      }
    }
    const combination: Combination = {
      id: row.id,
      reason: typeof row.reason === 'string' ? row.reason.trim() : '',
      valuation,
      valuationReason: typeof row.valuationReason === 'string' ? row.valuationReason.trim() : '',
      experiment: typeof row.experiment === 'string' ? row.experiment.trim() : '',
    };
    if (Object.keys(fieldStance).length) combination.fieldStance = fieldStance;
    if (typeof row.unknownNote === 'string' && row.unknownNote.trim()) combination.unknownNote = row.unknownNote.trim();
    if (typeof row.learningQuestion === 'string' && row.learningQuestion.trim()) combination.learningQuestion = row.learningQuestion.trim();
    if (typeof row.observed === 'string' && row.observed.trim()) combination.observed = row.observed.trim();
    combinations.push(combination);
  }

  const links: CrossLink[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(body.links) ? body.links : []) {
    if (!item || typeof item !== 'object') return { ok: false, message: 'Hay una conexión ilegible.' };
    const row = item as Partial<CrossLink>;
    if (typeof row.id !== 'string' || !row.id.trim() || seen.has(row.id)) {
      return { ok: false, message: 'Falta el identificador de una conexión.' };
    }
    if (typeof row.fromRef !== 'string' || typeof row.toRef !== 'string') {
      return { ok: false, message: 'Una conexión no indica su origen y su destino.' };
    }
    const from = byRef.get(row.fromRef);
    const to = byRef.get(row.toRef);
    if (!from || !to) return { ok: false, message: 'Una conexión apunta a una actividad que no está.' };
    if (from.field === to.field) return { ok: false, message: 'Conecta elementos de columnas distintas.' };
    if (typeof row.combinationId !== 'string' || !combinationIds.has(row.combinationId)) {
      return { ok: false, message: 'La conexión no pertenece a una combinación.' };
    }
    seen.add(row.id);
    const touched = changed.has(from.sourceRef) || changed.has(to.sourceRef);
    const requested = row.status === 'RETIRED' || row.status === 'NEEDS_REVIEW' || row.status === 'ACTIVE' ? row.status : 'ACTIVE';
    const status = requested === 'RETIRED' ? 'RETIRED' : touched ? 'NEEDS_REVIEW' : requested;
    links.push({
      id: row.id,
      fromRef: from.sourceRef,
      toRef: to.sourceRef,
      combinationId: row.combinationId,
      reason: typeof row.reason === 'string' ? row.reason.trim() : '',
      status,
    });
  }

  const rawParts = body.purpose && typeof body.purpose === 'object'
    ? (body.purpose as PurposeChoice).parts ?? {}
    : {};
  const answers: Partial<Record<IkigaiField, string>> = {};
  const parts: Partial<Record<IkigaiField, string>> = {};
  for (const field of IKIGAI_FIELDS) {
    const sourceRef = rawParts[field];
    if (!sourceRef) continue;
    const activity = byRef.get(sourceRef);
    if (!activity) return { ok: false, message: 'Una parte del propósito no tiene actividad.' };
    parts[field] = activity.sourceRef;
    answers[field] = activity.answer;
  }
  const purpose = readPurpose(body.purpose, answers);
  purpose.parts = parts;
  const version: SynthesisVersion = combinations.some((item) => item.fieldStance || item.learningQuestion || item.observed)
    ? SYNTHESIS_VERSION_V2
    : SYNTHESIS_VERSION;
  return { ok: true, state: { version, activities, links, combinations, purpose } };
}

export function readSynthesis(content: unknown): SynthesisState {
  if (!content || typeof content !== 'object') return emptySynthesis();
  const saved = (content as { synthesis?: unknown }).synthesis;
  if (!saved || typeof saved !== 'object') return emptySynthesis();
  const row = saved as Partial<SynthesisState>;
  const version: SynthesisVersion = row.version === SYNTHESIS_VERSION_V2 ? SYNTHESIS_VERSION_V2 : SYNTHESIS_VERSION;
  return {
    version,
    activities: Array.isArray(row.activities) ? row.activities.flatMap((item) => {
      const activity = asActivity(item);
      return activity ? [activity] : [];
    }) : [],
    links: Array.isArray(row.links) ? row.links as CrossLink[] : [],
    combinations: Array.isArray(row.combinations) ? row.combinations as Combination[] : [],
    purpose: row.purpose && typeof row.purpose === 'object' ? { ...emptyPurpose(), ...row.purpose } : emptyPurpose(),
  };
}
