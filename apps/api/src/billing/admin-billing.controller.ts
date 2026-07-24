import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { BillingService } from './billing.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateBillingSettingsDto } from './dto/update-billing-settings.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminBillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Lista todos los planes, activos e inactivos' })
  listPlans() {
    return this.billing.listAllPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Crea un plan de suscripción' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.billing.createPlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Actualiza un plan de suscripción' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.billing.updatePlan(id, dto);
  }

  @Patch('billing-settings')
  @ApiOperation({ summary: 'Actualiza la configuración global de billing (p. ej. días de prueba)' })
  updateSettings(@Body() dto: UpdateBillingSettingsDto) {
    return this.billing.updateSettings(dto);
  }
}
