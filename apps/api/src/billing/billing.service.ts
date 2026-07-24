import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateBillingSettingsDto } from './dto/update-billing-settings.dto';

function withMonthlyEquivalent<T extends { priceAmount: number; periodMonths: number }>(
  plan: T,
) {
  return {
    ...plan,
    monthlyEquivalent: Math.round(plan.priceAmount / plan.periodMonths),
  };
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Config es un singleton: se crea con el default (30 días) si aún no existe. */
  async getSettings() {
    const existing = await this.prisma.billingSettings.findFirst();
    if (existing) return existing;
    return this.prisma.billingSettings.create({ data: {} });
  }

  async getTrialDays(): Promise<number> {
    const settings = await this.getSettings();
    return settings.trialDays;
  }

  async updateSettings(dto: UpdateBillingSettingsDto) {
    const settings = await this.getSettings();
    return this.prisma.billingSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }

  /** Endpoint público: planes activos + período de prueba vigente. */
  async getPublicPlans() {
    const [settings, plans] = await Promise.all([
      this.getSettings(),
      this.prisma.plan.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    return {
      trialDays: settings.trialDays,
      plans: plans.map(withMonthlyEquivalent),
    };
  }

  async listAllPlans() {
    const plans = await this.prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
    return plans.map(withMonthlyEquivalent);
  }

  async createPlan(dto: CreatePlanDto) {
    const plan = await this.prisma.plan.create({
      data: {
        code: dto.code,
        name: dto.name,
        periodMonths: dto.periodMonths,
        priceAmount: dto.priceAmount,
        currency: dto.currency ?? 'CLP',
        discountPct: dto.discountPct,
        conditions: dto.conditions,
        benefits: dto.benefits ?? [],
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? 0,
        highlightLabel: dto.highlightLabel,
        promoText: dto.promoText,
        trialDaysOverride: dto.trialDaysOverride,
        autoRenews: dto.autoRenews ?? true,
        providerId: dto.providerId,
      },
    });
    return withMonthlyEquivalent(plan);
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Plan no encontrado');
    }
    const plan = await this.prisma.plan.update({ where: { id }, data: dto });
    return withMonthlyEquivalent(plan);
  }
}
