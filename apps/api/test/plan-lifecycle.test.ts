import { describe, expect, it } from 'vitest';
import {
  activationBlock,
  canTransition,
  compatStatus,
  fromLegacy,
  type PlanStage,
} from '../src/journey/plan-lifecycle';

const ALL: PlanStage[] = ['PREPARING', 'ACTIVE', 'PAUSED', 'MAINTENANCE', 'CLOSED'];

const ALLOWED: [PlanStage, PlanStage][] = [
  ['PREPARING', 'ACTIVE'],
  ['PREPARING', 'CLOSED'],
  ['ACTIVE', 'PAUSED'],
  ['ACTIVE', 'MAINTENANCE'],
  ['ACTIVE', 'CLOSED'],
  ['PAUSED', 'ACTIVE'],
  ['PAUSED', 'CLOSED'],
  ['MAINTENANCE', 'ACTIVE'],
  ['MAINTENANCE', 'PAUSED'],
  ['MAINTENANCE', 'CLOSED'],
];

describe('plan-lifecycle', () => {
  it('allows only C.2 transitions', () => {
    for (const [from, to] of ALLOWED) {
      expect(canTransition(from, to)).toBe(true);
    }
    for (const from of ALL) {
      for (const to of ALL) {
        if (ALLOWED.some(([a, b]) => a === from && b === to)) continue;
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it('maps compatStatus for each stage', () => {
    expect(compatStatus('PREPARING')).toBe('DRAFT');
    expect(compatStatus('ACTIVE')).toBe('ACTIVE');
    expect(compatStatus('MAINTENANCE')).toBe('ACTIVE');
    expect(compatStatus('PAUSED')).toBe('PAUSED');
    expect(compatStatus('CLOSED')).toBe('ARCHIVED');
  });

  it('reads legacy status', () => {
    expect(fromLegacy('DRAFT')).toBe('PREPARING');
    expect(fromLegacy('ARCHIVED')).toBe('CLOSED');
  });

  it('activationBlock ignores empty why', () => {
    const missing = activationBlock({
      hasGoalOrExperimentQuestion: true,
      timeDeclared: true,
      restrictionsAnswered: true,
      hasActionOrExplicitNoSchedule: true,
      confirmed: true,
      whyItMatters: '',
    });
    expect(missing).toEqual([]);
  });

  it('activationBlock without questionnaire or direction lists only activation fields', () => {
    expect(
      activationBlock({
        hasGoalOrExperimentQuestion: false,
        timeDeclared: false,
        restrictionsAnswered: false,
        hasActionOrExplicitNoSchedule: false,
        confirmed: false,
      }),
    ).toEqual(['GOAL', 'TIME', 'RESTRICTIONS', 'ACTION', 'CONFIRMATION']);
  });
});
