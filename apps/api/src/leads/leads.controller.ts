import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Capture lead from public landing (rate limited)' })
  create(@Body() dto: CreateLeadDto) {
    return this.leads.create(dto);
  }
}
