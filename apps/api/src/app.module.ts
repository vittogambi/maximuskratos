import { existsSync } from 'fs';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

function resolveApiEnvFile(): string | undefined {
  const candidates = [
    join(__dirname, '..', '.env'),
    join(process.cwd(), 'apps/api/.env'),
    join(process.cwd(), '.env'),
  ];
  return candidates.find((p) => existsSync(p));
}
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { LeadsModule } from './leads/leads.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveApiEnvFile(),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 30,
      },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    LeadsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
