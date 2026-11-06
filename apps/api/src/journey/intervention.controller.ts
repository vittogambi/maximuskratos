import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import type { MemberReviewChoice } from './intervention/review-decision';
import type { ActionChangeInput, AdditionInput } from './intervention/action-review';
import type { MenA1ReviewOutcomes } from './intervention/men-a1-prep';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { DiagnosticOpenGuard } from '../diagnostic/diagnostic-open.guard';
import { InterventionService } from './intervention.service';

@Controller('journey/intervention')
@UseGuards(JwtAuthGuard, DiagnosticOpenGuard)
@SkipThrottle({ auth: true })
export class InterventionController {
  constructor(private readonly intervention: InterventionService) {}

  @Get('week-review/pending')
  pendingWeek(@Request() req: AuthenticatedRequest, @Query('weekStart') weekStart?: string) {
    return this.intervention.pendingWeekReviews(req.user.sub, weekStart ?? '');
  }

  @Post('week-review/apply')
  applyWeek(@Request() req: AuthenticatedRequest, @Body() body: { weekStart?: string; note?: string | null; commandKey?: string }) {
    if (!body.weekStart) throw new BadRequestException('Indica la semana que quieres cerrar.');
    return this.intervention.applyInterventionWeekReview(req.user.sub, body.weekStart, body);
  }

  @Get(':territory')
  view(@Request() req: AuthenticatedRequest, @Param('territory') territory: string, @Query('meta') goal?: string) {
    return this.intervention.view(req.user.sub, territory, goal ?? null);
  }

  @Get(':territory/design-context')
  designContext(@Request() req: AuthenticatedRequest, @Param('territory') territory: string) {
    return this.intervention.designContext(req.user.sub, territory);
  }

  @Post(':territory/designs')
  createDesign(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Body() body: {
      change?: string;
      why?: string | null;
      goal?: string | null;
      contextReadingIds?: string[];
      purposeRevisionId?: string | null;
      linkKind?: string | null;
      commandKey?: string;
    },
  ) {
    return this.intervention.createDesign(req.user.sub, territory, body ?? {});
  }

  @Get(':territory/plans/:planId/design')
  design(@Request() req: AuthenticatedRequest, @Param('territory') territory: string, @Param('planId') planId: string) {
    return this.intervention.designView(req.user.sub, territory, planId);
  }

  @Patch(':territory/plans/:planId/design')
  patchDesign(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.intervention.patchDesign(req.user.sub, territory, planId, body ?? {});
  }

  @Post(':territory/recognition')
  recognize(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Body() body: { readingId?: string; outcome?: string; signature?: string },
  ) {
    return this.intervention.recognize(req.user.sub, territory, body ?? {});
  }

  @Post(':territory/plans')
  createPlan(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Body() body: {
      templateId?: string;
      readingIds?: string[];
      focusText?: string | null;
      stageDefinition?: string | null;
      commandKey?: string;
      change?: string | null;
      why?: string | null;
      observableResult?: string | null;
      linkKind?: string | null;
      purposeRevisionId?: string | null;
      criterion?: string | null;
      criterionStatus?: 'PROVISIONAL' | 'CONFIRMED' | null;
      evidenceHint?: string | null;
      checkAt?: string | null;
      linkedIndicatorRef?: string | null;
      consultedReadingIds?: string[];
    },
  ) {
    return this.intervention.createPlan(req.user.sub, territory, body ?? {});
  }

  @Get(':territory/plans/:planId')
  plan(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.intervention.planView(req.user.sub, territory, planId, weekStart);
  }

  @Patch(':territory/plans/:planId')
  adjust(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: {
      minimum?: boolean;
      horizonWeeks?: number;
      weeklyMinutes?: number;
      occasionsPerWeek?: number | null;
      minutesPerOccasion?: number;
      protectNote?: string | null;
      environmentAccepted?: boolean;
    },
  ) {
    return this.intervention.adjustPlan(req.user.sub, territory, planId, body ?? {});
  }

  @Post(':territory/plans/:planId/indicator')
  indicator(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: {
      indicatorRef?: string;
      value?: number | null;
      text?: string | null;
      textOutcome?: 'ACHIEVED' | 'NOT_ACHIEVED' | 'UNKNOWN';
      notApplicable?: boolean;
      commandKey?: string;
    },
  ) {
    return this.intervention.recordIndicator(req.user.sub, territory, planId, body ?? {});
  }

  @Post(':territory/plans/:planId/activate')
  activate(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: {
      confirmed?: boolean;
      commandKey?: string;
      minimumLoadConfirmed?: boolean;
      reviewAt?: string | null;
      purposeRevisionId?: string | null;
      keepDraftPurposeRevision?: boolean;
      healthLimit?: string | null;
      conversation?: string | null;
    },
  ) {
    return this.intervention.activatePlan(req.user.sub, territory, planId, body ?? {});
  }

  @Patch(':territory/plans/:planId/outcome-contract')
  patchOutcomeContract(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: {
      soughtOutcome?: string;
      criterion?: string;
      criterionStatus?: 'PROVISIONAL' | 'CONFIRMED';
      evidenceHint?: string | null;
      checkAt?: string | null;
      linkedIndicatorRef?: string | null;
      confirmed?: boolean;
      commandKey?: string;
    },
  ) {
    return this.intervention.patchOutcomeContract(req.user.sub, territory, planId, body ?? {});
  }

  @Post(':territory/plans/:planId/outcome-assessment')
  outcomeAssessment(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: { status?: string; text?: string | null; weekStart?: string; commandKey?: string },
  ) {
    return this.intervention.recordOutcomeAssessment(req.user.sub, territory, planId, body ?? {});
  }

  @Get(':territory/plans/:planId/week-prep')
  weekPrep(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.intervention.weekPrepView(req.user.sub, territory, planId, weekStart);
  }

  @Patch(':territory/plans/:planId/week-prep')
  saveWeekPrep(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: { weekStart?: string; payload?: unknown; commandKey?: string },
  ) {
    return this.intervention.saveWeekPrep(req.user.sub, territory, planId, body ?? {});
  }

  @Post(':territory/plans/:planId/week-prep/confirm')
  confirmWeekPrep(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: { weekStart?: string; commandKey?: string },
  ) {
    return this.intervention.confirmWeekPrep(req.user.sub, territory, planId, body ?? {});
  }

  @Patch(':territory/plans/:planId/week-prep/review-outcomes')
  weekPrepReview(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: { weekStart?: string; outcomes?: MenA1ReviewOutcomes; commandKey?: string },
  ) {
    return this.intervention.saveWeekPrepReviewOutcomes(req.user.sub, territory, planId, body ?? {});
  }

  @Post(':territory/plans/:planId/review-decision')
  reviewDecision(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: {
      choice?: string;
      weekStart?: string;
      revision?: { title?: string; doneWhen?: string; occasionsPerWeek?: number | null; minutesPerOccasion?: number | null };
      alternateTemplateId?: string | null;
      note?: string | null;
      commandKey?: string;
      meaning?: 'STILL' | 'LESS' | 'NO_LONGER' | null;
      actions?: ActionChangeInput[];
      additions?: AdditionInput[];
      healthLimit?: string | null;
      conversation?: string | null;
      indicatorChoice?: 'KEEP' | 'REVIEW' | null;
    },
  ) {
    return this.intervention.confirmReview(req.user.sub, territory, planId, {
      choice: body.choice as MemberReviewChoice,
      weekStart: body.weekStart,
      revision: body.revision,
      alternateTemplateId: body.alternateTemplateId,
      note: body.note,
      commandKey: body.commandKey,
      meaning: body.meaning,
      actions: body.actions,
      additions: body.additions,
      healthLimit: body.healthLimit,
      conversation: body.conversation,
      indicatorChoice: body.indicatorChoice,
    });
  }

  @Patch(':territory/plans/:planId/own-contract')
  ownContract(
    @Request() req: AuthenticatedRequest,
    @Param('territory') territory: string,
    @Param('planId') planId: string,
    @Body() body: { seeks?: string; action?: string; doneWhen?: string; indicatorQuestion?: string; horizonWeeks?: number },
  ) {
    if (!body.seeks?.trim() || !body.action?.trim() || !body.doneWhen?.trim() || !body.indicatorQuestion?.trim()) {
      throw new BadRequestException('Faltan el resultado, la acción, el criterio o la pregunta de evidencia.');
    }
    return this.intervention.upsertOwnContract(req.user.sub, territory, planId, {
      seeks: body.seeks,
      action: body.action,
      doneWhen: body.doneWhen,
      indicatorQuestion: body.indicatorQuestion,
      horizonWeeks: body.horizonWeeks,
    });
  }
}
