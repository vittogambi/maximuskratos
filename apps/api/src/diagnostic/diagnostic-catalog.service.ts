import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ensureDiagnosticCatalog } from '@mk/database';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Keeps the shared diagnostic questionnaire catalog ready.
 * Pre-warms on boot; DiagnosticService also calls ensureReady() before /start.
 */
@Injectable()
export class DiagnosticCatalogService implements OnModuleInit {
  private readonly logger = new Logger(DiagnosticCatalogService.name);
  private ready: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.ensureReady().catch((err) => {
      this.logger.error(
        'Diagnostic catalog pre-warm failed — will retry on first /diagnostic/start',
        err instanceof Error ? err.stack : err,
      );
    });
  }

  ensureReady(): Promise<void> {
    if (!this.ready) {
      this.ready = ensureDiagnosticCatalog(this.prisma).catch((err) => {
        this.ready = null;
        throw err;
      });
    }
    return this.ready;
  }
}
