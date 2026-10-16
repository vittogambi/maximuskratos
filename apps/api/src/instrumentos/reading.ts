import type { Prisma, PrismaClient } from '@prisma/client';
import {
  AUDIT_IDS,
  IDENTITY_ROWS,
  SENSE_ROWS,
  auditId,
  difficultyId,
  identityId,
  personalityId,
  scoreAudit,
  scoreBlock,
  scoreDifficulties,
  scoreIdentity,
  scorePersonality,
  scoreSense,
} from './score';
import { missingAlertTable, recordQuestionnaireAlerts, type AlertSourceRow } from './alert-store';
import { auditSignals } from './signals';
import type { FormularioAnswer } from './types';
import { auditSheetDiagnostic, financeSheetDiagnostic, relationSheetDiagnostic } from './formulario-diagnostic';
import { shadowDiagnosticFromParts } from './shadow-diagnostic';

/** Not a scored item. It only chooses whether the couple scales apply. */
export const PARTNER_GATE_REF = 'mk:f-rad-002-pareja-puerta';
export const PARTNER_NEVER = 'No tengo ni he tenido pareja';

type ResponseRow = {
  freeText: string | null;
  selectedOptions: { value: string; textEs?: string }[];
  question: { sourceRef: string | null; instrument: string | null; textEs: string; order: number; module?: { slug: string } | null };
};

export function relationScoreRefs(
  rows: { sourceRef: string | null; instrument: string | null; moduleSlug?: string | null }[],
  partnerNever: boolean,
): string[] {
  return rows.flatMap((row) => {
    if (row.instrument !== 'relations' || !row.sourceRef || row.sourceRef === PARTNER_GATE_REF) return [];
    if (partnerNever && row.moduleSlug === 'f-rad-002-s1') return [];
    return [row.sourceRef];
  });
}

function numeric(row: ResponseRow): number | null {
  const raw = row.selectedOptions[0]?.value;
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function answersFor(rows: ResponseRow[], ids: string[]): FormularioAnswer[] {
  const byRef = new Map(rows.map((row) => [row.question.sourceRef, row]));
  return ids.map((id) => ({ id, value: numeric(byRef.get(id) ?? { freeText: null, selectedOptions: [], question: { sourceRef: id, instrument: null, textEs: '', order: 0 } }) }));
}

type ReadingDb = PrismaClient | Prisma.TransactionClient;

function scoredTotal(result: { value: number | null; partial: number | null }): number {
  return result.value ?? result.partial ?? 0;
}

export function computeFormularioPayload(rows: ResponseRow[]) {
  const audit = scoreAudit(answersFor(rows, AUDIT_IDS));
  const sense = scoreSense(answersFor(rows, SENSE_ROWS.map(auditId)));
  const identity = scoreIdentity(answersFor(rows, IDENTITY_ROWS.map(identityId)));
  const partnerLabel = rows.find((row) => row.question.sourceRef === PARTNER_GATE_REF)?.selectedOptions[0]?.textEs
    ?? rows.find((row) => row.question.sourceRef === PARTNER_GATE_REF)?.selectedOptions[0]?.value
    ?? null;
  const partnerNever = partnerLabel === PARTNER_NEVER;
  const relationIds = relationScoreRefs(rows.map((row) => ({
    sourceRef: row.question.sourceRef,
    instrument: row.question.instrument,
    moduleSlug: row.question.module?.slug ?? null,
  })), partnerNever);
  const financeIds = rows.filter((row) => row.question.instrument === 'finance').map((row) => row.question.sourceRef).filter((id): id is string => Boolean(id));
  const relations = scoreBlock(answersFor(rows, relationIds), relationIds, partnerNever ? relationIds.length : 12, 60);
  const finance = scoreBlock(answersFor(rows, financeIds), financeIds, 12, 60);
  const difficultyAnswers: FormularioAnswer[] = [];
  for (const row of rows) {
    const match = /^(PR|ER|PY|IN|D)(\d+)/.exec(row.question.textEs);
    if (!match) continue;
    difficultyAnswers.push({ id: difficultyId(match[1] as 'PR', Number(match[2])), value: numeric(row) });
  }
  const difficulties = scoreDifficulties(difficultyAnswers);
  const shadow = shadowDiagnosticFromParts(difficulties.parts as Record<string, { value?: number | null; calculable?: boolean }>);
  const personalityRows = rows.filter((row) => row.question.instrument === 'personality').sort((a, b) => a.question.order - b.question.order);
  const personality = scorePersonality(personalityRows.map((row, index) => ({ id: personalityId(index + 1), value: numeric(row) })));
  const signals = auditSignals(answersFor(rows, AUDIT_IDS)).filter((signal) => signal.status === 'FIRED');
  const auditScored = scoredTotal(audit);
  const relationScored = partnerNever ? null : scoredTotal(relations);
  const financeScored = scoredTotal(finance);

  return {
    auditTotal: audit.value,
    auditPartial: audit.partial,
    auditMax: 115,
    auditBand: null,
    auditNote: audit.descriptor,
    auditCoverage: audit.coverage,
    auditDiagnostic: auditSheetDiagnostic(auditScored),
    senseTotal: sense.value,
    senseMax: 50,
    relationTotal: partnerNever ? null : relations.value,
    relationPartial: partnerNever ? null : relations.partial,
    relationBand: partnerNever || relations.value == null ? null : relations.value <= 28 ? 'DETRIMENTO' : relations.value <= 48 ? 'ALERTA' : 'PROPULSOR',
    relationBandPending: !partnerNever && relations.value == null,
    relationNote: partnerNever ? 'Sin pareja. El círculo íntimo queda fuera. El total de 60 no se calcula.' : null,
    relationDiagnostic: partnerNever || relationScored == null ? null : relationSheetDiagnostic(relationScored),
    financeTotal: finance.value,
    financePartial: finance.partial,
    financeBand: finance.value == null ? null : finance.value <= 24 ? 'CRÍTICO' : finance.value <= 44 ? 'ALERTA' : 'ÓPTIMO',
    financeDiagnostic: financeScored > 0 || finance.coverage.answered > 0 ? financeSheetDiagnostic(financeScored) : null,
    identityTotal: identity.value,
    identityMax: 40,
    identityNote: identity.descriptor,
    difficulties: difficulties.parts,
    ...shadow,
    personality: personality.parts,
    personalityOverall: personality.calculable ? personality.value : null,
    alertCount: signals.length,
    pillarsPending: true,
    scoringVersion: 'formulario-score@1',
  };
}

export async function persistFormularioReading(prisma: ReadingDb, sessionId: string): Promise<void> {
  const session = await prisma.diagnosticSession.findUnique({
    where: { id: sessionId },
    include: {
      version: true,
      responses: { include: { question: { include: { module: true } }, selectedOptions: true } },
    },
  });
  if (!session || session.version.definitionRef !== 'formulario-completo') return;

  const rows = session.responses as ResponseRow[];
  const computed = computeFormularioPayload(rows);
  const {
    auditPartial: _auditPartial,
    auditDiagnostic: _auditDiagnostic,
    relationPartial: _relationPartial,
    relationDiagnostic: _relationDiagnostic,
    financePartial: _financePartial,
    financeDiagnostic: _financeDiagnostic,
    ...payload
  } = computed;

  await prisma.diagnosticFormResult.upsert({
    where: { sessionId_formCode: { sessionId, formCode: 'formulario-completo' } },
    update: { payload },
    create: { sessionId, formCode: 'formulario-completo', payload },
  });
  await prisma.masterProfile.updateMany({
    where: { sessionId },
    data: { indices: payload, archetypePrimary: 'sin-clasificar' },
  });
  try {
    await recordQuestionnaireAlerts(prisma, {
      userId: session.userId,
      sessionId: session.id,
      catalogVersion: session.version.version,
      rows: session.responses as AlertSourceRow[],
      provenance: 'RECORDED',
    });
  } catch (err) {
    if (!missingAlertTable(err)) throw err;
  }
}
