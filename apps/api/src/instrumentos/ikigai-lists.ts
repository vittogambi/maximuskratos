import { IKIGAI_LISTAS } from './ikigai-listas';

export const IKIGAI_FIELDS = ['pasion', 'vocacion', 'mision', 'profesion'] as const;
export type IkigaiField = (typeof IKIGAI_FIELDS)[number];

export function isIkigaiField(value: string): value is IkigaiField {
  return (IKIGAI_FIELDS as readonly string[]).includes(value);
}

export function ambitsOf(field: string): { label: string; options: string[] }[] {
  if (!isIkigaiField(field)) return [];
  return IKIGAI_LISTAS.fields[field].ambits.map((ambit) => ({
    label: ambit.label,
    options: [...ambit.options],
  }));
}

export function sourceFieldFromRef(sourceRef: string | null | undefined): IkigaiField | null {
  const row = Number(/!R(\d+)$/.exec(sourceRef ?? '')?.[1] ?? 0);
  if (row >= 220 && row <= 224) return 'pasion';
  if (row >= 227 && row <= 231) return 'vocacion';
  if (row >= 234 && row <= 238) return 'mision';
  if (row >= 241 && row <= 245) return 'profesion';
  return null;
}

/**
 * The field is the one the question asked. A later catalog correction does not
 * silently move an answer into another column. The source row is returned apart
 * so the person can review the difference.
 */
export function fieldFromSource(sourceRef: string | null | undefined, context: string | null | undefined): IkigaiField | null {
  return fieldFromContext(context) ?? sourceFieldFromRef(sourceRef);
}

export function fieldFromContext(context: string | null | undefined): IkigaiField | null {
  if (!context) return null;
  const activity = /^@actividad:(pasion|vocacion|mision|profesion)$/.exec(context);
  if (activity) return activity[1] as IkigaiField;
  const legacy = /^@ikigai:([^:|]+)/.exec(context);
  if (!legacy) return null;
  const names: Record<string, IkigaiField> = {
    Pasión: 'pasion',
    Vocación: 'vocacion',
    Misión: 'mision',
    Profesión: 'profesion',
  };
  return names[legacy[1]] ?? null;
}
