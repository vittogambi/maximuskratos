import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { AdminActorGuard } from './admin-actor.guard';
import { ReconstructAlertsDto } from './dto/reconstruct-alerts.dto';
import { MemberJourneyService } from './member-journey.service';
import { NoStoreInterceptor } from './no-store.interceptor';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminActorGuard)
@UseInterceptors(NoStoreInterceptor)
export class MemberJourneyController {
  constructor(private readonly journey: MemberJourneyService) {}

  private requestId(req: AuthenticatedRequest): string {
    const header = req.header('x-request-id');
    return header?.trim() || randomUUID();
  }

  @Get('users/:userId/journey')
  summary(@Req() req: AuthenticatedRequest, @Param('userId') userId: string, @Query('sessionId') sessionId?: string) {
    return this.journey.summary(req.user.sub, userId, sessionId, this.requestId(req));
  }

  @Get('users/:userId/sessions/:sessionId/responses')
  responses(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Query('module') module?: string,
    @Query('page') page?: string,
  ) {
    return this.journey.responses(req.user.sub, userId, sessionId, module, page, this.requestId(req));
  }

  @Get('users/:userId/alerts')
  userAlerts(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Query('sessionId') sessionId?: string,
    @Query('module') module?: string,
    @Query('rule') rule?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
  ) {
    return this.journey.alerts(req.user.sub, { userId, sessionId, moduleSlug: module, ruleVersion: rule, from, to, page }, this.requestId(req));
  }

  @Get('alerts')
  alerts(
    @Req() req: AuthenticatedRequest,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('module') module?: string,
    @Query('rule') rule?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
  ) {
    return this.journey.alerts(req.user.sub, { userId, sessionId, moduleSlug: module, ruleVersion: rule, from, to, page }, this.requestId(req));
  }

  @Post('alerts/reconstruct')
  reconstruct(@Req() req: AuthenticatedRequest, @Body() body: ReconstructAlertsDto) {
    return this.journey.reconstruct(req.user.sub, body.userId, body.sessionId, body.execute, this.requestId(req));
  }
}
