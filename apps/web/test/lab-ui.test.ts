import { describe, expect, it } from 'vitest';
import {
  formatAnswer,
  describeResponseBuckets,
  describeResponseCounts,
  countResponses,
  flaggedQuestionHref,
  humanError,
  labRunReturnPath,
  nameWithId,
} from '@/lib/lab-ui/format';
import {
  COMPARISON_ROW,
  FIRST_DIVERGENCE_OPTIONS,
  PURPOSE_STAGES,
  ROOT_CAUSE_OPTIONS,
  describePriorityChoice,
  labUiLabels,
  looksLikeCode,
} from '@/lib/lab-ui/labels';
import { buildLabSteps, getLabRunHumanStatus } from '@/lib/lab-ui/status';
import {
  CALCULATION_FOLLOWUP_OPTIONS,
  COVERAGE_FOLLOWUP_OPTIONS,
  DIMENSION_FOLLOWUP_OPTIONS,
  DOUBT_OPTIONS,
  INFO_LOSS_FOLLOWUP_OPTIONS,
  INTERPRETATION_FOLLOWUP_OPTIONS,
  PRIORITY_FOLLOWUP_OPTIONS,
  QUESTION_FOLLOWUP_OPTIONS,
  ROUTE_FOLLOWUP_OPTIONS,
  SAFETY_EFFECT_OPTIONS,
  SCALE_FOLLOWUP_OPTIONS,
  STATE_ORIGIN_OPTIONS,
  WEIGHT_INTENT_OPTIONS,
  followupCauseLabel,
  followupForLayer,
} from '@/lib/lab-ui/review-followup';
import { LabApiError } from '@/lib/lab-api';
import { questionsFixture, runFixture } from './fixtures';

/** Enums Rafa must never read literally. */
const RAW_ENUMS = [
  'ANSWERED',
  'UNANSWERED',
  'SKIPPED_BY_USER',
  'NOT_SERVED_BY_POLICY',
  'COLLECTING',
  'AWAITING_EXPECTATION',
  'REVEALED',
  'SYNTHETIC',
  'SIMULATION',
  'IMPORTED',
  'CORRECT',
  'PARTIAL',
  'INCORRECT',
  'UNCERTAIN',
  'UNSURE',
  'BLOCKED',
  'NO_CLASIFICADO',
  'INTERPRETABLE',
  'MATRIX',
  'RAFA_JUDGMENT',
  'USER_CHOICE',
  'PRODUCT_HYPOTHESIS',
  'DATA_GAP',
  'SAFETY_BLOCKED',
  'FULL-v1',
  'INSUFFICIENT_COVERAGE',
];

describe('UX-01 language layer', () => {
  it('translates every known enum out of Modo Rafa', () => {
    const translated = [
      labUiLabels.responseStatus('ANSWERED'),
      labUiLabels.responseStatus('UNANSWERED'),
      labUiLabels.responseStatus('SKIPPED_BY_USER'),
      labUiLabels.responseStatus('NOT_SERVED_BY_POLICY'),
      labUiLabels.runStatus('COLLECTING'),
      labUiLabels.runStatus('AWAITING_EXPECTATION'),
      labUiLabels.runStatus('REVEALED'),
      labUiLabels.caseKind('SYNTHETIC'),
      labUiLabels.caseKind('SIMULATION'),
      labUiLabels.caseKind('IMPORTED'),
      labUiLabels.verdict('CORRECT'),
      labUiLabels.verdict('PARTIAL'),
      labUiLabels.verdict('INCORRECT'),
      labUiLabels.verdict('UNCERTAIN'),
      labUiLabels.purposeStage('UNSURE'),
      labUiLabels.executable('BLOCKED'),
      labUiLabels.state('NO_CLASIFICADO'),
      labUiLabels.classification('INTERPRETABLE'),
      labUiLabels.source('MATRIX'),
      labUiLabels.source('RAFA_JUDGMENT'),
      labUiLabels.source('USER_CHOICE'),
      labUiLabels.source('PRODUCT_HYPOTHESIS'),
      labUiLabels.source('DATA_GAP'),
      labUiLabels.restriction('SAFETY_BLOCKED'),
      labUiLabels.policy('FULL-v1'),
      labUiLabels.priorityReason('INSUFFICIENT_COVERAGE'),
    ];
    for (const value of translated) {
      expect(RAW_ENUMS).not.toContain(value);
      expect(value).not.toMatch(/^[A-Z_]{4,}$/);
    }
  });

  it('every option list Rafa reads is written in Spanish, not in code', () => {
    const options = [...PURPOSE_STAGES, ...FIRST_DIVERGENCE_OPTIONS, ...ROOT_CAUSE_OPTIONS];
    for (const option of options) {
      expect(option.label).not.toMatch(/^[A-Z_]+$/);
      expect(option.label).not.toBe(option.value);
    }
    for (const label of Object.values(COMPARISON_ROW)) {
      expect(label).not.toMatch(/^[a-z_]+$/);
    }
  });

  it('translates SCALE_TOO_NARROW instead of showing the enum', () => {
    expect(labUiLabels.rootCause('SCALE_TOO_NARROW')).toBe('La escala es demasiado estrecha');
    expect(labUiLabels.rootCause('SCALE_TOO_NARROW')).not.toBe('SCALE_TOO_NARROW');
    expect(looksLikeCode(labUiLabels.rootCause('SCALE_TOO_NARROW'))).toBe(false);
    expect(labUiLabels.rootCause('UNKNOWN_ENUM_CODE')).toBe('Sin dato');
  });

  it('never presents a follow-up option as its English code', () => {
    const options = [
      ...DOUBT_OPTIONS,
      ...QUESTION_FOLLOWUP_OPTIONS,
      ...INTERPRETATION_FOLLOWUP_OPTIONS,
      ...SCALE_FOLLOWUP_OPTIONS,
      ...DIMENSION_FOLLOWUP_OPTIONS,
      ...CALCULATION_FOLLOWUP_OPTIONS,
      ...COVERAGE_FOLLOWUP_OPTIONS,
      ...STATE_ORIGIN_OPTIONS,
      ...PRIORITY_FOLLOWUP_OPTIONS,
      ...ROUTE_FOLLOWUP_OPTIONS,
      ...INFO_LOSS_FOLLOWUP_OPTIONS,
      ...WEIGHT_INTENT_OPTIONS,
      ...SAFETY_EFFECT_OPTIONS,
    ];
    for (const option of options) {
      expect(option.label).not.toBe(option.value);
      expect(looksLikeCode(option.label)).toBe(false);
      expect(labUiLabels.rootCause(option.value)).not.toBe(option.value);
      expect(looksLikeCode(labUiLabels.rootCause(option.value))).toBe(false);
    }
    const scale = followupForLayer('SCALE_MAP');
    expect(scale).not.toBeNull();
    for (const option of scale!.options) {
      expect(followupCauseLabel('SCALE_MAP', [option.value])).toBe(option.label);
    }
  });

  it('keeps an unknown value visible instead of inventing a translation', () => {
    expect(labUiLabels.responseStatus('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });

  it('explains insufficient coverage without the engine token', () => {
    const copy = describePriorityChoice({
      domain: null,
      reason: 'INSUFFICIENT_COVERAGE',
      tier: null,
    });
    expect(copy).toContain('no eligió un ámbito');
    expect(copy).toMatch(/información suficiente/);
    expect(copy).not.toContain('INSUFFICIENT_COVERAGE');
    expect(labUiLabels.priorityReason('INSUFFICIENT_COVERAGE')).not.toMatch(/^[A-Z_]+$/);
  });
});

describe('UX-02 / UX-03 specific translations', () => {
  it('renders ANSWERED as Respondida', () => {
    expect(labUiLabels.responseStatus('ANSWERED')).toBe('Respondida');
  });

  it('renders UNSURE and UNCERTAIN as No estoy seguro', () => {
    expect(labUiLabels.purposeStage('UNSURE')).toBe('No estoy seguro');
    expect(labUiLabels.expectedState('UNSURE')).toBe('No estoy seguro');
    expect(labUiLabels.expectedPriority('UNSURE')).toBe('No estoy seguro');
    expect(labUiLabels.verdict('UNCERTAIN')).toBe('No estoy seguro');
  });

  it('keeps each purpose stage explained in product words', () => {
    expect(labUiLabels.purposeStage('HIPOTETICO')).toBe('Hipótesis');
    expect(labUiLabels.purposeStageHelp('HIPOTETICO')).toMatch(/probarse/);
  });
});

describe('UX-04 human run status', () => {
  it('never presents the machine state as the headline', () => {
    for (const status of ['COLLECTING', 'AWAITING_EXPECTATION', 'REVEALED', 'FAILED']) {
      const human = getLabRunHumanStatus({ status });
      expect(human.label).not.toContain(status);
      expect(human.label).not.toMatch(/^[A-Z_]+$/);
    }
  });

  it('moves the CTA forward as the case advances', () => {
    expect(getLabRunHumanStatus({ status: 'COLLECTING' })).toMatchObject({
      cta: 'Continuar',
      step: 'case',
    });
    expect(getLabRunHumanStatus({ status: 'AWAITING_EXPECTATION' })).toMatchObject({
      cta: 'Registrar tu criterio',
      step: 'prediction',
    });
    expect(
      getLabRunHumanStatus({ status: 'REVEALED', has_expectation: true }),
    ).toMatchObject({ cta: 'Continuar', step: 'result' });
    expect(
      getLabRunHumanStatus({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_purpose: true,
        has_product_review: true,
      }),
    ).toMatchObject({ label: 'Resultado disponible', complete: false });
    expect(
      getLabRunHumanStatus({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_case_verdict: true,
      }),
    ).toMatchObject({ label: 'Matriz revisada', cta: 'Ver resultado', complete: true });
  });

  it('uses the same flags on the case page as on the index', () => {
    const reviewed = {
      status: 'REVEALED',
      has_expectation: true,
      has_review: true,
      has_case_verdict: true,
    };
    expect(getLabRunHumanStatus(reviewed).label).toBe('Matriz revisada');
    expect(getLabRunHumanStatus({ status: reviewed.status }).label).toBe('Falta tu criterio');
  });
});

describe('UX-09 locked steps', () => {
  it('explains why every locked step is not reachable yet', () => {
    const collecting = buildLabSteps({ status: 'COLLECTING' });
    const locked = collecting.filter((step) => step.state === 'LOCKED');
    expect(locked.length).toBeGreaterThan(0);
    for (const step of locked) {
      expect(step.lockedReason && step.lockedReason.length).toBeGreaterThan(10);
    }
    expect(collecting.find((step) => step.id === 'prediction')?.lockedReason).toMatch(
      /cerrar las respuestas/,
    );
    expect(collecting.find((step) => step.id === 'result')?.lockedReason).toMatch(
      /registrar tu criterio/,
    );
  });

  it('unlocks the reveal side of the session only once the run is revealed', () => {
    const frozen = buildLabSteps({ status: 'AWAITING_EXPECTATION' });
    expect(frozen.find((step) => step.id === 'prediction')?.state).toBe('CURRENT');
    expect(frozen.find((step) => step.id === 'review')?.state).toBe('LOCKED');

    const revealed = buildLabSteps({ status: 'REVEALED', has_expectation: true });
    for (const step of revealed) {
      expect(step.state).not.toBe('LOCKED');
    }
  });
});

describe('UX-08 answers', () => {
  it('prefers the definition label over the raw number', () => {
    const [question] = questionsFixture();
    expect(formatAnswer(question)).toBe('A veces');
  });

  it('falls back to the position in the scale before showing a bare number', () => {
    expect(formatAnswer({ status: 'ANSWERED', raw_value: 3, answer_ordinal: '3 de 5' })).toBe('3 de 5');
    expect(formatAnswer({ status: 'ANSWERED', raw_value: 3 })).toBe('3');
  });

  it('reads a missing answer as a state, not as an empty value', () => {
    expect(formatAnswer({ status: 'UNANSWERED' })).toBe('Sin respuesta');
    expect(formatAnswer({ status: 'NOT_SERVED_BY_POLICY' })).toBe('No presentada');
  });

  it('accounts for every response bucket instead of leaving a remainder unexplained', () => {
    const counts = countResponses([
      { status: 'ANSWERED' },
      { status: 'ANSWERED' },
      { status: 'UNANSWERED' },
      { status: 'SKIPPED_BY_USER' },
      { status: 'NOT_SERVED_BY_POLICY' },
    ]);
    const text = describeResponseBuckets(counts);
    expect(text).toBe('2 respuestas, 1 sin respuesta, 1 omitida, 1 no presentada');
    expect(counts.answered + counts.unanswered + counts.skipped + counts.notServed).toBe(counts.total);
  });
});

describe('UX-14 / UX-15 errors', () => {
  it('never renders the literal server message', () => {
    const error = new LabApiError('Internal server error', 500);
    const human = humanError(error, 'No pudimos crear este cambio.');
    expect(human.message).toBe('No pudimos crear este cambio.');
    expect(human.message).not.toMatch(/internal server error/i);
    expect(human.hint).toBeTruthy();
  });

  it('UX-20: keeps the raw server text available as technical detail', () => {
    const error = new LabApiError('Internal server error', 500, 'CHANGE_FAILED');
    expect(humanError(error).technical).toContain('Internal server error');
    expect(humanError(error).technical).toContain('CHANGE_FAILED');
  });

  it('explains the blindness guard instead of showing a conflict code', () => {
    const error = new LabApiError('Expectation pending', 409, 'EXPECTATION_PENDING');
    const human = humanError(error);
    expect(human.message).toMatch(/Todavía no podemos mostrar el resultado/);
    expect(human.hint).toMatch(/predicción/);
  });

  it('does not tell you to reload when a step already moved', () => {
    const error = new LabApiError('Run is not awaiting expectation', 409);
    const human = humanError(error);
    expect(human.message).toBe('El caso ya avanzó de este paso.');
    expect(human.hint).not.toMatch(/cargar la página/);
  });

  it('treats an expired session as expired, not as a permission problem', () => {
    const error = new LabApiError('Unauthorized', 401);
    const human = humanError(error);
    expect(human.message).toBe('La sesión venció.');
    expect(human.message).not.toMatch(/permiso/);
  });
});

describe('names before ids', () => {
  it('UX-14: keeps the plan name as the value and the id as secondary', () => {
    expect(nameWithId('Instalar estructura personal', 'MEN-EST')).toEqual({
      name: 'Instalar estructura personal',
      id: 'MEN-EST',
    });
    expect(nameWithId(null, 'MEN-EST')).toEqual({ name: 'MEN-EST', id: null });
  });

  it('does not repeat the id twice when the catalog has no title', () => {
    expect(nameWithId('MEN-EST', 'MEN-EST')).toEqual({ name: 'MEN-EST', id: null });
  });
});

describe('return to the run from a flagged question', () => {
  const runId = 'c954a22f-fa96-4079-b073-56477edf6f9c';

  it('keeps the run path when opening a flagged question from a review', () => {
    expect(flaggedQuestionHref('AUD-MEN-01', runId)).toContain(`from=${encodeURIComponent(`/admin/lab/runs/${runId}`)}`);
  });

  it('only returns to a lab run path', () => {
    expect(labRunReturnPath(`/admin/lab/runs/${runId}`)).toBe(`/admin/lab/runs/${runId}`);
    expect(labRunReturnPath('/admin/lab/findings/questions')).toBeNull();
    expect(labRunReturnPath('https://example.com/admin/lab/runs/' + runId)).toBeNull();
  });
});

describe('run fixture sanity', () => {
  it('keeps the pre reveal run blind and without a facilitator note', () => {
    const run = runFixture();
    expect(run.status).toBe('COLLECTING');
    expect(run.facilitator_note).toBeNull();
  });
});

describe('LAB-050 labels', () => {
  it('uses Caso propio and Simulación de respuestas', () => {
    expect(labUiLabels.caseKind('SELF')).toBe('Caso propio');
    expect(labUiLabels.caseKind('SIMULATION')).toBe('Simulación de respuestas');
  });

  it('labels a revealed run without review as Resultado listo para revisar', () => {
    expect(getLabRunHumanStatus({ status: 'REVEALED', has_expectation: true }).cta).toBe(
      'Continuar',
    );
    expect(getLabRunHumanStatus({ status: 'REVEALED', has_expectation: true }).label).toBe(
      'Resultado disponible',
    );
  });
});

describe('LAB-054 coverage copy', () => {
  it('keeps Purpose out of domain coverage on R04', () => {
    expect(
      describeResponseCounts({ scoreableUnanswered: 0, purposeAnswered: 0, purposeTotal: 81 }),
    ).toBe(
      'Los 4 ámbitos tienen cobertura suficiente. Propósito no fue respondido en este caso.',
    );
  });
});
