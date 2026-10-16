import type { InstrumentResult, FormularioAnswer } from './types';
import {
  PERSONALITY_FACTOR_KEYS,
  personalityBandForAverage,
  personalityOverallAverage,
  type PersonalityFactorKey,
} from './personality-reading';

const AUDIT_SECTIONS: Array<{ id: string; rows: number[] }> = [
  { id: 's1', rows: [6, 7, 8, 9, 10] },
  { id: 's2', rows: [16, 17, 18, 19, 20] },
  { id: 's3', rows: [26, 27, 28, 29, 30] },
  { id: 's4', rows: [37, 38, 39, 40] },
  { id: 's5', rows: [46, 47, 48, 49] },
];

export const AUDIT_IDS = AUDIT_SECTIONS.flatMap((section) => section.rows.map(auditId));
/** Section 6 numbered items. Row 58 is a heading, not an item. */
export const SENSE_ROWS = [56, 57, 59, 60, 62, 63, 65, 66, 67, 68];

export function auditId(row: number): string {
  return `formulario-v1:E-AUD-001!R${row}`;
}

export function identityId(row: number): string {
  return `formulario-v1:E-PER-000!R${row}`;
}

export const IDENTITY_ROWS = [73, 74, 76, 77, 79, 80, 82, 83, 85, 86];

function byId(answers: FormularioAnswer[]): Map<string, FormularioAnswer> {
  return new Map(answers.map((answer) => [answer.id, answer]));
}

function numeric(answer: FormularioAnswer | undefined): number | null {
  if (!answer || answer.exception) return null;
  if (typeof answer.value !== 'number' || !Number.isFinite(answer.value)) return null;
  return answer.value;
}

function empty(min: number, max: number, required: number, refs: string[]): InstrumentResult {
  return {
    value: null,
    min,
    max,
    coverage: { answered: 0, required },
    calculable: false,
    partial: null,
    parts: {},
    descriptor: null,
    sourceRefs: refs,
    discrepancies: [],
  };
}

function sumOf(ids: string[], answers: Map<string, FormularioAnswer>, min: number, max: number): InstrumentResult {
  const values = ids.map((id) => numeric(answers.get(id)));
  const present = values.filter((value): value is number => value != null);
  const base = empty(min, max, ids.length, ids);
  base.coverage = { answered: present.length, required: ids.length };
  if (present.length === 0) return base;
  const total = present.reduce((acc, value) => acc + value, 0);
  if (present.length === ids.length) {
    return { ...base, value: total, calculable: true, partial: null };
  }
  return { ...base, partial: total, descriptor: 'Suma parcial. Sin categoría.' };
}

/** Audit native total is calculable only with all 23 items. Bands apply only then. */
export function scoreAudit(answers: FormularioAnswer[]): InstrumentResult {
  const map = byId(answers);
  const sections: Record<string, InstrumentResult> = {};
  for (const section of AUDIT_SECTIONS) {
    sections[section.id] = sumOf(section.rows.map(auditId), map, section.rows.length, section.rows.length * 5);
  }
  const total = sumOf(AUDIT_IDS, map, 23, 115);
  total.parts = sections;
  total.discrepancies = ['RESUMEN D15 promedia porcentajes de secciones de distinto tamaño. No es este total.'];
  if (!total.calculable || total.value == null) return total;
  total.descriptor = auditCategory(total.value);
  return total;
}

export function auditCategory(total: number): string {
  if (total < 46) return 'Categoría del formulario: por debajo de 46.';
  if (total < 69) return 'Categoría del formulario: de 46 a 68.';
  if (total < 92) return 'Categoría del formulario: de 69 a 91.';
  return 'Categoría del formulario: de 92 a 115.';
}

export function scoreSense(answers: FormularioAnswer[]): InstrumentResult {
  const result = sumOf(SENSE_ROWS.map(auditId), byId(answers), 10, 50);
  result.discrepancies = ['Estos diez ítems no entran en la auditoría de 115. Sin bandas.'];
  if (result.calculable) result.descriptor = 'Diez respuestas de desarrollo y sentido. Lectura aparte de la auditoría.';
  return result;
}

export function scoreIdentity(answers: FormularioAnswer[]): InstrumentResult {
  const ids = IDENTITY_ROWS.map(identityId);
  const result = sumOf(ids, byId(answers), 10, 40);
  result.discrepancies = [
    'E-PER-000 D88 no clasifica 34 ni 35.',
    'El marco rector propone otros cortes. La categoría formal queda en definición.',
  ];
  if (result.calculable) {
    result.descriptor = 'Total de identidad de 10 a 40. La categoría formal está en definición.';
  }
  return result;
}

const DIFFICULTY_GROUPS = ['PR', 'ER', 'PY', 'D', 'IN'] as const;

export function difficultyId(group: (typeof DIFFICULTY_GROUPS)[number], index: number): string {
  return `formulario-v1:E-PER-000:${group}${index}`;
}

/** Five groups, nine items, Sí=2, Más o menos=1, No=0. No mixed grand total. */
export function scoreDifficulties(answers: FormularioAnswer[]): InstrumentResult {
  const map = byId(answers);
  const parts: Record<string, InstrumentResult> = {};
  for (const group of DIFFICULTY_GROUPS) {
    const ids = Array.from({ length: 9 }, (_, index) => difficultyId(group, index + 1));
    const result = sumOf(ids, map, 0, 18);
    if (result.calculable) {
      result.descriptor = group === 'IN'
        ? 'Recursos de integración, de 0 a 18.'
        : 'Interferencia de este grupo, de 0 a 18.';
    }
    parts[group] = result;
  }
  const answered = Object.values(parts).reduce((acc, part) => acc + part.coverage.answered, 0);
  return {
    value: null,
    min: 0,
    max: 18,
    coverage: { answered, required: 45 },
    calculable: false,
    partial: null,
    parts,
    descriptor: 'Cinco lecturas separadas. No hay un total único.',
    sourceRefs: DIFFICULTY_GROUPS.flatMap((group) =>
      Array.from({ length: 9 }, (_, index) => difficultyId(group, index + 1)),
    ),
    discrepancies: [
      'F181 suma interferencia e integración hasta 90. No se usa.',
      'RESUMEN declara máximo 40. No corresponde a estos 45 ítems.',
    ],
  };
}

const FACTOR_NAMES = PERSONALITY_FACTOR_KEYS;

export function personalityId(index: number): string {
  return `formulario-v1:E-PER-000:OCEAN${index}`;
}

/** Fifteen items. The middle item of each trio is inverse (6 minus the answer). */
export function scorePersonality(answers: FormularioAnswer[]): InstrumentResult {
  const map = byId(answers);
  const parts: Record<string, InstrumentResult> = {};
  const rawAll: Array<number | null> = [];
  for (let group = 0; group < 5; group += 1) {
    const ids = [0, 1, 2].map((offset) => personalityId(group * 3 + offset + 1));
    const raw = ids.map((id) => numeric(map.get(id)));
    rawAll.push(...raw);
    const name = FACTOR_NAMES[group] as PersonalityFactorKey;
    const present = raw.filter((value): value is number => value != null);
    const result = empty(1, 5, 3, ids);
    result.coverage = { answered: present.length, required: 3 };
    if (present.length === 3) {
      const scored = raw.map((value, offset) => (offset === 1 ? 6 - (value as number) : (value as number)));
      const average = scored.reduce((acc, value) => acc + value, 0) / 3;
      result.value = average;
      result.calculable = true;
      result.descriptor = personalityBandForAverage(group, average);
    }
    parts[name] = result;
  }
  const answered = Object.values(parts).reduce((acc, part) => acc + part.coverage.answered, 0);
  const overall = personalityOverallAverage(rawAll);
  return {
    value: overall,
    min: 1,
    max: 5,
    coverage: { answered, required: 15 },
    calculable: overall != null,
    partial: null,
    parts,
    descriptor: overall != null
      ? 'Promedio global de los quince ítems (con ítems inversos aplicados).'
      : 'Cinco lecturas. Un puntaje mayor no significa una persona mejor.',
    sourceRefs: Array.from({ length: 15 }, (_, index) => personalityId(index + 1)),
    discrepancies: ['D206 promedia respuestas sin invertir. No se usa en MK.'],
  };
}

export function scoreBlock(
  answers: FormularioAnswer[],
  ids: string[],
  min: number,
  max: number,
): InstrumentResult {
  return sumOf(ids, byId(answers), min, max);
}
