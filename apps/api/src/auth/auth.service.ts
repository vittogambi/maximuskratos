import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import { MailService } from '../mail/mail.service';
import { publicWebUrl } from '../mail/public-web-url';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_UNTIL,
} from './auth.constants';
import type { ClientKind } from './client-kind';
import { MemberAccessService } from './member-access';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

type SessionUser = { id: string; email: string; role: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly memberAccess: MemberAccessService,
  ) {}

  async register(dto: RegisterDto, client: ClientKind, res: Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Este correo electrónico ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Early access: reserve founder access without starting the trial clock.
    // trialEnd is set when the platform launches (then + billing trialDays).
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        subscription: {
          create: {
            status: SubscriptionStatus.TRIAL,
            trialEnd: null,
          },
        },
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    void this.mail.sendWelcomeEmail(user.email).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Welcome email failed for ${user.email}: ${message}`);
    });

    void this.mail
      .sendNewRegistrationNotify(user.email, user.createdAt)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Registration notify failed for ${user.email}: ${message}`,
        );
      });

    return this.deliverSession(client, res, tokens, user);
  }

  async login(dto: LoginDto, client: ClientKind, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Email o contraseña inválidas.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email o contraseña inválidas.');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return this.deliverSession(client, res, tokens, user);
  }

  async refresh(refreshToken: string | undefined, client: ClientKind, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const tokens = await this.rotateRefreshToken(refreshToken);
    if (client === 'native') {
      return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  async logout(refreshToken: string | undefined, client: ClientKind, res: Response) {
    if (client === 'native' && !refreshToken) {
      throw new BadRequestException('Refresh token required');
    }
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    if (client === 'web') {
      this.clearRefreshCookie(res);
    }
    return { success: true };
  }

  /** Revokes every refresh token of the account. Access JWTs already issued stay valid. */
  async logoutAll(userId: string, client: ClientKind, res: Response) {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (client === 'web') {
      this.clearRefreshCookie(res);
    }
    return { success: true, revokedSessions: count };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingStep: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            trialEnd: true,
            currentPeriodEnd: true,
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { subscription, ...rest } = user;
    return {
      ...rest,
      subscription: subscription ?? null,
      access: this.memberAccess.forUser(user.id),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, requestOrigin?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      return { success: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const webUrl = publicWebUrl(requestOrigin);
    const resetUrl = `${webUrl}/reset-password?token=${rawToken}`;
    await this.mail.sendPasswordResetEmail(user.email, resetUrl);

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  private deliverSession(client: ClientKind, res: Response, tokens: AuthTokens, user: SessionUser) {
    const sessionUser = { id: user.id, email: user.email, role: user.role };
    if (client === 'native') {
      return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: sessionUser };
    }
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user: sessionUser };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.signAccessToken({ id: userId, email, role });
    const refreshToken = this.newRefreshSecret();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: REFRESH_TOKEN_UNTIL,
      },
    });
    return { accessToken, refreshToken };
  }

  private async rotateRefreshToken(presented: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(presented) },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    const now = new Date();
    if (!stored || stored.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Signed before the write so nothing can fail between committing the rotation and replying.
    const accessToken = await this.signAccessToken(stored.user);
    const refreshToken = this.newRefreshSecret();

    const rotated = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: now },
      });
      // Zero rows: a concurrent rotation consumed this token first.
      if (consumed.count !== 1) return false;
      await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: REFRESH_TOKEN_UNTIL,
        },
      });
      return true;
    });

    if (!rotated) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { accessToken, refreshToken };
  }

  private signAccessToken(user: SessionUser): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  private newRefreshSecret(): string {
    return randomBytes(48).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  setRefreshCookie(res: Response, refreshToken: string) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  clearRefreshCookie(res: Response) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
  }
}
