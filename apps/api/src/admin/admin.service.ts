import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Owner accounts excluded from admin user lists and stats. */
const HIDDEN_FROM_ADMIN_UI = new Set(
  ['vittogambi14@gmail.com'].map((email) => email.toLowerCase()),
);

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private get hiddenEmailFilter() {
    return { email: { notIn: [...HIDDEN_FROM_ADMIN_UI] } };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: this.hiddenEmailFilter,
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
        let s = v ?? '';
        // CSV/formula injection: a field starting with = + - @ is executed as
        // a formula by Excel/Sheets on open. These fields come from public,
        // unauthenticated form submissions. Prefixing with a single quote is
        // the standard OWASP mitigation and is invisible once quoted in CSV.
        if (/^[=+\-@]/.test(s)) s = `'${s}`;
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
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [userCount, leadCount, usersLast7d, leadsLast7d] = await Promise.all([
      this.prisma.user.count({ where: this.hiddenEmailFilter }),
      this.prisma.lead.count(),
      this.prisma.user.count({
        where: {
          ...this.hiddenEmailFilter,
          createdAt: { gte: since7d },
        },
      }),
      this.prisma.lead.count({
        where: {
          createdAt: { gte: since7d },
        },
      }),
    ]);

    return {
      users: { total: userCount, last7Days: usersLast7d },
      leads: { total: leadCount, last7Days: leadsLast7d },
    };
  }
}
