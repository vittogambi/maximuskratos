import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { isEarlyAccessMode } from '../product-phase';

const TRIGGERS = ['24h', '48h', '7d'] as const;
type Trigger = (typeof TRIGGERS)[number];

const DELAY_MS: Record<Trigger, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '48h': 48 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

@Injectable()
export class ReengagementService {
  private readonly logger = new Logger(ReengagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Runs every 4 hours to check for sessions that need a nudge. */
  @Cron(CronExpression.EVERY_4_HOURS)
  async sendReengagementNudges(): Promise<void> {
    if (isEarlyAccessMode()) return;

    const appUrl = this.config.get<string>('APP_URL') ?? 'https://maximus-kratos.com';
    const resumeUrl = `${appUrl}/diagnostico`;
    const now = Date.now();

    for (const trigger of TRIGGERS) {
      const cutoff = new Date(now - DELAY_MS[trigger]);
      const eventType = `reengagement_email_${trigger}`;

      // Find incomplete sessions inactive for at least `delay` with no prior nudge of this type
      const sessions = await this.prisma.diagnosticSession.findMany({
        where: {
          completedAt: null,
          lastActivityAt: { lte: cutoff },
          // Not already sent this specific nudge
          events: { none: { type: eventType } },
        },
        include: {
          user: { select: { email: true } },
          snapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        take: 50, // process in batches
      });

      for (const session of sessions) {
        const selfKnowledgePct = Math.round(
          Math.min(1, (session.snapshots[0]?.completionPct ?? 0) / 100) * 100,
        );

        const sent = await this.mail.sendReengagementEmail(
          session.user.email,
          selfKnowledgePct,
          trigger,
          resumeUrl,
        );

        if (sent) {
          await this.prisma.diagnosticEvent.create({
            data: {
              sessionId: session.id,
              type: eventType,
              payload: { trigger, selfKnowledgePct },
            },
          });
          this.logger.log(`Sent ${trigger} reengagement to ${session.user.email}`);
        }
      }
    }
  }
}
