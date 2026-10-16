import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { alignmentReading } from '../instrumentos/iad';
import { fieldFromContext, fieldFromSource } from '../instrumentos/ikigai-lists';
import { answersForAlerts, missingAlertTable, recordQuestionnaireAlerts, type AlertSourceRow } from '../instrumentos/alert-store';
import { AUDIT_IDS } from '../instrumentos/score';
import { auditSignals } from '../instrumentos/signals';
import { computeFormularioPayload } from '../instrumentos/reading';

const PAGE = 30;

type AlertState = 'NONE' | 'PENDING' | 'HISTORY_UNAVAILABLE' | 'READY' | 'ERROR';

function pageNumber(raw: string | undefined): number {
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

type ReviewSessionRow = {
  id: string;
  status: string;
  completedAt: Date | null;
  lastActivityAt: Date;
  version: { definitionRef: string | null };
  _count: { responses: number };
};

/** Prefer the completed formulario the admin should read, not a newer empty ACTIVE session. */
export function pickAdminReviewSession(sessions: ReviewSessionRow[]): ReviewSessionRow | null {
  if (sessions.length === 0) return null;
  const formulario = sessions.filter((session) => session.version.definitionRef === 'formulario-completo');
  const completed = formulario.filter((session) => session.status === 'COMPLETED');
  const byCompleted = (left: ReviewSessionRow, right: ReviewSessionRow) => {
    const a = left.completedAt?.getTime() ?? left.lastActivityAt.getTime();
    const b = right.completedAt?.getTime() ?? right.lastActivityAt.getTime();
    return b - a;
  };
  if (completed.length > 0) return [...completed].sort(byCompleted)[0];
  const byResponses = (left: ReviewSessionRow, right: ReviewSessionRow) =>
    right._count.responses - left._count.responses
    || right.lastActivityAt.getTime() - left.lastActivityAt.getTime();
  if (formulario.length > 0) return [...formulario].sort(byResponses)[0];
  return [...sessions].sort(byResponses)[0];
}

function alertState(input: { evaluated: boolean; completed: boolean; storedCount: number | null; rowCount: number }): AlertState {
  if (input.rowCount > 0) return 'READY';
  if (!input.evaluated && !input.completed) return 'PENDING';
  if (!input.evaluated) return 'HISTORY_UNAVAILABLE';
  if (input.storedCount != null && input.storedCount > 0) return 'HISTORY_UNAVAILABLE';
  return 'NONE';
}

function answerStatus(row: { skipped: boolean; exceptionKind: string | null } | undefined): string {
  if (!row) return 'UNANSWERED';
  if (row.exceptionKind) return row.exceptionKind;
  if (row.skipped) return 'SKIPPED';
  return 'ANSWERED';
}

@Injectable()
export class MemberJourneyService {
  constructor(private readonly prisma: PrismaService) {}

  private async log(actorId: string, targetUserId: string, resource: string, resourceId: string | null, requestId: string) {
    try {
      await this.prisma.adminAccessLog.create({
        data: { actorId, targetUserId, resource, resourceId, requestId },
      });
    } catch (err) {
      if (!missingAlertTable(err)) throw err;
    }
  }

  private async account(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, onboardingStep: true },
    });
    if (!user) throw new NotFoundException('No hay esa cuenta.');
    return user;
  }

  private async ownedSession(userId: string, sessionId: string) {
    const session = await this.prisma.diagnosticSession.findFirst({
      where: { id: sessionId, userId },
      include: { version: true },
    });
    if (!session) throw new NotFoundException('Esa sesión no es de esta cuenta.');
    return session;
  }

  private async liveFormularioProfile(sessionId: string) {
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { id: sessionId },
      include: {
        version: true,
        responses: { include: { question: { include: { module: true } }, selectedOptions: true } },
      },
    });
    if (!session || session.version.definitionRef !== 'formulario-completo') return null;
    return computeFormularioPayload(session.responses as Parameters<typeof computeFormularioPayload>[0]);
  }

  async summary(actorId: string, userId: string, sessionId: string | undefined, requestId: string = randomUUID()) {
    const account = await this.account(userId);
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: { userId },
      orderBy: [{ lastActivityAt: 'desc' }, { id: 'asc' }],
      include: { version: true, _count: { select: { responses: true } } },
    });
    const selected = sessionId
      ? await this.ownedSession(userId, sessionId)
      : pickAdminReviewSession(sessions);
    await this.log(actorId, userId, 'journey', selected?.id ?? null, requestId);
    const selectedVersionId = selected
      ? sessions.find((session) => session.id === selected.id)?.versionId ?? null
      : null;
    const [modules, readings, purposeRows, experiments, form, alertRows] = await Promise.all([
      selected && selectedVersionId ? this.moduleCounts(selected.id, selectedVersionId) : Promise.resolve([]),
      this.prisma.coreReading.findMany({
        where: { userId },
        orderBy: [{ computedAt: 'asc' }, { id: 'asc' }],
        select: { id: true, kind: true, methodVersion: true, sessionId: true, computedAt: true, output: true },
      }),
      this.prisma.purposeRevision.findMany({
        where: { userId },
        orderBy: { revision: 'asc' },
      }),
      this.prisma.ikigaiExperiment.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { revisions: { orderBy: { revision: 'desc' }, take: 1, select: { revision: true, hypothesis: true, sample: true, opportunity: true, missing: true } } },
      }),
      selected ? this.prisma.diagnosticFormResult.findUnique({ where: { sessionId_formCode: { sessionId: selected.id, formCode: 'formulario-completo' } } }) : Promise.resolve(null),
      selected ? this.alertCount(userId, selected.id) : Promise.resolve({ count: 0, failed: false }),
    ]);
    const signed = [...purposeRows].reverse().find((row) => row.confirmedAt);
    const latest = purposeRows.at(-1) ?? null;
    const stored = form?.payload && typeof form.payload === 'object' ? form.payload as Record<string, unknown> : null;
    const live = selected ? await this.liveFormularioProfile(selected.id) : null;
    const profile = live ?? stored;
    const storedCount = typeof profile?.alertCount === 'number' ? profile.alertCount : null;
    const [activities, rules] = selected
      ? await Promise.all([this.activities(selected.id), this.ruleReview(selected.id)])
      : [[], []];
    return {
      account,
      sessions: sessions.map((session) => ({
        id: session.id,
        status: session.status,
        version: session.version.version,
        definitionRef: session.version.definitionRef,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString() ?? null,
        lastActivityAt: session.lastActivityAt.toISOString(),
        responseCount: session._count.responses,
      })),
      selectedSessionId: selected?.id ?? null,
      modules,
      profile,
      alertState: !selected ? 'PENDING' as AlertState : alertRows.failed ? 'ERROR' : alertState({
        evaluated: Boolean(profile),
        completed: selected.status === 'COMPLETED',
        storedCount,
        rowCount: alertRows.count,
      }),
      alignment: readings.map((row) => ({
        id: row.id,
        kind: row.kind,
        methodVersion: row.methodVersion,
        sessionId: row.sessionId,
        computedAt: row.computedAt.toISOString(),
        output: row.output,
      })),
      declared: latest ? alignmentReading(latest.content, latest.revision) : null,
      direction: latest ? {
        revision: latest.revision,
        confirmedAt: latest.confirmedAt?.toISOString() ?? null,
        status: textField(latest.content, 'directionStatus'),
        statement: textField(latest.content, 'statement'),
        name: textField(latest.content, 'name'),
      } : null,
      signed: signed ? {
        revision: signed.revision,
        confirmedAt: signed.confirmedAt?.toISOString() ?? null,
        name: textField(signed.content, 'name'),
        contract: textField(signed.content, 'contract'),
        contractView: objectField(signed.content, 'contractView'),
      } : null,
      draftIsLater: Boolean(signed && latest && latest.revision !== signed.revision),
      rules,
      ikigai: {
        activities,
        synthesis: latest ? objectField(latest.content, 'synthesis') : null,
        experiments: experiments.map((row) => ({
          id: row.id,
          status: row.status,
          combinationId: row.combinationId,
          revision: row.revisions[0]?.revision ?? null,
          hypothesis: row.revisions[0]?.hypothesis ?? null,
          sample: row.revisions[0]?.sample ?? null,
          opportunity: row.revisions[0]?.opportunity ?? null,
          missing: row.revisions[0]?.missing ?? null,
        })),
      },
    };
  }

  async responses(actorId: string, userId: string, sessionId: string, moduleSlug: string | undefined, pageRaw: string | undefined, requestId: string = randomUUID()) {
    const session = await this.ownedSession(userId, sessionId);
    await this.log(actorId, userId, 'responses', sessionId, requestId);
    const page = pageNumber(pageRaw);
    const module = moduleSlug
      ? await this.prisma.diagnosticModule.findFirst({ where: { versionId: session.versionId, slug: moduleSlug } })
      : await this.prisma.diagnosticModule.findFirst({ where: { versionId: session.versionId }, orderBy: { order: 'asc' } });
    if (!module) throw new NotFoundException('Ese módulo no está en esta versión.');
    const where = { moduleId: module.id };
    const [total, questions] = await Promise.all([
      this.prisma.question.count({ where }),
      this.prisma.question.findMany({
        where,
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * PAGE,
        take: PAGE,
        include: { options: { orderBy: { order: 'asc' }, select: { id: true, order: true, textEs: true, value: true } } },
      }),
    ]);
    const stored = await this.prisma.response.findMany({
      where: { sessionId, questionId: { in: questions.map((question) => question.id) } },
      include: {
        selectedOptions: { select: { id: true, textEs: true, value: true } },
        revisions: { orderBy: { revision: 'asc' }, select: { revision: true, createdAt: true } },
      },
    });
    const byQuestion = new Map(stored.map((row) => [row.questionId, row]));
    return {
      sessionId,
      module: { slug: module.slug, title: module.titleEs, intro: module.introEs },
      page,
      pageSize: PAGE,
      total,
      items: questions.map((question) => {
        const row = byQuestion.get(question.id);
        return {
          questionId: question.id,
          sourceRef: question.sourceRef,
          order: question.order,
          type: question.type,
          text: question.textEs,
          instrument: question.instrument,
          anchors: question.options.map((option) => ({ order: option.order, label: option.textEs, value: option.value })),
          status: answerStatus(row),
          answeredAt: row?.answeredAt.toISOString() ?? null,
          revision: row?.revision ?? null,
          revisionDates: row?.revisions.map((revision) => ({ revision: revision.revision, at: revision.createdAt.toISOString() })) ?? [],
          selected: row?.selectedOptions.map((option) => ({ label: option.textEs, value: option.value })) ?? [],
          freeText: row?.freeText ?? null,
        };
      }),
    };
  }

  async alerts(actorId: string, query: { userId?: string; sessionId?: string; moduleSlug?: string; ruleVersion?: string; from?: string; to?: string; page?: string }, requestId: string = randomUUID()) {
    const page = pageNumber(query.page);
    if (query.userId && query.sessionId) await this.ownedSession(query.userId, query.sessionId);
    if (query.userId) await this.account(query.userId);
    await this.log(actorId, query.userId ?? 'all', 'alerts', query.sessionId ?? null, requestId);
    const where: Prisma.QuestionnaireAlertWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.sessionId ? { sessionId: query.sessionId } : {}),
      ...(query.moduleSlug ? { moduleSlug: query.moduleSlug } : {}),
      ...(query.ruleVersion ? { ruleVersion: query.ruleVersion } : {}),
      ...(query.from || query.to ? {
        detectedAt: {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        },
      } : {}),
    };
    try {
      const [total, rows] = await Promise.all([
        this.prisma.questionnaireAlert.count({ where }),
        this.prisma.questionnaireAlert.findMany({
          where,
          orderBy: [{ detectedAt: 'desc' }, { id: 'asc' }],
          skip: (page - 1) * PAGE,
          take: PAGE,
          include: { user: { select: { email: true } }, session: { select: { version: { select: { version: true } } } } },
        }),
      ]);
      const current = await this.currentRevisions(rows.map((row) => ({ sessionId: row.sessionId, questionRef: row.questionRef })));
      return {
        state: 'READY' as const,
        page,
        pageSize: PAGE,
        total,
        items: rows.map((row) => {
          const live = current.get(`${row.sessionId}:${row.questionRef}`);
          return {
          id: row.id,
          userId: row.userId,
          email: row.user.email,
          sessionId: row.sessionId,
          catalogVersion: row.catalogVersion,
          sessionVersion: row.session.version.version,
          moduleSlug: row.moduleSlug,
          questionId: live?.questionId ?? null,
          questionRef: row.questionRef,
          ruleVersion: row.ruleVersion,
          nativeRule: row.nativeRule,
          productRule: row.productRule,
          responseRevision: row.responseRevision,
          responseValue: row.responseValue,
          answeredAt: row.answeredAt?.toISOString() ?? null,
          detectedAt: row.detectedAt.toISOString(),
          provenance: row.provenance,
          matchesCurrentResponse: live?.revision === row.responseRevision,
        };
        }),
      };
    } catch (err) {
      if (missingAlertTable(err)) return { state: 'ERROR' as const, page, pageSize: PAGE, total: 0, items: [] };
      throw err;
    }
  }

  async reconstruct(actorId: string, userId: string, sessionId: string, execute: boolean, requestId: string = randomUUID()) {
    const session = await this.ownedSession(userId, sessionId);
    await this.log(actorId, userId, execute ? 'alerts-reconstruct' : 'alerts-reconstruct-preview', sessionId, requestId);
    const responses = await this.prisma.response.findMany({
      where: { sessionId },
      include: { question: { include: { module: true } }, selectedOptions: true },
    });
    const rows = responses as AlertSourceRow[];
    const fired = auditSignals(answersForAlerts(rows)).filter((signal) => signal.status === 'FIRED').length;
    if (!execute) return { preview: true, fired, sessionId, catalogVersion: session.version.version };
    const result = await recordQuestionnaireAlerts(this.prisma, {
      userId,
      sessionId,
      catalogVersion: session.version.version,
      rows,
      provenance: 'RECONSTRUCTED',
    });
    return { preview: false, ...result, sessionId };
  }

  private async currentRevisions(keys: { sessionId: string; questionRef: string }[]) {
    const map = new Map<string, { revision: number; questionId: string }>();
    if (!keys.length) return map;
    const rows = await this.prisma.response.findMany({
      where: { OR: keys.map((key) => ({ sessionId: key.sessionId, question: { sourceRef: key.questionRef } })) },
      select: { sessionId: true, questionId: true, revision: true, question: { select: { sourceRef: true } } },
    });
    for (const row of rows) {
      if (row.question.sourceRef) map.set(`${row.sessionId}:${row.question.sourceRef}`, { revision: row.revision, questionId: row.questionId });
    }
    return map;
  }

  private async alertCount(userId: string, sessionId: string): Promise<{ count: number; failed: boolean }> {
    try {
      return { count: await this.prisma.questionnaireAlert.count({ where: { userId, sessionId } }), failed: false };
    } catch (err) {
      if (missingAlertTable(err)) return { count: 0, failed: true };
      throw err;
    }
  }

  private async ruleReview(sessionId: string) {
    const responses = await this.prisma.response.findMany({
      where: { sessionId, question: { sourceRef: { in: [...AUDIT_IDS] } } },
      include: {
        question: { select: { id: true, sourceRef: true, textEs: true, module: { select: { slug: true } } } },
        selectedOptions: true,
      },
    });
    const rows: AlertSourceRow[] = responses.map((row) => ({
      revision: row.revision,
      answeredAt: row.answeredAt,
      skipped: row.skipped,
      exceptionKind: row.exceptionKind,
      freeText: row.freeText,
      selectedOptions: row.selectedOptions,
      question: { sourceRef: row.question.sourceRef, instrument: null, module: row.question.module },
    }));
    const byRef = new Map(responses.filter((row) => row.question.sourceRef).map((row) => [row.question.sourceRef as string, row]));
    return auditSignals(answersForAlerts(rows))
      .filter((signal) => signal.status === 'FIRED' || signal.status === 'NOT_FIRED')
      .map((signal) => {
        const row = byRef.get(signal.questionId);
        return {
          questionId: row?.question.id ?? null,
          questionRef: signal.questionId,
          text: row?.question.textEs ?? signal.questionId,
          moduleSlug: row?.question.module?.slug ?? null,
          value: row?.selectedOptions.map((option) => option.textEs).filter(Boolean).join('. ') || row?.selectedOptions[0]?.value || null,
          status: signal.status as 'FIRED' | 'NOT_FIRED',
          rule: ruleLabel(signal.productRule),
        };
      });
  }

  private async moduleCounts(sessionId: string, versionId: string) {
    const [modules, responses] = await Promise.all([
      this.prisma.diagnosticModule.findMany({
        where: { versionId },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        include: { _count: { select: { questions: true } } },
      }),
      this.prisma.response.findMany({
        where: { sessionId },
        select: { question: { select: { moduleId: true } } },
      }),
    ]);
    const answered = new Map<string, number>();
    for (const row of responses) {
      answered.set(row.question.moduleId, (answered.get(row.question.moduleId) ?? 0) + 1);
    }
    return modules.map((module) => ({
      slug: module.slug,
      phase: module.phase,
      sheet: module.dimensionKey,
      title: module.titleEs,
      intro: module.introEs,
      answered: answered.get(module.id) ?? 0,
      total: module._count.questions,
    }));
  }

  private async activities(sessionId: string) {
    const rows = await this.prisma.response.findMany({
      where: { sessionId, question: { module: { slug: 'e-per-ikigai' } } },
      orderBy: { question: { order: 'asc' } },
      include: { question: { select: { sourceRef: true, contextEs: true } }, selectedOptions: { select: { textEs: true } } },
    });
    return rows.flatMap((row) => {
      const text = row.freeText?.trim() || row.selectedOptions.map((option) => option.textEs).filter(Boolean).join(', ');
      if (!text) return [];
      const field = fieldFromContext(row.question.contextEs) ?? fieldFromSource(row.question.sourceRef, null);
      const read = readActivityText(text);
      return [{
        sourceRef: row.question.sourceRef,
        field,
        ambit: read.ambit,
        option: read.option,
        answer: read.answer,
        recognized: read.recognized,
        raw: read.recognized ? null : text.startsWith('{') ? text : null,
      }];
    });
  }
}

function readActivityText(text: string): { answer: string; ambit: string; option: string; recognized: boolean } {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return { answer: trimmed, ambit: '', option: '', recognized: false };
  try {
    const parsed = JSON.parse(trimmed) as { answer?: unknown; activity?: unknown; ambit?: unknown; option?: unknown };
    const answer = typeof parsed.answer === 'string' ? parsed.answer.trim()
      : typeof parsed.activity === 'string' ? parsed.activity.trim() : '';
    if (!answer) return { answer: trimmed, ambit: '', option: '', recognized: false };
    return {
      answer,
      ambit: typeof parsed.ambit === 'string' ? parsed.ambit.trim() : '',
      option: typeof parsed.option === 'string' ? parsed.option.trim() : '',
      recognized: true,
    };
  } catch {
    return { answer: trimmed, ambit: '', option: '', recognized: false };
  }
}

function ruleLabel(rule: string): string {
  if (rule.startsWith('less than or equal 2')) return 'Se gatilla con respuesta 1 o 2 en la escala.';
  if (rule === 'equals 1') return 'Se gatilla con respuesta 1 en la escala.';
  if (rule === 'equals 2') return 'Se gatilla con respuesta 2 en la escala.';
  return rule;
}

function textField(content: unknown, key: string): string | null {
  if (!content || typeof content !== 'object') return null;
  const value = (content as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function objectField(content: unknown, key: string): unknown {
  if (!content || typeof content !== 'object') return null;
  const value = (content as Record<string, unknown>)[key];
  return value && typeof value === 'object' ? value : null;
}
