import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { DiagnosticOpenGuard } from './diagnostic-open.guard';
import { DiagnosticService } from './diagnostic.service';
import { SubmitResponseDto } from './dto/submit-response.dto';

@ApiTags('diagnostic')
@Controller('diagnostic')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiagnosticController {
  constructor(private readonly diagnostic: DiagnosticService) {}

  @Post('start')
  @UseGuards(DiagnosticOpenGuard)
  @ApiOperation({ summary: 'Start or resume the diagnostic session' })
  start(@Request() req: AuthenticatedRequest) {
    return this.diagnostic.startOrResume(req.user.sub);
  }

  @Get('state')
  @UseGuards(DiagnosticOpenGuard)
  @ApiOperation({ summary: 'Get current diagnostic state and next question' })
  state(@Request() req: AuthenticatedRequest) {
    return this.diagnostic.getState(req.user.sub);
  }

  @Post('response')
  @UseGuards(DiagnosticOpenGuard)
  @ApiOperation({ summary: 'Submit an answer, receive next step' })
  submitResponse(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.diagnostic.submitResponse(req.user.sub, dto);
  }

  @Post('welcome-seen')
  @UseGuards(DiagnosticOpenGuard)
  @ApiOperation({ summary: 'Mark global diagnostic welcome as seen' })
  welcomeSeen(@Request() req: AuthenticatedRequest) {
    return this.diagnostic.markWelcomeSeen(req.user.sub);
  }

  @Post('outro-seen/:moduleSlug')
  @UseGuards(DiagnosticOpenGuard)
  @ApiOperation({ summary: 'Mark module outro as seen, unlock next module' })
  outroSeen(
    @Request() req: AuthenticatedRequest,
    @Param('moduleSlug') moduleSlug: string,
  ) {
    return this.diagnostic.markOutroSeen(req.user.sub, moduleSlug);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get lightweight module-level progress for the panel (null if no session)' })
  progress(@Request() req: AuthenticatedRequest) {
    return this.diagnostic.getProgress(req.user.sub);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get the completed MasterProfile (null if diagnostic not yet complete)' })
  profile(@Request() req: AuthenticatedRequest) {
    return this.diagnostic.getProfile(req.user.sub);
  }
}
