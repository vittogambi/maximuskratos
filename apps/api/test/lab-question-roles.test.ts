import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLAN_DOMAINS, type MatrixDefinition } from '@mk/matrix-engine';
import { buildQuestionBank, questionRoles } from '../src/lab/lab-question-roles';

const definition = JSON.parse(
  readFileSync(resolve(__dirname, '../../../packages/matrix-engine/definitions/matrix-v2.0.json'), 'utf8'),
) as MatrixDefinition;

describe('question roles', () => {
  const bank = buildQuestionBank(definition);

  it('does not label purpose items as diagnostic Puntaje', () => {
    const purpose = bank.questions.filter((item) => item.domain === 'PROPÓSITO' || item.domain === 'PURPOSE');
    expect(purpose.length).toBe(81);
    expect(purpose.every((item) => item.roles.includes('Dirección'))).toBe(true);
    expect(purpose.every((item) => !item.roles.includes('Puntaje'))).toBe(true);
    expect(purpose.every((item) => !item.participates_in_score)).toBe(true);
    expect(purpose.every((item) => !/manifiesto/i.test(item.functional_consumer))).toBe(true);
  });

  it('keeps diagnostic scoreable items as Puntaje', () => {
    const scored = definition.questions.filter(
      (item) => item.scoreable && (PLAN_DOMAINS as readonly string[]).includes(item.domain),
    );
    expect(scored.length).toBeGreaterThan(0);
    expect(scored.every((item) => questionRoles(item).includes('Puntaje'))).toBe(true);
  });

  it('does not claim a manifiesto consumer', () => {
    expect(bank.questions.some((item) => /manifiesto/i.test(item.used_in))).toBe(false);
  });

  it('splits integrity counters', () => {
    expect(bank.without_function).toBe(bank.without_role);
    expect(bank.without_role + bank.without_current_consumer + bank.broken_config).toBeGreaterThanOrEqual(0);
  });
});
