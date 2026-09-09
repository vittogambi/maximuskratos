import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LabCaseKind } from '@prisma/client';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import {
  AcceptChangeSetDto,
  ComposeCandidateDto,
  CreateCaseDto,
  CreateFindingDto,
  CreateMethodologyCaseDto,
  CreateObservationDto,
  DuplicateCaseDto,
  FindingCaseLedgerDto,
  ObservationFindingDto,
  PatchObservationDto,
  CreateReplayDto,
  CreateRunDto,
  CreateWorkSessionDto,
  CreateWorkspaceDto,
  DirectionDto,
  ExpectationDto,
  FindingChangeDto,
  FindingConsistencyDto,
  GuidedChangeDto,
  LinkFindingCasesDto,
  MaterializeDto,
  PatchCaseDto,
  PatchFindingDto,
  PatchMigrationDto,
  PatchOperationsDto,
  ProductReviewDto,
  ProjectExperienceDto,
  PurposeAssessmentDto,
  ReadinessDecisionDto,
  RejectDto,
  ReplayReviewedDto,
  ReplayVerdictDto,
  ReviewDto,
  ReviewVerdictDto,
  SafetyAssessmentDto,
  SaveResponseDto,
  SaveResponsesBatchDto,
} from './lab.dto';
import { LabService } from './lab.service';

@ApiTags('admin-lab')
@Controller('admin/lab')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class LabController {
  constructor(private readonly lab: LabService) {}

  @Get('definitions')
  listDefinitions() {
    return this.lab.listDefinitions();
  }

  @Get('definitions/:ref/validation')
  async validation(@Param('ref') ref: string) {
    const row = await this.lab.getDefinition(ref);
    return { definition_ref: row.definition_ref, note: 'Published copy. Importer report lives with the frozen artifact.' };
  }

  @Get('definitions/:ref/export')
  exportDefinition(@Param('ref') ref: string) {
    return this.lab.getDefinition(ref);
  }

  @Get('definitions/:ref')
  getDefinition(@Param('ref') ref: string) {
    return this.lab.getDefinition(ref);
  }

  @Post('definitions/:ref/accept')
  acceptDefinition(@Param('ref') ref: string) {
    return this.lab.markDefinition(ref, 'ACCEPTED_CANDIDATE');
  }

  @Post('definitions/:ref/reject')
  rejectDefinition(@Param('ref') ref: string, @Body() _body: RejectDto) {
    return this.lab.markDefinition(ref, 'REJECTED');
  }

  @Post('definitions/:ref/mark-published')
  markPublished(@Param('ref') ref: string) {
    return this.lab.markDefinition(ref, 'PUBLISHED');
  }

  @Get('workspaces')
  workspaces() {
    return this.lab.workspaces();
  }

  @Post('workspaces')
  createWorkspace(@Req() req: AuthenticatedRequest, @Body() body: CreateWorkspaceDto) {
    return this.lab.createWorkspace(req.user.sub, body.base_definition_ref);
  }

  @Get('workspaces/:id')
  getWorkspace(@Param('id') id: string) {
    return this.lab.getWorkspace(id);
  }

  @Patch('workspaces/:id/operations')
  patchOperations(@Param('id') id: string, @Body() body: PatchOperationsDto) {
    return this.lab.patchOperations(id, body.operations);
  }

  @Post('workspaces/:id/materialize')
  materialize(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: MaterializeDto,
  ) {
    return this.lab.materialize(id, req.user.sub, body);
  }

  @Get('cases')
  listCases(@Req() req: AuthenticatedRequest) {
    return this.lab.listCases(req.user.sub);
  }

  @Get('session-progress')
  sessionProgress(@Req() req: AuthenticatedRequest) {
    return this.lab.sessionProgress(req.user.sub);
  }

  @Get('question-bank')
  questionBank() {
    return this.lab.questionBank();
  }

  @Get('rule-coverage')
  ruleCoverage() {
    return this.lab.ruleCoverage();
  }

  @Post('cases')
  createCase(@Req() req: AuthenticatedRequest, @Body() body: CreateCaseDto) {
    return this.lab.createCase(req.user.sub, {
      label: body.label,
      kind: body.kind as LabCaseKind,
      blind: body.blind,
      expert_context: body.expert_context,
    });
  }

  @Post('cases/methodology')
  createMethodologyCase(@Req() req: AuthenticatedRequest, @Body() body: CreateMethodologyCaseDto) {
    return this.lab.createMethodologyCase(req.user.sub, body);
  }

  @Post('cases/:id/duplicate')
  duplicateCase(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() body: DuplicateCaseDto) {
    return this.lab.duplicateCase(id, req.user.sub, body);
  }

  @Post('cases/:id/archive')
  archiveDraft(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.lab.archiveDraftCase(id, req.user.sub);
  }

  @Get('cases/:id')
  getCase(@Param('id') id: string) {
    return this.lab.getCase(id);
  }

  @Patch('cases/:id')
  patchCase(@Param('id') id: string, @Body() body: PatchCaseDto) {
    return this.lab.patchCase(id, body);
  }

  @Post('cases/:id/runs')
  createRun(@Param('id') id: string, @Body() body: CreateRunDto) {
    return this.lab.createRun(id, body);
  }

  @Get('runs/:id/next')
  next(@Param('id') id: string) {
    return this.lab.nextQuestion(id);
  }

  @Get('runs/:id/responses')
  responses(@Param('id') id: string) {
    return this.lab.listQuestions(id);
  }

  @Post('runs/:id/responses/batch')
  saveResponses(@Param('id') id: string, @Body() body: SaveResponsesBatchDto) {
    return this.lab.saveResponses(id, body.responses ?? []);
  }

  @Post('runs/:id/responses')
  saveResponse(@Param('id') id: string, @Body() body: SaveResponseDto) {
    return this.lab.saveResponse(id, body);
  }

  @Post('runs/:id/freeze')
  freeze(@Param('id') id: string) {
    return this.lab.freeze(id);
  }

  @Get('runs/:id/result')
  result(@Param('id') id: string) {
    return this.lab.result(id);
  }

  @Get('runs/:id/trace')
  trace(@Param('id') id: string) {
    return this.lab.trace(id);
  }

  @Get('runs/:id/preview')
  preview(@Param('id') id: string) {
    return this.lab.preview(id);
  }

  @Post('runs/:id/expectation')
  expectation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: ExpectationDto,
  ) {
    return this.lab.submitExpectation(id, req.user.sub, body);
  }

  @Get('runs/:id/expectation')
  getExpectation(@Param('id') id: string) {
    return this.lab.getExpectation(id);
  }

  @Post('runs/:id/reveal')
  reveal(@Param('id') id: string) {
    return this.lab.reveal(id);
  }

  @Get('runs/:id/comparison')
  comparison(@Param('id') id: string) {
    return this.lab.comparison(id);
  }

  @Post('runs/:id/review')
  review(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() body: ReviewDto) {
    return this.lab.submitReview(id, req.user.sub, body);
  }

  @Get('runs/:id/review')
  getReview(@Param('id') id: string) {
    return this.lab.getReview(id);
  }

  @Patch('runs/:id/review/verdict')
  patchReviewVerdict(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: ReviewVerdictDto,
  ) {
    return this.lab.patchReviewVerdict(id, req.user.sub, body);
  }

  @Post('runs/:id/safety-assessment')
  safety(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: SafetyAssessmentDto,
  ) {
    return this.lab.submitSafety(id, req.user.sub, body);
  }

  @Post('runs/:id/purpose-assessment')
  purpose(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: PurposeAssessmentDto,
  ) {
    return this.lab.submitPurpose(id, req.user.sub, body);
  }

  @Get('runs/:id/assessments')
  assessments(@Param('id') id: string) {
    return this.lab.assessments(id);
  }

  @Post('runs/:id/direction')
  direction(@Param('id') id: string, @Body() body: DirectionDto) {
    return this.lab.createDirection(id, body);
  }

  @Post('runs/:id/experience/project')
  project(@Param('id') id: string, @Body() body: ProjectExperienceDto) {
    return this.lab.project(id, body);
  }

  @Get('runs/:id/experience')
  experience(@Param('id') id: string) {
    return this.lab.latestExperience(id);
  }

  @Post('runs/:id/product-review')
  productReview(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: ProductReviewDto,
  ) {
    return this.lab.productReview(id, req.user.sub, body);
  }

  @Get('runs/:id/product-review')
  getProductReview(@Param('id') id: string) {
    return this.lab.getProductReview(id);
  }

  @Get('runs/:id/catalog')
  catalog(@Param('id') id: string) {
    return this.lab.catalog(id);
  }

  @Get('runs/:id/change-options')
  changeOptions(@Param('id') id: string) {
    return this.lab.changeOptions(id);
  }

  @Post('runs/:id/change')
  guidedChange(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: GuidedChangeDto,
  ) {
    return this.lab.guidedChange(id, req.user.sub, body);
  }

  @Get('runs/:id')
  getRun(@Param('id') id: string) {
    return this.lab.getRun(id);
  }

  @Post('replays')
  replay(@Req() req: AuthenticatedRequest, @Body() body: CreateReplayDto) {
    return this.lab.replay(req.user.sub, body);
  }

  @Get('replays/:id/results/:runId')
  replayResult(@Param('id') id: string, @Param('runId') runId: string) {
    return this.lab.replayResult(id, runId);
  }

  @Post('replays/:id/results/:runId/verdict')
  replayVerdict(
    @Param('id') id: string,
    @Param('runId') runId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: ReplayVerdictDto,
  ) {
    return this.lab.replayVerdict(id, runId, req.user.sub, body.verdict);
  }

  @Get('replays/:id/results')
  replayResults(@Param('id') id: string) {
    return this.lab.getReplay(id);
  }

  @Get('replays/:id/comparison')
  replayComparison(@Param('id') id: string) {
    return this.lab.replayComparison(id);
  }

  @Get('replays/:id')
  getReplay(@Param('id') id: string) {
    return this.lab.getReplay(id);
  }

  @Post('changesets/:id/accept')
  acceptChangeSet(@Param('id') id: string, @Body() body: AcceptChangeSetDto) {
    return this.lab.acceptChangeSet(id, body);
  }

  @Post('changesets/:id/reject')
  rejectChangeSet(@Param('id') id: string) {
    return this.lab.rejectChangeSet(id);
  }

  @Get('runs/:id/pair-compare')
  pairCompare(@Param('id') id: string) {
    return this.lab.pairCompare(id);
  }

  @Get('runs/:id/compare-parent')
  compareParent(@Param('id') id: string) {
    return this.lab.compareParent(id);
  }

  @Get('source-mappings')
  sourceMappings(@Query('confidence') confidence?: string) {
    return this.lab.listSourceMappings(confidence);
  }

  @Get('migrations')
  listMigrations() {
    return this.lab.listMigrations();
  }

  @Get('review-agenda')
  reviewAgenda() {
    return this.lab.reviewAgenda();
  }

  @Patch('migrations/:id')
  patchMigration(@Param('id') id: string, @Body() body: PatchMigrationDto) {
    return this.lab.patchMigration(id, body);
  }

  @Get('observations')
  listObservations() {
    return this.lab.listObservations();
  }

  @Post('runs/:id/observations')
  createObservation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateObservationDto,
  ) {
    return this.lab.createObservation(req.user.sub, id, body);
  }

  @Patch('observations/:id')
  patchObservation(@Param('id') id: string, @Body() body: PatchObservationDto) {
    return this.lab.patchObservation(id, body);
  }

  @Post('observations/:id/finding')
  observationFinding(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: ObservationFindingDto,
  ) {
    return this.lab.observationToFinding(req.user.sub, id, body);
  }

  @Post('findings/:id/ledger')
  findingLedger(@Param('id') id: string, @Body() body: FindingCaseLedgerDto) {
    return this.lab.patchFindingCaseLedger(id, body);
  }

  @Get('delivery-report')
  deliveryReport(@Query('format') format?: string) {
    if (format === 'markdown') return this.lab.deliveryMarkdown();
    return this.lab.deliveryReport();
  }

  @Get('changesets')
  listChangeSets() {
    return this.lab.listChangeSets();
  }

  @Get('findings')
  listFindings() {
    return this.lab.listFindings();
  }

  @Post('findings')
  createFinding(@Req() req: AuthenticatedRequest, @Body() body: CreateFindingDto) {
    return this.lab.createFinding(req.user.sub, body);
  }

  @Get('findings/:id')
  getFinding(@Param('id') id: string) {
    return this.lab.getFinding(id);
  }

  @Patch('findings/:id')
  patchFinding(@Param('id') id: string, @Body() body: PatchFindingDto) {
    return this.lab.patchFinding(id, body);
  }

  @Post('findings/:id/cases')
  linkFindingCases(@Param('id') id: string, @Body() body: LinkFindingCasesDto) {
    return this.lab.linkFindingCases(id, body.case_ids);
  }

  @Post('findings/:id/consistency')
  findingConsistency(@Param('id') id: string, @Body() body: FindingConsistencyDto) {
    return this.lab.recordConsistency(id, body);
  }

  @Post('findings/:id/change')
  findingChange(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: FindingChangeDto,
  ) {
    return this.lab.findingChange(id, req.user.sub, body);
  }

  @Get('candidates')
  listCandidates() {
    return this.lab.listCandidates();
  }

  @Post('candidates/compose')
  composeCandidate(@Req() req: AuthenticatedRequest, @Body() body: ComposeCandidateDto) {
    return this.lab.composeCandidate(req.user.sub, body);
  }

  @Post('candidates/replay-reviewed')
  replayReviewed(@Req() req: AuthenticatedRequest, @Body() body: ReplayReviewedDto) {
    return this.lab.replayReviewed(req.user.sub, body);
  }

  @Get('contracts')
  contracts() {
    return this.lab.evaluateContracts();
  }

  @Get('contracts/:ref')
  contractsRef(@Param('ref') ref: string) {
    return this.lab.evaluateContracts(ref);
  }

  @Get('readiness')
  readiness() {
    return this.lab.readiness();
  }

  @Post('readiness/decision')
  decideReadiness(@Req() req: AuthenticatedRequest, @Body() body: ReadinessDecisionDto) {
    return this.lab.decideReadiness(req.user.sub, body);
  }

  @Get('decision-report')
  decisionReport() {
    return this.lab.decisionReport();
  }

  @Get('work-sessions/current')
  currentSession(@Req() req: AuthenticatedRequest) {
    return this.lab.currentSession(req.user.sub);
  }

  @Post('work-sessions')
  createWorkSession(@Req() req: AuthenticatedRequest, @Body() body: CreateWorkSessionDto) {
    return this.lab.createWorkSession(req.user.sub, body);
  }

  @Post('work-sessions/:id/close')
  closeWorkSession(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.lab.closeWorkSession(id, req.user.sub);
  }

  @Post('fixtures/seed')
  seedFixtures(@Req() req: AuthenticatedRequest) {
    return this.lab.seedFixtures(req.user.sub);
  }

  @Get('questions/:id')
  question(@Param('id') id: string) {
    return this.lab.questionCard(id);
  }

  @Get('rules/:id')
  rule(@Param('id') id: string) {
    return this.lab.ruleCard(id);
  }
}
