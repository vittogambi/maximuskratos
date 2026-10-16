import { ageInYears } from './birthdate';

export const EXCEPTION_KINDS = ['UNKNOWN', 'NOT_APPLICABLE', 'DECLINED', 'PENDING'] as const;
export type ExceptionKind = (typeof EXCEPTION_KINDS)[number];

export type AnswerView = {
  skipped: boolean;
  exceptionKind: string | null;
  exceptionOrigin: string | null;
  freeText: string | null;
  selectedOptionIds: string[];
};

/** A settled item can leave the block. A user pending item cannot. */
export function isSettled(response: AnswerView | null): boolean {
  if (!response) return false;
  if (response.exceptionKind === 'PENDING' && response.exceptionOrigin !== 'CONDITION') return false;
  if (response.skipped) return true;
  if (response.exceptionKind === 'PENDING') return true;
  if (response.exceptionKind) return true;
  if ((response.freeText ?? '').trim().length > 0) return true;
  return response.selectedOptionIds.length > 0;
}

export type ParentView = {
  settled: boolean;
  exceptionKind: string | null;
  value: string | null;
  values?: string[];
};

/** Unknown parent keeps the detail pending. It is not treated as not applicable. */
export function childDisposition(
  parent: ParentView | null,
  rule: { value: string; negate: boolean },
): 'ask' | 'pending' | 'hide' {
  if (!parent?.settled) return 'pending';
  if (parent.exceptionKind === 'UNKNOWN' || parent.exceptionKind === 'PENDING') return 'pending';
  if (parent.exceptionKind === 'DECLINED' || parent.exceptionKind === 'NOT_APPLICABLE') return 'hide';
  const values = parent.values?.length ? parent.values : parent.value ? [parent.value] : [];
  if (values.length === 0) return 'pending';
  const matches = rule.negate ? values.some((item) => item !== rule.value) : values.includes(rule.value);
  return matches ? 'ask' : 'hide';
}

/** expected 0 means the client has not seen a saved row. */
export function revisionDecision(expected: number | undefined, current: number | null): 'create' | 'update' | 'conflict' {
  if (current == null) return expected == null || expected === 0 ? 'create' : 'conflict';
  if (expected == null) return 'update';
  return expected === current ? 'update' : 'conflict';
}

export function validateSubmission(input: {
  exceptionKind: string | null;
  allowed: string[];
  optionIds: string[];
  freeText: string | null;
  maxSelections: number | null;
  selectedValues: string[];
  priorValues: string[] | null;
  number: { min: number; max: number } | null;
  birthdate?: { minAge: number; maxAge: number } | null;
  forbidException?: boolean;
  mustChoose?: boolean;
  ikigaiLenses: string[] | null;
  activity?: { ambits: { label: string; options: string[] }[] } | null;
}): { ok: true } | { ok: false; message: string } {
  const text = input.freeText?.trim() ?? '';
  const hasContent = input.optionIds.length > 0 || text.length > 0;
  if (input.forbidException && input.exceptionKind) {
    return { ok: false, message: input.birthdate ? 'Falta la fecha de nacimiento.' : 'Falta la respuesta.' };
  }
  if (input.mustChoose && (input.exceptionKind || input.optionIds.length === 0)) {
    return { ok: false, message: 'Falta la respuesta.' };
  }
  if (input.exceptionKind) {
    if (!EXCEPTION_KINDS.includes(input.exceptionKind as ExceptionKind)) {
      return { ok: false, message: 'Excepción desconocida.' };
    }
    if (!input.allowed.includes(input.exceptionKind)) {
      return { ok: false, message: 'Esta pregunta no admite esa excepción.' };
    }
    if (hasContent) return { ok: false, message: 'La excepción y la respuesta no pueden guardarse juntas.' };
    return { ok: true };
  }
  if (input.maxSelections != null && input.optionIds.length > input.maxSelections) {
    return { ok: false, message: `Puedes elegir hasta ${input.maxSelections}.` };
  }
  if (
    input.priorValues
    && input.priorValues.length > 0
    && input.selectedValues.some((value) => !input.priorValues?.includes(value))
  ) {
    return { ok: false, message: 'Elige entre los valores que ya marcaste.' };
  }
  if (input.number) {
    if (!text) return { ok: false, message: 'Falta el número o una excepción admitida.' };
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount < input.number.min || amount > input.number.max) {
      return { ok: false, message: `El número tiene que estar entre ${input.number.min} y ${input.number.max}.` };
    }
  }
  if (input.birthdate) {
    if (!text) return { ok: false, message: 'Falta la fecha de nacimiento.' };
    const age = ageInYears(text);
    if (age == null || age < input.birthdate.minAge || age > input.birthdate.maxAge) {
      return { ok: false, message: `La fecha tiene que corresponder a una edad entre ${input.birthdate.minAge} y ${input.birthdate.maxAge} años.` };
    }
  }
  if (input.activity) {
    let parsed: { ambit?: unknown; option?: unknown; answer?: unknown } | null = null;
    try {
      parsed = text ? JSON.parse(text) as { ambit?: unknown; option?: unknown; answer?: unknown } : null;
    } catch {
      parsed = null;
    }
    const ambit = typeof parsed?.ambit === 'string' ? parsed.ambit.trim() : '';
    const option = typeof parsed?.option === 'string' ? parsed.option.trim() : '';
    const answer = typeof parsed?.answer === 'string' ? parsed.answer.trim() : '';
    if (!answer || !ambit) return { ok: false, message: 'Escribe la respuesta y elige un ámbito.' };
    const match = input.activity.ambits.find((item) => item.label === ambit);
    if (!match) return { ok: false, message: 'Elige un ámbito de la lista de ese campo.' };
    if (!match.options.includes(option)) {
      return { ok: false, message: 'Revisa el desarrollo de idea: no corresponde a ese ámbito.' };
    }
  }
  if (input.ikigaiLenses) {
    let parsed: { activity?: unknown; also?: unknown } | null = null;
    try {
      parsed = text ? JSON.parse(text) as { activity?: unknown; also?: unknown } : null;
    } catch {
      parsed = null;
    }
    const activity = typeof parsed?.activity === 'string' ? parsed.activity.trim() : '';
    const also = Array.isArray(parsed?.also) ? parsed.also : null;
    if (!activity || !also || also.some((item) => typeof item !== 'string' || !input.ikigaiLenses?.includes(item))) {
      return { ok: false, message: 'Escribe la actividad y marca solo campos de la lista.' };
    }
  }
  if (!hasContent) return { ok: false, message: 'Falta la respuesta o una excepción admitida.' };
  return { ok: true };
}
