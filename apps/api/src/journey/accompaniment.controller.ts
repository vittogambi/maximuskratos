import { BadRequestException, Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { DiagnosticOpenGuard } from '../diagnostic/diagnostic-open.guard';
import { generalStartingPoints } from './accompaniment/families';
import { AccompanimentService, type AccompanimentBody } from './accompaniment.service';
import { TERRITORIES, type Territory } from '../instrumentos/glossary';

@Controller('journey')
@UseGuards(JwtAuthGuard, DiagnosticOpenGuard)
@SkipThrottle({ auth: true })
export class AccompanimentController {
  constructor(private readonly accompaniment: AccompanimentService) {}

  @Get('accompaniment/starting-points/:territory')
  startingPoints(@Param('territory') territory: string) {
    const key = territory.toUpperCase();
    if (!TERRITORIES.includes(key as Territory)) throw new BadRequestException('Ámbito desconocido.');
    return { territory: key, points: generalStartingPoints(key as Territory) };
  }

  @Get('devolution')
  devolution(@Request() req: AuthenticatedRequest) {
    return this.accompaniment.devolution(req.user.sub);
  }

  @Post('accompaniment/preview')
  preview(@Request() req: AuthenticatedRequest, @Body() body: AccompanimentBody) {
    return this.accompaniment.preview(req.user.sub, body ?? {});
  }

  @Post('accompaniment')
  confirm(@Request() req: AuthenticatedRequest, @Body() body: AccompanimentBody) {
    return this.accompaniment.confirm(req.user.sub, body ?? {});
  }

  @Post('occasions/cancel')
  cancel(@Request() req: AuthenticatedRequest, @Body() body: { actionId: string; day: string; reason: string }) {
    return this.accompaniment.cancelOccasion(req.user.sub, body);
  }

  @Post('experiments/:id/observations')
  observe(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { aspect: string; status: string; recipient?: string | null; observed?: string | null; actionRecordId?: string | null },
  ) {
    return this.accompaniment.addObservation(req.user.sub, id, body);
  }

  @Post('experiments/:id/hypothesis')
  hypothesis(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { hypothesis: string; sample?: string | null; opportunity?: string | null; missing?: string | null },
  ) {
    return this.accompaniment.changeHypothesis(req.user.sub, id, body);
  }

  @Post('experiments/:id/review')
  review(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { decision: string; evidence?: string | null; meaning?: string | null; matters?: string | null; change?: string | null; link?: string | null },
  ) {
    return this.accompaniment.reviewExperiment(req.user.sub, id, body);
  }
}
