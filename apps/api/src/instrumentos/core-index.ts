import { GROUP_LABEL, GROUP_PILLAR, INDICATOR_GROUPS, PILLARS, type IndicatorGroup, type Pillar } from './glossary';
import {
  ALIGNMENT_METHOD,
  ALIGNMENT_NAME,
  CORE_SIGNALS,
  DEFINITION_SHA,
  captureQuality,
  type CaptureQuality,
  type CoreSignal,
} from './core-definition';

export type ExceptionKind = 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED' | 'PENDING';

export type CoreAnswer = {
  sourceRef: string;
  value: number | null;
  exception?: ExceptionKind | null;
  catalogVersion: string;
  answeredAt?: string | null;
};

export type SignalReading = {
  id: string;
  sourceRef: string;
  group: IndicatorGroup;
  value: number | null;
  raw: number | null;
  reason: string | null;
  quality: CaptureQuality;
  answeredAt: string | null;
};

export type AlignmentIndex = {
  name: typeof ALIGNMENT_NAME;
  methodVersion: typeof ALIGNMENT_METHOD;
  definitionSha: string;
  groups: Record<IndicatorGroup, { value: number | null; reason: string | null }>;
  pillars: Record<Pillar, number | null>;
  general: number | null;
  coverage: { eligible: number; required: number };
  signals: SignalReading[];
  pending: string[];
};

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** Linear map. A product convention, not equal psychological distance. */
export function normalizeSignal(raw: number, signal: CoreSignal): number {
  return (100 * (raw - signal.min)) / (signal.max - signal.min);
}

function reasonFor(answer: CoreAnswer | undefined, signal: CoreSignal): { raw: number | null; reason: string | null; quality: CaptureQuality } {
  const quality = captureQuality(answer?.catalogVersion ?? '', signal);
  if (!answer) return { raw: null, reason: 'Sin respuesta.', quality };
  if (answer.exception) return { raw: null, reason: answer.exception, quality };
  if (quality !== 'ETIQUETADA') return { raw: null, reason: quality, quality };
  if (answer.value == null || !Number.isFinite(answer.value)) return { raw: null, reason: 'Sin valor.', quality };
  if (answer.value < signal.min || answer.value > signal.max) return { raw: null, reason: 'Fuera de escala.', quality };
  return { raw: answer.value, reason: null, quality };
}

export function scoreAlignment(answers: CoreAnswer[]): AlignmentIndex {
  const byRef = new Map(answers.map((answer) => [answer.sourceRef, answer]));
  const exact = new Map<string, number>();
  const signals: SignalReading[] = CORE_SIGNALS.map((signal) => {
    const answer = byRef.get(signal.sourceRef);
    const judged = reasonFor(answer, signal);
    const normalized = judged.raw == null ? null : normalizeSignal(judged.raw, signal);
    if (normalized != null) exact.set(signal.id, normalized);
    return {
      id: signal.id,
      sourceRef: signal.sourceRef,
      group: signal.group,
      raw: judged.raw,
      value: normalized == null ? null : round4(normalized),
      reason: judged.reason,
      quality: judged.quality,
      answeredAt: answer?.answeredAt ?? null,
    };
  });
  const groupExact = {} as Record<IndicatorGroup, number | null>;
  const groups = {} as AlignmentIndex['groups'];
  for (const group of INDICATOR_GROUPS) {
    const rows = signals.filter((item) => item.group === group);
    if (rows.every((item) => exact.has(item.id))) {
      const mean = rows.reduce((sum, item) => sum + (exact.get(item.id) as number), 0) / rows.length;
      groupExact[group] = mean;
      groups[group] = { value: round4(mean), reason: null };
    } else {
      groupExact[group] = null;
      const missing = rows.filter((item) => item.value == null).map((item) => `${item.id}: ${item.reason}`);
      groups[group] = { value: null, reason: missing.join(' ') };
    }
  }
  const pillarExact = {} as Record<Pillar, number | null>;
  const pillars = {} as Record<Pillar, number | null>;
  for (const pillar of PILLARS) {
    const rows = INDICATOR_GROUPS.filter((group) => GROUP_PILLAR[group] === pillar);
    const values = rows.map((group) => groupExact[group]);
    if (values.every((value) => value != null)) {
      const mean = (values as number[]).reduce((sum, value) => sum + value, 0) / values.length;
      pillarExact[pillar] = mean;
      pillars[pillar] = round4(mean);
    } else {
      pillarExact[pillar] = null;
      pillars[pillar] = null;
    }
  }
  const general = PILLARS.every((pillar) => pillarExact[pillar] != null)
    ? round4(PILLARS.reduce((sum, pillar) => sum + (pillarExact[pillar] as number), 0) / 3)
    : null;
  const pending = signals.filter((item) => item.value == null).map((item) => `${item.id} ${item.reason}`);
  return {
    name: ALIGNMENT_NAME,
    methodVersion: ALIGNMENT_METHOD,
    definitionSha: DEFINITION_SHA,
    groups,
    pillars,
    general,
    coverage: { eligible: signals.filter((item) => item.value != null).length, required: CORE_SIGNALS.length },
    signals,
    pending,
  };
}

export function groupLabel(group: IndicatorGroup): string {
  return GROUP_LABEL[group];
}

export type Compared = { allowed: false; reason: string } | { allowed: true; delta: number };

/** A reconstruction of an ineligible capture is not an improvement over that capture. */
export function compareAlignment(
  previous: AlignmentIndex | null,
  next: AlignmentIndex,
  previousKind: 'INITIAL' | 'RECONSTRUCTED' | 'REMEASURE' | 'NONE',
): Compared {
  if (!previous || previous.general == null || next.general == null) {
    return { allowed: false, reason: 'Falta un general comparable.' };
  }
  if (previous.methodVersion !== next.methodVersion || previous.definitionSha !== next.definitionSha) {
    return { allowed: false, reason: 'La composición o el método no coinciden.' };
  }
  if (previousKind === 'NONE') return { allowed: false, reason: 'No hay una lectura anterior.' };
  if (previous.coverage.eligible < previous.coverage.required) {
    return { allowed: false, reason: 'La lectura anterior no era elegible. No se dibuja una mejora.' };
  }
  return { allowed: true, delta: round4(next.general - previous.general) };
}
