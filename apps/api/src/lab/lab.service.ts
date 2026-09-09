import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ALREADY_FROZEN,
  buildExperienceV01,
  buildDirectionReading,
  closerToExpected,
  compareExpectation,
  defaultBlind,
  derivedPayloadBlocked,
  deriveReplayImpact,
  disagreementFromVerdicts,
  EXPECTATION_PENDING,
  facilitatorNoteVisible,
  freezeDestination,
  importantResultChanged,
  isCriticalRegression,
  isFocusKind,
  isMatrixReviewComplete,
  PRODUCT_HYPOTHESIS,
  projectExperience,
  readinessCopy,
  readinessMissing,
  CORE_FAMILY_IDS,
  realCasesAllowed,
  REAL_CASES_GATED,
  toUserView,
  type FocusKind,
  type ProvenanceSource,
  type ResultLite,
  type DirectionReading,
} from '@mk/experience-engine';
import {
  applyChangeOperations,
  buildPolicyPlan,
  canonicalize,
  ENGINE_SEMVER,
  fixtureCatalog,
  formatWhy,
  indexTrace,
  isNoopChange,
  namedPolicy,
  replayMethodology,
  runAssessment,
  sourceMappingById,
  toDiagnosticContract,
  loadSourceMappings,
  stripGeneratedAt,
  validateDefinition,
  type ChangeOperation,
  type MatrixDefinition,
  type ResponseInput,
  type ResultSnapshot,
} from '@mk/matrix-engine';
import {
  LabCaseKind,
  LabChangeSetStatus,
  LabDefinitionStatus,
  LabRunStatus,
  Prisma,
} from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { assertCasebookStoriesClean, CASEBOOK_FAMILIES, CASEBOOK_META, criterionIdForFamilyCase, familiesForKey, pairQuestionFor, questionForFamilyCase } from './lab-casebook';
import { applyFamilyClose, buildFamilyProgress, familyIsResolved, parseFamilyReviews } from './lab-family-progress';
import { buildQuestionBank } from './lab-question-roles';
import { buildRuleCoverage } from './lab-rule-coverage';
import { findingBlocksMatrix, findingEffectiveStatus, findingOpenReady, findingScope, isBlockingFindingStatus } from './lab-finding-ready';
import { decisiveRules, domainComposition, nextThreshold, tieBreakDecided } from './lab-composition';
import { buildDomainFormula, buildItemTrace, buildStateBands } from './lab-item-trace';
import { buildEvidenceSummary } from './lab-evidence';
import { buildPairCompareView, pairCompareAvailable, pairKeyFromCasebook } from './lab-pair';
import {
  buildChangeOperation,
  buildChangeOptions,
  ChangeRequestError,
  inertInterpretationParams,
  type ChangeKind,
} from './lab-change-options';
import {
  aspectCounts,
  classifyObservation,
  hasNonOkAspect,
  validateAspects,
  validateFidelity,
  type ObservationAspects,
  type ObservationFidelity,
} from './lab-observation';
import { listMigrationViews } from './lab-migrations';
import { catalogById } from './lab-review-catalog';
import { hydrateProvenance } from './lab-provenance';
import { buildReviewAgenda } from './lab-review-agenda';
import { loadLabLegacyCatalogs } from './lab-legacy-catalogs';
import { keepCandidateBlocked, replayImpactSummary } from './lab-replay-compare';
import { buildDeliverySections, formatDeliveryMarkdown } from './lab-delivery';
import { casebookDir, loadFrozenDefinition } from './lab-paths';
import { buildQuestionnaireBlueprint, questionScalePayload } from './lab-questionnaire';

const OPS = new Set([
  'SET_RULE_PARAM',
  'SET_QUESTION_WEIGHT',
  'SET_QUESTION_ACTIVE',
  'SET_DIMENSION_ALIAS',
  'SET_INTERPRETATION_PARAM',
]);

function pending(): never {
  throw new HttpException(
    {
      statusCode: 409,
      reason: EXPECTATION_PENDING,
      message: 'Expectation pending',
    },
    HttpStatus.CONFLICT,
  );
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function parseRaw(raw: string | null, kind: string): number | string | null {
  if (raw == null) return null;
  if (kind === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }
  return raw;
}

function encodeRaw(value: unknown): { raw: string | null; kind: string } {
  if (value == null || value === '') return { raw: null, kind: 'null' };
  if (typeof value === 'number') return { raw: String(value), kind: 'number' };
  return { raw: String(value), kind: 'string' };
}

function toResponseInputs(
  rows: Array<{
    questionId: string;
    status: string;
    rawValue: string | null;
    valueKind: string;
    qualitativeConfirmed: boolean | null;
  }>,
): ResponseInput[] {
  return rows.map((row) => ({
    questionId: row.questionId,
    status: row.status as ResponseInput['status'],
    rawValue: parseRaw(row.rawValue, row.valueKind),
    qualitativeConfirmed: row.qualitativeConfirmed,
  }));
}

function parseCasebookResponses(file: string): ResponseInput[] {
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
        qualitativeConfirmed:
          (record.qualitativeConfirmed as boolean | null | undefined) ?? null,
      };
    }
    return {
      questionId,
      status: 'ANSWERED' as const,
      rawValue: value as number | string | null,
    };
  });
}

interface ResolvedAnswer {
  answer_label: string | null;
  answer_ordinal: string | null;
  answer_scale_hint: string | null;
}

/**
 * Resolves the human answer from the scale anchors in the definition. Never invents a
 * label: when the scale has no anchor for the stored value the raw value travels as the
 * ordinal or as the free text the person wrote.
 */
function resolveAnswer(
  definition: MatrixDefinition,
  question: { scale_id: string } | undefined,
  raw: number | string | null,
): ResolvedAnswer {
  const empty: ResolvedAnswer = { answer_label: null, answer_ordinal: null, answer_scale_hint: null };
  if (raw == null || raw === '' || !question) return empty;
  const scale = definition.scales.find((item) => item.id === question.scale_id);
  if (!scale) return { ...empty, answer_label: String(raw) };
  const anchor = scale.anchors.find(
    (item) => item.value != null && String(item.value) === String(raw),
  );
  const openAnchor = scale.anchors.find((item) => item.value == null);
  const ordinal =
    scale.kind === 'SCALE_5' && typeof raw === 'number'
      ? `${raw} de ${scale.anchors.length}`
      : null;
  if (anchor) {
    return { answer_label: anchor.label, answer_ordinal: ordinal, answer_scale_hint: null };
  }
  return {
    answer_label: String(raw),
    answer_ordinal: ordinal,
    answer_scale_hint: openAnchor?.label ?? null,
  };
}

function pairKey(casebookKey: string | null): { pair: string | null; side: string | null } {
  return pairKeyFromCasebook(casebookKey);
}

@Injectable()
export class LabService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** In flight seeding, shared by concurrent requests. */
  private seeding: Promise<void> | null = null;

  private realEnabled(): boolean {
    return this.config.get<string>('LAB_REAL_CASES_ENABLED') === 'true';
  }

  /**
   * The Lab home asks for cases and session progress at the same time. Without this
   * shared promise both requests would seed the casebook and every case would appear twice.
   */
  async ensureFoundation(userId: string) {
    if (!this.seeding) {
      // Released once it settles: seeding is idempotent, and a casebook case removed
      // between requests has to be rebuilt without restarting the API.
      this.seeding = this.seedFoundation(userId).finally(() => {
        this.seeding = null;
      });
    }
    await this.seeding;
    return this.publishedDefinition();
  }

  private async seedFoundation(userId: string) {
    const frozen = loadFrozenDefinition();
    const existing = await this.prisma.labDefinition.findUnique({
      where: { definitionRef: frozen.definition_ref },
    });
    if (!existing) {
      await this.prisma.labDefinition.create({
        data: {
          definitionId: frozen.definition_id,
          revision: frozen.revision,
          definitionRef: frozen.definition_ref,
          definitionSha256: frozen.definition_sha256,
          sourceSha256: frozen.source.sha256,
          status: LabDefinitionStatus.PUBLISHED,
          payload: asJson(frozen),
        },
      });
    }
    const experience = buildExperienceV01();
    const exp = await this.prisma.experienceDefinition.findUnique({
      where: { experienceRef: experience.experience_ref },
    });
    if (!exp) {
      await this.prisma.experienceDefinition.create({
        data: {
          experienceId: experience.experience_id,
          revision: experience.revision,
          experienceRef: experience.experience_ref,
          sha256: experience.sha256,
          status: 'PUBLISHED',
          payload: asJson(experience),
        },
      });
    }
    await this.ensureCasebook(userId);
  }

  private async publishedDefinition() {
    const row = await this.prisma.labDefinition.findUnique({
      where: { definitionRef: loadFrozenDefinition().definition_ref },
    });
    if (!row) throw new NotFoundException('Published definition missing');
    return row.payload as unknown as MatrixDefinition;
  }

  private async definitionByRef(ref: string): Promise<MatrixDefinition> {
    const row = await this.prisma.labDefinition.findUnique({
      where: { definitionRef: ref },
    });
    if (!row) throw new NotFoundException(`Unknown definition_ref ${ref}`);
    return row.payload as unknown as MatrixDefinition;
  }

  async ensureCasebook(userId: string) {
    assertCasebookStoriesClean();
    for (const meta of CASEBOOK_META) {
      const found =
        (await this.prisma.labCase.findFirst({
          where: { casebookKey: meta.key, archivedAt: null },
        })) ??
        (meta.key === 'R15A'
          ? await this.prisma.labCase.findFirst({
              where: { casebookKey: 'R15', archivedAt: null },
            })
          : null);
      if (found) {
        const nextLabel = meta.label;
        const nextStory = meta.story;
        if (
          found.expertContext !== nextStory ||
          found.label !== nextLabel ||
          found.casebookKey !== meta.key
        ) {
          await this.prisma.labCase.update({
            where: { id: found.id },
            data: { expertContext: nextStory, label: nextLabel, casebookKey: meta.key },
          });
        }
        continue;
      }
      const created = await this.prisma.labCase.create({
        data: {
          label: meta.label,
          kind: LabCaseKind.SYNTHETIC,
          blind: true,
          expertContext: meta.story,
          casebookKey: meta.key,
          createdBy: userId,
        },
      });
      const definition = await this.publishedDefinition();
      const run = await this.prisma.labRun.create({
        data: {
          caseId: created.id,
          definitionRef: definition.definition_ref,
          definitionSha256: definition.definition_sha256,
          sourceSha256: definition.source.sha256,
          engineSemver: ENGINE_SEMVER,
          policyId: 'FULL-v1',
          status: LabRunStatus.COLLECTING,
        },
      });
      const responses = parseCasebookResponses(meta.file);
      if (responses.length) {
        await this.prisma.labResponse.createMany({
          data: responses.map((response) => {
            const encoded = encodeRaw(response.rawValue);
            return {
              runId: run.id,
              questionId: response.questionId,
              status: response.status,
              rawValue: encoded.raw,
              valueKind: encoded.kind,
              qualitativeConfirmed: response.qualitativeConfirmed ?? null,
              source: 'FIXTURE',
            };
          }),
        });
      }
    }
  }

  async listDefinitions() {
    await this.ensureFoundation('system');
    const rows = await this.prisma.labDefinition.findMany({
      orderBy: [{ definitionId: 'asc' }, { revision: 'asc' }],
    });
    return rows.map((row) => ({
      definition_ref: row.definitionRef,
      definition_id: row.definitionId,
      revision: row.revision,
      status: row.status,
      definition_sha256: row.definitionSha256,
      source_sha256: row.sourceSha256,
      base_definition_ref: row.baseDefinitionRef,
    }));
  }

  async getDefinition(ref: string) {
    const row = await this.prisma.labDefinition.findUnique({
      where: { definitionRef: decodeURIComponent(ref) },
    });
    if (!row) throw new NotFoundException('Definition not found');
    return {
      definition_ref: row.definitionRef,
      status: row.status,
      definition_sha256: row.definitionSha256,
      payload: row.payload,
    };
  }

  async markDefinition(
    ref: string,
    status: 'ACCEPTED_CANDIDATE' | 'REJECTED' | 'PUBLISHED',
  ) {
    const decoded = decodeURIComponent(ref);
    const row = await this.prisma.labDefinition.findUnique({
      where: { definitionRef: decoded },
    });
    if (!row) throw new NotFoundException('Definition not found');
    if (status === 'PUBLISHED') {
      const frozen = loadFrozenDefinition();
      if (row.definitionSha256 !== frozen.definition_sha256 && decoded === frozen.definition_ref) {
        throw new ConflictException('Repo hash does not match this record');
      }
    }
    const updated = await this.prisma.labDefinition.update({
      where: { definitionRef: decoded },
      data: { status },
    });
    return { definition_ref: updated.definitionRef, status: updated.status };
  }

  async listCases(userId: string) {
    await this.ensureFoundation(userId);
    const cases = await this.prisma.labCase.findMany({
      where: { archivedAt: null },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: {
            responses: { select: { status: true } },
            expectations: { select: { id: true }, take: 1 },
            reviews: {
              select: {
                id: true,
                verdicts: true,
                caseVerdict: true,
                familyVerdicts: true,
                firstWrongLayer: true,
                noMethodologicalProblem: true,
              },
              orderBy: { revision: 'desc' },
              take: 1,
            },
            purposeAssessments: { select: { id: true }, take: 1 },
          },
        },
      },
      // Rafa reads the casebook as R01..R15, so the key orders the list. Rebuilt
      // cases would otherwise jump to the end with createdAt.
      orderBy: [{ casebookKey: 'asc' }, { createdAt: 'asc' }],
    });
    const productReviewRunIds = new Set(
      (await this.prisma.productReview.findMany({ select: { runId: true } })).map(
        (row) => row.runId,
      ),
    );
    const findingCaseIds = new Set(
      (await this.prisma.labFindingCase.findMany({ select: { caseId: true } })).map((row) => row.caseId),
    );
    const definition = await this.publishedDefinition();
    const servedByPolicy = new Map<string, number>();
    return cases.map((item) => {
      const run = item.runs[0];
      const { pair, side } = pairKey(item.casebookKey);
      let served: number | null = null;
      if (run) {
        const cached = servedByPolicy.get(run.policyId);
        if (cached != null) {
          served = cached;
        } else {
          const plan = buildPolicyPlan({
            definition,
            policy: namedPolicy(run.policyId),
            responses: [],
          });
          servedByPolicy.set(run.policyId, plan.questions_served);
          served = plan.questions_served;
        }
      }
      const review = run?.reviews[0] ?? null;
      const verdicts = (review?.verdicts ?? null) as Record<string, unknown> | null;
      const disagreement = disagreementFromVerdicts(verdicts);
      const progress = {
        status: run?.status ?? 'COLLECTING',
        has_expectation: Boolean(run?.expectations.length),
        has_review: Boolean(review),
        has_case_verdict: Boolean(review?.caseVerdict),
        has_purpose: Boolean(run?.purposeAssessments.length),
        has_product_review: run ? productReviewRunIds.has(run.id) : false,
      };
      const meta = CASEBOOK_META.find((entry) => entry.key === item.casebookKey);
      return {
        id: item.id,
        label: meta?.label ?? item.label,
        kind: item.kind,
        blind: item.blind,
        casebook_key: item.casebookKey,
        fixture_key: item.fixtureKey,
        story: meta?.story ?? item.expertContext,
        test_intent: meta?.testIntent ?? null,
        pair,
        pair_side: side,
        has_findings: findingCaseIds.has(item.id),
        derived_from_case_id: item.derivedFromCaseId,
        purpose_answered: meta?.purpose_answered ?? false,
        case_verdict: review?.caseVerdict ?? null,
        family_reviews: parseFamilyReviews(review?.familyVerdicts),
        matrix_review_complete: run ? isMatrixReviewComplete(progress) : false,
        product_review_complete: progress.has_product_review,
        purpose_complete: progress.has_purpose,
        latest_run: run
          ? {
              id: run.id,
              status: run.status,
              policy_id: run.policyId,
              served,
              answered: run.responses.filter((row) => row.status === 'ANSWERED').length,
              skipped: run.responses.filter((row) => row.status === 'SKIPPED_BY_USER').length,
              has_expectation: progress.has_expectation,
              has_review: progress.has_review,
              has_case_verdict: progress.has_case_verdict,
              has_purpose: progress.has_purpose,
              has_product_review: progress.has_product_review,
              disagreement,
            }
          : null,
      };
    });
  }

  async sessionProgress(userId: string) {
    const cases = await this.listCases(userId);
    const [experiments, findingRows, inTest, currentCandidate, pendingDecisions, flagged] = await Promise.all([
      this.prisma.labChangeSet.count(),
      this.prisma.labFinding.findMany({ include: { cases: true } }),
      this.prisma.labFinding.count({ where: { status: 'CHANGE_IN_TEST' } }),
      this.prisma.labDefinition.findFirst({
        where: { status: LabDefinitionStatus.ACCEPTED_CANDIDATE },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.labFinding.count({
        where: {
          OR: [
            { status: { in: ['NEEDS_MORE_CASES', 'WORTH_TESTING'] } },
            { contentChangeRequired: true, status: { in: ['OPEN', 'NEEDS_MORE_CASES', 'WORTH_TESTING'] } },
          ],
        },
      }),
      this.prisma.labQuestionObservation.count({ where: { status: { in: ['PENDING', 'NEEDS_MORE_CASES'] } } }),
    ]);
    const openFindings = findingRows.filter((row) =>
      isBlockingFindingStatus(this.effectiveFindingStatus(row)),
    ).length;
    const relevant = cases.filter((item) => item.latest_run);
    const overview = buildFamilyProgress(cases);
    const nextFamily = overview.families.find(
      (item) => item.review_surface === 'matrix' && !familyIsResolved(item.status),
    );
    const next =
      cases.find(
        (item) =>
          item.casebook_key &&
          nextFamily?.keys.includes(item.casebook_key) &&
          item.latest_run &&
          !item.family_reviews?.[nextFamily.id]?.case_done,
      ) ?? cases.find((item) => item.casebook_key && item.latest_run && !item.matrix_review_complete);
    return {
      ...overview,
      cases_total: relevant.length,
      pending: relevant.filter((item) => !item.matrix_review_complete).length,
      reviewed: relevant.filter((item) => item.matrix_review_complete).length,
      with_disagreement: relevant.filter((item) => item.latest_run?.disagreement).length,
      experiments,
      open_findings: openFindings,
      flagged_questions: flagged,
      pending_decisions: pendingDecisions,
      changes_in_test: inTest,
      current_candidate: currentCandidate?.definitionRef ?? null,
      next_incomplete_run_id: next?.latest_run?.id ?? null,
      next_incomplete_label: next?.label ?? null,
    };
  }

  async createCase(
    userId: string,
    input: { label: string; kind: LabCaseKind; blind?: boolean; expert_context?: string },
  ) {
    if (!realCasesAllowed(input.kind, this.realEnabled())) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        reason: REAL_CASES_GATED,
        message: 'Los casos reales e importados están restringidos.',
      });
    }
    return this.prisma.labCase.create({
      data: {
        label: input.label,
        kind: input.kind,
        blind: input.blind ?? defaultBlind(input.kind),
        expertContext: input.expert_context,
        createdBy: userId,
      },
    });
  }

  async getCase(id: string) {
    const item = await this.prisma.labCase.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          include: {
            expectations: { select: { id: true }, take: 1 },
            reviews: {
              select: { id: true, caseVerdict: true },
              orderBy: { revision: 'desc' },
              take: 1,
            },
            purposeAssessments: { select: { id: true }, take: 1 },
          },
        },
        directions: { orderBy: { revision: 'desc' } },
      },
    });
    if (!item) throw new NotFoundException('Case not found');
    const meta = CASEBOOK_META.find((entry) => entry.key === item.casebookKey);
    const anyRevealed = item.runs.some((run) => facilitatorNoteVisible(run.status));
    const productReviewRunIds = new Set(
      (
        await this.prisma.productReview.findMany({
          where: { runId: { in: item.runs.map((run) => run.id) } },
          select: { runId: true },
        })
      ).map((row) => row.runId),
    );
    return {
      id: item.id,
      label: meta?.label ?? item.label,
      kind: item.kind,
      blind: item.blind,
      expert_context: meta?.story ?? item.expertContext,
      test_intent: meta?.testIntent ?? null,
      casebook_key: item.casebookKey,
      facilitator_note: anyRevealed ? (meta?.facilitator_note ?? null) : null,
      runs: item.runs.map((run) => ({
        id: run.id,
        status: run.status,
        policy_id: run.policyId,
        definition_ref: run.definitionRef,
        frozen_at: run.frozenAt,
        revealed_at: run.revealedAt,
        has_expectation: run.expectations.length > 0,
        has_review: run.reviews.length > 0,
        has_case_verdict: Boolean(run.reviews[0]?.caseVerdict),
        has_purpose: run.purposeAssessments.length > 0,
        has_product_review: productReviewRunIds.has(run.id),
      })),
      directions: item.directions,
    };
  }

  async patchCase(
    id: string,
    input: { label?: string; expert_context?: string; archived?: boolean; blind?: boolean },
  ) {
    const item = await this.prisma.labCase.findUnique({
      where: { id },
      include: { runs: true },
    });
    if (!item) throw new NotFoundException('Case not found');
    if (input.blind != null) {
      const locked = item.runs.some((run) => run.status !== LabRunStatus.COLLECTING);
      if (locked) throw new ConflictException('blind can change only while runs are COLLECTING');
    }
    return this.prisma.labCase.update({
      where: { id },
      data: {
        label: input.label,
        expertContext: input.expert_context,
        archivedAt: input.archived ? new Date() : input.archived === false ? null : undefined,
        blind: input.blind,
      },
    });
  }

  async createRun(caseId: string, input: { policy_id?: string; definition_ref?: string }) {
    const item = await this.prisma.labCase.findUnique({ where: { id: caseId } });
    if (!item) throw new NotFoundException('Case not found');
    const definition = input.definition_ref
      ? await this.definitionByRef(input.definition_ref)
      : await this.publishedDefinition();
    return this.prisma.labRun.create({
      data: {
        caseId,
        definitionRef: definition.definition_ref,
        definitionSha256: definition.definition_sha256,
        sourceSha256: definition.source.sha256,
        engineSemver: ENGINE_SEMVER,
        policyId: input.policy_id ?? 'FULL-v1',
        status: LabRunStatus.COLLECTING,
      },
    });
  }

  private async loadRun(id: string) {
    const run = await this.prisma.labRun.findUnique({
      where: { id },
      include: {
        case: true,
        responses: true,
        expectations: { orderBy: { revision: 'desc' } },
        reviews: { orderBy: { revision: 'desc' } },
        purposeAssessments: { orderBy: { revision: 'desc' } },
        safetyAssessments: { orderBy: { submittedAt: 'desc' } },
      },
    });
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }

  private assertDerived(run: { status: LabRunStatus }, endpoint: string) {
    if (derivedPayloadBlocked(run.status, endpoint)) pending();
  }

  async getRun(id: string) {
    const run = await this.loadRun(id);
    const definition = await this.definitionByRef(run.definitionRef);
    const policy = namedPolicy(run.policyId);
    const plan = buildPolicyPlan({
      definition,
      policy,
      responses: toResponseInputs(run.responses),
    });
    const answered = run.responses.filter((row) => row.status === 'ANSWERED').length;
    const skipped = run.responses.filter((row) => row.status === 'SKIPPED_BY_USER').length;
    const noteVisible = facilitatorNoteVisible(run.status);
    const { pair, side } = pairKey(run.case.casebookKey);
    const projections = await this.prisma.experienceProjectionRecord.count({
      where: { runId: run.id },
    });
    const productReviews = await this.prisma.productReview.count({ where: { runId: run.id } });
    const meta = CASEBOOK_META.find((item) => item.key === run.case.casebookKey);
    const latestReview = run.reviews[0] ?? null;
    const evidence = buildEvidenceSummary(definition, toResponseInputs(run.responses), {
      revealed: run.status === LabRunStatus.REVEALED,
    });
    let derivedFromLabel: string | null = null;
    if (run.case.derivedFromCaseId) {
      const parent = await this.prisma.labCase.findUnique({
        where: { id: run.case.derivedFromCaseId },
      });
      const parentMeta = CASEBOOK_META.find((item) => item.key === parent?.casebookKey);
      derivedFromLabel = parentMeta?.label ?? parent?.label ?? null;
    }
    return {
      id: run.id,
      case_id: run.caseId,
      case_label: meta?.label ?? run.case.label,
      case_kind: run.case.kind,
      casebook_key: run.case.casebookKey,
      expert_context: meta?.story ?? run.case.expertContext,
      test_intent: meta?.testIntent ?? null,
      method_families: familiesForKey(run.case.casebookKey).map((item) => ({
        id: item.id,
        label: item.label,
        question: questionForFamilyCase(item, run.case.casebookKey ?? ''),
        review_prompt: questionForFamilyCase(item, run.case.casebookKey ?? ''),
        review_surface: item.review_surface,
        criterion_id: criterionIdForFamilyCase(item, run.case.casebookKey ?? ''),
      })),
      // POST-REVEAL ONLY: the note states what the Matrix is expected to produce.
      facilitator_note: noteVisible ? (meta?.facilitator_note ?? null) : null,
      pair,
      pair_side: side,
      blind: run.case.blind,
      status: run.status,
      policy_id: run.policyId,
      definition_ref: run.definitionRef,
      definition_sha256: run.definitionSha256,
      engine_semver: run.engineSemver,
      skipped_expectation: run.skippedExpectation,
      served: plan.questions_served,
      answered,
      skipped,
      unanswered: Math.max(plan.questions_served - answered - skipped, 0),
      has_expectation: run.expectations.length > 0,
      has_review: run.reviews.length > 0,
      has_case_verdict: Boolean(latestReview?.caseVerdict),
      family_reviews: parseFamilyReviews(latestReview?.familyVerdicts),
      has_purpose: run.purposeAssessments.length > 0,
      has_projection: projections > 0,
      has_product_review: productReviews > 0,
      matrix_review_complete: isMatrixReviewComplete({
        status: run.status,
        has_expectation: run.expectations.length > 0,
        has_review: run.reviews.length > 0,
        has_case_verdict: Boolean(latestReview?.caseVerdict),
      }),
      evidence,
      frozen_at: run.frozenAt,
      revealed_at: run.revealedAt,
      derived_from_case_id: run.case.derivedFromCaseId,
      derived_from_label: derivedFromLabel,
      responses_editable: run.status === LabRunStatus.COLLECTING && !run.case.casebookKey,
      purpose_answered: meta?.purpose_answered ?? false,
    };
  }

  async listQuestions(runId: string) {
    const run = await this.loadRun(runId);
    const definition = await this.definitionByRef(run.definitionRef);
    const policy = namedPolicy(run.policyId);
    const plan = buildPolicyPlan({
      definition,
      policy,
      responses: toResponseInputs(run.responses),
    });
    const byId = new Map(run.responses.map((row) => [row.questionId, row]));
    const dimensionLabels = new Map(
      definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key]),
    );
    const observations = await this.prisma.labQuestionObservation.findMany({
      where: { questionId: { in: plan.served_ids } },
      select: {
        questionId: true,
        caseId: true,
        status: true,
        note: true,
        issueTypes: true,
        id: true,
        case: { select: { label: true, casebookKey: true } },
      },
    });
    return plan.served_ids.map((id) => {
      const question = definition.questions.find((item) => item.id === id);
      const response = byId.get(id);
      const raw = response ? parseRaw(response.rawValue, response.valueKind) : null;
      const answer = resolveAnswer(definition, question, raw);
      const here = observations.filter((row) => row.questionId === id && row.caseId === run.caseId);
      const others = observations.filter((row) => row.questionId === id && row.caseId !== run.caseId);
      return {
        id,
        text: question?.text ?? id,
        domain: question?.domain ?? null,
        dimension: question?.dimension ?? null,
        dimension_label: question ? (dimensionLabels.get(question.dimension) ?? null) : null,
        scale_id: question?.scale_id ?? null,
        scale_kind: definition.scales.find((item) => item.id === question?.scale_id)?.kind ?? null,
        scale: questionScalePayload(definition, question),
        weight: question?.weight ?? null,
        active: question?.active ?? null,
        scoreable: question?.scoreable ?? null,
        is_risk: Boolean(question?.risk),
        status: response?.status ?? 'UNANSWERED',
        raw_value: raw,
        ...answer,
        qualitative_confirmed: response?.qualitativeConfirmed ?? null,
        skipped: response?.status === 'SKIPPED_BY_USER',
        source_mapping: sourceMappingById(id),
        flagged_here: here.length > 0,
        observation_id: here[0]?.id ?? null,
        other_observations: run.status === LabRunStatus.REVEALED ? others.length : 0,
        other_notes:
          run.status === LabRunStatus.REVEALED
            ? others.map((row) => {
                const meta = CASEBOOK_META.find((entry) => entry.key === row.case?.casebookKey);
                return {
                  id: row.id,
                  note: row.note,
                  issue_types: row.issueTypes,
                  case_label: meta?.label ?? row.case?.label ?? null,
                  casebook_key: row.case?.casebookKey ?? null,
                };
              })
            : [],
      };
    });
  }

  async nextQuestion(runId: string) {
    const questions = await this.listQuestions(runId);
    const next = questions.find((item) => item.status !== 'ANSWERED' && !item.skipped);
    return { next, remaining: questions.filter((item) => item.status !== 'ANSWERED').length };
  }

  private assertResponsesWritable(run: { status: LabRunStatus; case: { casebookKey: string | null } }) {
    if (run.status !== LabRunStatus.COLLECTING) {
      throw new ConflictException('Las respuestas ya están cerradas.');
    }
    if (run.case.casebookKey) {
      throw new ConflictException('Base case responses are immutable. Duplicate the case to edit answers.');
    }
  }

  private responseUpsert(
    runId: string,
    input: {
      question_id: string;
      raw_value?: unknown;
      qualitative_confirmed?: boolean | null;
      status?: string;
    },
  ) {
    const encoded = encodeRaw(input.raw_value);
    const status = input.status ?? (encoded.raw == null ? 'SKIPPED_BY_USER' : 'ANSWERED');
    return this.prisma.labResponse.upsert({
      where: { runId_questionId: { runId, questionId: input.question_id } },
      create: {
        runId,
        questionId: input.question_id,
        status,
        rawValue: encoded.raw,
        valueKind: encoded.kind,
        qualitativeConfirmed: input.qualitative_confirmed ?? null,
        source: 'MANUAL',
      },
      update: {
        status,
        rawValue: encoded.raw,
        valueKind: encoded.kind,
        qualitativeConfirmed: input.qualitative_confirmed ?? null,
        source: 'MANUAL',
      },
    });
  }

  async saveResponse(
    runId: string,
    input: {
      question_id: string;
      raw_value?: unknown;
      qualitative_confirmed?: boolean | null;
      status?: string;
    },
  ) {
    const run = await this.loadRun(runId);
    this.assertResponsesWritable(run);
    await this.responseUpsert(runId, input);
    return this.listQuestions(runId);
  }

  async saveResponses(
    runId: string,
    inputs: Array<{
      question_id: string;
      raw_value?: unknown;
      qualitative_confirmed?: boolean | null;
      status?: string;
    }>,
  ) {
    const run = await this.loadRun(runId);
    this.assertResponsesWritable(run);
    const rows = inputs.filter((item) => item.question_id);
    if (rows.length) {
      await this.prisma.$transaction(rows.map((item) => this.responseUpsert(runId, item)));
    }
    return this.listQuestions(runId);
  }

  async freeze(runId: string) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.COLLECTING || run.snapshot) {
      throw new HttpException(
        { statusCode: 409, reason: ALREADY_FROZEN, message: 'Run already frozen' },
        HttpStatus.CONFLICT,
      );
    }
    const definition = await this.definitionByRef(run.definitionRef);
    const policy = namedPolicy(run.policyId);
    const snapshot = runAssessment({
      definition,
      responses: toResponseInputs(run.responses),
      policy,
      engineSemver: ENGINE_SEMVER,
      now: new Date().toISOString(),
    });
    const directionReading = buildDirectionReading({
      definition,
      responses: toResponseInputs(run.responses),
    });
    const nextStatus = freezeDestination(run.case.blind);
    const updated = await this.prisma.labRun.update({
      where: { id: runId },
      data: {
        status: nextStatus,
        snapshot: asJson(snapshot),
        responsesHash: snapshot.responses_hash,
        frozenAt: new Date(),
        revealedAt: nextStatus === LabRunStatus.REVEALED ? new Date() : null,
        directionReading: asJson(directionReading),
        directionMethodologyVersion: directionReading.methodology_version,
      },
    });
    return { id: updated.id, status: updated.status, responses_hash: updated.responsesHash };
  }

  async submitExpectation(
    runId: string,
    userId: string,
    input: {
      expected_states: Record<string, string>;
      expected_priority_domain: string;
      expected_plan_id?: string | null;
      expected_plan_free_text?: string | null;
      expected_alerts?: string[];
      expected_purpose_stage: string;
      confidence: string;
      notes?: string | null;
      open_what_is_happening?: string | null;
      open_main_concern?: string | null;
      open_first_focus?: string | null;
      open_first_action?: string | null;
      personal_first_domain?: string | null;
    },
  ) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.AWAITING_EXPECTATION && run.status !== LabRunStatus.REVEALED) {
      throw new ConflictException('Freeze the run before recording an expectation');
    }
    const revision = (run.expectations[0]?.revision ?? 0) + 1;
    const created = await this.prisma.labExpectation.create({
      data: {
        runId,
        revision,
        expectedStates: asJson(input.expected_states),
        expectedPriorityDomain: input.expected_priority_domain,
        expectedPlanId: input.expected_plan_id ?? null,
        expectedPlanFreeText: input.expected_plan_free_text ?? null,
        expectedAlerts: input.expected_alerts ?? [],
        expectedPurposeStage: input.expected_purpose_stage,
        confidence: input.confidence,
        notes: input.notes ?? null,
        openWhatIsHappening: input.open_what_is_happening ?? null,
        openMainConcern: input.open_main_concern ?? null,
        openFirstFocus: input.open_first_focus ?? null,
        openFirstAction: input.open_first_action ?? null,
        personalFirstDomain: input.personal_first_domain ?? null,
        submittedBy: userId,
      },
    });
    if (run.status === LabRunStatus.AWAITING_EXPECTATION) {
      await this.prisma.labRun.update({
        where: { id: runId },
        data: { status: LabRunStatus.REVEALED, revealedAt: new Date() },
      });
    }
    return created;
  }

  async getExpectation(runId: string) {
    const run = await this.loadRun(runId);
    return {
      latest: run.expectations[0] ?? null,
      history: run.expectations,
    };
  }

  async reveal(runId: string) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.AWAITING_EXPECTATION) {
      throw new ConflictException('Run is not awaiting expectation');
    }
    const updated = await this.prisma.labRun.update({
      where: { id: runId },
      data: {
        status: LabRunStatus.REVEALED,
        skippedExpectation: true,
        revealedAt: new Date(),
      },
    });
    return { id: updated.id, status: updated.status, skipped_expectation: true };
  }

  private snapshotOf(run: { status: LabRunStatus; snapshot: Prisma.JsonValue | null }, endpoint: string): ResultSnapshot {
    this.assertDerived(run, endpoint);
    if (!run.snapshot) throw new NotFoundException('Snapshot not available');
    return run.snapshot as unknown as ResultSnapshot;
  }

  async result(runId: string) {
    const run = await this.loadRun(runId);
    const snapshot = this.snapshotOf(run, 'result');
    const definition = await this.definitionByRef(run.definitionRef);
    const index = indexTrace(snapshot.trace);
    const counterfactuals: Record<string, number | null> = {};
    for (const domain of snapshot.domains) {
      const node = index.get(`domain_score:${domain.key}`);
      const output = node?.output as { counterfactual_item_weighted?: number | null } | undefined;
      counterfactuals[domain.key] = output?.counterfactual_item_weighted ?? null;
    }
    const tieBreak = definition.interpretations.find((item) => item.id === 'LAB-PRIORITY-01')
      ?.params.domain_tie_break;
    const composition = Object.fromEntries(
      snapshot.domains
        .filter((domain) => ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'].includes(domain.key))
        .map((domain) => [
          domain.key,
          domainComposition(
            snapshot,
            domain.key,
            Object.fromEntries(definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key])),
          ),
        ]),
    );
    const plan = buildPolicyPlan({
      definition,
      policy: namedPolicy(run.policyId),
      responses: toResponseInputs(run.responses),
    });
    return {
      snapshot,
      diagnostic_contract: toDiagnosticContract(snapshot),
      direction_reading: (run.directionReading as DirectionReading | null) ?? null,
      purpose_is_not_a_domain_output: true,
      purpose_dimension_scores_are_lab_only: true,
      catalog: {
        plans: definition.plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          domain: plan.domain,
          state: plan.state,
          duration_text: plan.duration_text,
          objective_ids: plan.objective_ids,
        })),
        objectives: definition.objectives.map((objective) => ({
          id: objective.id,
          plan_id: objective.plan_id,
          text: objective.text,
          sequence: objective.sequence,
          horizon_weeks: objective.horizon_weeks,
        })),
        dimension_labels: Object.fromEntries(
          definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key]),
        ),
      },
      lab_reading: {
        counterfactual_item_weighted: counterfactuals,
        tie_break_order: Array.isArray(tieBreak) ? (tieBreak as string[]) : [],
        coverage_bands: definition.coverage_bands,
        composition,
        item_trace: buildItemTrace(
          definition,
          snapshot,
          composition,
          plan.served_ids,
          toResponseInputs(run.responses),
        ),
        state_bands: buildStateBands(definition),
        domain_formula: buildDomainFormula(snapshot, composition),
        thresholds: Object.fromEntries(
          snapshot.domains.map((domain) => [domain.key, nextThreshold(domain.score_display)]),
        ),
        decisive_rules: decisiveRules(snapshot, tieBreakDecided(snapshot)),
        equal_dimension_weight: true,
      },
    };
  }

  async trace(runId: string) {
    const run = await this.loadRun(runId);
    const snapshot = this.snapshotOf(run, 'trace');
    return { trace: snapshot.trace, why: formatWhy(snapshot) };
  }

  async preview(runId: string) {
    const run = await this.loadRun(runId);
    if (run.case.blind && run.status !== LabRunStatus.REVEALED) pending();
    if (run.status === LabRunStatus.COLLECTING && !run.case.blind) {
      const definition = await this.definitionByRef(run.definitionRef);
      const snapshot = runAssessment({
        definition,
        responses: toResponseInputs(run.responses),
        policy: namedPolicy(run.policyId),
        engineSemver: ENGINE_SEMVER,
        now: new Date().toISOString(),
      });
      return { partial: true, snapshot };
    }
    return { partial: false, snapshot: this.snapshotOf(run, 'preview') };
  }

  async comparison(runId: string) {
    const run = await this.loadRun(runId);
    const snapshot = this.snapshotOf(run, 'comparison');
    const expectation = run.expectations[0];
    if (!expectation) {
      return { expectation: null, comparison: null };
    }
    const expectedStates = expectation.expectedStates as Record<string, string>;
    const comparison = compareExpectation({
      firedAlerts: snapshot.safety.alerts.filter((alert) => alert.fired).map((alert) => alert.question_id),
      classifications: Object.fromEntries(
        snapshot.domains.map((domain) => [domain.key, domain.classification]),
      ),
      states: Object.fromEntries(snapshot.domains.map((domain) => [domain.key, domain.state_final])),
      priority: snapshot.priority.domain,
      planId: snapshot.recommendations.primary?.plan_id ?? null,
      expectedAlerts: expectation.expectedAlerts,
      expectedStates,
      expectedPriority: expectation.expectedPriorityDomain,
      expectedPlanId: expectation.expectedPlanId,
    });
    const domainNames: Record<string, string> = {
      MENTALIDAD: 'Mentalidad',
      RELACIONES: 'Relaciones',
      FINANZAS: 'Finanzas',
      CUERPO: 'Cuerpo',
    };
    const stateNames: Record<string, string> = {
      CONTENCIÓN: 'Contención',
      ESTABILIZACIÓN: 'Estabilización',
      CONSOLIDACIÓN: 'Consolidación',
      EXPANSIÓN: 'Expansión',
      NO_CLASIFICADO: 'No clasificado',
      UNSURE: 'No estoy seguro',
    };
    const agreements: Array<{ concept: string; text: string }> = [];
    const differences: Array<{ concept: string; expected: string; actual: string; text: string }> = [];
    for (const key of ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const) {
      const expected = expectedStates[key];
      const actual = snapshot.domains.find((item) => item.key === key)?.state_final ?? 'NO_CLASIFICADO';
      const concept = domainNames[key] ?? key;
      if (!expected || expected === 'UNSURE') continue;
      if (expected === actual) {
        agreements.push({ concept, text: `${concept}: ${stateNames[actual] ?? actual}` });
      } else {
        differences.push({
          concept,
          expected,
          actual,
          text: `${concept}: tú ${stateNames[expected] ?? expected}, la Matriz ${stateNames[actual] ?? actual}`,
        });
      }
    }
    const expectedPriority = expectation.expectedPriorityDomain;
    const actualPriority = snapshot.priority.domain;
    if (expectedPriority && expectedPriority !== 'UNSURE') {
      const expectedName = domainNames[expectedPriority] ?? expectedPriority;
      const actualName = actualPriority ? domainNames[actualPriority] ?? actualPriority : 'Ninguno';
      if (expectedPriority === actualPriority) {
        agreements.push({ concept: 'Ámbito prioritario', text: `Ámbito prioritario: ${actualName}` });
      } else {
        differences.push({
          concept: 'Ámbito prioritario',
          expected: expectedPriority,
          actual: actualPriority ?? 'NONE',
          text: `Ámbito prioritario: tú ${expectedName}, la Matriz ${actualName}`,
        });
      }
    }
    const expectedPlan = expectation.expectedPlanId;
    const actualPlan = snapshot.recommendations.primary?.plan_id ?? null;
    if (expectedPlan) {
      if (expectedPlan === actualPlan) {
        agreements.push({ concept: 'Ruta', text: `Ruta: ${actualPlan}` });
      } else {
        differences.push({
          concept: 'Ruta',
          expected: expectedPlan,
          actual: actualPlan ?? 'NONE',
          text: `Ruta: tú ${expectedPlan}, la Matriz ${actualPlan ?? 'sin ruta'}`,
        });
      }
    }
    const alertRow = comparison.rows.find((row) => row.key === 'alerts');
    if (alertRow?.result === 'MATCH') {
      agreements.push({ concept: 'Alertas', text: 'Alertas: coinciden' });
    } else if (alertRow?.result === 'DIVERGENCE') {
      differences.push({
        concept: 'Alertas',
        expected: expectation.expectedAlerts.join(', ') || 'ninguna',
        actual: snapshot.safety.alerts.filter((item) => item.fired).map((item) => item.question_id).join(', ') || 'ninguna',
        text: 'Alertas: no coinciden',
      });
    }
    return { expectation, comparison: { ...comparison, agreements, differences } };
  }

  async submitReview(runId: string, userId: string, input: {
    verdicts: Record<string, unknown>;
    first_wrong_layer?: string | null;
    root_cause_codes?: string[];
    evidence_refs?: string[];
    notes?: string | null;
    recommended_plan_id?: string | null;
    post_reveal_states?: Record<string, string> | null;
    post_reveal_priority_domain?: string | null;
    no_methodological_problem?: boolean;
    case_verdict?: string | null;
    family_verdicts?: Record<string, { verdict?: string | null; case_done?: boolean }>;
    hypothesis?: string | null;
    disposition?: string | null;
    linked_finding_id?: string | null;
    doubted_rules?: string[];
  }) {
    const run = await this.loadRun(runId);
    this.assertDerived(run, 'review');
    const revision = (run.reviews[0]?.revision ?? 0) + 1;
    return this.prisma.labReview.create({
      data: {
        runId,
        revision,
        verdicts: asJson(input.verdicts),
        firstWrongLayer: input.first_wrong_layer ?? null,
        rootCauseCodes: input.root_cause_codes ?? [],
        evidenceRefs: input.evidence_refs ?? [],
        notes: input.notes ?? null,
        recommendedPlanId: input.recommended_plan_id ?? null,
        postRevealStates: input.post_reveal_states ? asJson(input.post_reveal_states) : undefined,
        postRevealPriorityDomain: input.post_reveal_priority_domain ?? null,
        noMethodologicalProblem: Boolean(input.no_methodological_problem),
        caseVerdict: input.case_verdict ?? null,
        familyVerdicts: (input.family_verdicts ?? {}) as Prisma.InputJsonValue,
        hypothesis: input.hypothesis ?? null,
        disposition: input.disposition ?? null,
        linkedFindingId: input.linked_finding_id ?? null,
        doubtedRules: input.doubted_rules ?? [],
        submittedBy: userId,
      },
    });
  }

  async patchReviewVerdict(
    runId: string,
    userId: string,
    input: {
      case_verdict: string;
      family_id?: string | null;
      pair_conclusion?: boolean;
      hypothesis?: string | null;
      disposition?: string | null;
      linked_finding_id?: string | null;
      criterion_id?: string | null;
    },
  ) {
    let run = await this.loadRun(runId);
    if (run.status === LabRunStatus.AWAITING_EXPECTATION) {
      await this.reveal(runId);
      run = await this.loadRun(runId);
    }
    this.assertDerived(run, 'review');
    const latest = run.reviews[0];
    const familyId =
      input.family_id ??
      (familiesForKey(run.case.casebookKey).length === 1 ? familiesForKey(run.case.casebookKey)[0]?.id : null);
    const family = CASEBOOK_FAMILIES.find((item) => item.id === familyId);
    const nextReviews = applyFamilyClose({
      current: parseFamilyReviews(latest?.familyVerdicts),
      familyId,
      verdictAt: family?.verdict_at,
      pairConclusion: Boolean(input.pair_conclusion),
      verdict: input.case_verdict,
      criterion_id:
        input.criterion_id ??
        (family && run.case.casebookKey ? criterionIdForFamilyCase(family, run.case.casebookKey) : familyId),
    });
    if (!latest) {
      return this.submitReview(runId, userId, {
        verdicts: {},
        notes: input.hypothesis ?? null,
        no_methodological_problem: input.case_verdict === 'REPRESENTS',
        case_verdict: input.case_verdict,
        family_verdicts: nextReviews,
        hypothesis: input.hypothesis ?? null,
        disposition: input.disposition ?? (input.case_verdict === 'IMPORTANT_DIFF' ? 'CREATE_FINDING' : 'NO_CHANGE'),
        linked_finding_id: input.linked_finding_id ?? null,
      });
    }
    return this.prisma.labReview.update({
      where: { id: latest.id },
      data: {
        caseVerdict: input.case_verdict,
        familyVerdicts: nextReviews as Prisma.InputJsonValue,
        hypothesis: input.hypothesis ?? null,
        disposition: input.disposition ?? null,
        linkedFindingId: input.linked_finding_id ?? null,
        submittedBy: userId,
      },
    });
  }

  async getReview(runId: string) {
    const run = await this.loadRun(runId);
    this.assertDerived(run, 'review');
    return { latest: run.reviews[0] ?? null, history: run.reviews };
  }

  async submitPurpose(runId: string, userId: string, input: {
    stage: string;
    evidence_refs?: string[];
    confidence: string;
    notes?: string | null;
  }) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.REVEALED) pending();
    const revision = (run.purposeAssessments[0]?.revision ?? 0) + 1;
    return this.prisma.labExpertPurposeAssessment.create({
      data: {
        runId,
        revision,
        stage: input.stage,
        evidenceRefs: input.evidence_refs ?? [],
        confidence: input.confidence,
        notes: input.notes ?? null,
        submittedBy: userId,
      },
    });
  }

  async submitSafety(runId: string, userId: string, input: {
    question_id: string;
    verdict: string;
    notes?: string | null;
  }) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.REVEALED) pending();
    return this.prisma.labSafetyAssessment.create({
      data: {
        runId,
        questionId: input.question_id,
        verdict: input.verdict,
        notes: input.notes ?? null,
        submittedBy: userId,
      },
    });
  }

  async assessments(runId: string) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.REVEALED) pending();
    return {
      purpose: run.purposeAssessments,
      safety: run.safetyAssessments,
      matrix_purpose: 'NO_DOMAIN_OUTPUT',
    };
  }

  async questionCard(id: string) {
    const definition = await this.publishedDefinition();
    const question = definition.questions.find((item) => item.id === id);
    if (!question) throw new NotFoundException('Question not found');
    return { ...question, source_mapping: sourceMappingById(id) };
  }

  listSourceMappings(confidence?: string) {
    const mappings = loadSourceMappings().filter((item) => {
      if (confidence === 'LOW') return item.confidence === 'LOW' || item.transformation_type === 'UNCLEAR';
      return true;
    });
    return { mappings };
  }

  async listMigrations() {
    const stored = await this.prisma.labMigrationDecision.findMany();
    return { migrations: listMigrationViews(stored) };
  }

  async reviewAgenda() {
    const cases = await this.prisma.labCase.findMany({
      where: { archivedAt: null, casebookKey: { not: null } },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: {
            reviews: { orderBy: { revision: 'desc' }, take: 1 },
            expectations: { select: { id: true }, take: 1 },
          },
        },
        findings: { include: { finding: true } },
      },
    });
    const overview = buildFamilyProgress(
      cases.map((item) => {
        const run = item.runs[0];
        return {
          casebook_key: item.casebookKey,
          matrix_review_complete: isMatrixReviewComplete({
            status: run?.status ?? 'COLLECTING',
            has_expectation: Boolean(run?.expectations.length),
            has_review: Boolean(run?.reviews[0]),
            has_case_verdict: Boolean(run?.reviews[0]?.caseVerdict),
          }),
          case_verdict: run?.reviews[0]?.caseVerdict ?? null,
          family_reviews: parseFamilyReviews(run?.reviews[0]?.familyVerdicts),
          has_open_finding: item.findings.some((link) =>
            ['OPEN', 'NEEDS_MORE_CASES', 'WORTH_TESTING', 'CHANGE_IN_TEST'].includes(link.finding.status),
          ),
          test_intent: CASEBOOK_META.find((entry) => entry.key === item.casebookKey)?.testIntent ?? null,
          latest_run: run ? { id: run.id } : null,
        };
      }),
    );
    const stored = await this.prisma.labMigrationDecision.findMany();
    return {
      ...buildReviewAgenda({ families: overview.families, stored }),
      legacy_catalogs: loadLabLegacyCatalogs(),
    };
  }

  async patchMigration(id: string, input: { rafa_verdict?: string | null; rafa_note?: string | null }) {
    const seed = catalogById(id);
    const ledger = listMigrationViews([]).find((row) => row.id === id);
    if (!seed && !ledger) throw new NotFoundException('Migration not found');
    const row = await this.prisma.labMigrationDecision.upsert({
      where: { id },
      create: {
        id,
        rafaVerdict: input.rafa_verdict ?? null,
        rafaNote: input.rafa_note ?? null,
      },
      update: {
        ...(input.rafa_verdict !== undefined ? { rafaVerdict: input.rafa_verdict } : {}),
        ...(input.rafa_note !== undefined ? { rafaNote: input.rafa_note } : {}),
      },
    });
    if (seed) return hydrateProvenance(seed, row);
    return listMigrationViews([row]).find((item) => item.id === id);
  }

  async ruleCard(id: string) {
    const definition = await this.publishedDefinition();
    const rule = definition.rules.find((item) => item.id === id);
    if (!rule) throw new NotFoundException('Rule not found');
    return rule;
  }

  async createWorkspace(userId: string, baseRef: string) {
    await this.definitionByRef(baseRef);
    return this.prisma.labDefinitionWorkspace.create({
      data: {
        baseDefinitionRef: baseRef,
        pendingOperations: [],
        createdBy: userId,
      },
    });
  }

  async getWorkspace(id: string) {
    const workspace = await this.prisma.labDefinitionWorkspace.findUnique({
      where: { id },
      include: { changeSets: { orderBy: { number: 'desc' } } },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async patchOperations(id: string, operations: unknown[]) {
    const workspace = await this.getWorkspace(id);
    const normalized = operations.map((item) => {
      const op = item as ChangeOperation;
      if (!OPS.has(op.op)) {
        throw new UnprocessableEntityException(`Operation ${String((item as { op?: string }).op)} is not allowed`);
      }
      return op;
    });
    return this.prisma.labDefinitionWorkspace.update({
      where: { id: workspace.id },
      data: { pendingOperations: asJson(normalized) },
    });
  }

  async materialize(
    id: string,
    userId: string,
    input: {
      reason: string;
      related_case_ids?: string[];
      related_run_ids?: string[];
      related_review_ids?: string[];
    },
  ) {
    if (!input.reason.trim()) {
      throw new UnprocessableEntityException('reason is required');
    }
    const workspace = await this.getWorkspace(id);
    const base = await this.definitionByRef(workspace.baseDefinitionRef);
    const operations = (workspace.pendingOperations as unknown as ChangeOperation[]) ?? [];
    if (!operations.length) throw new UnprocessableEntityException('no operations to materialize');
    let candidate: MatrixDefinition;
    try {
      candidate = applyChangeOperations(base, operations);
    } catch (error) {
      // The engine refuses an operation whose `from` no longer matches the base definition.
      // That is a 422, not a server fault.
      throw new UnprocessableEntityException({
        reason: 'CHANGE_NOT_APPLICABLE',
        message:
          'El cambio ya no se puede aplicar sobre esta definición: el valor de partida cambió.',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    if (isNoopChange(base, candidate)) {
      throw new UnprocessableEntityException({
        reason: 'CHANGE_NO_EFFECT',
        message: 'Ese valor es igual al actual, así que no hay nada que comparar.',
      });
    }
    const issues = validateDefinition(candidate, {
      questionRows: candidate.questions.map((question) => ({
        ID_Pregunta: question.id,
        Dimensión: question.dimension,
        Ámbito: question.domain,
        Ponderación: question.weight,
      })),
      catalogs: {},
    });
    const errors = issues.filter((issue) => issue.severity === 'ERROR');
    if (errors.length) {
      throw new UnprocessableEntityException({ reason: 'VALIDATION_FAILED', errors });
    }
    const latest = await this.prisma.labDefinition.findFirst({
      where: { definitionId: base.definition_id },
      orderBy: { revision: 'desc' },
    });
    const revision = (latest?.revision ?? base.revision) + 1;
    const definitionRef = `${base.definition_id}@${revision}`;
    candidate.revision = revision;
    candidate.definition_ref = definitionRef;
    const created = await this.prisma.labDefinition.create({
      data: {
        definitionId: base.definition_id,
        revision,
        definitionRef,
        definitionSha256: candidate.definition_sha256,
        sourceSha256: candidate.source.sha256,
        status: LabDefinitionStatus.CANDIDATE,
        payload: asJson(candidate),
        baseDefinitionRef: base.definition_ref,
      },
    });
    const number = (workspace.changeSets[0]?.number ?? 0) + 1;
    const changeset = await this.prisma.labChangeSet.create({
      data: {
        number,
        workspaceId: workspace.id,
        baseDefinitionRef: base.definition_ref,
        baseDefinitionSha256: base.definition_sha256,
        targetDefinitionRef: created.definitionRef,
        targetDefinitionSha256: created.definitionSha256,
        operations: asJson(operations),
        reason: input.reason,
        relatedCaseIds: input.related_case_ids ?? [],
        relatedRunIds: input.related_run_ids ?? [],
        relatedReviewIds: input.related_review_ids ?? [],
        status: LabChangeSetStatus.MATERIALIZED,
        createdBy: userId,
      },
    });
    await this.prisma.labDefinition.update({
      where: { id: created.id },
      data: { changesetId: changeset.id },
    });
    await this.prisma.labDefinitionWorkspace.update({
      where: { id: workspace.id },
      data: { pendingOperations: [] },
    });
    return { definition: created, changeset };
  }

  /** Everything the guided change wizard needs: no free text, no technical `from`. */
  /**
   * Plan and objective names of the run's definition. Definition content only, so it is
   * safe before the reveal: it says nothing about this case.
   */
  async catalog(runId: string) {
    const run = await this.loadRun(runId);
    const definition = await this.definitionByRef(run.definitionRef);
    return {
      definition_ref: definition.definition_ref,
      plans: definition.plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        domain: plan.domain,
        state: plan.state,
        duration_text: plan.duration_text,
        objective_ids: plan.objective_ids,
      })),
      objectives: definition.objectives.map((objective) => ({
        id: objective.id,
        plan_id: objective.plan_id,
        text: objective.text,
        sequence: objective.sequence,
        horizon_weeks: objective.horizon_weeks,
      })),
      dimension_labels: Object.fromEntries(
        definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key]),
      ),
      questionnaire: buildQuestionnaireBlueprint(definition, buildPolicyPlan({
        definition,
        policy: namedPolicy(run.policyId),
        responses: toResponseInputs(run.responses),
      }).served_ids),
    };
  }

  async changeOptions(runId: string) {
    const run = await this.loadRun(runId);
    const definition = await this.definitionByRef(run.definitionRef);
    const policy = namedPolicy(run.policyId);
    const plan = buildPolicyPlan({
      definition,
      policy,
      responses: toResponseInputs(run.responses),
    });
    const served = new Set(plan.served_ids);
    const dimensionLabels = new Map(
      definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key]),
    );
    return {
      definition_ref: definition.definition_ref,
      options: buildChangeOptions(definition),
      questions: definition.questions.map((question) => ({
        id: question.id,
        text: question.text,
        domain: question.domain,
        dimension: question.dimension,
        dimension_label: dimensionLabels.get(question.dimension) ?? question.dimension,
        weight: question.weight,
        active: question.active,
        scoreable: question.scoreable,
        served: served.has(question.id),
      })),
      inert_interpretation_params: inertInterpretationParams(definition),
    };
  }

  /**
   * One guided experiment: resolve the operation server side, materialize the candidate and
   * replay this run against it. The client never sends an operation code or a `from` value.
   */
  async guidedChange(
    runId: string,
    userId: string,
    input: { kind: ChangeKind; target_id: string; to: unknown; reason: string },
  ) {
    const run = await this.loadRun(runId);
    const base = await this.definitionByRef(run.definitionRef);
    if (!input.reason.trim()) {
      throw new UnprocessableEntityException({
        reason: 'CHANGE_REASON_REQUIRED',
        message: 'Escribe por qué quieres probar este cambio.',
      });
    }
    let built: ReturnType<typeof buildChangeOperation>;
    try {
      built = buildChangeOperation(base, input);
    } catch (error) {
      if (error instanceof ChangeRequestError) {
        throw new UnprocessableEntityException({
          reason: error.reason,
          message: error.message,
        });
      }
      throw error;
    }
    const workspace =
      (await this.prisma.labDefinitionWorkspace.findFirst({
        where: { baseDefinitionRef: base.definition_ref, createdBy: userId },
        orderBy: { updatedAt: 'desc' },
      })) ?? (await this.createWorkspace(userId, base.definition_ref));
    await this.patchOperations(workspace.id, [built.operation]);
    const materialized = await this.materialize(workspace.id, userId, {
      reason: input.reason,
      related_case_ids: [run.caseId],
      related_run_ids: [run.id],
    });
    const replay = await this.replay(userId, {
      changeset_id: materialized.changeset.id,
      run_ids: [runId],
    });
    return {
      changeset_id: materialized.changeset.id,
      candidate_ref: materialized.definition.definitionRef,
      summary: built.summary,
      comparison: await this.replayComparison(replay.id),
    };
  }

  /** Compact base vs candidate comparison. Keeps full snapshots out of the browser. */
  async replayComparison(replayId: string) {
    const replay = await this.prisma.labReplayRun.findUnique({
      where: { id: replayId },
      include: { results: true, changeset: true },
    });
    if (!replay) throw new NotFoundException('Replay not found');
    const candidate = await this.definitionByRef(replay.candidateDefinitionRef);
    const planName = new Map(candidate.plans.map((plan) => [plan.id, plan.name]));
    const runs = await this.prisma.labRun.findMany({
      where: { id: { in: replay.results.map((row) => row.sourceRunId) } },
      include: { case: true },
    });
    const caseLabel = new Map(runs.map((run) => [run.id, run.case.label]));
    const results = replay.results.map((row) => {
        const base = row.baseSnapshot as unknown as ResultSnapshot;
        const next = row.candidateSnapshot as unknown as ResultSnapshot;
        const flags = (row.flags ?? {}) as Record<string, unknown>;
        const rafa = (flags.rafa_said as { priority?: string | null } | undefined) ?? {};
        return {
          run_id: row.sourceRunId,
          case_label: caseLabel.get(row.sourceRunId) ?? row.sourceRunId,
          attribution: row.attribution,
          verdict: row.verdict,
          rafa_priority: rafa.priority ?? null,
          impact: (flags.impact as string | undefined) ?? 'NEEDS_REVIEW',
          critical_regression: Boolean(flags.critical_regression),
          flags,
          domains: base.domains.map((domain) => {
            const other = next.domains.find((item) => item.key === domain.key);
            return {
              key: domain.key,
              from_score: domain.score_display,
              to_score: other?.score_display ?? null,
              from_state: domain.state_final,
              to_state: other?.state_final ?? null,
              from_classification: domain.classification,
              to_classification: other?.classification ?? null,
            };
          }),
          priority: { from: base.priority.domain, to: next.priority.domain },
          plan: {
            from: base.recommendations.primary?.plan_id ?? null,
            to: next.recommendations.primary?.plan_id ?? null,
            from_name: planName.get(base.recommendations.primary?.plan_id ?? '') ?? null,
            to_name: planName.get(next.recommendations.primary?.plan_id ?? '') ?? null,
          },
          safety: {
            from: base.safety.alerts.filter((alert) => alert.fired).length,
            to: next.safety.alerts.filter((alert) => alert.fired).length,
          },
        };
      });
    const summary = replayImpactSummary(results);
    return {
      id: replay.id,
      changeset_id: replay.changesetId,
      changeset_status: replay.changeset?.status ?? null,
      changeset_reason: replay.changeset?.reason ?? null,
      base_definition_ref: replay.baseDefinitionRef,
      candidate_definition_ref: replay.candidateDefinitionRef,
      summary,
      keep_blocked: keepCandidateBlocked(summary),
      results,
    };
  }

  async replay(
    userId: string,
    input: {
      changeset_id?: string;
      base_ref?: string;
      candidate_ref?: string;
      run_ids?: string[] | 'all';
    },
  ) {
    let changeset = input.changeset_id
      ? await this.prisma.labChangeSet.findUnique({ where: { id: input.changeset_id } })
      : null;
    if (input.changeset_id && !changeset) throw new NotFoundException('Changeset not found');
    const baseRef = input.base_ref ?? changeset?.baseDefinitionRef;
    const candidateRef = input.candidate_ref ?? changeset?.targetDefinitionRef;
    if (!baseRef || !candidateRef) {
      throw new UnprocessableEntityException('Need changeset or base_ref + candidate_ref');
    }
    const base = await this.definitionByRef(baseRef);
    const candidate = await this.definitionByRef(candidateRef);
    const runFilter =
      input.run_ids === 'all' || input.run_ids == null
        ? { status: { in: [LabRunStatus.AWAITING_EXPECTATION, LabRunStatus.REVEALED] } }
        : { id: { in: input.run_ids } };
    const runs = await this.prisma.labRun.findMany({
      where: { ...runFilter, snapshot: { not: Prisma.DbNull } },
      include: { responses: true, case: true },
    });
    if (!runs.length) throw new UnprocessableEntityException('No eligible runs');
    if (!changeset) {
      const workspace = await this.prisma.labDefinitionWorkspace.findFirst({
        where: { baseDefinitionRef: baseRef },
      });
      if (!workspace) throw new UnprocessableEntityException('Open a workspace first');
      changeset = await this.prisma.labChangeSet.create({
        data: {
          number: 0,
          workspaceId: workspace.id,
          baseDefinitionRef: baseRef,
          baseDefinitionSha256: base.definition_sha256,
          targetDefinitionRef: candidateRef,
          targetDefinitionSha256: candidate.definition_sha256,
          operations: [],
          reason: 'ad-hoc methodology replay',
          status: LabChangeSetStatus.MATERIALIZED,
          createdBy: userId,
        },
      });
    }
    const operations = (changeset.operations as unknown as ChangeOperation[]) ?? [];
    const replayRun = await this.prisma.labReplayRun.create({
      data: {
        changesetId: changeset.id,
        baseDefinitionRef: baseRef,
        candidateDefinitionRef: candidateRef,
        status: 'COMPLETE',
        createdBy: userId,
      },
    });
    for (const run of runs) {
      const compared = replayMethodology({
        responses: toResponseInputs(run.responses),
        policy: namedPolicy(run.policyId),
        baseDefinition: base,
        candidateDefinition: candidate,
        now: new Date().toISOString(),
        operationCount: operations.length,
      });
      const original = run.snapshot as unknown as ResultSnapshot;
      const impact = await this.impactForReplay(run.id, compared.base, compared.candidate, compared.flags);
      const sameEngine = run.engineSemver === ENGINE_SEMVER;
      const sameDef = run.definitionSha256 === base.definition_sha256;
      let verified = false;
      if (sameEngine && sameDef) {
        // jsonb does not preserve key order, so the stored snapshot has to be compared
        // canonically. A plain JSON.stringify reports drift on every round trip.
        const left = canonicalize(stripGeneratedAt(original));
        const right = canonicalize(stripGeneratedAt(compared.base));
        if (left !== right) {
          throw new ConflictException({
            reason: 'BASE_SNAPSHOT_DRIFT',
            run_id: run.id,
          });
        }
        verified = true;
      }
      await this.prisma.labReplayResult.create({
        data: {
          replayRunId: replayRun.id,
          sourceRunId: run.id,
          baseSnapshot: asJson(compared.base),
          candidateSnapshot: asJson(compared.candidate),
          flags: asJson({
            ...compared.flags,
            base_verified_against_snapshot: verified,
            base_engine_differs: !sameEngine,
            impact: impact.impact,
            critical_regression: impact.critical,
            rafa_said: impact.rafaSaid,
            score_deltas: compared.base.domains.map((domain, index) => ({
              key: domain.key,
              from: domain.score_display,
              to: compared.candidate.domains[index]?.score_display ?? null,
            })),
          }),
          attribution: compared.attribution,
        },
      });
    }
    await this.prisma.labChangeSet.update({
      where: { id: changeset.id },
      data: { status: LabChangeSetStatus.REPLAYED },
    });
    return this.getReplay(replayRun.id);
  }

  async getReplay(id: string) {
    const replay = await this.prisma.labReplayRun.findUnique({
      where: { id },
      include: { results: true, changeset: true },
    });
    if (!replay) throw new NotFoundException('Replay not found');
    return replay;
  }

  async replayResult(replayId: string, runId: string) {
    const row = await this.prisma.labReplayResult.findUnique({
      where: { replayRunId_sourceRunId: { replayRunId: replayId, sourceRunId: runId } },
    });
    if (!row) throw new NotFoundException('Replay result not found');
    return row;
  }

  async replayVerdict(replayId: string, runId: string, userId: string, verdict: string) {
    return this.prisma.labReplayResult.update({
      where: { replayRunId_sourceRunId: { replayRunId: replayId, sourceRunId: runId } },
      data: { verdict, verdictBy: userId, verdictAt: new Date() },
    });
  }

  async acceptChangeSet(
    id: string,
    input: { accept_safety_change?: boolean; safety_note?: string },
  ) {
    const changeset = await this.prisma.labChangeSet.findUnique({
      where: { id },
      include: { replays: { include: { results: true } }, target: true },
    });
    if (!changeset?.target) throw new NotFoundException('Changeset or candidate missing');
    const replay = changeset.replays[0];
    if (!replay || replay.status !== 'COMPLETE') {
      throw new UnprocessableEntityException('Need a COMPLETE methodology replay');
    }
    const safetyChanged = replay.results.some((row) => {
      const flags = row.flags as { safety_changed?: boolean };
      return flags.safety_changed;
    });
    if (safetyChanged && !input.accept_safety_change) {
      throw new UnprocessableEntityException('safety_changed requires explicit accept_safety_change');
    }
    if (safetyChanged && !input.safety_note?.trim()) {
      throw new UnprocessableEntityException('safety_changed requires a written note');
    }
    const missingVerdict = replay.results.filter((row) => {
      const flags = row.flags as {
        state_changed?: boolean;
        priority_changed?: boolean;
        plan_changed?: boolean;
        impact?: string;
        critical_regression?: boolean;
      };
      const needs = flags.state_changed || flags.priority_changed || flags.plan_changed;
      return needs && !row.verdict && flags.impact === 'NEEDS_REVIEW';
    });
    if (missingVerdict.length) {
      throw new UnprocessableEntityException({
        reason: 'REVIEW_REQUIRED',
        message: 'Hay casos que requieren revisión antes de conservar esta versión candidata.',
      });
    }
    const critical = replay.results.filter((row) => {
      const flags = row.flags as { critical_regression?: boolean };
      return flags.critical_regression;
    });
    if (critical.length) {
      throw new UnprocessableEntityException({
        reason: 'CRITICAL_REGRESSION',
        message: 'Hay una regresión crítica abierta. No se puede conservar esta versión candidata.',
      });
    }
    const contracts = await this.evaluateContracts(changeset.target.definitionRef);
    if (contracts.overall !== 'PASS') {
      throw new UnprocessableEntityException({
        reason: 'CONTRACTS_FAILED',
        message: 'Los contratos técnicos no están en PASS.',
        contracts,
      });
    }
    await this.prisma.labChangeSet.update({
      where: { id },
      data: { status: LabChangeSetStatus.ACCEPTED },
    });
    await this.prisma.labDefinition.update({
      where: { definitionRef: changeset.target.definitionRef },
      data: { status: LabDefinitionStatus.ACCEPTED_CANDIDATE },
    });
    return { changeset_id: id, status: 'ACCEPTED', hypothesis: PRODUCT_HYPOTHESIS };
  }

  async rejectChangeSet(id: string) {
    const changeset = await this.prisma.labChangeSet.findUnique({
      where: { id },
      include: { target: true },
    });
    if (!changeset) throw new NotFoundException('Changeset not found');
    await this.prisma.labChangeSet.update({
      where: { id },
      data: { status: LabChangeSetStatus.REJECTED },
    });
    if (changeset.targetDefinitionRef) {
      await this.prisma.labDefinition.update({
        where: { definitionRef: changeset.targetDefinitionRef },
        data: { status: LabDefinitionStatus.REJECTED },
      });
    }
    return { changeset_id: id, status: 'REJECTED' };
  }

  async createDirection(runId: string, input: {
    statement: string;
    status?: string;
    source?: string;
    evidence_refs?: string[];
    confidence?: string;
  }) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.REVEALED) pending();
    const latest = await this.prisma.directionVersion.findFirst({
      where: { caseId: run.caseId },
      orderBy: { revision: 'desc' },
    });
    return this.prisma.directionVersion.create({
      data: {
        caseId: run.caseId,
        revision: (latest?.revision ?? 0) + 1,
        statement: input.statement,
        status: input.status ?? 'DRAFT',
        evidenceRefs: input.evidence_refs ?? [],
        confidence: input.confidence,
        source: input.source ?? 'RAFA_JUDGMENT',
        supersedesId: latest?.id,
      },
    });
  }

  async project(runId: string, input: {
    selected_focus?: string | null;
    selection_source?: string | null;
    selection_reason?: string | null;
    objective_id?: string | null;
    action_text?: string | null;
    period_start?: string;
    billing_cadence?: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
    confirm_matrix_focus?: boolean;
  }) {
    const run = await this.loadRun(runId);
    const snapshot = this.snapshotOf(run, 'experience');
    const experience = buildExperienceV01();
    const direction = await this.prisma.directionVersion.findFirst({
      where: { caseId: run.caseId },
      orderBy: { revision: 'desc' },
    });
    const purpose = run.purposeAssessments[0];
    let selected = input.selected_focus ?? null;
    let source = input.selection_source ?? null;
    let reason = input.selection_reason ?? null;
    if (input.confirm_matrix_focus && snapshot.priority.domain) {
      selected = snapshot.priority.domain;
      source = source ?? 'RAFA_JUDGMENT';
      reason = reason?.trim() ? reason : null;
    }
    const focusKind = selected && isFocusKind(selected) ? (selected as FocusKind) : selected ? null : null;
    const projection = projectExperience({
      resultSnapshot: snapshot,
      purposeAssessment: purpose
        ? { stage: purpose.stage as 'DIFUSO', confidence: purpose.confidence, notes: purpose.notes ?? undefined }
        : null,
      direction: direction
        ? { statement: direction.statement, source: direction.source as ProvenanceSource }
        : null,
      focusSelection: {
        selected_focus: focusKind,
        selection_source: (source as ProvenanceSource | null) ?? null,
        selection_reason: reason,
      },
      objectiveSelection: {
        objective_id: input.objective_id ?? null,
        source: input.objective_id ? 'USER_CHOICE' : null,
      },
      action: {
        text: input.action_text ?? null,
        source: input.action_text ? 'USER_CHOICE' : null,
      },
      subscriptionContext: {
        period_start: input.period_start ?? '2026-08-25T00:00:00.000Z',
        billing_cadence: input.billing_cadence ?? 'MONTHLY',
      },
      experienceDefinition: experience,
    });
    const record = await this.prisma.experienceProjectionRecord.create({
      data: {
        runId,
        experienceRef: experience.experience_ref,
        experienceSha256: experience.sha256,
        projection: asJson(projection),
      },
    });
    return {
      id: record.id,
      projection,
      user_view: toUserView(projection),
    };
  }

  async latestExperience(runId: string) {
    const run = await this.loadRun(runId);
    this.assertDerived(run, 'experience');
    const record = await this.prisma.experienceProjectionRecord.findFirst({
      where: { runId },
      orderBy: { createdAt: 'desc' },
    });
    // Not having projected yet is a state of the session, not an error to report.
    if (!record) return null;
    const projection = record.projection as unknown as ReturnType<typeof projectExperience>;
    return { id: record.id, projection, user_view: toUserView(projection) };
  }

  async productReview(runId: string, userId: string, input: {
    verdicts: Record<string, 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNCERTAIN'>;
    purpose_feels: string;
    still_mk: string;
    first_product_divergence: string;
    what_would_change?: string | null;
    what_was_missing?: string | null;
  }) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.REVEALED) pending();
    const latest = await this.prisma.productReview.findFirst({
      where: { runId },
      orderBy: { revision: 'desc' },
    });
    return this.prisma.productReview.create({
      data: {
        caseId: run.caseId,
        runId,
        revision: (latest?.revision ?? 0) + 1,
        verdicts: asJson(input.verdicts),
        purposeFeels: input.purpose_feels,
        stillMk: input.still_mk,
        firstProductDivergence: input.first_product_divergence,
        whatWouldChange: input.what_would_change ?? null,
        whatWasMissing: input.what_was_missing ?? null,
        submittedBy: userId,
      },
    });
  }

  async getProductReview(runId: string) {
    const run = await this.loadRun(runId);
    if (run.status !== LabRunStatus.REVEALED) pending();
    const rows = await this.prisma.productReview.findMany({
      where: { runId },
      orderBy: { revision: 'desc' },
    });
    return { latest: rows[0] ?? null, history: rows };
  }

  async seedFixtures(userId: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('fixtures/seed is disabled in production', HttpStatus.FORBIDDEN);
    }
    assertCasebookStoriesClean();
    const definition = await this.publishedDefinition();
    const families = fixtureCatalog(definition);
    const created: string[] = [];
    for (const family of families) {
      const existing = await this.prisma.labCase.findFirst({
        where: { fixtureKey: family.key, archivedAt: null },
      });
      if (existing) continue;
      await this.prisma.labCase.create({
        data: {
          label: family.key,
          kind: LabCaseKind.SIMULATION,
          blind: true,
          expertContext: family.purpose,
          fixtureKey: family.key,
          createdBy: userId,
        },
      });
      created.push(family.key);
    }
    return { created, golden: families.filter((item) => item.golden).map((item) => item.key) };
  }

  async workspaces() {
    return this.prisma.labDefinitionWorkspace.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { changeSets: { orderBy: { number: 'desc' }, take: 1 } },
    });
  }

  async pairCompare(runId: string) {
    const run = await this.loadRun(runId);
    const { pair, side } = pairKey(run.case.casebookKey);
    if (!pair || !side) return { available: false, reason: 'Este caso no forma parte de un par.' };
    const otherKey = `${pair}${side === 'A' ? 'B' : 'A'}`;
    const otherCase = await this.prisma.labCase.findFirst({
      where: { casebookKey: otherKey, archivedAt: null },
      include: { runs: { orderBy: { startedAt: 'desc' }, take: 1, include: { responses: true } } },
    });
    const other = otherCase?.runs[0];
    const leftRevealed = run.status === LabRunStatus.REVEALED;
    const rightRevealed = other?.status === LabRunStatus.REVEALED;
    if (!pairCompareAvailable(leftRevealed, Boolean(rightRevealed))) {
      return {
        available: false,
        pair,
        this_side: side,
        other_key: otherKey,
        other_revealed: Boolean(rightRevealed),
      };
    }
    const leftSnap = run.snapshot as unknown as ResultSnapshot;
    const rightSnap = other?.snapshot as unknown as ResultSnapshot;
    if (!leftSnap || !rightSnap || !other) {
      return { available: false, pair, this_side: side, other_key: otherKey };
    }
    const definition = await this.definitionByRef(run.definitionRef);
    const asAnswers = (rows: typeof run.responses) =>
      rows.map((row) => ({
        questionId: row.questionId,
        text: definition.questions.find((item) => item.id === row.questionId)?.text,
        raw: parseRaw(row.rawValue, row.valueKind),
        status: row.status,
      }));
    const aIsThis = side === 'A';
    const aSnap = aIsThis ? leftSnap : rightSnap;
    const bSnap = aIsThis ? rightSnap : leftSnap;
    const aAnswers = asAnswers(aIsThis ? run.responses : other.responses);
    const bAnswers = asAnswers(aIsThis ? other.responses : run.responses);
    const view = buildPairCompareView(definition, aSnap, bSnap, aAnswers, bAnswers);
    const metaA = CASEBOOK_META.find((item) => item.key === `${pair}A`);
    const metaB = CASEBOOK_META.find((item) => item.key === `${pair}B`);
    return {
      available: true,
      pair,
      this_side: side,
      other_key: otherKey,
      other_run_id: other.id,
      other_label: otherCase?.label ?? otherKey,
      other_revealed: true,
      ...view,
      implied_rule: pairQuestionFor(pair),
      portraits: {
        a: metaA?.portrait ?? null,
        b: metaB?.portrait ?? null,
      },
    };
  }

  async evaluateContracts(ref?: string) {
    const definition = ref ? await this.definitionByRef(ref) : await this.publishedDefinition();
    const enginePass =
      definition.questions.length > 0 &&
      definition.domains.length > 0 &&
      definition.plans.length > 0 &&
      Boolean(definition.definition_sha256);
    const issues: Array<{ severity: string; message: string }> = enginePass
      ? []
      : [{ severity: 'ERROR', message: 'La definición candidata no tiene la estructura mínima del motor.' }];
    const published = await this.publishedDefinition();
    const baselineImmutable = published.definition_ref === 'matrix-v2.0@1';
    const latestReplay = await this.prisma.labReplayRun.findFirst({
      where: ref ? { candidateDefinitionRef: ref } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { results: true },
    });
    const determinism =
      !latestReplay
        ? 'UNAVAILABLE'
        : latestReplay.results.every((row) => {
            const flags = row.flags as { base_verified_against_snapshot?: boolean };
            return flags.base_verified_against_snapshot !== false;
          })
          ? 'PASS'
          : 'FAIL';
    const safety =
      !latestReplay
        ? 'UNAVAILABLE'
        : latestReplay.results.some((row) => {
            const flags = row.flags as { safety_changed?: boolean; critical_regression?: boolean };
            return flags.critical_regression && flags.safety_changed;
          })
          ? 'FAIL'
          : 'PASS';
    const goldens = enginePass ? 'PASS' : 'FAIL';
    const overall = enginePass && safety !== 'FAIL' && determinism !== 'FAIL' ? 'PASS' : 'FAIL';
    return {
      definition_ref: definition.definition_ref,
      goldens,
      safety_invariants: safety,
      engine_tests: enginePass ? 'PASS' : 'FAIL',
      determinism,
      baseline_immutable: baselineImmutable,
      issues,
      overall,
    };
  }

  private snapshotLite(snapshot: ResultSnapshot): ResultLite {
    return {
      priority: snapshot.priority.domain,
      planId: snapshot.recommendations.primary?.plan_id ?? null,
      states: Object.fromEntries(snapshot.domains.map((domain) => [domain.key, domain.state_final])),
      classifications: Object.fromEntries(
        snapshot.domains.map((domain) => [domain.key, domain.classification]),
      ),
      firedCritical: snapshot.safety.alerts.some((alert) => alert.fired && alert.severity === 'CRITICA'),
      firedHigh: snapshot.safety.alerts.some((alert) => alert.fired && alert.severity === 'ALTA'),
    };
  }

  private async impactForReplay(
    runId: string,
    base: ResultSnapshot,
    candidate: ResultSnapshot,
    flags: { safety_changed?: boolean; state_changed?: boolean; priority_changed?: boolean; plan_changed?: boolean },
  ) {
    const review = await this.prisma.labReview.findFirst({
      where: { runId },
      orderBy: { revision: 'desc' },
    });
    const expectation = await this.prisma.labExpectation.findFirst({
      where: { runId },
      orderBy: { revision: 'desc' },
    });
    const baseLite = this.snapshotLite(base);
    const nextLite = this.snapshotLite(candidate);
    const important = importantResultChanged(baseLite, nextLite);
    const expectedStates = {
      ...((expectation?.expectedStates as Record<string, string> | null) ?? {}),
      ...((review?.postRevealStates as Record<string, string> | null) ?? {}),
    };
    const expectedPriority = review?.postRevealPriorityDomain ?? expectation?.expectedPriorityDomain ?? null;
    const expectedPlan = review?.recommendedPlanId ?? expectation?.expectedPlanId ?? null;
    const closer = closerToExpected(baseLite, nextLite, {
      priority: expectedPriority,
      states: expectedStates,
      planId: expectedPlan,
    });
    const rafaAccepted =
      review?.caseVerdict === 'REPRESENTS' ||
      Object.values((review?.verdicts as Record<string, unknown>) ?? {}).includes('CORRECT');
    const impact = deriveReplayImpact({
      importantChanged: important,
      safetyChanged: Boolean(flags.safety_changed),
      priorCaseVerdict: review?.caseVerdict,
      rafaAcceptedMatrix: Boolean(rafaAccepted) && !important ? false : Boolean(rafaAccepted) && important,
      closerToRafa: closer === true,
      fartherFromRafa: closer === false,
    });
    const critical = isCriticalRegression({
      impact,
      priorCaseVerdict: review?.caseVerdict,
      safetyChanged: Boolean(flags.safety_changed),
      rafaAcceptedMatrix: Boolean(rafaAccepted),
    });
    return {
      impact,
      critical,
      rafaSaid: {
        verdict: review?.caseVerdict ?? null,
        priority: expectedPriority,
        plan: expectedPlan,
      },
    };
  }

  async listFindings() {
    const rows = await this.prisma.labFinding.findMany({
      orderBy: { number: 'desc' },
      include: { cases: { include: { case: true } }, changeSets: true },
    });
    const open = rows.filter((row) => this.effectiveFindingStatus(row) === 'OPEN').length;
    const needs = rows.filter((row) => row.status === 'NEEDS_MORE_CASES').length;
    const testing = rows.filter((row) => row.status === 'CHANGE_IN_TEST' || row.status === 'WORTH_TESTING').length;
    const decided = rows.filter((row) =>
      ['KEEP_MATRIX', 'CHANGE_MATRIX', 'KNOWN_LIMITATION', 'OUTSIDE_MATRIX'].includes(row.status),
    ).length;
    return {
      summary: { open, needs_more_cases: needs, in_test: testing, decided },
      findings: rows.map((row) => this.serializeFinding(row)),
    };
  }

  async getFinding(id: string) {
    const row = await this.prisma.labFinding.findUnique({
      where: { id },
      include: {
        cases: {
          include: {
            case: {
              include: {
                runs: {
                  orderBy: { startedAt: 'desc' },
                  take: 1,
                  include: { expectations: { orderBy: { revision: 'desc' }, take: 1 } },
                },
              },
            },
          },
        },
        changeSets: {
          include: { replays: { orderBy: { createdAt: 'desc' }, take: 1, include: { results: true } } },
        },
        consistencies: true,
        observations: true,
      },
    });
    if (!row) throw new NotFoundException('Finding not found');
    const definition = await this.publishedDefinition();
    const serialized = this.serializeFinding(row);
    const domainName: Record<string, string> = {
      MENTALIDAD: 'Mentalidad',
      RELACIONES: 'Relaciones',
      FINANZAS: 'Finanzas',
      CUERPO: 'Cuerpo',
    };
    return {
      ...serialized,
      cases: serialized.cases.map((item) => {
        const link = row.cases.find((entry) => entry.caseId === item.id);
        const run = link?.case?.runs[0];
        const expectation = run?.expectations[0] as
          | { personalFirstDomain?: string | null; openFirstFocus?: string | null }
          | undefined;
        const snapshot = run?.snapshot as unknown as ResultSnapshot | null;
        const personal = expectation?.personalFirstDomain ?? expectation?.openFirstFocus ?? null;
        const rafa = personal ? (domainName[personal] ?? personal) : 'Sin criterio registrado';
        const matrixDomain = snapshot?.priority.domain ?? null;
        const planId = snapshot?.recommendations.primary?.plan_id ?? null;
        const planName = definition.plans.find((plan) => plan.id === planId)?.name ?? null;
        const matrix = matrixDomain
          ? `${domainName[matrixDomain] ?? matrixDomain}${planName ? ` · ${planName}` : ''}`
          : 'Sin resultado';
        const difference =
          !personal || !matrixDomain
            ? personal
              ? `${rafa} frente a sin resultado`
              : 'Sin criterio registrado'
            : personal === matrixDomain
              ? 'Coinciden'
              : `${rafa} frente a ${domainName[matrixDomain] ?? matrixDomain}`;
        return { ...item, rafa_criterion: rafa, matrix_result: matrix, difference };
      }),
      experiments: (row.changeSets ?? []).map((item) => {
        const flags = item.replays[0]?.results.map((result) => result.flags as { impact?: string }) ?? [];
        return {
          id: item.id,
          reason: item.reason,
          status: item.status,
          candidate_ref: item.targetDefinitionRef ?? null,
          replay_id: item.replays[0]?.id ?? null,
          replay_summary: {
            improves: flags.filter((flag) => flag.impact === 'IMPROVES').length,
            worsens: flags.filter((flag) => flag.impact === 'WORSENS').length,
            unchanged: flags.filter((flag) => flag.impact === 'UNCHANGED').length,
            needs_review: flags.filter((flag) => flag.impact === 'NEEDS_REVIEW').length,
          },
        };
      }),
    };
  }

  async createFinding(
    userId: string,
    input: {
      title: string;
      summary: string;
      layer: string;
      severity: string;
      status?: string;
      hypothesis?: string | null;
      current_behavior: string;
      rafa_expected_behavior: string;
      related_rules?: string[];
      evidence_ids?: string[];
      case_ids?: string[];
      content_change_required?: boolean;
    },
  ) {
    const last = await this.prisma.labFinding.findFirst({ orderBy: { number: 'desc' } });
    const created = await this.prisma.labFinding.create({
      data: {
        number: (last?.number ?? 0) + 1,
        title: input.title,
        summary: input.summary,
        layer: input.layer,
        severity: input.severity,
        status: this.resolvedFindingStatus(input, input.case_ids?.length ?? 0),
        hypothesis: input.hypothesis ?? null,
        currentBehavior: input.current_behavior,
        rafaExpectedBehavior: input.rafa_expected_behavior,
        relatedRules: input.related_rules ?? [],
        evidenceIds: input.evidence_ids ?? [],
        contentChangeRequired: Boolean(input.content_change_required),
        createdBy: userId,
        cases: input.case_ids?.length
          ? { create: input.case_ids.map((caseId) => ({ caseId })) }
          : undefined,
      },
      include: { cases: { include: { case: true } }, changeSets: true, consistencies: true },
    });
    return this.serializeFinding(created);
  }

  async patchFinding(
    id: string,
    input: {
      title?: string;
      summary?: string;
      layer?: string;
      severity?: string;
      status?: string;
      hypothesis?: string | null;
      current_behavior?: string;
      rafa_expected_behavior?: string;
      related_rules?: string[];
      evidence_ids?: string[];
      decision?: string | null;
      decision_reason?: string | null;
    },
  ) {
    const current = await this.getFinding(id);
    if (input.status && input.status !== 'DRAFT' && input.status !== 'DISCARDED') {
      const ready = findingOpenReady({
        title: input.title ?? current.title,
        current_behavior: input.current_behavior ?? current.current_behavior,
        rafa_expected_behavior: input.rafa_expected_behavior ?? current.rafa_expected_behavior,
        layer: input.layer ?? current.layer,
        severity: input.severity ?? current.severity,
        caseCount: current.cases.length,
        evidenceCount: current.evidence_ids.length,
        global: (input.related_rules ?? current.related_rules).includes('GLOBAL'),
      });
      if (!ready.ok && isBlockingFindingStatus(input.status)) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          reason: 'FINDING_INCOMPLETE',
          message: `Este hallazgo sigue en borrador. Falta: ${ready.missing.join(', ')}.`,
        });
      }
    }
    const updated = await this.prisma.labFinding.update({
      where: { id },
      data: {
        title: input.title,
        summary: input.summary,
        layer: input.layer,
        severity: input.severity,
        status: input.status,
        hypothesis: input.hypothesis,
        currentBehavior: input.current_behavior,
        rafaExpectedBehavior: input.rafa_expected_behavior,
        relatedRules: input.related_rules,
        evidenceIds: input.evidence_ids,
        decision: input.decision,
        decisionReason: input.decision_reason,
      },
      include: { cases: { include: { case: true } }, changeSets: true, consistencies: true },
    });
    return this.serializeFinding(updated);
  }

  async linkFindingCases(id: string, caseIds: string[]) {
    await this.prisma.labFindingCase.createMany({
      data: caseIds.map((caseId) => ({ findingId: id, caseId })),
      skipDuplicates: true,
    });
    return this.getFinding(id);
  }

  async recordConsistency(
    id: string,
    input: { accepted_case_key: string; rejected_case_key: string; answer?: string | null; notes?: string | null },
  ) {
    await this.prisma.labFindingConsistency.create({
      data: {
        findingId: id,
        acceptedCaseKey: input.accepted_case_key,
        rejectedCaseKey: input.rejected_case_key,
        answer: input.answer ?? null,
        notes: input.notes ?? null,
      },
    });
    return this.getFinding(id);
  }

  async findingChange(
    id: string,
    userId: string,
    input: { run_id: string; kind: ChangeKind; target_id: string; to: unknown; reason: string },
  ) {
    const result = await this.guidedChange(input.run_id, userId, {
      kind: input.kind,
      target_id: input.target_id,
      to: input.to,
      reason: input.reason,
    });
    await this.prisma.labChangeSet.update({
      where: { id: result.changeset_id },
      data: { findingId: id },
    });
    await this.prisma.labFinding.update({
      where: { id },
      data: { status: 'CHANGE_IN_TEST' },
    });
    return result;
  }

  async replayReviewed(userId: string, input: { changeset_id?: string; candidate_ref?: string }) {
    const reviewed = await this.prisma.labRun.findMany({
      where: {
        kind: 'ORIGINAL',
        OR: [
          { reviews: { some: { caseVerdict: { not: null } } } },
          {
            status: { not: LabRunStatus.COLLECTING },
            case: { casebookKey: null, kind: { in: [LabCaseKind.SELF, LabCaseKind.SIMULATION] } },
          },
        ],
      },
      select: { id: true },
    });
    const runIds = reviewed.map((row) => row.id);
    if (!runIds.length) {
      throw new UnprocessableEntityException('No hay casos con conclusión para volver a correr.');
    }
    return this.replay(userId, {
      changeset_id: input.changeset_id,
      candidate_ref: input.candidate_ref,
      run_ids: runIds,
    });
  }

  async listCandidates() {
    const published = await this.publishedDefinition();
    const rows = await this.prisma.labDefinition.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const changeSets = await this.prisma.labChangeSet.findMany({
      include: { finding: true, replays: { include: { results: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const byTarget = new Map(changeSets.filter((row) => row.targetDefinitionRef).map((row) => [row.targetDefinitionRef!, row]));
    return {
      base: {
        definition_ref: published.definition_ref,
        status: 'PUBLISHED',
      },
      candidates: rows
        .filter((row) => row.definitionRef !== published.definition_ref)
        .map((row) => {
          const changeset = byTarget.get(row.definitionRef);
          const replay = changeset?.replays[0];
          const impacts = (replay?.results ?? []).map((item) => {
            const flags = item.flags as { impact?: string; critical_regression?: boolean };
            return flags.impact ?? 'NEEDS_REVIEW';
          });
          return {
            definition_ref: row.definitionRef,
            status: row.status,
            base_definition_ref: row.baseDefinitionRef,
            changeset_id: changeset?.id ?? null,
            reason: changeset?.reason ?? null,
            finding: changeset?.finding
              ? { id: changeset.finding.id, number: changeset.finding.number, title: changeset.finding.title }
              : null,
            cases_tested: replay?.results.length ?? 0,
            impacts: {
              unchanged: impacts.filter((item) => item === 'UNCHANGED').length,
              improves: impacts.filter((item) => item === 'IMPROVES').length,
              worsens: impacts.filter((item) => item === 'WORSENS').length,
              needs_review: impacts.filter((item) => item === 'NEEDS_REVIEW').length,
            },
            last_replay_id: replay?.id ?? null,
          };
        }),
    };
  }

  async composeCandidate(userId: string, input: { changeset_ids: string[]; reason: string }) {
    if (!input.changeset_ids.length) {
      throw new UnprocessableEntityException('Elige al menos un cambio aceptado.');
    }
    const sets = await this.prisma.labChangeSet.findMany({
      where: { id: { in: input.changeset_ids } },
    });
    if (sets.length !== input.changeset_ids.length) {
      throw new NotFoundException('ChangeSet not found');
    }
    const published = await this.publishedDefinition();
    const operations = sets.flatMap((row) => (row.operations as unknown as ChangeOperation[]) ?? []);
    applyChangeOperations(published, operations);
    const workspace =
      (await this.prisma.labDefinitionWorkspace.findFirst({
        where: { baseDefinitionRef: published.definition_ref, createdBy: userId },
      })) ?? (await this.createWorkspace(userId, published.definition_ref));
    await this.patchOperations(workspace.id, operations);
    const findingIds = sets.map((row) => row.findingId).filter((id): id is string => Boolean(id));
    const materialized = await this.materialize(workspace.id, userId, {
      reason: input.reason,
      related_case_ids: [...new Set(sets.flatMap((row) => row.relatedCaseIds))],
      related_run_ids: [...new Set(sets.flatMap((row) => row.relatedRunIds))],
    });
    if (findingIds[0]) {
      await this.prisma.labChangeSet.update({
        where: { id: materialized.changeset.id },
        data: { findingId: findingIds[0] },
      });
    }
    return {
      candidate_ref: materialized.definition.definitionRef,
      changeset_id: materialized.changeset.id,
      provenance: sets.map((row) => ({
        changeset_id: row.id,
        finding_id: row.findingId,
        reason: row.reason,
      })),
      applied_ops: operations.length,
    };
  }

  async currentSession(userId: string) {
    return this.prisma.labWorkSession.findFirst({
      where: { createdBy: userId, closedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWorkSession(
    userId: string,
    input: { title?: string; casebook_keys: string[]; close_observation_before_changes?: boolean },
  ) {
    const open = await this.currentSession(userId);
    if (open) {
      await this.prisma.labWorkSession.update({
        where: { id: open.id },
        data: { closedAt: new Date() },
      });
    }
    return this.prisma.labWorkSession.create({
      data: {
        title: input.title?.trim() || 'Sesión de revisión',
        casebookKeys: input.casebook_keys,
        closeObservationBeforeChanges: input.close_observation_before_changes ?? true,
        createdBy: userId,
      },
    });
  }

  async closeWorkSession(id: string, userId: string) {
    const session = await this.prisma.labWorkSession.findUnique({ where: { id } });
    if (!session || session.createdBy !== userId) throw new NotFoundException('Session not found');
    const cases = await this.listCases(userId);
    const selected = cases.filter((item) => item.casebook_key && session.casebookKeys.includes(item.casebook_key));
    const reviews = await this.prisma.labReview.findMany({
      where: { runId: { in: selected.map((item) => item.latest_run?.id).filter((id): id is string => Boolean(id)) } },
      orderBy: { revision: 'desc' },
    });
    const latestByRun = new Map<string, (typeof reviews)[number]>();
    for (const review of reviews) {
      if (!latestByRun.has(review.runId)) latestByRun.set(review.runId, review);
    }
    const findings = await this.prisma.labFinding.findMany({
      include: { cases: { include: { case: true } } },
    });
    const summary = {
      cases_reviewed: selected.filter((item) => item.matrix_review_complete).length,
      matches: [...latestByRun.values()].filter((row) => row.caseVerdict === 'REPRESENTS').length,
      partial: [...latestByRun.values()].filter((row) => row.caseVerdict === 'MINOR_DIFF').length,
      important: [...latestByRun.values()].filter((row) => row.caseVerdict === 'IMPORTANT_DIFF').length,
      findings_new: findings.filter((row) =>
        row.cases.some((link) => selected.some((item) => item.id === link.caseId)),
      ).length,
      findings_reinforced: findings.filter(
        (row) => row.cases.filter((link) => selected.some((item) => item.id === link.caseId)).length > 1,
      ).length,
      open_questions: [...latestByRun.values()].filter((row) => row.caseVerdict === 'NEED_MORE_INFO').length,
      worth_testing: findings.filter((row) => row.status === 'WORTH_TESTING' || row.status === 'CHANGE_IN_TEST').length,
    };
    return this.prisma.labWorkSession.update({
      where: { id },
      data: { closedAt: new Date(), summary: asJson(summary) },
    });
  }

  async readiness() {
    const cases = await this.prisma.labCase.findMany({
      where: { archivedAt: null, casebookKey: { not: null } },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: {
            reviews: { orderBy: { revision: 'desc' }, take: 1 },
            expectations: { select: { id: true }, take: 1 },
          },
        },
        findings: { include: { finding: true } },
      },
    });
    const overview = buildFamilyProgress(
      cases.map((item) => {
        const run = item.runs[0];
        return {
          casebook_key: item.casebookKey,
          matrix_review_complete: isMatrixReviewComplete({
            status: run?.status ?? 'COLLECTING',
            has_expectation: Boolean(run?.expectations.length),
            has_review: Boolean(run?.reviews[0]),
            has_case_verdict: Boolean(run?.reviews[0]?.caseVerdict),
          }),
          case_verdict: run?.reviews[0]?.caseVerdict ?? null,
          family_reviews: parseFamilyReviews(run?.reviews[0]?.familyVerdicts),
          has_open_finding: item.findings.some((link) =>
            ['OPEN', 'NEEDS_MORE_CASES', 'WORTH_TESTING', 'CHANGE_IN_TEST'].includes(link.finding.status),
          ),
          test_intent: CASEBOOK_META.find((entry) => entry.key === item.casebookKey)?.testIntent ?? null,
          latest_run: run ? { id: run.id } : null,
        };
      }),
    );
    const families = overview.families.map((family) => ({
      id: family.id,
      label: family.label,
      keys: family.keys,
      case_keys: family.keys,
      core: family.core,
      status: family.status,
    }));
    const findings = await this.prisma.labFinding.findMany({ include: { cases: true } });
    const stored = await this.prisma.labMigrationDecision.findMany();
    const candidate = await this.prisma.labDefinition.findFirst({
      where: { status: { in: [LabDefinitionStatus.CANDIDATE, LabDefinitionStatus.ACCEPTED_CANDIDATE] } },
      orderBy: { createdAt: 'desc' },
    });
    const contracts = await this.evaluateContracts(candidate?.definitionRef ?? undefined);
    const latestReplay = candidate
      ? await this.prisma.labReplayRun.findFirst({
          where: { candidateDefinitionRef: candidate.definitionRef },
          orderBy: { createdAt: 'desc' },
          include: { results: true, changeset: true },
        })
      : null;
    const criticalRegressions =
      latestReplay?.results.filter((row) => (row.flags as { critical_regression?: boolean }).critical_regression)
        .length ?? 0;
    const decision = await this.prisma.labReadinessDecision.findFirst({
      orderBy: { decidedAt: 'desc' },
    });
    const pendingCore = families
      .filter((family) => (CORE_FAMILY_IDS as readonly string[]).includes(family.id) && !familyIsResolved(family.status))
      .map((family) => family.label);
    const observations = await this.prisma.labQuestionObservation.findMany();
    const bank = buildQuestionBank(await this.publishedDefinition());
    const diagnosticIntegrityIssues = bank.without_role + bank.broken_config;
    const blockingContent = findings.filter(
      (row) =>
        row.contentChangeRequired &&
        isBlockingFindingStatus(this.effectiveFindingStatus(row)),
    ).length;
    const missing = readinessMissing({
      contractsPass: contracts.engine_tests === 'PASS' && contracts.goldens === 'PASS',
      safetyPass: !candidate || contracts.safety_invariants === 'PASS',
      enginePass: contracts.engine_tests === 'PASS',
      openCriticalFindings: findings.filter((row) => row.severity === 'CRITICAL' && this.effectiveFindingStatus(row) === 'OPEN').length,
      coreFamiliesReviewed: pendingCore.length === 0,
      pendingCoreFamilies: pendingCore,
      allIncludedChangesReplayed: Boolean(latestReplay) || !candidate,
      openCriticalRegressions: criticalRegressions,
      knownLimitationsDocumented: findings.some((row) => row.status === 'KNOWN_LIMITATION') || findings.every((row) => this.effectiveFindingStatus(row) !== 'OPEN'),
      explicitDecisionReady: decision?.decision === 'READY',
      blockingQuestionnaireIssues: diagnosticIntegrityIssues,
    });
    return {
      contracts,
      families,
      questionnaire: {
        reviewed: new Set(observations.map((row) => row.questionId)).size,
        pending: observations.filter((row) => row.status === 'PENDING').length,
        needs_more_cases: observations.filter((row) => row.status === 'NEEDS_MORE_CASES').length,
        converted: observations.filter((row) => row.status === 'CONVERTED_TO_FINDING').length,
        critical_content: findings.filter((row) => row.layer === 'QUESTION_CONTENT' && row.severity === 'CRITICAL' && this.effectiveFindingStatus(row) === 'OPEN').length,
        important_content: findings.filter((row) => row.layer === 'QUESTION_CONTENT' && row.severity === 'IMPORTANT' && this.effectiveFindingStatus(row) === 'OPEN').length,
        missing_questions: findings.filter((row) => row.relatedRules.includes('MISSING_QUESTION') || row.layer === 'QUESTION_CONTENT').filter((row) => this.effectiveFindingStatus(row) === 'OPEN').length,
        blocking: blockingContent,
      },
      integrity: {
        without_role: bank.without_role,
        broken_config: bank.broken_config,
        without_current_consumer: bank.without_current_consumer,
      },
      next_layers: {
        direction: 'v0.1 en definición. Captura trazable, no una lectura validada de propósito.',
        intervention: 'No construido.',
      },
      findings: {
        critical_open: findings.filter((row) => row.severity === 'CRITICAL' && this.effectiveFindingStatus(row) === 'OPEN').length,
        important_open: findings.filter((row) => row.severity === 'IMPORTANT' && this.effectiveFindingStatus(row) === 'OPEN').length,
        needs_more_cases: findings.filter((row) => row.status === 'NEEDS_MORE_CASES').length,
        accepted_for_candidate: findings.filter((row) => row.status === 'CHANGE_IN_TEST' || row.status === 'CHANGE_MATRIX').length,
        known_limitations: findings.filter((row) => row.status === 'KNOWN_LIMITATION').length,
      },
      candidate: candidate
        ? {
            definition_ref: candidate.definitionRef,
            changeset_id: latestReplay?.changesetId ?? null,
            cases_replayed: latestReplay?.results.length ?? 0,
            open_regressions: criticalRegressions,
            technical_status: contracts.overall,
          }
        : null,
      decision,
      missing,
      ready_copy: readinessCopy(missing),
      review: buildReviewAgenda({ families: overview.families, stored }),
    };
  }

  async decideReadiness(userId: string, input: { candidate_ref: string; decision: string; note?: string | null }) {
    if (input.decision === 'READY') {
      const snapshot = await this.readiness();
      if (snapshot.missing.length) {
        throw new UnprocessableEntityException({
          reason: 'READINESS_INCOMPLETE',
          message: 'Todavía falta evidencia para marcar lista.',
          missing: snapshot.missing,
        });
      }
    }
    return this.prisma.labReadinessDecision.create({
      data: {
        candidateRef: input.candidate_ref,
        decision: input.decision,
        note: input.note ?? null,
        decidedBy: userId,
      },
    });
  }

  async decisionReport() {
    const findings = await this.prisma.labFinding.findMany({
      include: { cases: { include: { case: true } }, consistencies: true, changeSets: true, observations: true },
      orderBy: { number: 'asc' },
    });
    const readiness = await this.readiness();
    return {
      works: findings.filter((row) => row.status === 'KEEP_MATRIX').map((row) => this.serializeFinding(row)),
      needs_change: findings
        .filter((row) => ['CHANGE_MATRIX', 'WORTH_TESTING', 'CHANGE_IN_TEST', 'OPEN'].includes(row.status))
        .map((row) => this.serializeFinding(row)),
      unknown: findings.filter((row) => row.status === 'NEEDS_MORE_CASES').map((row) => this.serializeFinding(row)),
      known_limitations: findings
        .filter((row) => row.status === 'KNOWN_LIMITATION')
        .map((row) => this.serializeFinding(row)),
      candidate: readiness.candidate,
      advance: readiness,
    };
  }

  async createMethodologyCase(
    userId: string,
    input: { name: string; context?: string; kind?: 'SELF' | 'SIMULATION'; policy_id?: string },
  ) {
    if (input.kind === 'SIMULATION') {
      throw new UnprocessableEntityException('Las simulaciones solo se crean desde un caso original.');
    }
    const created = await this.createCase(userId, {
      label: input.name,
      kind: 'SELF',
      expert_context: input.context,
    });
    const run = await this.createRun(created.id, { policy_id: input.policy_id ?? 'FULL-v1' });
    return { case: created, run };
  }

  async duplicateCase(id: string, userId: string, input?: { label?: string }) {
    const source = await this.prisma.labCase.findUnique({
      where: { id },
      include: { runs: { orderBy: { startedAt: 'desc' }, take: 1, include: { responses: true } } },
    });
    if (!source) throw new NotFoundException('Case not found');
    const sourceRun = source.runs[0];
    if (sourceRun?.status !== LabRunStatus.REVEALED) {
      throw new ConflictException('Solo puedes simular un caso que ya tiene resultado.');
    }
    const created = await this.prisma.labCase.create({
      data: {
        label: input?.label?.trim() || `${source.label} · simulación`,
        kind: LabCaseKind.SIMULATION,
        blind: true,
        expertContext: source.expertContext,
        derivedFromCaseId: source.id,
        createdBy: userId,
      },
    });
    const run = await this.createRun(created.id, { policy_id: sourceRun?.policyId ?? 'FULL-v1' });
    if (sourceRun?.responses.length) {
      await this.prisma.labResponse.createMany({
        data: sourceRun.responses.map((row) => ({
          runId: run.id,
          questionId: row.questionId,
          status: row.status,
          rawValue: row.rawValue,
          valueKind: row.valueKind,
          qualitativeConfirmed: row.qualitativeConfirmed,
          source: 'MANUAL',
        })),
      });
    }
    return { case: created, run, derived_from_case_id: source.id };
  }

  async compareParent(runId: string) {
    const run = await this.loadRun(runId);
    if (!run.case.derivedFromCaseId) {
      return { kind: 'SIMULATION_COMPARE', parent: null, available: false };
    }
    const parent = await this.prisma.labCase.findUnique({
      where: { id: run.case.derivedFromCaseId },
      include: { runs: { orderBy: { startedAt: 'desc' }, take: 1, include: { responses: true } } },
    });
    if (!parent?.runs[0]) throw new NotFoundException('Caso original no encontrado');
    const parentRun = parent.runs[0];
    const parentMeta = CASEBOOK_META.find((item) => item.key === parent.casebookKey);
    const parentLabel = parentMeta?.label ?? parent.label;
    const parentRevealed = parentRun.status === LabRunStatus.REVEALED;
    const thisRevealed = run.status === LabRunStatus.REVEALED;
    const header = {
      kind: 'SIMULATION_COMPARE',
      parent: { id: parent.id, label: parentLabel, casebook_key: parent.casebookKey, run_id: parentRun.id },
      columns: { a: 'Original', b: 'Simulación' },
    };
    if (!pairCompareAvailable(parentRevealed, thisRevealed) || !parentRun.snapshot || !run.snapshot) {
      return { ...header, available: false };
    }
    const definition = await this.definitionByRef(run.definitionRef);
    const asPair = (rows: typeof run.responses) =>
      rows.map((row) => ({
        questionId: row.questionId,
        text: definition.questions.find((item) => item.id === row.questionId)?.text,
        raw: parseRaw(row.rawValue, row.valueKind),
        status: row.status,
      }));
    const view = buildPairCompareView(
      definition,
      parentRun.snapshot as unknown as ResultSnapshot,
      run.snapshot as unknown as ResultSnapshot,
      asPair(parentRun.responses),
      asPair(run.responses),
    );
    return {
      ...header,
      available: true,
      ...view,
    };
  }

  async archiveDraftCase(id: string, userId: string) {
    const item = await this.prisma.labCase.findUnique({
      where: { id },
      include: { runs: true },
    });
    if (!item || item.createdBy !== userId) throw new NotFoundException('Case not found');
    if (item.casebookKey) throw new ConflictException('No se puede eliminar un caso base.');
    const frozen = item.runs.some((run) => run.status !== LabRunStatus.COLLECTING);
    if (frozen) throw new ConflictException('Solo se pueden eliminar borradores.');
    return this.prisma.labCase.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  serializeObservation(row: {
    id: string;
    questionId: string;
    caseId: string | null;
    runId: string | null;
    reviewer: string;
    issueTypes: string[];
    note: string;
    proposal: string | null;
    aspects?: unknown;
    proposedWording?: string | null;
    kind?: string;
    suggestedOperation?: unknown;
    fidelity?: unknown;
    status: string;
    findingId: string | null;
    createdAt: Date;
    updatedAt: Date;
    case?: { label: string; casebookKey: string | null } | null;
    finding?: { number: number; title: string } | null;
  }) {
    return {
      id: row.id,
      question_id: row.questionId,
      case_id: row.caseId,
      run_id: row.runId,
      case_label: row.case?.label ?? null,
      casebook_key: row.case?.casebookKey ?? null,
      issue_types: row.issueTypes,
      note: row.note,
      proposal: row.proposal,
      aspects: (row.aspects as ObservationAspects | null) ?? null,
      proposed_wording: row.proposedWording ?? null,
      kind: row.kind ?? 'CONTENT',
      suggested_operation: row.suggestedOperation ?? null,
      fidelity: (row.fidelity as ObservationFidelity | null) ?? null,
      status: row.status,
      finding_id: row.findingId,
      finding: row.finding
        ? { id: row.findingId, number: row.finding.number, title: row.finding.title }
        : null,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  }

  async listObservations() {
    const rows = await this.prisma.labQuestionObservation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { case: true, finding: true },
    });
    const definition = await this.publishedDefinition();
    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = grouped.get(row.questionId) ?? [];
      list.push(row);
      grouped.set(row.questionId, list);
    }
    const dimensionLabels = new Map(
      definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key]),
    );
    return {
      questions: [...grouped.entries()]
        .map(([questionId, items]) => {
          const question = definition.questions.find((item) => item.id === questionId);
          const aspects = items.map((item) => (item.aspects ?? {}) as ObservationAspects);
          return {
            question_id: questionId,
            text: question?.text ?? questionId,
            domain: question?.domain ?? null,
            dimension: question?.dimension ?? null,
            dimension_label: question ? dimensionLabels.get(question.dimension) ?? question.dimension : null,
            cases: items.map((item) => ({
              case_id: item.caseId,
              label: item.case?.casebookKey
                ? (CASEBOOK_META.find((entry) => entry.key === item.case?.casebookKey)?.label ?? item.case.label)
                : (item.case?.label ?? 'sin caso'),
              aspects: (item.aspects ?? {}) as ObservationAspects,
              proposal: item.note,
              proposed_wording: item.proposedWording ?? item.proposal,
              kind: item.kind ?? 'CONTENT',
              fidelity: (item.fidelity ?? null) as ObservationFidelity | null,
            })),
            aspect_counts: aspectCounts(aspects),
            engine_testable: items.some((item) => item.kind === 'ENGINE'),
            issue_types: [...new Set(items.flatMap((item) => item.issueTypes))],
            status: items[0]?.status ?? 'PENDING',
            count: items.length,
            observations: items.map((item) => this.serializeObservation(item)),
          };
        })
        .sort((a, b) => b.cases.length - a.cases.length),
    };
  }

  async createObservation(
    userId: string,
    runId: string,
    input: {
      question_id: string;
      issue_types?: string[];
      aspects?: ObservationAspects;
      note?: string;
      proposal?: string | null;
      proposed_wording?: string | null;
      fidelity?: ObservationFidelity | null;
    },
  ) {
    const run = await this.loadRun(runId);
    const aspects = input.aspects ?? {};
    const invalid = validateAspects(aspects);
    if (invalid) throw new UnprocessableEntityException(invalid);
    const fidelityError = validateFidelity(input.fidelity);
    if (fidelityError) throw new UnprocessableEntityException(fidelityError);
    const definition = await this.definitionByRef(run.definitionRef);
    const question = definition.questions.find((item) => item.id === input.question_id);
    const aliasFrom = definition.alias_map
      .filter((item) => item.to === question?.dimension || item.from === question?.dimension)
      .map((item) => item.from);
    const classified = classifyObservation(aspects, {
      question_id: input.question_id,
      alias_from: aliasFrom,
    });
    const note = (input.note ?? input.proposal ?? '').trim();
    if (hasNonOkAspect(aspects) && !note) {
      throw new UnprocessableEntityException('Escribe qué cambiarías exactamente.');
    }
    const created = await this.prisma.labQuestionObservation.create({
      data: {
        questionId: input.question_id,
        caseId: run.caseId,
        runId: run.id,
        reviewer: userId,
        issueTypes: classified.issue_types.length ? classified.issue_types : (input.issue_types ?? []),
        note: note || 'Revisada',
        proposal: input.proposal?.trim() || input.proposed_wording?.trim() || null,
        aspects: asJson(aspects),
        proposedWording: input.proposed_wording?.trim() || null,
        kind: classified.kind,
        suggestedOperation: classified.suggested_operation ? asJson(classified.suggested_operation) : undefined,
        fidelity: input.fidelity ? asJson(input.fidelity) : undefined,
        status: 'PENDING',
      },
      include: { case: true, finding: true },
    });
    return this.serializeObservation(created);
  }

  async patchObservation(
    id: string,
    input: {
      status?: string;
      finding_id?: string | null;
      note?: string;
      proposal?: string | null;
      issue_types?: string[];
    },
  ) {
    const updated = await this.prisma.labQuestionObservation.update({
      where: { id },
      data: {
        status: input.status,
        findingId: input.finding_id === undefined ? undefined : input.finding_id,
        note: input.note,
        proposal: input.proposal,
        issueTypes: input.issue_types,
      },
      include: { case: true, finding: true },
    });
    return this.serializeObservation(updated);
  }

  async observationToFinding(
    userId: string,
    observationId: string,
    input: { finding_id?: string; title?: string; summary?: string; severity?: string },
  ) {
    const observation = await this.prisma.labQuestionObservation.findUnique({
      where: { id: observationId },
      include: { case: true },
    });
    if (!observation) throw new NotFoundException('Observation not found');
    let findingId = input.finding_id ?? null;
    if (!findingId) {
      const created = await this.createFinding(userId, {
        title: input.title?.trim() || `Pregunta ${observation.questionId}`,
        summary: input.summary?.trim() || observation.note,
        layer: 'QUESTION_CONTENT',
        severity: input.severity ?? 'IMPORTANT',
        current_behavior: `Pregunta ${observation.questionId} tal como está en la definición publicada.`,
        rafa_expected_behavior: observation.proposal || observation.note,
        related_rules: observation.issueTypes,
        evidence_ids: [observation.questionId],
        case_ids: observation.caseId ? [observation.caseId] : [],
      });
      findingId = created.id;
      const contentOps = ['BAD_COPY', 'UNCLEAR', 'DOUBLE', 'SCALE_MISMATCH', 'OPTIONS_SENSELESS', 'MISSING_QUESTION'];
      if (observation.issueTypes.some((item) => contentOps.includes(item))) {
        await this.prisma.labFinding.update({
          where: { id: findingId },
          data: { contentChangeRequired: true },
        });
      }
    } else if (observation.caseId) {
      await this.linkFindingCases(findingId, [observation.caseId]);
    }
    return this.patchObservation(observationId, {
      finding_id: findingId,
      status: 'CONVERTED_TO_FINDING',
    });
  }

  async patchFindingCaseLedger(
    findingId: string,
    input: {
      case_id: string;
      supports_finding?: string | null;
      rafa_criterion?: string | null;
      matrix_result?: string | null;
      difference?: string | null;
    },
  ) {
    await this.prisma.labFindingCase.upsert({
      where: { findingId_caseId: { findingId, caseId: input.case_id } },
      create: {
        findingId,
        caseId: input.case_id,
        supportsFinding: input.supports_finding ?? null,
        rafaCriterion: input.rafa_criterion ?? null,
        matrixResult: input.matrix_result ?? null,
        difference: input.difference ?? null,
      },
      update: {
        supportsFinding: input.supports_finding,
        rafaCriterion: input.rafa_criterion,
        matrixResult: input.matrix_result,
        difference: input.difference,
      },
    });
    return this.getFinding(findingId);
  }

  async deliveryReport() {
    const findings = await this.prisma.labFinding.findMany({
      include: { cases: { include: { case: true } }, consistencies: true, changeSets: true, observations: true },
      orderBy: { number: 'asc' },
    });
    const observations = await this.prisma.labQuestionObservation.findMany({
      include: { case: true },
      orderBy: { createdAt: 'asc' },
    });
    const cases = await this.prisma.labCase.findMany({
      where: { archivedAt: null },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: { reviews: { orderBy: { revision: 'desc' }, take: 1 }, expectations: { orderBy: { revision: 'desc' }, take: 1 } },
        },
      },
    });
    const replays = await this.prisma.labReplayRun.findMany({
      include: { results: true, changeset: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const readiness = await this.readiness();
    const questionText = new Map(loadFrozenDefinition().questions.map((item) => [item.id, item.text]));
    const reviewed = cases.filter((item) =>
      isMatrixReviewComplete({
        status: item.runs[0]?.status ?? 'COLLECTING',
        has_expectation: Boolean(item.runs[0]?.expectations.length),
        has_review: Boolean(item.runs[0]?.reviews[0]),
        has_case_verdict: Boolean(item.runs[0]?.reviews[0]?.caseVerdict),
      }),
    );
    const keep = findings.filter((row) => row.status === 'KEEP_MATRIX');
    const change = findings.filter((row) =>
      ['OPEN', 'CHANGE_MATRIX', 'WORTH_TESTING', 'CHANGE_IN_TEST'].includes(row.status),
    );
    return {
      recommended_version: readiness.candidate,
      keep: keep.map((row) => ({ code: `H-${String(row.number).padStart(3, '0')}`, title: row.title, current: row.currentBehavior })),
      change: change.map((row) => ({
        code: `H-${String(row.number).padStart(3, '0')}`,
        title: row.title,
        current: row.currentBehavior,
        proposed: row.rafaExpectedBehavior,
        evidence: row.cases.map((link) => link.case.casebookKey ?? link.case.label),
      })),
      questions_to_correct: observations
        .filter((row) => !row.issueTypes.includes('MISSING_QUESTION') && !row.issueTypes.includes('NOT_USEFUL'))
        .map((row) => ({
          question_id: row.questionId,
          problem: row.issueTypes,
          proposed: row.proposal,
          note: row.note,
          cases: row.case?.casebookKey ?? row.case?.label ?? null,
        })),
      questions_to_remove: observations
        .filter((row) => row.issueTypes.includes('NOT_USEFUL'))
        .map((row) => ({ question_id: row.questionId, note: row.note })),
      questions_to_add: observations
        .filter((row) => row.issueTypes.includes('MISSING_QUESTION'))
        .map((row) => ({ note: row.note, proposal: row.proposal })),
      rules_to_change: change
        .filter((row) => row.relatedRules.length)
        .map((row) => ({
          rules: row.relatedRules,
          current: row.currentBehavior,
          proposed: row.rafaExpectedBehavior,
          cases: row.cases.map((link) => link.case.casebookKey ?? link.case.label),
        })),
      open_findings: findings.filter((row) => ['OPEN', 'NEEDS_MORE_CASES', 'WORTH_TESTING', 'CHANGE_IN_TEST'].includes(row.status)).map((row) => this.serializeFinding(row)),
      known_limitations: findings.filter((row) => row.status === 'KNOWN_LIMITATION').map((row) => this.serializeFinding(row)),
      cases_reviewed: reviewed.map((item) => ({
        id: item.id,
        label: item.label,
        casebook_key: item.casebookKey,
        verdict: item.runs[0]?.reviews[0]?.caseVerdict ?? null,
      })),
      cases_created: cases.filter((item) => !item.casebookKey).map((item) => ({ id: item.id, label: item.label, kind: item.kind })),
      regression: replays[0]
        ? {
            replay_id: replays[0].id,
            cases: replays[0].results.length,
            flags: replays[0].results.map((row) => row.flags),
          }
        : null,
      decision: readiness.decision,
      readiness,
      sections: buildDeliverySections({
        candidate_ref: readiness.candidate?.definition_ref ?? null,
        reviewed: reviewed.map((item) => ({
          label: item.label,
          verdict: item.runs[0]?.reviews[0]?.caseVerdict ?? null,
        })),
        own: cases.filter((item) => !item.casebookKey).map((item) => ({ label: item.label, kind: item.kind })),
        observations: observations.map((row) => ({
          question_id: row.questionId,
          text: questionText.get(row.questionId) ?? row.questionId,
          aspects: (row.aspects ?? null) as Record<string, string | null> | null,
          issue_types: row.issueTypes,
          proposed_wording: row.proposedWording,
          proposal: row.proposal,
          note: row.note,
          status: row.status,
          case_label: row.case?.casebookKey ?? row.case?.label ?? null,
          fidelity: (row.fidelity ?? null) as { verdict?: string } | null,
        })),
        findings: findings.map((row) => ({
          title: row.title,
          layer: row.layer,
          status: row.status,
          related_rules: row.relatedRules,
        })),
        plans: reviewed
          .filter((item) => {
            const verdicts = (item.runs[0]?.reviews[0]?.verdicts ?? {}) as Record<string, unknown>;
            return verdicts.plan === 'INCORRECT';
          })
          .map((item) => ({
            label: item.label,
            recommended: item.runs[0]?.reviews[0]?.recommendedPlanId ?? null,
          })),
        regressions: (replays[0]?.results ?? []).map((row) => ({
          case_label: row.sourceRunId,
          impact: (row.flags as { impact?: string } | null)?.impact,
        })),
        decision: readiness.decision,
      }),
    };
  }

  async deliveryMarkdown() {
    const report = await this.deliveryReport();
    return { markdown: formatDeliveryMarkdown(report.sections) };
  }

  async listChangeSets() {
    const rows = await this.prisma.labChangeSet.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        finding: { select: { number: true, title: true } },
        replays: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true } },
      },
    });
    return {
      changesets: rows.map((row) => ({
        id: row.id,
        number: row.number,
        reason: row.reason,
        status: row.status,
        finding: row.finding ? { number: row.finding.number, title: row.finding.title } : null,
        candidate_ref: row.targetDefinitionRef,
        replay_id: row.replays[0]?.id ?? null,
        operations: ((row.operations as Array<{ op?: string; question_id?: string; label?: string }>) ?? []).map((item) =>
          item.op === 'SET_QUESTION_WEIGHT'
            ? 'Esta pregunta influye distinto'
            : item.op === 'SET_QUESTION_ACTIVE'
              ? 'Esta pregunta deja de participar en el cálculo'
              : item.op === 'SET_DIMENSION_ALIAS'
                ? 'Estas dimensiones se tratan juntas'
                : item.op === 'SET_INTERPRETATION_PARAM'
                  ? 'Cambia una regla de lectura'
                  : item.op === 'SET_RULE_PARAM'
                    ? 'Cambia un umbral'
                    : 'Cambio',
        ),
      })),
    };
  }

  private serializeFinding(row: {
    id: string;
    number: number;
    title: string;
    summary: string;
    layer: string;
    severity: string;
    status: string;
    hypothesis: string | null;
    currentBehavior: string;
    rafaExpectedBehavior: string;
    relatedRules: string[];
    evidenceIds: string[];
    decision: string | null;
    decisionReason: string | null;
    contentChangeRequired?: boolean;
    createdAt: Date;
    updatedAt: Date;
    cases?: Array<{
      caseId: string;
      supportsFinding?: string | null;
      rafaCriterion?: string | null;
      matrixResult?: string | null;
      difference?: string | null;
      case?: { label: string; casebookKey: string | null };
    }>;
    changeSets?: Array<{ id: string; reason: string; status: string; targetDefinitionRef?: string | null }>;
    consistencies?: Array<{
      id: string;
      acceptedCaseKey: string;
      rejectedCaseKey: string;
      answer: string | null;
      notes: string | null;
    }>;
    observations?: Array<{
      id: string;
      questionId: string;
      issueTypes: string[];
      note: string;
      proposal: string | null;
      status: string;
      caseId: string | null;
    }>;
  }) {
    return {
      id: row.id,
      number: row.number,
      code: `H-${String(row.number).padStart(3, '0')}`,
      title: row.title,
      summary: row.summary,
      layer: row.layer,
      scope: findingScope(row.layer),
      blocks_matrix: findingBlocksMatrix({
        layer: row.layer,
        severity: row.severity,
        status: this.effectiveFindingStatus(row),
      }),
      severity: row.severity,
      status: this.effectiveFindingStatus(row),
      stored_status: row.status,
      ready_to_open: this.findingGate(row).ok,
      open_missing: this.findingGate(row).missing,
      hypothesis: row.hypothesis,
      current_behavior: row.currentBehavior,
      rafa_expected_behavior: row.rafaExpectedBehavior,
      related_rules: row.relatedRules,
      evidence_ids: row.evidenceIds,
      decision: row.decision,
      decision_reason: row.decisionReason,
      content_change_required: row.contentChangeRequired ?? false,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      cases: (row.cases ?? []).map((link) => ({
        id: link.caseId,
        label: link.case?.label ?? link.caseId,
        casebook_key: link.case?.casebookKey ?? null,
        supports_finding: link.supportsFinding ?? null,
        rafa_criterion: link.rafaCriterion ?? null,
        matrix_result: link.matrixResult ?? null,
        difference: link.difference ?? null,
      })),
      experiments: (row.changeSets ?? []).map((item) => ({
        id: item.id,
        reason: item.reason,
        status: item.status,
        candidate_ref: item.targetDefinitionRef ?? null,
      })),
      consistencies: row.consistencies ?? [],
      observations: (row.observations ?? []).map((item) => ({
        id: item.id,
        question_id: item.questionId,
        issue_types: item.issueTypes,
        note: item.note,
        proposal: item.proposal,
        status: item.status,
        case_id: item.caseId,
      })),
    };
  }

  async questionBank() {
    const definition = await this.publishedDefinition();
    return buildQuestionBank(definition);
  }

  async ruleCoverage() {
    return buildRuleCoverage();
  }

  private findingGate(row: {
    title: string;
    currentBehavior?: string | null;
    rafaExpectedBehavior?: string | null;
    layer: string;
    severity: string;
    evidenceIds?: string[];
    relatedRules?: string[];
    cases?: unknown[];
  }) {
    return findingOpenReady({
      title: row.title,
      currentBehavior: row.currentBehavior,
      rafaExpectedBehavior: row.rafaExpectedBehavior,
      layer: row.layer,
      severity: row.severity,
      caseCount: row.cases?.length ?? 0,
      evidenceCount: row.evidenceIds?.length ?? 0,
      global: row.relatedRules?.includes('GLOBAL'),
    });
  }

  private effectiveFindingStatus(row: {
    title: string;
    currentBehavior?: string | null;
    rafaExpectedBehavior?: string | null;
    layer: string;
    severity: string;
    evidenceIds?: string[];
    relatedRules?: string[];
    cases?: unknown[];
    status: string;
  }) {
    return findingEffectiveStatus(row.status, this.findingGate(row).ok);
  }

  private resolvedFindingStatus(
    input: {
      title: string;
      current_behavior: string;
      rafa_expected_behavior: string;
      layer: string;
      severity: string;
      related_rules?: string[];
      evidence_ids?: string[];
      status?: string;
    },
    caseCount: number,
  ) {
    const ready = findingOpenReady({
      title: input.title,
      current_behavior: input.current_behavior,
      rafa_expected_behavior: input.rafa_expected_behavior,
      layer: input.layer,
      severity: input.severity,
      caseCount,
      evidenceCount: input.evidence_ids?.length ?? 0,
      global: input.related_rules?.includes('GLOBAL'),
    });
    if (input.status && input.status !== 'DRAFT' && ready.ok) return input.status;
    return 'DRAFT';
  }
}
