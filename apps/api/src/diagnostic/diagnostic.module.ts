import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { DiagnosticCatalogService } from './diagnostic-catalog.service';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { ReengagementService } from './reengagement.service';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, ReengagementService, DiagnosticCatalogService],
  exports: [DiagnosticService],
})
export class DiagnosticModule {}
