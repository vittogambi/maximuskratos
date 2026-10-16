import type { Prisma, PrismaClient } from '@prisma/client';
import { AUDIT_IDS } from './score';
import { auditSignals } from './signals';
import type { ExceptionKind, FormularioAnswer } from './types';

type Db = PrismaClient | Prisma.TransactionClient;

export type AlertSourceRow = {
  revision: number;
  answeredAt: Date;
  skipped: boolean;
  exceptionKind: string | null;
  freeText: string | null;
  selectedOptions: { value: string }[];
  question: { sourceRef: string | null; instrument: string | null; module?: { slug: string } | null };
};

const EXCEPTIONS = new Set<ExceptionKind>(['UNKNOWN', 'NOT_APPLICABLE', 'DECLINED', 'PENDING']);

export function alertOccurrenceKey(userId: string, sessionId: string, questionRef: string, ruleVersion: string, revision: number): string {
  return `${userId}:${sessionId}:${questionRef}:${ruleVersion}:r${revision}`;
}

function exceptionOf(kind: string | null): ExceptionKind | null {
  if (kind && EXCEPTIONS.has(kind as ExceptionKind)) return kind as ExceptionKind;
  return null;
}

function numeric(row: AlertSourceRow | undefined): number | null {
  const raw = row?.selectedOptions[0]?.value;
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Exceptions and skips are not scores. A missing answer is not zero. */
export function answersForAlerts(rows: AlertSourceRow[]): FormularioAnswer[] {
  const byRef = new Map(rows.filter((row) => row.question.sourceRef).map((row) => [row.question.sourceRef as string, row]));
  return AUDIT_IDS.map((id) => {
    const row = byRef.get(id);
    const exception = exceptionOf(row?.exceptionKind ?? null);
    const blocked = !row || row.skipped || exception != null;
    return { id, value: blocked ? null : numeric(row), exception };
  });
}

export async function recordQuestionnaireAlerts(
  db: Db,
  input: {
    userId: string;
    sessionId: string;
    catalogVersion: string;
    rows: AlertSourceRow[];
    provenance: 'RECORDED' | 'RECONSTRUCTED';
  },
): Promise<{ created: number; kept: number; fired: number }> {
  const signals = auditSignals(answersForAlerts(input.rows)).filter((signal) => signal.status === 'FIRED');
  const byRef = new Map(input.rows.filter((row) => row.question.sourceRef).map((row) => [row.question.sourceRef as string, row]));
  let created = 0;
  let kept = 0;
  for (const signal of signals) {
    const row = byRef.get(signal.questionId);
    const revision = row?.revision ?? 0;
    const occurrenceKey = alertOccurrenceKey(input.userId, input.sessionId, signal.questionId, signal.ruleVersion, revision);
    const existing = await db.questionnaireAlert.findUnique({ where: { occurrenceKey }, select: { id: true } });
    if (existing) {
      kept += 1;
      continue;
    }
    try {
      await db.questionnaireAlert.create({
        data: {
          userId: input.userId,
          sessionId: input.sessionId,
          occurrenceKey,
          questionRef: signal.questionId,
          ruleVersion: signal.ruleVersion,
          nativeRule: signal.nativeRule,
          productRule: signal.productRule,
          responseRevision: revision,
          responseValue: row ? numeric(row)?.toString() ?? row.freeText : null,
          catalogVersion: input.catalogVersion,
          moduleSlug: row?.question.module?.slug ?? null,
          answeredAt: row?.answeredAt ?? null,
          detectedAt: new Date(),
          provenance: input.provenance,
        },
      });
      created += 1;
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        kept += 1;
        continue;
      }
      throw err;
    }
  }
  return { created, kept, fired: signals.length };
}

export function missingAlertTable(err: unknown): boolean {
  const code = (err as { code?: string }).code;
  return code === 'P2021';
}
