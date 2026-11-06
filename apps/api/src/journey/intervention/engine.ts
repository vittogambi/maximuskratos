import { catalogRevision } from '../../instrumentos/core-definition';
import type { LedgerEntry } from '../../instrumentos/answer-ledger';

/** Shared beta rules. Not the approved MK method and not reviewed by Rafa. */
export type TerritoryId = 'MENTALIDAD' | 'FINANZAS' | 'RELACIONES' | 'SALUD_FISICA';
export type Instrument = 'E-AUD-001' | 'E-PER-000' | 'F-RAD-001' | 'F-RAD-002' | 'F-RAD-003';

export type SourceId = {
  instrument: Instrument;
  row: number;
  sourceRef: string;
  catalogVersion: string | null;
  revision: number;
};

export type ScaleBand = 'CANDIDATE' | 'MIDDLE' | 'RESOURCE';
export type DifficultyLevel = 'YES' | 'PARTIAL' | 'NO';
export type Recognition = 'REPRESENTS' | 'PARTIAL' | 'NOT';

export type ScaleSpec = { instrument: Instrument; row: number; question: string; labelsRepairedIn?: number };
export type DifficultySpec = { instrument: Instrument; row: number; statement: string };
export type ChoiceSpec = { instrument: Instrument; row: number; statement: string; candidateValues: string[] };
export type VisionSpec = { instrument: Instrument; row: number };

export type ScaleReading = { kind: 'SCALE'; key: string; question: string; value: number; band: ScaleBand; source: SourceId };
export type DifficultyReading = { kind: 'DIFFICULTY'; key: string; statement: string; level: DifficultyLevel; source: SourceId };
export type ChoiceReading = { kind: 'CHOICE'; key: string; statement: string; value: string; candidate: boolean; source: SourceId };
export type Ineligible = { key: string; source: SourceId; reason: 'GENERIC_LABELS' | 'EXCEPTION' | 'NO_VALUE' };

export type SourceRead = {
  scales: Record<string, ScaleReading>;
  difficulties: Record<string, DifficultyReading>;
  choices: Record<string, ChoiceReading>;
  vision: { text: string; source: SourceId } | null;
  ineligible: Ineligible[];
};

export type ReadingDef = {
  id: string;
  group: string;
  goal: string;
  scales: string[];
  difficulties: string[];
  interpretation: string;
  question: string;
  asksFocus?: string;
  plans: string[];
  requiresVision?: boolean;
};

export type ReadingStatus = 'CANDIDATE' | 'TO_CONFIRM';

export type ReadingView = {
  id: string;
  group: string;
  goal: string;
  status: ReadingStatus;
  declared: string[];
  interpretation: string;
  question: string;
  asksFocus: string | null;
  vision: string | null;
  sources: SourceId[];
  signature: string;
  recognition: Recognition | null;
  plans: string[];
};

export type StoredRecognition = { readingId: string; outcome: Recognition; signature: string };

export type IndicatorKind = 'COUNT' | 'SCALE_1_5' | 'YES_NO' | 'CHOICE' | 'TEXT';

export type Indicator = {
  ref: string;
  role: 'RESULT' | 'PERCEPTION';
  question: string;
  kind: IndicatorKind;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  better: 'UP' | 'DOWN' | 'NONE';
  notApplicable?: string;
};

export type Template = {
  id: string;
  version: string;
  group: string;
  goal: string;
  title: string;
  seeks: string;
  action: string;
  schedule: { kind: 'WEEKLY'; occasionsPerWeek: number; minutesPerOccasion: number } | { kind: 'TRIGGER'; trigger: string; minutesPerOccasion: number };
  minimum: { text: string; occasionsPerWeek: number | null; minutesPerOccasion: number; indicators?: Indicator[] };
  doneWhen: string;
  indicators: Indicator[];
  horizonWeeks: number;
  focusPrompt?: string;
  stagePrompt?: string;
  notes: string[];
  contentTags?: string[];
};

export type Modifiers = {
  suggestMinimum: { because: string; sources: SourceId[] } | null;
  environmentAlternative: { text: string; source: SourceId } | null;
};

export type Pack = {
  territory: TerritoryId;
  version: string;
  scope: string;
  scales: Record<string, ScaleSpec>;
  difficulties: Record<string, DifficultySpec>;
  choices: Record<string, ChoiceSpec>;
  vision: VisionSpec | null;
  readings: ReadingDef[];
  goals: { id: string; label: string }[];
  templates: Template[];
  modifiers: (read: SourceRead) => Modifiers;
};

export const EMPTY_MODIFIERS: Modifiers = { suggestMinimum: null, environmentAlternative: null };

export function band(value: number): ScaleBand {
  if (value <= 2) return 'CANDIDATE';
  if (value === 3) return 'MIDDLE';
  return 'RESOURCE';
}

function refOf(instrument: Instrument, row: number): string {
  return `formulario-v1:${instrument}!R${row}`;
}

function sourceOf(entry: LedgerEntry, instrument: Instrument, row: number): SourceId {
  return { instrument, row, sourceRef: entry.sourceRef, catalogVersion: entry.catalogVersion, revision: entry.revision };
}

export function readSources(pack: Pack, ledger: LedgerEntry[]): SourceRead {
  const byRef = new Map(ledger.map((entry) => [entry.sourceRef, entry]));
  const out: SourceRead = { scales: {}, difficulties: {}, choices: {}, vision: null, ineligible: [] };
  for (const [key, spec] of Object.entries(pack.scales)) {
    const entry = byRef.get(refOf(spec.instrument, spec.row));
    if (!entry) continue;
    const source = sourceOf(entry, spec.instrument, spec.row);
    if (entry.exceptionKind) {
      out.ineligible.push({ key, source, reason: 'EXCEPTION' });
      continue;
    }
    if (spec.labelsRepairedIn && catalogRevision(entry.catalogVersion) < spec.labelsRepairedIn) {
      out.ineligible.push({ key, source, reason: 'GENERIC_LABELS' });
      continue;
    }
    const value = Number.parseInt(entry.value ?? '', 10);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      out.ineligible.push({ key, source, reason: 'NO_VALUE' });
      continue;
    }
    out.scales[key] = { kind: 'SCALE', key, question: spec.question, value, band: band(value), source };
  }
  for (const [key, spec] of Object.entries(pack.difficulties)) {
    const entry = byRef.get(refOf(spec.instrument, spec.row));
    if (!entry) continue;
    const source = sourceOf(entry, spec.instrument, spec.row);
    if (entry.exceptionKind) {
      out.ineligible.push({ key, source, reason: 'EXCEPTION' });
      continue;
    }
    const level: DifficultyLevel | null = entry.value === '2' ? 'YES' : entry.value === '1' ? 'PARTIAL' : entry.value === '0' ? 'NO' : null;
    if (!level) {
      out.ineligible.push({ key, source, reason: 'NO_VALUE' });
      continue;
    }
    out.difficulties[key] = { kind: 'DIFFICULTY', key, statement: spec.statement, level, source };
  }
  for (const [key, spec] of Object.entries(pack.choices)) {
    const entry = byRef.get(refOf(spec.instrument, spec.row));
    if (!entry) continue;
    const source = sourceOf(entry, spec.instrument, spec.row);
    if (entry.exceptionKind) {
      out.ineligible.push({ key, source, reason: 'EXCEPTION' });
      continue;
    }
    const value = entry.value?.trim() ?? '';
    if (!value) {
      out.ineligible.push({ key, source, reason: 'NO_VALUE' });
      continue;
    }
    out.choices[key] = { kind: 'CHOICE', key, statement: spec.statement, value, candidate: spec.candidateValues.includes(value), source };
  }
  if (pack.vision) {
    const vision = byRef.get(refOf(pack.vision.instrument, pack.vision.row));
    if (vision && !vision.exceptionKind && vision.value?.trim()) {
      out.vision = { text: vision.value.trim(), source: sourceOf(vision, pack.vision.instrument, pack.vision.row) };
    }
  }
  return out;
}

export function hasAnswers(read: SourceRead): boolean {
  return Object.keys(read.scales).length + Object.keys(read.difficulties).length + Object.keys(read.choices).length > 0 || Boolean(read.vision);
}

function signatureOf(sources: SourceId[]): string {
  return sources
    .map((source) => `${source.sourceRef}@${source.catalogVersion ?? 'sin-version'}#${source.revision}`)
    .sort()
    .join('|');
}

function declaredScale(reading: ScaleReading): string {
  return `En «${reading.question}» marcaste ${reading.value} de 5.`;
}

function declaredDifficulty(reading: DifficultyReading): string {
  return `A «${reading.statement}» respondiste «${reading.level === 'YES' ? 'Sí' : 'Más o menos'}».`;
}

/**
 * Candidate readings with their literal sources. A reading built only from «Más o menos»
 * asks whether it happens now. Recognition lapses when any source revision changes.
 */
export function buildReadings(pack: Pack, read: SourceRead, stored: StoredRecognition[]): ReadingView[] {
  const latest = new Map<string, StoredRecognition>();
  for (const row of stored) latest.set(row.readingId, row);
  const out: ReadingView[] = [];
  for (const def of pack.readings) {
    const scales = def.scales.map((key) => read.scales[key]).filter((row): row is ScaleReading => Boolean(row) && row.band === 'CANDIDATE');
    const yes = def.difficulties.map((key) => read.difficulties[key]).filter((row): row is DifficultyReading => row?.level === 'YES');
    const partial = def.difficulties.map((key) => read.difficulties[key]).filter((row): row is DifficultyReading => row?.level === 'PARTIAL');
    if (def.requiresVision && (!scales.length || !read.vision)) continue;
    if (!scales.length && !yes.length && !partial.length) continue;
    const status: ReadingStatus = scales.length || yes.length ? 'CANDIDATE' : 'TO_CONFIRM';
    const used = [...scales, ...yes, ...(status === 'TO_CONFIRM' ? partial : [])];
    const sources = used.map((row) => row.source);
    if (def.requiresVision && read.vision) sources.push(read.vision.source);
    const signature = signatureOf(sources);
    const prior = latest.get(def.id);
    out.push({
      id: def.id,
      group: def.group,
      goal: def.goal,
      status,
      declared: used.map((row) => (row.kind === 'SCALE' ? declaredScale(row) : declaredDifficulty(row))),
      interpretation: def.interpretation,
      question: status === 'TO_CONFIRM' ? '¿Esto ocurre actualmente?' : def.question,
      asksFocus: def.asksFocus ?? null,
      vision: def.requiresVision ? read.vision?.text ?? null : null,
      sources,
      signature,
      recognition: prior && prior.signature === signature ? prior.outcome : null,
      plans: def.plans,
    });
  }
  return out;
}

/** With a declared goal, up to two pertinent readings. Without one, every candidate and no priority. */
export function readingsForGoal(readings: ReadingView[], goal: string | null): { readings: ReadingView[]; prioritized: boolean } {
  const visible = readings.filter((row) => row.recognition !== 'NOT');
  if (!goal) return { readings: visible, prioritized: false };
  return { readings: visible.filter((row) => row.goal === goal).slice(0, 2), prioritized: true };
}

export function isOriented(reading: ReadingView): boolean {
  return reading.recognition === 'REPRESENTS' || reading.recognition === 'PARTIAL';
}

export function templateById(templates: Template[], id: string | null | undefined): Template | null {
  return templates.find((row) => row.id === id) ?? null;
}

export function activeIndicators(template: Template, minimum: boolean): Indicator[] {
  return minimum && template.minimum.indicators ? template.minimum.indicators : template.indicators;
}

export type Execution = 'SUFFICIENT' | 'PARTIAL' | 'LOW' | 'NONE' | 'NOT_APPLICABLE';
export type Progress = 'ADVANCE' | 'MAINTAINED' | 'NO_ADVANCE' | 'UNKNOWN';

export type TextOutcome = 'ACHIEVED' | 'NOT_ACHIEVED' | 'UNKNOWN';

export function executionFrom(counts: { done: number; notDone: number; noInformation: number }, trigger: boolean): Execution {
  if (trigger) return 'NOT_APPLICABLE';
  const resolved = counts.done + counts.notDone;
  if (resolved === 0) return 'NONE';
  const ratio = counts.done / resolved;
  if (ratio >= 0.75) return 'SUFFICIENT';
  if (ratio >= 0.4) return 'PARTIAL';
  return 'LOW';
}

export type Measure = { value: number | null; text: string | null; notApplicable: boolean };

export function textOutcomeOf(measure: Measure): TextOutcome | null {
  if (measure.notApplicable) return null;
  if (measure.value === 1) return 'ACHIEVED';
  if (measure.value === 0) return 'NOT_ACHIEVED';
  if (measure.text?.trim()) return 'UNKNOWN';
  return null;
}

function measureMeetsSuccess(indicator: Indicator, measure: Measure): boolean {
  if (measure.notApplicable) return false;
  if (indicator.kind === 'YES_NO') return measure.value === 1;
  if (indicator.kind === 'TEXT') return measure.value === 1;
  if (indicator.kind === 'CHOICE') return measure.text === 'RESUELTA';
  if (measure.value == null) return false;
  if (indicator.better === 'UP' && indicator.max != null) return measure.value >= indicator.max;
  if (indicator.better === 'DOWN' && indicator.min != null) return measure.value <= indicator.min;
  return false;
}

/** The first measure is the baseline of that indicator. It is never compared with the diagnostic answer. */
export function progressFrom(indicator: Indicator, series: Measure[]): Progress {
  const usable = series.filter((row) => !row.notApplicable);
  const latest = usable[usable.length - 1];
  if (!latest) return 'UNKNOWN';
  if (indicator.kind === 'TEXT') {
    if (latest.value === 1) return usable.length < 2 ? 'UNKNOWN' : measureMeetsSuccess(indicator, usable[0]!) ? 'MAINTAINED' : 'ADVANCE';
    if (latest.value === 0) return 'NO_ADVANCE';
    return 'UNKNOWN';
  }
  if (indicator.kind === 'YES_NO') {
    if (latest.value === 1) {
      if (usable.length < 2) return 'UNKNOWN';
      return measureMeetsSuccess(indicator, usable[0]!) ? 'MAINTAINED' : 'ADVANCE';
    }
    return latest.value === 0 ? 'NO_ADVANCE' : 'UNKNOWN';
  }
  if (indicator.kind === 'CHOICE') {
    if (latest.text === 'RESUELTA') {
      if (usable.length < 2) return 'UNKNOWN';
      return measureMeetsSuccess(indicator, usable[0]!) ? 'MAINTAINED' : 'ADVANCE';
    }
    return 'UNKNOWN';
  }
  const baseline = usable[0];
  if (usable.length < 2 || baseline.value == null || latest.value == null) return 'UNKNOWN';
  if (measureMeetsSuccess(indicator, latest) && measureMeetsSuccess(indicator, baseline)) return 'MAINTAINED';
  if (indicator.better === 'UP') return latest.value > baseline.value ? 'ADVANCE' : 'NO_ADVANCE';
  if (indicator.better === 'DOWN') return latest.value < baseline.value ? 'ADVANCE' : 'NO_ADVANCE';
  return 'UNKNOWN';
}

export type ReviewCode = 'COMPATIBILITY' | 'NO_RECORDS' | 'KEEP' | 'CHECK' | 'LIGHTER_OK' | 'EXPLORE';

export function reviewProposal(input: {
  execution: Execution;
  progress: Progress;
  coverage?: 'COMPLETE' | 'INCOMPLETE' | 'NONE';
  ratioOfResolved?: number | null;
  unresolved?: number;
  newRestriction?: boolean;
  harmful?: boolean;
}): { code: ReviewCode; text: string } {
  if (input.newRestriction || input.harmful) {
    return { code: 'COMPATIBILITY', text: 'Apareció una restricción o un efecto que no esperabas. Revisemos si el plan sigue siendo compatible, sin esperar a la fecha de revisión.' };
  }
  const execution = input.execution === 'NOT_APPLICABLE' ? 'SUFFICIENT' : input.execution;
  if (execution === 'NONE' || input.coverage === 'NONE') {
    return { code: 'NO_RECORDS', text: 'Todavía no hay registros suficientes. Eso no significa que el plan haya fallado. ¿Qué pasó estas semanas?' };
  }
  if (input.coverage === 'INCOMPLETE') {
    const pct = input.ratioOfResolved ?? 0;
    const missing = input.unresolved ?? 0;
    return {
      code: 'NO_RECORDS',
      text: `De lo registrado, cumpliste ${pct} % (${input.unresolved != null ? `${missing} ${missing === 1 ? 'ocasión quedó' : 'ocasiones quedaron'} sin registro` : 'faltan registros'}). Antes de mantener o subir la carga, conviene completar el registro o dejar constancia de qué pasó.`,
    };
  }
  const progressed = input.progress === 'ADVANCE' || input.progress === 'MAINTAINED';
  if (execution === 'SUFFICIENT' && progressed) {
    return { code: 'KEEP', text: 'Hiciste el plan y hubo avance. Puedes mantenerlo así; no hace falta subir la carga.' };
  }
  if (execution === 'SUFFICIENT') {
    return { code: 'CHECK', text: 'Hiciste el plan y todavía no se ve avance. Antes de cambiar la estrategia, revisemos si el plazo alcanza, si falta información y si el indicador mide lo que te importa.' };
  }
  if (progressed) {
    return { code: 'LIGHTER_OK', text: 'Hubo avance aunque no hiciste todas las ocasiones. Puede que una carga menor te alcance.' };
  }
  return { code: 'EXPLORE', text: 'Todavía no se ve avance. Revisemos tu capacidad, las oportunidades que tuviste, lo que se interpuso y la estrategia. Reducir la carga es una opción, no la única.' };
}

export function validateMeasure(
  indicator: Indicator,
  input: { value?: number | null; text?: string | null; notApplicable?: boolean; textOutcome?: TextOutcome | null },
): Measure {
  if (input.notApplicable) {
    if (!indicator.notApplicable) throw new Error('Este indicador no admite «no aplica».');
    return { value: null, text: null, notApplicable: true };
  }
  if (indicator.kind === 'TEXT') {
    const outcome = input.textOutcome;
    if (outcome !== 'ACHIEVED' && outcome !== 'NOT_ACHIEVED' && outcome !== 'UNKNOWN') {
      throw new Error('Indica si el resultado de esta semana fue conseguido, no conseguido o no se sabe.');
    }
    const text = input.text?.trim() ?? '';
    if ((outcome === 'ACHIEVED' || outcome === 'NOT_ACHIEVED') && !text) {
      throw new Error('Escribe una nota breve sobre el resultado.');
    }
    const value = outcome === 'ACHIEVED' ? 1 : outcome === 'NOT_ACHIEVED' ? 0 : null;
    return { value, text: text ? text.slice(0, 1000) : null, notApplicable: false };
  }
  if (indicator.kind === 'CHOICE') {
    const option = indicator.options?.find((row) => row.value === input.text);
    if (!option) throw new Error('Elige una de las opciones.');
    return { value: null, text: option.value, notApplicable: false };
  }
  const value = input.value;
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new Error('La respuesta tiene que ser un número entero.');
  const min = indicator.kind === 'YES_NO' ? 0 : indicator.min ?? 0;
  const max = indicator.kind === 'YES_NO' ? 1 : indicator.max ?? 99;
  if (value < min || value > max) throw new Error(`La respuesta tiene que estar entre ${min} y ${max}.`);
  return { value, text: null, notApplicable: false };
}

export function bindPack(pack: Pack) {
  return {
    pack,
    readSources: (ledger: LedgerEntry[]) => readSources(pack, ledger),
    buildReadings: (read: SourceRead, stored: StoredRecognition[]) => buildReadings(pack, read, stored),
    templateById: (id: string | null | undefined) => templateById(pack.templates, id),
  };
}
