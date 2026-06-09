import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_DAYS,
} from './auth.constants';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Este correo electrónico ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    this.setRefreshCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async login(dto: LoginDto, res: Response) {
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
    this.setRefreshCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );
    this.setRefreshCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  async logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.clearRefreshCookie(res);
    return { success: true };
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
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
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

    const webUrl =
      this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';
    const resetUrl = `${webUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
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

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const accessToken = await this.jwt.signAsync(payload, {
      secret: accessSecret,
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
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
      maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
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
