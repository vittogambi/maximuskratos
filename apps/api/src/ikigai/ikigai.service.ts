import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  buildResult,
  emptyDraft,
  hashDefinition,
  hashResult,
  loadDefinition,
  normalizeDraft,
  sha256Utf8,
  validateForCompletion,
  validateNextExperiment,
  ENGINE_VERSION,
  type IkigaiDraft,
  type IkigaiDefinition,
} from '@mk/ikigai-engine';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateIkigaiSessionDto, NextExperimentDto, PatchIkigaiDraftDto } from './ikigai.dto';
import { IkigaiSessionStatus, Prisma } from '@prisma/client';

type SessionWithDef = {
  id: string;
  definitionId: string;
  tokenHash: string | null;
  status: IkigaiSessionStatus;
  currentStep: string;
  draftVersion: number;
  draft: unknown;
  source: unknown;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt: Date | null;
  definition: { id: string; ref: string; payload: unknown; status: string };
  snapshots: Array<{ revision: number; createdAt: Date; payload: unknown; sha256: string }>;
};

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function asDraft(value: unknown): IkigaiDraft {
  return normalizeDraft(value);
}

function mergeDraft(current: IkigaiDraft, patch: Record<string, unknown>): IkigaiDraft {
  const next: IkigaiDraft = {
    ...current,
    items: { ...current.items },
    fieldClarity: { ...current.fieldClarity },
  };
  if (patch.items && typeof patch.items === 'object') {
    next.items = { ...next.items, ...(patch.items as IkigaiDraft['items']) };
  }
  if (patch.fieldClarity && typeof patch.fieldClarity === 'object') {
    next.fieldClarity = {
      ...next.fieldClarity,
      ...(patch.fieldClarity as IkigaiDraft['fieldClarity']),
    };
  }
  if ('patternNote' in patch) next.patternNote = (patch.patternNote as string | null) ?? null;
  if (Array.isArray(patch.hypotheses)) next.hypotheses = patch.hypotheses as IkigaiDraft['hypotheses'];
  if ('noHypothesisYet' in patch) next.noHypothesisYet = Boolean(patch.noHypothesisYet);
  if ('selectedHypothesisId' in patch) {
    next.selectedHypothesisId = (patch.selectedHypothesisId as string | null) ?? null;
  }
  if ('nextExperiment' in patch) {
    next.nextExperiment = (patch.nextExperiment as IkigaiDraft['nextExperiment']) ?? null;
  }
  return normalizeDraft(next);
}

function sessionView(session: SessionWithDef) {
  return {
    id: session.id,
    status: session.status,
    currentStep: session.currentStep,
    draftVersion: session.draftVersion,
    definitionRef: session.definition.ref,
    definitionStatus: session.definition.status,
    startedAt: session.startedAt,
    lastActivityAt: session.lastActivityAt,
    completedAt: session.completedAt,
  };
}

@Injectable()
export class IkigaiService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefinitionRow() {
    const payload = loadDefinition();
    const sha256 = hashDefinition(payload);
    const existing = await this.prisma.ikigaiDefinition.findUnique({ where: { ref: payload.ref } });
    if (!existing) {
      return this.prisma.ikigaiDefinition.create({
        data: {
          definitionId: payload.definitionId,
          revision: payload.revision,
          ref: payload.ref,
          status: 'DRAFT',
          sha256,
          engineMin: payload.engineMin,
          payload: asJson(payload),
        },
      });
    }
    if (existing.status === 'DRAFT' && existing.sha256 !== sha256) {
      return this.prisma.ikigaiDefinition.update({
        where: { id: existing.id },
        data: { sha256, engineMin: payload.engineMin, payload: asJson(payload) },
      });
    }
    return existing;
  }

  async activeDefinition() {
    await this.ensureDefinitionRow();
    const published = await this.prisma.ikigaiDefinition.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { revision: 'desc' },
    });
    const row =
      published ??
      (await this.prisma.ikigaiDefinition.findFirst({
        where: { status: 'DRAFT' },
        orderBy: { revision: 'desc' },
      }));
    if (!row) throw new NotFoundException({ statusCode: 404, message: 'No encontrado', reason: 'NO_DEFINITION' });
    return row;
  }

  async getPublicDefinition() {
    const row = await this.activeDefinition();
    return {
      ref: row.ref,
      status: row.status,
      sha256: row.sha256,
      engineMin: row.engineMin,
      payload: row.payload as unknown as IkigaiDefinition,
    };
  }

  async createSession(dto: CreateIkigaiSessionDto) {
    const definition = await this.activeDefinition();
    const token = randomBytes(32).toString('base64url');
    const tokenHash = sha256Utf8(token);
    const session = await this.prisma.ikigaiSession.create({
      data: {
        definitionId: definition.id,
        tokenHash,
        status: 'NEW',
        currentStep: 'PASION',
        draftVersion: 0,
        draft: asJson(emptyDraft()),
        source: dto.source ? asJson(dto.source) : undefined,
      },
      include: {
        definition: true,
        snapshots: { orderBy: { revision: 'desc' }, take: 1 },
      },
    });
    return {
      session: sessionView(session as unknown as SessionWithDef),
      draft: asDraft(session.draft),
      definition: session.definition.payload,
      token,
    };
  }

  getSession(session: SessionWithDef) {
    const latest = session.snapshots[0];
    return {
      session: sessionView(session),
      draft: asDraft(session.draft),
      definition: session.definition.payload,
      latestSnapshot: latest
        ? { revision: latest.revision, createdAt: latest.createdAt }
        : null,
    };
  }

  async patchDraft(session: SessionWithDef, dto: PatchIkigaiDraftDto) {
    if (dto.draftVersion !== session.draftVersion) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Este mapa cambió en otra pestaña. Recargamos la versión más reciente.',
        reason: 'DRAFT_CONFLICT',
        current: asDraft(session.draft),
        draftVersion: session.draftVersion,
      });
    }
    const merged = mergeDraft(asDraft(session.draft), dto.patch);
    const nextStep = dto.step ?? session.currentStep;
    const updated = await this.prisma.ikigaiSession.update({
      where: { id: session.id },
      data: {
        draft: asJson(merged),
        draftVersion: session.draftVersion + 1,
        currentStep: nextStep,
        lastActivityAt: new Date(),
        status: session.status === 'NEW' ? IkigaiSessionStatus.IN_PROGRESS : session.status,
      },
      include: {
        definition: true,
        snapshots: { orderBy: { revision: 'desc' }, take: 1 },
      },
    });
    return {
      draftVersion: updated.draftVersion,
      draft: asDraft(updated.draft),
      session: sessionView(updated as unknown as SessionWithDef),
    };
  }

  async complete(session: SessionWithDef) {
    if (session.status === 'COMPLETED' || session.status === 'FOLLOW_UP') {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: 'Este mapa ya está cerrado. Edita tu material para crear otra revisión.',
        reason: 'ALREADY_COMPLETED',
        step: 'CONTRASTE',
      });
    }
    const definition = session.definition.payload as unknown as IkigaiDefinition;
    const draft = asDraft(session.draft);
    const check = validateForCompletion(definition, draft);
    if (!check.ok) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: check.details,
        reason: 'INCOMPLETE',
        step: check.step,
        details: check.details,
      });
    }
    const generatedAt = new Date().toISOString();
    const result = buildResult(definition, draft, generatedAt);
    const digest = hashResult(result);
    const maxRev = session.snapshots[0]?.revision ?? 0;
    const revision = maxRev + 1;
    const [snapshot] = await this.prisma.$transaction([
      this.prisma.ikigaiResultSnapshot.create({
        data: {
          sessionId: session.id,
          revision,
          definitionRef: definition.ref,
          engineVersion: ENGINE_VERSION,
          sha256: digest,
          payload: asJson(result),
        },
      }),
      this.prisma.ikigaiSession.update({
        where: { id: session.id },
        data: {
          status: draft.nextExperiment ? IkigaiSessionStatus.FOLLOW_UP : IkigaiSessionStatus.COMPLETED,
          completedAt: session.completedAt ?? new Date(),
          lastActivityAt: new Date(),
          currentStep: 'CONTRASTE',
        },
      }),
    ]);
    return { result, revision, sha256: snapshot.sha256 };
  }

  getResult(session: SessionWithDef) {
    const latest = session.snapshots[0];
    if (!latest) {
      throw new NotFoundException({ statusCode: 404, message: 'No encontrado', reason: 'NO_RESULT' });
    }
    const draft = asDraft(session.draft);
    const payload = latest.payload as unknown as Record<string, unknown>;
    return {
      result: {
        ...payload,
        nextExperiment: draft.nextExperiment ?? payload.nextExperiment ?? null,
      },
      revision: latest.revision,
      sha256: latest.sha256,
      createdAt: latest.createdAt,
    };
  }

  async reopen(session: SessionWithDef) {
    await this.prisma.ikigaiSession.update({
      where: { id: session.id },
      data: {
        status: IkigaiSessionStatus.IN_PROGRESS,
        currentStep: 'REVISION',
        lastActivityAt: new Date(),
      },
    });
    return { ok: true };
  }

  async saveNextExperiment(session: SessionWithDef, dto: NextExperimentDto) {
    const error = validateNextExperiment(dto);
    if (error) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: error,
        reason: 'INVALID_EXPERIMENT',
      });
    }
    const draft = asDraft(session.draft);
    draft.nextExperiment = {
      hypothesisId: dto.hypothesisId ?? null,
      focus: dto.focus.trim(),
      horizonDays: dto.horizonDays,
      action: dto.action.trim(),
      signal: dto.signal.trim(),
      savedAt: new Date().toISOString(),
    };
    const nextStatus =
      session.status === 'COMPLETED' || session.status === 'FOLLOW_UP'
        ? IkigaiSessionStatus.FOLLOW_UP
        : session.status;
    const updated = await this.prisma.ikigaiSession.update({
      where: { id: session.id },
      data: {
        draft: asJson(draft),
        draftVersion: session.draftVersion + 1,
        status: nextStatus,
        lastActivityAt: new Date(),
      },
    });
    return { nextExperiment: draft.nextExperiment, draftVersion: updated.draftVersion };
  }

  fileDefinition() {
    return loadDefinition();
  }
}
