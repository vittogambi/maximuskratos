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
  EXPECTED_DEFINITION_SHA256,
  hashDefinition,
  hashResult,
  loadDefinition,
  normalizeDraft,
  reconcileDraft,
  sha256Utf8,
  validateDraftStructure,
  validateForCompletion,
  validateNextExperiment,
  ENGINE_VERSION,
  type IkigaiDraft,
  type IkigaiDefinition,
  type IkigaiNextExperiment,
  type IkigaiResult,
} from '@mk/ikigai-engine';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateIkigaiSessionDto, NextExperimentDto, PatchIkigaiDraftDto, SessionWriteDto } from './ikigai.dto';
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
  definition: { id: string; ref: string; sha256: string; payload: unknown; status: string };
  snapshots: Array<{ revision: number; createdAt: Date; payload: unknown; sha256: string }>;
};

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function asDraft(value: unknown): IkigaiDraft {
  return normalizeDraft(value);
}

type ExperimentContext =
  | { state: 'NONE' }
  | { state: 'CURRENT'; experiment: IkigaiNextExperiment }
  | { state: 'NEEDS_REVIEW'; experiment: IkigaiNextExperiment };

function applyPatch(current: IkigaiDraft, patch: Record<string, unknown>): IkigaiDraft {
  const next = structuredClone(current);
  if (patch.items && typeof patch.items === 'object') {
    const items = patch.items as Partial<IkigaiDraft['items']>;
    next.items = {
      PASION: Array.isArray(items.PASION) ? items.PASION : next.items.PASION,
      CAPACIDAD: Array.isArray(items.CAPACIDAD) ? items.CAPACIDAD : next.items.CAPACIDAD,
      NECESIDAD: Array.isArray(items.NECESIDAD) ? items.NECESIDAD : next.items.NECESIDAD,
      VALOR: Array.isArray(items.VALOR) ? items.VALOR : next.items.VALOR,
    };
  }
  if (patch.fieldClarity && typeof patch.fieldClarity === 'object') {
    next.fieldClarity = { ...next.fieldClarity, ...(patch.fieldClarity as IkigaiDraft['fieldClarity']) };
  }
  if ('patternNote' in patch) next.patternNote = (patch.patternNote as string | null) ?? null;
  if (Array.isArray(patch.hypotheses)) next.hypotheses = patch.hypotheses as IkigaiDraft['hypotheses'];
  if ('noHypothesisYet' in patch) next.noHypothesisYet = Boolean(patch.noHypothesisYet);
  if ('selectedHypothesisId' in patch) {
    next.selectedHypothesisId = (patch.selectedHypothesisId as string | null) ?? null;
  }
  return next;
}

function definitionHash(payload: unknown): string {
  return hashDefinition(payload);
}

function versionConflict(draftVersion: number): ConflictException {
  return new ConflictException({
    statusCode: 409,
    message: 'Esta sesión cambió en otra pestaña.',
    reason: 'DRAFT_VERSION_CONFLICT',
    draftVersion,
  });
}

function definitionChanged(): ConflictException {
  return new ConflictException({
    statusCode: 409,
    message: 'La definición de esta prueba cambió. No se escribió nada.',
    reason: 'DEFINITION_CHANGED',
  });
}

function sessionState(): ConflictException {
  return new ConflictException({
    statusCode: 409,
    message: 'Esta sesión no admite esa operación.',
    reason: 'SESSION_STATE',
  });
}

function assertWrite(session: SessionWithDef, input: { draftVersion: number; definitionSha256: string }) {
  const actual = definitionHash(session.definition.payload);
  if (actual !== EXPECTED_DEFINITION_SHA256 || input.definitionSha256 !== actual) {
    throw definitionChanged();
  }
  if (input.draftVersion !== session.draftVersion) throw versionConflict(session.draftVersion);
}

function editable(status: IkigaiSessionStatus): boolean {
  return status === 'NEW' || status === 'IN_PROGRESS';
}

function closed(status: IkigaiSessionStatus): boolean {
  return status === 'COMPLETED' || status === 'FOLLOW_UP';
}

function experimentContext(session: SessionWithDef, snapshot: IkigaiResult): ExperimentContext {
  const draft = asDraft(session.draft);
  const experiment = draft.nextExperiment;
  if (!experiment) return { state: 'NONE' };
  const selected = snapshot.selectedHypothesisId ?? null;
  const matches =
    experiment.reviewStatus === 'CURRENT' &&
    closed(session.status) &&
    Boolean(experiment.hypothesisId) &&
    experiment.hypothesisId === selected &&
    draft.hypotheses.some((hyp) => hyp.id === experiment.hypothesisId);
  if (matches) return { state: 'CURRENT', experiment };
  return {
    state: 'NEEDS_REVIEW',
    experiment: { ...experiment, reviewStatus: 'NEEDS_REVIEW' },
  };
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
      definitionSha256: definitionHash(session.definition.payload),
      token,
    };
  }

  getSession(session: SessionWithDef) {
    const latest = session.snapshots[0];
    return {
      session: sessionView(session),
      draft: asDraft(session.draft),
      definition: session.definition.payload,
      definitionSha256: definitionHash(session.definition.payload),
      latestSnapshot: latest
        ? { revision: latest.revision, createdAt: latest.createdAt }
        : null,
    };
  }

  private async readSession(tx: Prisma.TransactionClient, id: string): Promise<SessionWithDef> {
    const session = await tx.ikigaiSession.findUnique({
      where: { id },
      include: { definition: true, snapshots: { orderBy: { revision: 'desc' }, take: 1 } },
    });
    if (!session) throw new NotFoundException({ statusCode: 404, message: 'No encontrado', reason: 'NOT_FOUND' });
    return session as unknown as SessionWithDef;
  }

  async patchDraft(sessionRef: { id: string }, dto: PatchIkigaiDraftDto) {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.readSession(tx, sessionRef.id);
      if (!editable(session.status)) throw sessionState();
      assertWrite(session, dto);
      const definition = session.definition.payload as unknown as IkigaiDefinition;
      const previous = asDraft(session.draft);
      const candidate = applyPatch(previous, dto.patch ?? {});
      const reconciled = reconcileDraft(previous, candidate);
      const issues = validateDraftStructure(definition, reconciled.draft);
      if (issues.length > 0) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          message: issues[0].message,
          reason: 'INVALID_DRAFT',
          issues,
        });
      }
      const stored = normalizeDraft(reconciled.draft);
      const changed = await tx.ikigaiSession.updateMany({
        where: { id: session.id, draftVersion: dto.draftVersion, status: session.status },
        data: {
          draft: asJson(stored),
          draftVersion: dto.draftVersion + 1,
          currentStep: dto.step ?? session.currentStep,
          lastActivityAt: new Date(),
          status: session.status === 'NEW' ? IkigaiSessionStatus.IN_PROGRESS : session.status,
        },
      });
      if (changed.count !== 1) throw versionConflict(session.draftVersion);
      return {
        draftVersion: dto.draftVersion + 1,
        draft: stored,
        affectedHypothesisIds: reconciled.affectedHypothesisIds,
        definitionSha256: definitionHash(session.definition.payload),
        session: {
          ...sessionView(session),
          draftVersion: dto.draftVersion + 1,
          status: session.status === 'NEW' ? 'IN_PROGRESS' : session.status,
          currentStep: dto.step ?? session.currentStep,
        },
      };
    });
  }

  async complete(sessionRef: { id: string }, dto: SessionWriteDto) {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.readSession(tx, sessionRef.id);
      if (!editable(session.status)) throw sessionState();
      assertWrite(session, dto);
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
      const changed = await tx.ikigaiSession.updateMany({
        where: {
          id: session.id,
          draftVersion: dto.draftVersion,
          status: { in: [IkigaiSessionStatus.NEW, IkigaiSessionStatus.IN_PROGRESS] },
        },
        data: {
          status: draft.nextExperiment ? IkigaiSessionStatus.FOLLOW_UP : IkigaiSessionStatus.COMPLETED,
          completedAt: session.completedAt ?? new Date(),
          lastActivityAt: new Date(),
          currentStep: 'CONTRASTE',
          draftVersion: dto.draftVersion + 1,
        },
      });
      if (changed.count !== 1) throw versionConflict(session.draftVersion);
      const revision = (session.snapshots[0]?.revision ?? 0) + 1;
      const snapshot = await tx.ikigaiResultSnapshot.create({
        data: {
          sessionId: session.id,
          revision,
          definitionRef: definition.ref,
          engineVersion: ENGINE_VERSION,
          sha256: digest,
          payload: asJson(result),
        },
      });
      return { result, revision, sha256: snapshot.sha256, draftVersion: dto.draftVersion + 1 };
    });
  }

  getResult(session: SessionWithDef) {
    const latest = session.snapshots[0];
    if (!latest) {
      throw new NotFoundException({ statusCode: 404, message: 'No encontrado', reason: 'NO_RESULT' });
    }
    const payload = latest.payload as unknown as IkigaiResult;
    return {
      result: payload,
      experiment: experimentContext(session, payload),
      revision: latest.revision,
      sha256: latest.sha256,
      createdAt: latest.createdAt,
      definitionSha256: definitionHash(session.definition.payload),
    };
  }

  async reopen(sessionRef: { id: string }, dto: SessionWriteDto) {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.readSession(tx, sessionRef.id);
      if (!closed(session.status)) throw sessionState();
      assertWrite(session, dto);
      const draft = asDraft(session.draft);
      if (draft.nextExperiment) {
        draft.nextExperiment = {
          ...draft.nextExperiment,
          reviewStatus: 'NEEDS_REVIEW',
          hypothesisId: null,
        };
      }
      const changed = await tx.ikigaiSession.updateMany({
        where: {
          id: session.id,
          draftVersion: dto.draftVersion,
          status: { in: [IkigaiSessionStatus.COMPLETED, IkigaiSessionStatus.FOLLOW_UP] },
        },
        data: {
          status: IkigaiSessionStatus.IN_PROGRESS,
          currentStep: 'REVISION',
          draft: asJson(draft),
          draftVersion: dto.draftVersion + 1,
          lastActivityAt: new Date(),
        },
      });
      if (changed.count !== 1) throw versionConflict(session.draftVersion);
      return { ok: true, draftVersion: dto.draftVersion + 1, definitionSha256: definitionHash(session.definition.payload) };
    });
  }

  async saveNextExperiment(sessionRef: { id: string }, dto: NextExperimentDto) {
    const error = validateNextExperiment(dto);
    if (error) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: error,
        reason: 'INVALID_EXPERIMENT',
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const session = await this.readSession(tx, sessionRef.id);
      if (!closed(session.status)) throw sessionState();
      assertWrite(session, dto);
      const snapshot = session.snapshots[0]?.payload as IkigaiResult | undefined;
      const selected = snapshot?.selectedHypothesisId ?? null;
      const draft = asDraft(session.draft);
      if (!selected || !draft.hypotheses.some((hyp) => hyp.id === selected)) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          message: 'El experimento necesita una posibilidad elegida en el mapa.',
          reason: 'INVALID_EXPERIMENT',
        });
      }
      if (dto.hypothesisId && dto.hypothesisId !== selected) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          message: 'El experimento no corresponde a la posibilidad elegida.',
          reason: 'INVALID_EXPERIMENT',
        });
      }
      draft.nextExperiment = {
        hypothesisId: selected,
        focus: dto.focus.trim(),
        horizonDays: dto.horizonDays,
        action: dto.action.trim(),
        signal: dto.signal.trim(),
        savedAt: new Date().toISOString(),
        reviewStatus: 'CURRENT',
      };
      const changed = await tx.ikigaiSession.updateMany({
        where: {
          id: session.id,
          draftVersion: dto.draftVersion,
          status: { in: [IkigaiSessionStatus.COMPLETED, IkigaiSessionStatus.FOLLOW_UP] },
        },
        data: {
          draft: asJson(draft),
          draftVersion: dto.draftVersion + 1,
          status: IkigaiSessionStatus.FOLLOW_UP,
          lastActivityAt: new Date(),
        },
      });
      if (changed.count !== 1) throw versionConflict(session.draftVersion);
      return {
        nextExperiment: draft.nextExperiment,
        draftVersion: dto.draftVersion + 1,
        definitionSha256: definitionHash(session.definition.payload),
      };
    });
  }

  fileDefinition() {
    return loadDefinition();
  }
}
