import { describe, expect, it } from 'vitest';
import { resetLabData } from '../../../packages/database/src/lab-reset';

function mockPrisma() {
  const calls: string[] = [];
  const prisma = new Proxy(
    {},
    {
      get: (_target, model: string) => {
        if (model === 'then') return undefined;
        return {
          deleteMany: async () => {
            calls.push(String(model));
            return { count: 0 };
          },
        };
      },
    },
  ) as never;
  return { prisma, calls };
}

describe('lab:reset', () => {
  it('refuses to run in production', async () => {
    const { prisma } = mockPrisma();
    await expect(resetLabData(prisma, 'production')).rejects.toThrow(
      'lab:reset is disabled in production',
    );
  });

  it('deletes lab tables in the specified order', async () => {
    const { prisma, calls } = mockPrisma();
    await resetLabData(prisma, 'test');
    expect(calls).toEqual([
      'labReplayResult',
      'labReplayRun',
      'labChangeSet',
      'labDefinitionWorkspace',
      'labDefinition',
      'labQuestionObservation',
      'labFindingConsistency',
      'labFindingCase',
      'labFinding',
      'labMigrationDecision',
      'labReadinessDecision',
      'labWorkSession',
      'productReview',
      'experienceProjectionRecord',
      'directionVersion',
      'labExpertPurposeAssessment',
      'labSafetyAssessment',
      'labReview',
      'labExpectation',
      'labResponse',
      'labRun',
      'labCase',
    ]);
  });

  it.skipIf(!process.env.LAB_RESET_INTEGRATION)(
    'wipes QA rows and reseeds 26 casebook runs',
    async () => {
      const { resetLab } = await import('../../../packages/database/src/lab-reset');
      const { getPrismaClient } = await import('@mk/database');
      const prisma = getPrismaClient();
      const publishedBefore = await prisma.labDefinition.count({
        where: { status: 'PUBLISHED' },
      });
      const counts = await resetLab(prisma);
      const publishedAfter = await prisma.labDefinition.count({
        where: { status: 'PUBLISHED' },
      });
      expect(counts).toEqual({ cases: 26, runs: 26, findings: 0, candidates: 0 });
      expect(publishedAfter).toBe(publishedBefore);
      expect(publishedAfter).toBeGreaterThan(0);
    },
  );
});
