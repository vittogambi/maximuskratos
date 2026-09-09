import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, LabCaseKind, LabDefinitionStatus } from '@prisma/client';
import { getPrismaClient } from './index';

export type LabResetCounts = {
  cases: number;
  runs: number;
  findings: number;
  candidates: number;
};

function assertNotProduction(nodeEnv = process.env.NODE_ENV): void {
  if (nodeEnv === 'production') {
    throw new Error('lab:reset is disabled in production');
  }
}

function firstExisting(candidates: string[]): string | null {
  return candidates.find((path) => existsSync(path)) ?? null;
}

function casebookDir(): string {
  const found = firstExisting([
    join(process.cwd(), 'packages/matrix-engine/test/cases/rafa-casebook'),
    join(process.cwd(), '../../packages/matrix-engine/test/cases/rafa-casebook'),
    join(__dirname, '../../../matrix-engine/test/cases/rafa-casebook'),
  ]);
  if (!found) throw new Error('rafa-casebook not found');
  return found;
}

function encodeRaw(value: unknown): { raw: string | null; kind: string } {
  if (value == null || value === '') return { raw: null, kind: 'null' };
  if (typeof value === 'number') return { raw: String(value), kind: 'number' };
  return { raw: String(value), kind: 'string' };
}

function parseCasebookResponses(file: string): Array<{
  questionId: string;
  status: 'ANSWERED';
  rawValue: number | string | null;
  qualitativeConfirmed: boolean | null;
}> {
  const raw = JSON.parse(readFileSync(join(casebookDir(), file), 'utf8')) as {
    responses: Record<string, unknown>;
  };
  return Object.entries(raw.responses).map(([questionId, value]) => {
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      return {
        questionId,
        status: 'ANSWERED' as const,
        rawValue: (record.value ?? record.rawValue ?? null) as number | string | null,
        qualitativeConfirmed: (record.qualitativeConfirmed as boolean | null | undefined) ?? null,
      };
    }
    return {
      questionId,
      status: 'ANSWERED' as const,
      rawValue: value as number | string | null,
      qualitativeConfirmed: null,
    };
  });
}

export async function resetLabData(
  prisma: PrismaClient,
  nodeEnv = process.env.NODE_ENV,
): Promise<void> {
  assertNotProduction(nodeEnv);

  await prisma.labReplayResult.deleteMany();
  await prisma.labReplayRun.deleteMany();
  await prisma.labChangeSet.deleteMany();
  await prisma.labDefinitionWorkspace.deleteMany();
  await prisma.labDefinition.deleteMany({
    where: { status: { not: LabDefinitionStatus.PUBLISHED } },
  });
  await prisma.labQuestionObservation.deleteMany();
  await prisma.labFindingConsistency.deleteMany();
  await prisma.labFindingCase.deleteMany();
  await prisma.labFinding.deleteMany();
  await prisma.labMigrationDecision.deleteMany();
  await prisma.labReadinessDecision.deleteMany();
  await prisma.labWorkSession.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.experienceProjectionRecord.deleteMany();
  await prisma.directionVersion.deleteMany();
  await prisma.labExpertPurposeAssessment.deleteMany();
  await prisma.labSafetyAssessment.deleteMany();
  await prisma.labReview.deleteMany();
  await prisma.labExpectation.deleteMany();
  await prisma.labResponse.deleteMany();
  await prisma.labRun.deleteMany();
  await prisma.labCase.deleteMany();
}

type CasebookRow = {
  key: string;
  file: string;
  label: string;
  story: string;
};

async function loadCasebookMeta(): Promise<CasebookRow[]> {
  const modulePath = firstExisting([
    join(process.cwd(), 'apps/api/src/lab/lab-casebook.ts'),
    join(process.cwd(), '../../apps/api/src/lab/lab-casebook.ts'),
    join(__dirname, '../../../../apps/api/src/lab/lab-casebook.ts'),
  ]);
  if (!modulePath) throw new Error('lab-casebook.ts not found');
  const loaded = (await import(modulePath)) as {
    CASEBOOK_META: CasebookRow[];
    assertCasebookStoriesClean: () => void;
  };
  loaded.assertCasebookStoriesClean();
  return loaded.CASEBOOK_META;
}

export async function reseedCasebook(prisma: PrismaClient, userId: string): Promise<void> {
  const definition = await prisma.labDefinition.findFirst({
    where: { status: LabDefinitionStatus.PUBLISHED },
  });
  if (!definition) throw new Error('Published definition missing');
  const payload = definition.payload as { engine_semver?: string };
  const metas = await loadCasebookMeta();

  for (const meta of metas) {
    const created = await prisma.labCase.create({
      data: {
        label: meta.label,
        kind: LabCaseKind.SYNTHETIC,
        blind: true,
        expertContext: meta.story,
        casebookKey: meta.key,
        createdBy: userId,
      },
    });
    const run = await prisma.labRun.create({
      data: {
        caseId: created.id,
        definitionRef: definition.definitionRef,
        definitionSha256: definition.definitionSha256,
        sourceSha256: definition.sourceSha256,
        engineSemver: payload.engine_semver ?? '0.1.0',
        policyId: 'FULL-v1',
        status: 'COLLECTING',
      },
    });
    const responses = parseCasebookResponses(meta.file);
    if (responses.length) {
      await prisma.labResponse.createMany({
        data: responses.map((response) => {
          const encoded = encodeRaw(response.rawValue);
          return {
            runId: run.id,
            questionId: response.questionId,
            status: response.status,
            rawValue: encoded.raw,
            valueKind: encoded.kind,
            qualitativeConfirmed: response.qualitativeConfirmed,
            source: 'FIXTURE',
          };
        }),
      });
    }
  }
}

export async function resetLab(prisma: PrismaClient = getPrismaClient()): Promise<LabResetCounts> {
  await resetLabData(prisma);
  const admin =
    (await prisma.user.findFirst({ where: { role: 'ADMIN' } })) ??
    (await prisma.user.findFirst());
  if (!admin) throw new Error('No user available to own reseeding');
  await reseedCasebook(prisma, admin.id);
  const [cases, runs, findings, candidates] = await Promise.all([
    prisma.labCase.count({ where: { archivedAt: null, casebookKey: { not: null } } }),
    prisma.labRun.count(),
    prisma.labFinding.count(),
    prisma.labDefinition.count({ where: { status: { not: LabDefinitionStatus.PUBLISHED } } }),
  ]);
  return { cases, runs, findings, candidates };
}

async function main(): Promise<void> {
  const prisma = getPrismaClient();
  try {
    const counts = await resetLab(prisma);
    process.stdout.write(
      `lab:reset complete. cases=${counts.cases} runs=${counts.runs} findings=${counts.findings} candidates=${counts.candidates}\n`,
    );
    if (counts.cases !== 26 || counts.runs !== 26 || counts.findings !== 0 || counts.candidates !== 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
