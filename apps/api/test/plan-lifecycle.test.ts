import { describe, expect, it } from 'vitest';
import {
  activationBlock,
  achievementEvidenceReady,
  canDeclareAchievement,
  canTransition,
  compatStatus,
  fromLegacy,
  weekFallsInPause,
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

  it('achievementEvidenceReady requires OBSERVED text', () => {
    expect(achievementEvidenceReady({ status: 'OBSERVED', text: 'Hecho.' })).toBe(true);
    expect(achievementEvidenceReady({ status: 'OBSERVED', text: '  ' })).toBe(false);
    expect(achievementEvidenceReady(null)).toBe(false);
  });

  it('canDeclareAchievement requires CONFIRMED criterion on active plan', () => {
    expect(
      canDeclareAchievement({
        criterionText: 'La guía quedó publicada.',
        criterionStatus: 'CONFIRMED',
        stage: 'ACTIVE',
      }),
    ).toBe(true);
    expect(
      canDeclareAchievement({
        criterionText: 'Algo',
        criterionStatus: 'PROVISIONAL',
        stage: 'ACTIVE',
      }),
    ).toBe(false);
    expect(
      canDeclareAchievement({
        criterionText: 'Algo',
        criterionStatus: 'CONFIRMED',
        stage: 'PREPARING',
      }),
    ).toBe(false);
  });

  it('does not count weeks after a pause as owed work', () => {
    const pause = [{ toStage: 'PAUSED', effectiveFrom: new Date('2026-10-28T12:00:00.000Z') }];
    expect(weekFallsInPause('2026-10-26', pause)).toBe(false);
    expect(weekFallsInPause('2026-11-02', pause)).toBe(true);
    expect(weekFallsInPause('2026-11-16', pause)).toBe(true);
    const resumed = [
      ...pause,
      { toStage: 'ACTIVE', effectiveFrom: new Date('2026-11-18T12:00:00.000Z') },
    ];
    expect(weekFallsInPause('2026-11-09', resumed)).toBe(true);
    expect(weekFallsInPause('2026-11-16', resumed)).toBe(false);
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
