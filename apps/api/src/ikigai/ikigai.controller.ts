import { Body, Controller, Get, HttpCode, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IkigaiAccessGuard } from './ikigai-access.guard';
import { CreateIkigaiSessionDto, NextExperimentDto, PatchIkigaiDraftDto, SessionWriteDto } from './ikigai.dto';
import { IkigaiService } from './ikigai.service';

type AuthedIkigaiRequest = {
  ikigai: { session: Parameters<IkigaiService['getSession']>[0] };
};

@ApiTags('ikigai')
@Controller('ikigai')
export class IkigaiController {
  constructor(private readonly ikigai: IkigaiService) {}

  @Get('definition')
  getDefinition() {
    return this.ikigai.getPublicDefinition();
  }

  @Post('sessions')
  @Throttle({ auth: { limit: 30, ttl: 60_000 } })
  create(@Body() dto: CreateIkigaiSessionDto) {
    return this.ikigai.createSession(dto);
  }

  @Get('sessions/:id')
  @UseGuards(IkigaiAccessGuard)
  get(@Req() req: AuthedIkigaiRequest) {
    return this.ikigai.getSession(req.ikigai.session);
  }

  @Patch('sessions/:id/draft')
  @UseGuards(IkigaiAccessGuard)
  patch(@Req() req: AuthedIkigaiRequest, @Body() dto: PatchIkigaiDraftDto) {
    return this.ikigai.patchDraft(req.ikigai.session, dto);
  }

  @Post('sessions/:id/complete')
  @HttpCode(200)
  @UseGuards(IkigaiAccessGuard)
  complete(@Req() req: AuthedIkigaiRequest, @Body() dto: SessionWriteDto) {
    return this.ikigai.complete(req.ikigai.session, dto);
  }

  @Get('sessions/:id/result')
  @UseGuards(IkigaiAccessGuard)
  result(@Req() req: AuthedIkigaiRequest) {
    return this.ikigai.getResult(req.ikigai.session);
  }

  @Post('sessions/:id/reopen')
  @HttpCode(200)
  @UseGuards(IkigaiAccessGuard)
  reopen(@Req() req: AuthedIkigaiRequest, @Body() dto: SessionWriteDto) {
    return this.ikigai.reopen(req.ikigai.session, dto);
  }

  @Put('sessions/:id/next-experiment')
  @UseGuards(IkigaiAccessGuard)
  nextExperiment(@Req() req: AuthedIkigaiRequest, @Body() dto: NextExperimentDto) {
    return this.ikigai.saveNextExperiment(req.ikigai.session, dto);
  }

  @Patch('sessions/:id/next-experiment')
  @UseGuards(IkigaiAccessGuard)
  nextExperimentPatch(@Req() req: AuthedIkigaiRequest, @Body() dto: NextExperimentDto) {
    return this.ikigai.saveNextExperiment(req.ikigai.session, dto);
  }
}
