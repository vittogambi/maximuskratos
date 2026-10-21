import type { PrismaClient } from '@prisma/client';

export type LedgerResponseRow = {
  sourceRef: string;
  revision: number;
  answeredAt: Date;
  exceptionKind: string | null;
  freeText: string | null;
  selectedOptionIds: string[];
  skipped: boolean;
};

export type LedgerSession = {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  completedAt: Date | null;
  catalogVersion: string | null;
  responses: LedgerResponseRow[];
};

export type LedgerEntry = {
  sourceRef: string;
  revision: number;
  answeredAt: Date;
  sessionId: string;
  catalogVersion: string | null;
  value: string | null;
  exceptionKind: string | null;
};

function responseValue(row: LedgerResponseRow): string | null {
  if (row.exceptionKind) return null;
  if (row.skipped) return null;
  const text = row.freeText?.trim();
  if (text) return text;
  if (row.selectedOptionIds.length) return row.selectedOptionIds.join(',');
  return null;
}

export function pickLedgerSession(sessions: LedgerSession[]): LedgerSession | null {
  const active = sessions.find((session) => session.status === 'ACTIVE');
  if (active) return active;
  const completed = sessions
    .filter((session) => session.status === 'COMPLETED')
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  return completed[0] ?? null;
}

export function ledgerFrom(sessions: LedgerSession[]): LedgerEntry[] {
  const session = pickLedgerSession(sessions.filter((item) => item.status !== 'ABANDONED'));
  if (!session) return [];
  const best = new Map<string, LedgerResponseRow>();
  for (const response of session.responses) {
    const prev = best.get(response.sourceRef);
    if (!prev || response.revision > prev.revision) {
      best.set(response.sourceRef, response);
    }
  }
  return [...best.entries()].map(([sourceRef, row]) => ({
    sourceRef,
    revision: row.revision,
    answeredAt: row.answeredAt,
    sessionId: session.id,
    catalogVersion: session.catalogVersion,
    value: responseValue(row),
    exceptionKind: row.exceptionKind,
  }));
}

export type AnswerLedgerDb = Pick<PrismaClient, 'diagnosticSession'>;

export async function answerLedger(db: AnswerLedgerDb, userId: string): Promise<LedgerEntry[]> {
  const sessions = await db.diagnosticSession.findMany({
    where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    orderBy: { lastActivityAt: 'desc' },
    include: {
      responses: {
        include: {
          question: { select: { sourceRef: true } },
        },
      },
      version: { select: { version: true } },
    },
  });
  const mapped: LedgerSession[] = sessions.map((session) => ({
    id: session.id,
    status: session.status as LedgerSession['status'],
    completedAt: session.completedAt,
    catalogVersion: session.version?.version ?? null,
    responses: session.responses
      .filter((response) => response.question.sourceRef != null)
      .map((response) => ({
        sourceRef: response.question.sourceRef as string,
        revision: response.revision,
        answeredAt: response.answeredAt,
        exceptionKind: response.exceptionKind,
        freeText: response.freeText,
        skipped: response.skipped,
        selectedOptionIds: response.selectedOptionIds,
      })),
  }));
  return ledgerFrom(mapped);
}
