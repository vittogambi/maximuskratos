import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List users with subscription and onboarding state' })
  listUsers() {
    return this.admin.listUsers();
  }

  @Get('leads')
  @ApiOperation({ summary: 'List captured leads (format=csv for export)' })
  async listLeads(
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (format === 'csv') {
      const { csv } = await this.admin.exportLeadsCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="leads.csv"',
      );
      res.send(csv);
      return;
    }
    return this.admin.listLeads();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats for MVP validation' })
  stats() {
    return this.admin.stats();
  }
}
