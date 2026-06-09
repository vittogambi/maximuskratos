import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingStep: true,
        createdAt: true,
        subscription: {
          select: { status: true, trialEnd: true, currentPeriodEnd: true },
        },
      },
    });
    return users.map(({ subscription, ...u }) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      onboardingStep: u.onboardingStep,
      createdAt: u.createdAt,
      subscriptionStatus: subscription?.status ?? null,
      trialEnd: subscription?.trialEnd ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    }));
  }

  async listLeads() {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async exportLeadsCsv() {
    const leads = await this.listLeads();
    const header = 'id,email,name,message,source,created_at';
    const rows = leads.map((l) => {
      const esc = (v: string | null | undefined) => {
        const s = v ?? '';
        return `"${s.replace(/"/g, '""')}"`;
      };
      return [
        l.id,
        esc(l.email),
        esc(l.name),
        esc(l.message),
        esc(l.source),
        l.createdAt.toISOString(),
      ].join(',');
    });
    return { csv: [header, ...rows].join('\n') };
  }

  async stats() {
    const [userCount, leadCount, usersLast7d, leadsLast7d] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.lead.count(),
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.lead.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      users: { total: userCount, last7Days: usersLast7d },
      leads: { total: leadCount, last7Days: leadsLast7d },
    };
  }
}
