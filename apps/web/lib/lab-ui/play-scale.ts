import type { LabQuestion } from '@/lib/lab-api';

type Scale = NonNullable<LabQuestion['scale']>;
type Anchor = Scale['anchors'][number];

export type NumberFieldSpec = {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  integers?: boolean;
  optional?: boolean;
};

export type NumberLayout =
  | { type: 'single'; unit: string; min: number; max: number; integers?: boolean }
  | { type: 'fields'; fields: NumberFieldSpec[] };

const SLEEP: NumberLayout = { type: 'single', unit: 'horas', min: 0, max: 24 };
const BASAL: NumberLayout = {
  type: 'fields',
  fields: [
    { key: 'edad', label: 'Edad', unit: 'años', min: 12, max: 100, integers: true },
    { key: 'estatura_cm', label: 'Estatura', unit: 'cm', min: 120, max: 230 },
    { key: 'peso_kg', label: 'Peso', unit: 'kg', min: 30, max: 250 },
    { key: 'cintura_cm', label: 'Cintura', unit: 'cm', min: 40, max: 200, optional: true },
  ],
};
const WEEK_TIME: NumberLayout = {
  type: 'fields',
  fields: [
    { key: 'dias', label: 'Días', unit: 'por semana', min: 0, max: 7, integers: true },
    { key: 'minutos', label: 'Minutos', unit: 'por semana', min: 0, max: 1500, integers: true },
  ],
};

export function playKind(question: Pick<LabQuestion, 'scale' | 'scale_kind'>): string {
  return question.scale?.kind ?? question.scale_kind ?? '';
}

export function isTypedScale(question: Pick<LabQuestion, 'scale' | 'scale_kind'>): boolean {
  const kind = playKind(question);
  return kind === 'TEXT' || kind === 'NUMBER';
}

export function expandChoiceAnchors(scale: Scale | null | undefined): Anchor[] {
  const anchors = scale?.anchors ?? [];
  if (!scale || scale.kind !== 'CHOICE' || anchors.length !== 1) return anchors;
  const only = anchors[0];
  if (only.value != null && String(only.value) !== '') return anchors;
  const parts = only.label.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return anchors;
  return parts.map((label) => ({ value: label, label, score: only.score }));
}

export function numberLayout(
  question: Pick<LabQuestion, 'id' | 'scale_id' | 'scale'>,
): NumberLayout | null {
  const scaleId = question.scale?.id ?? question.scale_id;
  if (scaleId === 'SLEEP_HOURS' || question.id === 'D-CUE-07') return SLEEP;
  if (question.id === 'D-CUE-06') return BASAL;
  if (question.id === 'P-CUE-03') return WEEK_TIME;
  if (scaleId === 'NUMERIC') return { type: 'single', unit: '', min: 0, max: 999 };
  return null;
}

export function filterDecimalInput(raw: string, integers = false): string {
  let out = '';
  let sep = false;
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') out += ch;
    else if (!integers && (ch === ',' || ch === '.') && !sep && out.length > 0) {
      out += ',';
      sep = true;
    }
  }
  return out;
}

export function parseBoundedNumber(raw: string, min: number, max: number): number | null {
  const compact = raw.trim().replace(',', '.');
  if (!compact || compact.endsWith('.')) return null;
  if (!/^-?\d+(\.\d+)?$/.test(compact)) return null;
  const parsed = Number(compact);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function formatDecimal(value: number): string {
  return String(value).replace('.', ',');
}

export function parseFieldMap(raw: unknown): Record<string, number> {
  if (typeof raw !== 'string' || !raw.startsWith('{')) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeFieldMap(
  fields: NumberFieldSpec[],
  draft: Record<string, string>,
): string | null {
  const values: Record<string, number> = {};
  for (const field of fields) {
    const text = (draft[field.key] ?? '').trim();
    if (!text) {
      if (field.optional) continue;
      return null;
    }
    const parsed = parseBoundedNumber(text, field.min, field.max);
    if (parsed == null) return null;
    values[field.key] = parsed;
  }
  return JSON.stringify(values);
}

export function formatNumericLabel(
  question: Pick<LabQuestion, 'id' | 'scale_id' | 'scale'>,
  raw: unknown,
): string | null {
  const layout = numberLayout(question);
  if (!layout) return typeof raw === 'number' || typeof raw === 'string' ? String(raw) : null;
  if (layout.type === 'single') {
    const parsed = typeof raw === 'number' ? raw : parseBoundedNumber(String(raw ?? ''), layout.min, layout.max);
    if (parsed == null) return null;
    return layout.unit ? `${formatDecimal(parsed)} ${layout.unit}` : formatDecimal(parsed);
  }
  const values = parseFieldMap(raw);
  const parts = layout.fields.flatMap((field) => {
    const value = values[field.key];
    if (value == null) return [];
    return [`${formatDecimal(value)} ${field.unit}`];
  });
  return parts.length ? parts.join(', ') : null;
}

export function rangeHint(min: number, max: number, unit: string): string {
  const suffix = unit ? ` ${unit}` : '';
  return `Entre ${formatDecimal(min)} y ${formatDecimal(max)}${suffix}.`;
}
