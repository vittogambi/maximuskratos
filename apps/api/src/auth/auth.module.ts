import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MemberAccessService } from './member-access';
import { RolesGuard } from './roles.guard';
import { SubscriptionGuard } from './subscription.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, SubscriptionGuard, RolesGuard, MemberAccessService],
  exports: [
    AuthService,
    JwtAuthGuard,
    SubscriptionGuard,
    RolesGuard,
    MemberAccessService,
    JwtModule,
  ],
})
export class AuthModule {}
