import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { DiagnosticOpenGuard } from '../diagnostic/diagnostic-open.guard';
import { IAD_IDS, scoreIad, type IadAnswer, type IadId } from '../instrumentos/iad';
import { JourneyService } from './journey.service';

type PriorityDirection = 'EXPLORANDO' | 'PROVISIONAL' | 'CONFIRMADO_POR_USUARIO' | null;

@ApiTags('journey')
@Controller('journey')
@UseGuards(JwtAuthGuard, DiagnosticOpenGuard)
@ApiBearerAuth()
@SkipThrottle({ auth: true })
export class JourneyController {
  constructor(private readonly journey: JourneyService) {}

  @Get('state')
  state(@Request() req: AuthenticatedRequest) {
    return this.journey.state(req.user.sub);
  }

  @Get('purpose/contract')
  contract(@Request() req: AuthenticatedRequest) {
    return this.journey.contractDraft(req.user.sub);
  }

  @Get('purpose')
  purpose(@Request() req: AuthenticatedRequest) {
    return this.journey.latestPurpose(req.user.sub);
  }

  @Post('purpose')
  savePurpose(@Request() req: AuthenticatedRequest, @Body() body: { content: Record<string, string> }) {
    return this.journey.savePurpose(req.user.sub, body.content ?? {});
  }

  @Get('synthesis')
  synthesis(@Request() req: AuthenticatedRequest) {
    return this.journey.synthesis(req.user.sub);
  }

  @Post('synthesis')
  saveSynthesis(@Request() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.journey.saveSynthesis(req.user.sub, body);
  }

  @Get('purpose/history')
  purposeHistory(@Request() req: AuthenticatedRequest) {
    return this.journey.purposeHistory(req.user.sub);
  }

  @Post('alignment')
  alignment(
    @Request() req: AuthenticatedRequest,
    @Body() body: { answers?: Record<string, { value?: number | null; unknown?: boolean }> },
  ) {
    const answers = {} as Record<IadId, IadAnswer>;
    for (const id of IAD_IDS) {
      const row = body.answers?.[id];
      const value = row?.value;
      answers[id] = {
        value: value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : null,
        unknown: Boolean(row?.unknown) || value == null,
      };
    }
    return this.journey.saveAlignment(req.user.sub, answers, scoreIad(answers));
  }

  @Post('purpose/confirm')
  confirmPurpose(@Request() req: AuthenticatedRequest) {
    return this.journey.confirmPurpose(req.user.sub);
  }

  @Post('purpose/reopen')
  reopenGap(@Request() req: AuthenticatedRequest, @Body() body: { moduleSlug?: string }) {
    const moduleSlug = body.moduleSlug?.trim() ?? '';
    if (!moduleSlug) throw new BadRequestException('Falta el módulo.');
    return this.journey.reopenGap(req.user.sub, moduleSlug);
  }

  @Get('execution')
  execution(@Request() req: AuthenticatedRequest) {
    return this.journey.execution(req.user.sub);
  }

  @Get('domains/:domain')
  domain(@Request() req: AuthenticatedRequest, @Param('domain') domain: string) {
    return this.journey.domainView(req.user.sub, this.journey.parseDomain(domain));
  }

  @Post('domains/:domain/actions')
  addDomainAction(
    @Request() req: AuthenticatedRequest,
    @Param('domain') domain: string,
    @Body() body: { title: string; doneWhen: string; weekday?: number; contentTags?: string[]; healthLimit?: string; conversation?: string },
  ) {
    return this.journey.addDomainAction(req.user.sub, this.journey.parseDomain(domain), body);
  }

  @Get('plans')
  plans(@Request() req: AuthenticatedRequest) {
    return this.journey.listPlans(req.user.sub);
  }

  @Post('plans')
  createPlan(
    @Request() req: AuthenticatedRequest,
    @Body() body: { title: string; outcome: string; priorityNote?: string; linkKind?: string; valueRef?: string; purposeRevisionId?: string; sourceCombinationId?: string },
  ) {
    return this.journey.createPlan(req.user.sub, body);
  }

  @Post('reading/recover')
  recoverReading(@Request() req: AuthenticatedRequest) {
    return this.journey.recoverReading(req.user.sub);
  }

  @Post('priority/preview')
  previewPriority(
    @Request() req: AuthenticatedRequest,
    @Body() body: { direction?: PriorityDirection; interest?: string | null; capacity?: number | null; weeklyMinutes?: number | null; healthLimit?: boolean; hasIkigaiExperiment?: boolean; goal?: string | null },
  ) {
    return this.journey.previewPriority(req.user.sub, {
      direction: body.direction ?? null,
      interest: body.interest ?? null,
      capacity: body.capacity ?? null,
      weeklyMinutes: body.weeklyMinutes ?? null,
      healthLimit: body.healthLimit,
      hasIkigaiExperiment: Boolean(body.hasIkigaiExperiment),
      goal: body.goal ?? null,
    });
  }

  @Post('priority')
  confirmPriority(
    @Request() req: AuthenticatedRequest,
    @Body() body: { direction?: PriorityDirection; interest?: string | null; capacity?: number | null; weeklyMinutes?: number | null; healthLimit?: boolean; hasIkigaiExperiment?: boolean; goal?: string | null; focus?: string; digest?: string; commandKey?: string },
  ) {
    return this.journey.confirmPriority(req.user.sub, {
      direction: body.direction ?? null,
      interest: body.interest ?? null,
      capacity: body.capacity ?? null,
      weeklyMinutes: body.weeklyMinutes ?? null,
      healthLimit: body.healthLimit,
      hasIkigaiExperiment: Boolean(body.hasIkigaiExperiment),
      goal: body.goal ?? null,
      focus: body.focus,
      digest: body.digest,
      commandKey: body.commandKey,
    });
  }

  @Post('depth')
  confirmDepth(
    @Request() req: AuthenticatedRequest,
    @Body() body: { component: string; meaning?: string; matters?: string; change?: string; link?: string; evidence?: string; decision?: 'KEEP' | 'CHANGE' | 'NOT_APPLY' },
  ) {
    return this.journey.confirmDepth(req.user.sub, body);
  }

  @Post('measurements')
  openMeasurement(@Request() req: AuthenticatedRequest, @Body() body: { kind: 'RECONFIRM' | 'REMEASURE'; sessionId?: string | null }) {
    return this.journey.openCoreMeasurement(req.user.sub, body.kind, body.sessionId ?? null);
  }

  @Post('measurements/:id/answers')
  answerMeasurement(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { sourceRef: string; value?: number | null; exception?: string | null },
  ) {
    return this.journey.answerCoreMeasurement(req.user.sub, id, body.sourceRef, body.value ?? null, body.exception ?? null);
  }

  @Post('measurements/:id/close')
  closeMeasurement(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.journey.finishCoreMeasurement(req.user.sub, id);
  }

  @Post('plans/:planId/actions')
  addAction(
    @Request() req: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Body() body: { title: string; doneWhen: string; weekday?: number; guideId?: string; contentTags?: string[]; healthLimit?: string; conversation?: string },
  ) {
    return this.journey.addAction(req.user.sub, planId, body);
  }

  @Patch('actions/:actionId')
  patchAction(
    @Request() req: AuthenticatedRequest,
    @Param('actionId') actionId: string,
    @Body() body: { title?: string; doneWhen?: string; contentTags?: string[]; healthLimit?: string; conversation?: string },
  ) {
    return this.journey.patchAction(req.user.sub, actionId, body);
  }

  @Post('plans/:planId/activate')
  activatePlan(
    @Request() req: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Body() body: {
      confirmed?: boolean;
      capacityMinutes?: number;
      protectNote?: string | null;
      explicitNoSchedule?: boolean;
      expectedVersion?: number;
      commandKey?: string;
    },
  ) {
    return this.journey.activatePlan(req.user.sub, planId, body);
  }

  @Post('plans/:planId/transition')
  transitionPlan(
    @Request() req: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Body() body: { toStage: 'PREPARING' | 'ACTIVE' | 'PAUSED' | 'MAINTENANCE' | 'CLOSED'; reason?: string | null; expectedVersion?: number },
  ) {
    return this.journey.transitionPlan(req.user.sub, planId, body);
  }

  @Post('plans/:planId/focus')
  focusPlan(
    @Request() req: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Body() body: { enable: boolean; expectedVersion?: number },
  ) {
    return this.journey.setPlanFocus(req.user.sub, planId, body);
  }

  @Patch('plans/:planId')
  patchPlan(
    @Request() req: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Body() body: {
      title?: string;
      outcome?: string;
      status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
      valueRef?: string | null;
      linkKind?: string | null;
      confirmed?: boolean;
      capacityMinutes?: number;
      protectNote?: string | null;
      explicitNoSchedule?: boolean;
      expectedVersion?: number;
    },
  ) {
    return this.journey.patchPlan(req.user.sub, planId, body);
  }

  @Get('calendar')
  calendar(@Request() req: AuthenticatedRequest, @Request() _req: AuthenticatedRequest) {
    return this.journey.calendar(req.user.sub);
  }

  @Post('records')
  record(
    @Request() req: AuthenticatedRequest,
    @Body() body: { actionId: string; day: string; status: 'PENDING' | 'DONE' | 'SKIPPED' | 'NOT_APPLICABLE'; note?: string; resultNote?: string; resultStatus?: 'OBSERVED' | 'NOT_YET_OBSERVED' | 'NOT_OBSERVED' | 'NO_INFORMATION' | null },
  ) {
    return this.journey.upsertRecord(req.user.sub, body);
  }

  @Post('weeks/preview')
  previewWeek(
    @Request() req: AuthenticatedRequest,
    @Body() body: {
      weekStart: string;
      decisions?: Record<string, 'KEEP' | 'REDUCE' | 'SUBSTITUTE' | 'PAUSE' | 'RESUME' | 'CLOSE' | 'MODIFY' | 'RETIRE'>;
      revisions?: Record<string, { title?: string; doneWhen?: string; weekday?: number | null; intervalDays?: number | null }>;
      outcomes?: Record<string, string>;
      review?: { done: number; applicable: number; result: 'MOVED' | 'STUCK' | 'UNKNOWN'; alignmentLow?: boolean; bodyCareLow?: boolean; directionChanged?: boolean };
    },
  ) {
    return this.journey.previewClose(req.user.sub, body.weekStart, body.decisions, body.revisions, body.outcomes, body.review);
  }

  @Post('weeks/close')
  closeWeek(
    @Request() req: AuthenticatedRequest,
    @Body() body: {
      weekStart: string;
      note?: string;
      decisions?: Record<string, 'KEEP' | 'REDUCE' | 'SUBSTITUTE' | 'PAUSE' | 'RESUME' | 'CLOSE' | 'MODIFY' | 'RETIRE'>;
      revisions?: Record<string, { title?: string; doneWhen?: string; weekday?: number | null; intervalDays?: number | null }>;
      outcomes?: Record<string, string>;
    },
  ) {
    return this.journey.closeWeek(req.user.sub, body.weekStart, body.note, body.decisions, body.revisions, body.outcomes);
  }

  @Get('weeks')
  weeks(@Request() req: AuthenticatedRequest) {
    return this.journey.weeks(req.user.sub);
  }

  @Post('guidance')
  guidance(@Request() req: AuthenticatedRequest, @Body() body: { source: string; note?: string }) {
    return this.journey.requestGuidance(req.user.sub, body.source, body.note);
  }
}
