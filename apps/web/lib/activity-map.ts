import type { IkigaiFieldKey } from '@/lib/ikigai-api';

export const ACTIVITY_FIELDS = ['pasion', 'vocacion', 'mision', 'profesion'] as const;
export type ActivityFieldName = (typeof ACTIVITY_FIELDS)[number];

const LENSES: Array<{ key: IkigaiFieldKey; field: ActivityFieldName; from: number; to: number; name: string; row: string; prompt: string }> = [
  {
    key: 'PASION',
    field: 'pasion',
    from: 220,
    to: 224,
    name: 'pasión',
    row: 'Lo que amas',
    prompt: '¿Qué actividades te hacen sentir vivo, interesado o energizado, incluso cuando nadie te obliga a realizarlas?',
  },
  {
    key: 'CAPACIDAD',
    field: 'vocacion',
    from: 227,
    to: 231,
    name: 'vocación',
    row: 'En lo que eres hábil',
    prompt: '¿En qué eres bueno, o puedes llegar a serlo?',
  },
  {
    key: 'NECESIDAD',
    field: 'mision',
    from: 234,
    to: 238,
    name: 'misión',
    row: 'Lo que necesita',
    prompt: '¿En qué puedes ser útil, o a quién puedes ayudar?',
  },
  {
    key: 'VALOR',
    field: 'profesion',
    from: 241,
    to: 245,
    name: 'profesión',
    row: 'Por lo que te pueden pagar',
    prompt: '¿Qué actividad entrega suficiente valor como para que alguien quiera pagarla?',
  },
];

export function activityRows() {
  return LENSES.map((lens) => ({ field: lens.field, row: lens.row }));
}

export type ActivityCounts = Record<IkigaiFieldKey, number>;

function lensOf(sourceRef: string | null | undefined) {
  const row = Number(/!R(\d+)$/.exec(sourceRef ?? '')?.[1] ?? 0);
  return LENSES.find((lens) => row >= lens.from && row <= lens.to) ?? null;
}

export function activityLens(sourceRef: string | null | undefined): IkigaiFieldKey | null {
  return lensOf(sourceRef)?.key ?? null;
}

export function activityField(sourceRef: string | null | undefined): ActivityFieldName | null {
  return lensOf(sourceRef)?.field ?? null;
}

export function isIkigaiClose(sourceRef: string | null | undefined): boolean {
  return sourceRef === 'formulario-v1:E-PER-000!R245';
}

/** Each circle holds up to five activities. The title stays the question, not “Actividad 2”. */
export function activitySlot(sourceRef: string | null | undefined): { index: number; total: number; name: string; prompt: string } | null {
  const lens = lensOf(sourceRef);
  if (!lens) return null;
  const row = Number(/!R(\d+)$/.exec(sourceRef ?? '')?.[1] ?? 0);
  return { index: row - lens.from + 1, total: lens.to - lens.from + 1, name: lens.name, prompt: lens.prompt };
}

export function activityAnswer(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value) as { answer?: string };
    return parsed.answer?.trim() ?? '';
  } catch {
    return '';
  }
}

export function activityDraftReady(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value) as { ambit?: string; option?: string; answer?: string };
    return Boolean(parsed.ambit && parsed.option && parsed.answer?.trim());
  } catch {
    return false;
  }
}

export function activityCounts(
  filled: Iterable<string>,
): ActivityCounts {
  const counts: ActivityCounts = { PASION: 0, CAPACIDAD: 0, NECESIDAD: 0, VALOR: 0 };
  for (const ref of filled) {
    const lens = activityLens(ref);
    if (lens) counts[lens] += 1;
  }
  return counts;
}
