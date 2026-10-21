import { describe, expect, it } from 'vitest';
import { decideAction } from '../src/instrumentos/restrictions';
import {
  applyOperationalClarification,
  guideTags,
  healthFactFromAnswers,
  parseContentTags,
  planLink,
  unfinishedHelp,
  valueHelpTemplate,
  activationBlock,
  planActivationInput,
  writerBlock,
} from '../src/journey/plan-gate';

describe('unfinished help', () => {
  it('refuses a bracket example and the untouched value sentence', () => {
    expect(unfinishedHelp('Ayudo a [persona] a lograr [resultado].', null)).toContain('huecos');
    expect(unfinishedHelp(valueHelpTemplate('Claridad mental'), 'Claridad mental')).toContain('qué cambia');
    expect(unfinishedHelp('Esta semana escribo un párrafo porque quiero claridad mental.', 'Claridad mental')).toBeNull();
  });
});

describe('activationBlock via planActivationInput', () => {
  it('lists missing activation fields without questionnaire or direction', () => {
    const missing = activationBlock(
      planActivationInput({
        plan: { outcome: '' },
        activeActionCount: 0,
        restrictionsAnswered: false,
        patch: {},
      }),
    );
    expect(missing).toEqual(['GOAL', 'TIME', 'RESTRICTIONS', 'ACTION', 'CONFIRMATION']);
  });

  it('passes when preparation data and confirmation are present', () => {
    const missing = activationBlock(
      planActivationInput({
        plan: { outcome: 'Hay un párrafo.' },
        activeActionCount: 1,
        restrictionsAnswered: false,
        patch: { confirmed: true, capacityMinutes: 60, protectNote: 'Nada.' },
      }),
    );
    expect(missing).toEqual([]);
  });
});

describe('writerBlock', () => {
  it('asks for a persisted formulario reading before any direction', () => {
    expect(writerBlock({ formularioCompleted: false, directionStatus: 'CONFIRMADO_POR_USUARIO' })).toMatchObject({
      code: 'FORMULARIO_REQUIRED',
      nextHref: '/diagnostico',
    });
  });

  it('asks for a direction when the reading exists but the sheet has none', () => {
    expect(writerBlock({ formularioCompleted: true, directionStatus: null })).toMatchObject({
      code: 'DIRECTION_REQUIRED',
      nextHref: '/proposito',
    });
  });

  it('lets exploring and provisional directions write plans without confirmation', () => {
    for (const directionStatus of ['EXPLORANDO', 'PROVISIONAL', 'CONFIRMADO_POR_USUARIO']) {
      expect(writerBlock({ formularioCompleted: true, directionStatus })).toBeNull();
    }
  });

  it('rejects direction values it does not know', () => {
    expect(writerBlock({ formularioCompleted: true, directionStatus: 'LIBRE' })).toMatchObject({
      code: 'DIRECTION_REQUIRED',
    });
  });
});

describe('planLink', () => {
  it('reads the link prefix written by the plan form', () => {
    expect(planLink('DIRECT: Ayudo a una persona.')).toBe('DIRECT');
    expect(planLink('EXPLORATORY: Pruebo algo.')).toBe('EXPLORATORY');
  });

  it('refuses a missing or unknown link', () => {
    expect(planLink(undefined)).toBeNull();
    expect(planLink('')).toBeNull();
    expect(planLink('Ayudo a una persona.')).toBeNull();
    expect(planLink('MAYBE: Ayudo.')).toBeNull();
  });
});

describe('guideTags', () => {
  it('knows the guides the member sees and no others', () => {
    expect(guideTags('cuidado')).toEqual([]);
    expect(guideTags('no-existe')).toBeNull();
    expect(guideTags('constructor')).toBeNull();
  });
});

describe('healthFactFromAnswers', () => {
  const answers = (values: Record<string, string | null>) => (ref: string) => values[ref] ?? null;
  const plainNo = { R18: 'No', R20: 'No', R22: 'No', R24: 'No', R27: 'No' };

  it('reads an exact No, with or without final punctuation, as no', () => {
    const health = healthFactFromAnswers(answers({ ...plainNo, R24: 'No.' }));
    expect(health.pain).toBe('NO');
    expect(health.medicalLimit).toBe('NO');
  });

  it('reads any other text as ambiguous, not as a confirmed limit', () => {
    const health = healthFactFromAnswers(answers({ ...plainNo, R27: 'Sí, evitar cargas' }));
    expect(health.medicalLimit).toBe('AMBIGUOUS');
  });

  it('keeps unanswered health questions unknown', () => {
    const health = healthFactFromAnswers(answers({ R18: 'No' }));
    expect(health.medicalLimit).toBe('UNKNOWN');
    expect(health.pain).toBe('UNKNOWN');
  });

  it('asks to clarify ambiguous health text instead of asserting a current limit', () => {
    const health = healthFactFromAnswers(answers({ ...plainNo, R27: 'Respuesta local de prueba.' }));
    expect(decideAction(['PHYSICAL_EXERTION'], health)).toMatchObject({
      allowed: false,
      needsClarification: 'HEALTH',
    });
    expect(decideAction(['PHYSICAL_EXERTION'], health).reason).not.toContain('límite vigente que esta acción');
  });

  it('treats a dated current limit as a refusal and a cleared limit as allowed', () => {
    const health = healthFactFromAnswers(answers({ ...plainNo, R20: 'Lesión antigua', R27: 'Respuesta local de prueba.' }));
    const blocked = applyOperationalClarification(health, { healthLimit: 'CURRENT_LIMIT', conversation: null });
    expect(decideAction(['PHYSICAL_EXERTION'], blocked).reason).toContain('límite vigente');
    const cleared = applyOperationalClarification(health, { healthLimit: 'NO_CURRENT_LIMIT', conversation: null });
    expect(decideAction(['PHYSICAL_EXERTION'], cleared)).toMatchObject({ allowed: true });
    expect(health.injuryHistory).toBe('AMBIGUOUS');
    expect(health.illness).toBe('NO');
    expect(cleared.illness).toBe('NO');
  });

  it('does not erase pain or medication when an old injury is cleared', () => {
    const health = healthFactFromAnswers(answers({ ...plainNo, R24: 'Duele al cargar', R22: 'Un remedio' }));
    const cleared = applyOperationalClarification(health, { healthLimit: 'NO_CURRENT_LIMIT', conversation: null, subjectRef: 'hombro' });
    expect(cleared.pain).toBe('AMBIGUOUS');
    expect(cleared.medication).toBe('AMBIGUOUS');
    expect(cleared.injuryLimitsNow).toBe(false);
    expect(decideAction(['PHYSICAL_EXERTION'], cleared).allowed).toBe(false);
    const ambiguous = applyOperationalClarification(health, { healthLimit: 'NO_CURRENT_LIMIT', conversation: null });
    expect(ambiguous.pain).toBe('NO');
    expect(decideAction(['PHYSICAL_EXERTION'], ambiguous).allowed).toBe(true);
    const confirmed = applyOperationalClarification(health, { healthLimit: 'CURRENT_LIMIT', conversation: null });
    const still = applyOperationalClarification(confirmed, { healthLimit: 'NO_CURRENT_LIMIT', conversation: null });
    expect(still.medicalLimit).toBe('YES');
    expect(decideAction(['PHYSICAL_EXERTION'], still).allowed).toBe(false);
  });

  it('asks about a confrontation until the member says it is viable', () => {
    const health = healthFactFromAnswers(answers(plainNo));
    expect(decideAction(['CONFRONTATION'], health)).toMatchObject({ needsClarification: 'CONVERSATION' });
    const viable = applyOperationalClarification(health, { healthLimit: null, conversation: 'VIABLE' });
    expect(decideAction(['CONFRONTATION'], viable)).toMatchObject({ allowed: true });
    const unsafe = applyOperationalClarification(health, { healthLimit: null, conversation: 'UNSAFE' });
    expect(decideAction(['CONFRONTATION'], unsafe).reason).toContain('no es segura');
  });

  it('asks for the missing health answer instead of asserting a limit', () => {
    const health = healthFactFromAnswers(answers({ R18: 'No', R20: 'No', R22: 'No', R24: 'No' }));
    expect(decideAction(['DIET'], health)).toMatchObject({ allowed: false, needsClarification: 'HEALTH' });
  });

  it('allows health content only when every health answer is a plain No', () => {
    const health = healthFactFromAnswers(answers(plainNo));
    expect(decideAction(['PHYSICAL_EXERTION'], health)).toMatchObject({ allowed: true });
  });
});

describe('parseContentTags', () => {
  it('treats a missing list as no marks', () => {
    expect(parseContentTags(undefined)).toEqual([]);
    expect(parseContentTags(null)).toEqual([]);
  });

  it('keeps the marks the member can declare, once each', () => {
    expect(parseContentTags(['DIET', 'DIET', 'DEBT'])).toEqual(['DIET', 'DEBT']);
  });

  it('refuses a mark the form does not offer', () => {
    expect(parseContentTags(['FINANCIAL_DECISION'])).toBeNull();
    expect(parseContentTags(['esfuerzo'])).toBeNull();
    expect(parseContentTags('DIET')).toBeNull();
  });
});
