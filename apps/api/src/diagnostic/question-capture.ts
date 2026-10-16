export type MeasureField = {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
};

export type LineField = { key: string; label: string };

export type QuestionCapture =
  | { kind: 'measures'; fields: MeasureField[] }
  | { kind: 'hours'; min: number; max: number }
  | { kind: 'lines'; fields: LineField[] }
  | { kind: 'number'; unit: string; min: number; max: number }
  | { kind: 'birthdate'; minAge: number; maxAge: number }
  | { kind: 'ikigai'; lens: string; others: string[] }
  | { kind: 'activity'; field: 'pasion' | 'vocacion' | 'mision' | 'profesion'; ambits?: { label: string; options: string[] }[] }
  | { kind: 'archetype' };

export type FollowRule = { order: number; value: string; negate: boolean };

export function parseQuestionContext(context: string | null | undefined): {
  contextEs: string | null;
  capture: QuestionCapture | null;
  follows: FollowRule | null;
  subsetRef: string | null;
  heading: string | null;
} {
  const blank = (
    partial: Partial<ReturnType<typeof parseQuestionContext>> = {},
  ): ReturnType<typeof parseQuestionContext> => ({
    contextEs: null,
    capture: null,
    follows: null,
    subsetRef: null,
    heading: null,
    ...partial,
  });
  if (!context) return blank();

  if (context.includes('|@')) {
    return context.split('|').reduce((acc, part) => {
      const parsed = parseQuestionContext(part);
      return {
        contextEs: parsed.contextEs ?? acc.contextEs,
        capture: parsed.capture ?? acc.capture,
        follows: parsed.follows ?? acc.follows,
        subsetRef: parsed.subsetRef ?? acc.subsetRef,
        heading: parsed.heading ?? acc.heading,
      };
    }, blank());
  }

  if (context.startsWith('@titulo:')) {
    const heading = context.slice('@titulo:'.length).trim();
    return blank({ heading: heading || null });
  }

  if (context.startsWith('@sigue:')) {
    const [, order, rawValue] = context.split(':');
    const parsed = Number(order);
    if (!Number.isInteger(parsed) || !rawValue) {
      return blank();
    }
    const negate = rawValue.startsWith('!');
    return blank({
      follows: { order: parsed, value: negate ? rawValue.slice(1) : rawValue, negate },
    });
  }

  if (context.startsWith('@fecha:nacimiento:')) {
    const [minAge, maxAge] = context.slice('@fecha:nacimiento:'.length).split(':').map(Number);
    if (!Number.isInteger(minAge) || !Number.isInteger(maxAge)) return blank();
    return blank({ capture: { kind: 'birthdate', minAge, maxAge } });
  }

  if (context.startsWith('@numero:')) {
    const [unit, min, max] = context.slice('@numero:'.length).split(':');
    const low = Number(min);
    const high = Number(max);
    if (!unit || !Number.isFinite(low) || !Number.isFinite(high)) {
      return blank();
    }
    return blank({ capture: { kind: 'number', unit, min: low, max: high } });
  }

  if (context.startsWith('@nota:')) {
    const note = context.slice('@nota:'.length).trim();
    return blank({ contextEs: note || null });
  }

  if (context.startsWith('@actividad:')) {
    const field = context.slice('@actividad:'.length).trim();
    if (field !== 'pasion' && field !== 'vocacion' && field !== 'mision' && field !== 'profesion') {
      return blank();
    }
    return blank({ capture: { kind: 'activity', field } });
  }

  if (context.startsWith('@ikigai:')) {
    const [lens, others] = context.slice('@ikigai:'.length).split(':');
    const list = (others ?? '').split('|').filter(Boolean);
    if (!lens || list.length === 0) return blank();
    return blank({ capture: { kind: 'ikigai', lens, others: list } });
  }

  if (context.startsWith('@subset:')) {
    const subsetRef = context.slice('@subset:'.length).trim();
    return blank({ subsetRef: subsetRef || null });
  }

  if (context.startsWith('@medidas:')) {
    const fields = context
      .slice('@medidas:'.length)
      .split('|')
      .map((part) => {
        const [key, label, unit, min, max] = part.split(':');
        return {
          key,
          label,
          unit,
          min: Number(min),
          max: Number(max),
        };
      })
      .filter((field) => field.key && field.label && Number.isFinite(field.min) && Number.isFinite(field.max));
    return blank({ capture: fields.length ? { kind: 'measures', fields } : null });
  }

  if (context.startsWith('@lineas:')) {
    const fields = context
      .slice('@lineas:'.length)
      .split('|')
      .map((part) => {
        const splitAt = part.indexOf(':');
        if (splitAt <= 0) return null;
        return { key: part.slice(0, splitAt), label: part.slice(splitAt + 1) };
      })
      .filter((field): field is LineField => Boolean(field?.key && field.label));
    return blank({ capture: fields.length ? { kind: 'lines', fields } : null });
  }

  if (context.startsWith('@horas:')) {
    const [min, max] = context.slice('@horas:'.length).split(':').map(Number);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return blank();
    }
    return blank({ capture: { kind: 'hours', min, max } });
  }

  if (/formulario/i.test(context)) return blank();

  return blank({ contextEs: context });
}

/** The physical age item stores a birth date. Age is derived, including while the catalog row still says years. */
export const BIRTHDATE_SOURCE = 'formulario-v1:F-RAD-001!R6';
export const SEX_SOURCE = 'formulario-v1:F-RAD-001!R7';
export const HEIGHT_SOURCE = 'formulario-v1:F-RAD-001!R8';
export const PARTNER_GATE_SOURCE = 'mk:f-rad-002-pareja-puerta';
/** Origen y linaje: elige un arquetipo del marco central. */
export const ARCHETYPE_ORIGIN_SOURCE = 'formulario-v1:E-PER-000!R9';
/** Origen y linaje: alineación con el significado del nombre (1 a 5). */
export const ORIGIN_ALIGNMENT_SOURCE = 'formulario-v1:E-PER-000!R10';

export function isRequiredBasal(sourceRef: string | null | undefined): boolean {
  return sourceRef === BIRTHDATE_SOURCE
    || sourceRef === SEX_SOURCE
    || sourceRef === HEIGHT_SOURCE
    || sourceRef === PARTNER_GATE_SOURCE;
}

/** First activity of each Ikigai field. The other four can be skipped. */
export function isRequiredActivity(sourceRef: string | null | undefined): boolean {
  return sourceRef === 'formulario-v1:E-PER-000!R220'
    || sourceRef === 'formulario-v1:E-PER-000!R227'
    || sourceRef === 'formulario-v1:E-PER-000!R234'
    || sourceRef === 'formulario-v1:E-PER-000!R241';
}

export function readQuestionContext(sourceRef: string | null | undefined, context: string | null | undefined) {
  const parsed = parseQuestionContext(context);
  if (sourceRef === ARCHETYPE_ORIGIN_SOURCE) {
    return { ...parsed, capture: { kind: 'archetype' as const } };
  }
  if (sourceRef !== BIRTHDATE_SOURCE) return parsed;
  const capture = parsed.capture?.kind === 'birthdate'
    ? parsed.capture
    : { kind: 'birthdate' as const, minAge: 1, maxAge: 120 };
  return { ...parsed, capture };
}
