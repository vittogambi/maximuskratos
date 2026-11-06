import { describe, expect, it } from 'vitest';
import { readQuestionContext } from '../src/diagnostic/question-capture';
import { buildAuditClose, previousModuleSlug, questionNavMeta } from '../src/diagnostic/player-navigation';
import { AUDIT_IDS } from '../src/instrumentos/score';

describe('player navigation helpers', () => {
  it('resolves the previous module slug in catalog order', () => {
    const progress = [
      { module: { slug: 'e-aud-s1', order: 1 } },
      { module: { slug: 'e-aud-s2', order: 2 } },
      { module: { slug: 'e-aud-s3', order: 3 } },
    ];
    expect(previousModuleSlug(progress, 'e-aud-s1')).toBeNull();
    expect(previousModuleSlug(progress, 'e-aud-s2')).toBe('e-aud-s1');
    expect(previousModuleSlug(progress, 'e-aud-s3')).toBe('e-aud-s2');
  });

  it('marks the first question of each module', () => {
    const trail = [
      { id: 'a', moduleSlug: 'e-aud-s1' },
      { id: 'b', moduleSlug: 'e-aud-s1' },
      { id: 'c', moduleSlug: 'e-aud-s2' },
    ];
    expect(questionNavMeta(trail, 'a')).toEqual({ previousQuestionId: null, isFirstInModule: true });
    expect(questionNavMeta(trail, 'b')).toEqual({ previousQuestionId: 'a', isFirstInModule: false });
    expect(questionNavMeta(trail, 'c')).toEqual({ previousQuestionId: 'b', isFirstInModule: true });
  });

  it('lowers waist capture minimum to 35 cm for R11', () => {
    const ctx = readQuestionContext('formulario-v1:F-RAD-001!R11', '@numero:cm:40:200');
    expect(ctx.capture?.kind).toBe('number');
    if (ctx.capture?.kind === 'number') {
      expect(ctx.capture.min).toBe(35);
    }
  });

  it('builds audit close with diagnostic band when all audit items answered', () => {
    const questions = AUDIT_IDS.map((sourceRef, index) => ({
      id: `q-${index}`,
      sourceRef,
      options: [{ id: `o-${index}`, value: '3' }],
    }));
    const moduleProgress = AUDIT_IDS.slice(0, 5).map((_, index) => ({
      module: {
        slug: `e-aud-s${index + 1}`,
        titleEs: `Sección ${index + 1}`,
        questions: questions.slice(index * 5, index * 5 + 5),
      },
    }));
    const responses = questions.map((question) => ({
      questionId: question.id,
      skipped: false,
      exceptionOrigin: null,
      selectedOptionIds: [question.options[0]!.id],
      freeText: null,
      exceptionKind: null,
      rankingOrder: [],
      revision: 1,
    }));
    const close = buildAuditClose(moduleProgress, responses);
    expect(close.total).toBe(23 * 3);
    expect(close.diagnostic).toContain('SÓLIDO');
    expect(close.sections).toHaveLength(5);
  });
});
