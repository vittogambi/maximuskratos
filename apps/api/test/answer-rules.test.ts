import { describe, expect, it } from 'vitest';
import { childDisposition, isSettled, revisionDecision, validateSubmission } from '../src/diagnostic/answer-rules';
import { ageInYears } from '../src/diagnostic/birthdate';
import { ambitsOf } from '../src/instrumentos/ikigai-lists';

const empty = {
  exceptionKind: null as string | null,
  allowed: ['UNKNOWN', 'DECLINED'],
  optionIds: [] as string[],
  freeText: null as string | null,
  maxSelections: 10,
  selectedValues: [] as string[],
  priorValues: null as string[] | null,
  number: null,
  ikigaiLenses: null,
};

describe('selection limits', () => {
  it('rejects more than the maximum and accepts essentials inside the previous selection', () => {
    expect(validateSubmission({ ...empty, optionIds: ['a', 'b'], maxSelections: 1 }).ok).toBe(false);
    expect(validateSubmission({
      ...empty,
      optionIds: ['valor'],
      selectedValues: ['Lealtad'],
      priorValues: ['Lealtad', 'Orden'],
      maxSelections: 3,
    }).ok).toBe(true);
    expect(validateSubmission({
      ...empty,
      optionIds: ['a', 'b', 'c'],
      selectedValues: ['Claridad', 'Oficio', 'Cuidado'],
      priorValues: [],
      maxSelections: 3,
    }).ok).toBe(true);
    const outside = validateSubmission({
      ...empty,
      optionIds: ['otro'],
      selectedValues: ['Otro'],
      priorValues: ['Lealtad'],
      maxSelections: 3,
    });
    expect(outside.ok).toBe(false);
  });
});

describe('numbers and ikigai', () => {
  it('accepts a unit in range and rejects a score on the cross', () => {
    expect(validateSubmission({ ...empty, freeText: '20', number: { min: 0, max: 100 }, maxSelections: null }).ok).toBe(true);
    expect(validateSubmission({ ...empty, freeText: '140', number: { min: 0, max: 100 }, maxSelections: null }).ok).toBe(false);
    const today = new Date(2026, 9, 15);
    expect(ageInYears('1990-06-15', today)).toBe(36);
    expect(ageInYears('2026-10-16', today)).toBeNull();
    expect(ageInYears('2026-02-31', today)).toBeNull();
    expect(validateSubmission({
      ...empty,
      freeText: '1990-06-15',
      birthdate: { minAge: 1, maxAge: 120 },
      maxSelections: null,
    }).ok).toBe(true);
    expect(validateSubmission({
      ...empty,
      exceptionKind: 'UNKNOWN',
      birthdate: { minAge: 1, maxAge: 120 },
      forbidException: true,
      maxSelections: null,
    }).ok).toBe(false);
    expect(validateSubmission({
      ...empty,
      exceptionKind: 'UNKNOWN',
      forbidException: true,
      number: { min: 120, max: 230 },
      maxSelections: null,
    }).ok).toBe(false);
    expect(validateSubmission({
      ...empty,
      exceptionKind: 'DECLINED',
      mustChoose: true,
      maxSelections: null,
    }).ok).toBe(false);
    expect(validateSubmission({
      ...empty,
      optionIds: ['h'],
      mustChoose: true,
      maxSelections: null,
    }).ok).toBe(true);
    expect(validateSubmission({
      ...empty,
      freeText: '1800-01-01',
      birthdate: { minAge: 1, maxAge: 120 },
      maxSelections: null,
    }).ok).toBe(false);
    expect(validateSubmission({
      ...empty,
      freeText: JSON.stringify({ activity: 'Enseñar', also: ['Misión'] }),
      ikigaiLenses: ['Misión', 'Vocación'],
      maxSelections: null,
    }).ok).toBe(true);
    const ambit = ambitsOf('pasion')[0];
    expect(validateSubmission({
      ...empty,
      freeText: JSON.stringify({ ambit: ambit.label, option: ambit.options[0], answer: 'Ensayos' }),
      activity: { ambits: ambitsOf('pasion') },
      maxSelections: null,
    }).ok).toBe(true);
    expect(validateSubmission({
      ...empty,
      freeText: JSON.stringify({ ambit: ambit.label, option: 'No está en la lista', answer: 'Ensayos' }),
      activity: { ambits: ambitsOf('pasion') },
      maxSelections: null,
    }).ok).toBe(false);
  });
});

describe('exceptions and coverage', () => {
  it('keeps an exception exclusive and leaves a user pending item unsettled', () => {
    expect(validateSubmission({ ...empty, exceptionKind: 'UNKNOWN', freeText: 'texto', maxSelections: null }).ok).toBe(false);
    expect(validateSubmission({ ...empty, exceptionKind: 'UNKNOWN', maxSelections: null }).ok).toBe(true);
    expect(isSettled({
      skipped: false,
      exceptionKind: 'PENDING',
      exceptionOrigin: 'USER',
      freeText: null,
      selectedOptionIds: [],
    })).toBe(false);
    expect(isSettled({
      skipped: true,
      exceptionKind: 'NOT_APPLICABLE',
      exceptionOrigin: 'CONDITION',
      freeText: null,
      selectedOptionIds: [],
    })).toBe(true);
  });
});

describe('parent change', () => {
  it('keeps a detail pending when the parent is unknown and hides it when the parent says no', () => {
    expect(childDisposition({ settled: true, exceptionKind: 'UNKNOWN', value: null }, { value: 'No', negate: true })).toBe('pending');
    expect(childDisposition({ settled: true, exceptionKind: null, value: 'No' }, { value: 'No', negate: true })).toBe('hide');
    expect(childDisposition({ settled: true, exceptionKind: null, value: 'Sí' }, { value: 'No', negate: true })).toBe('ask');
    expect(childDisposition(
      { settled: true, exceptionKind: null, value: 'No tengo ni he tenido pareja' },
      { value: 'No tengo ni he tenido pareja', negate: true },
    )).toBe('hide');
    expect(childDisposition(
      { settled: true, exceptionKind: null, value: 'Tengo pareja ahora' },
      { value: 'No tengo ni he tenido pareja', negate: true },
    )).toBe('ask');
    expect(childDisposition(
      { settled: true, exceptionKind: null, value: 'Trabajo', values: ['Trabajo', 'Otra'] },
      { value: 'Otra', negate: false },
    )).toBe('ask');
  });
});

describe('revision', () => {
  it('rejects a write that is behind the saved revision', () => {
    expect(revisionDecision(0, null)).toBe('create');
    expect(revisionDecision(0, 1)).toBe('conflict');
    expect(revisionDecision(1, 1)).toBe('update');
  });
});
