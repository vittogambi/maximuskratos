import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE_NAME } from './auth.constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ auth: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register with email and password' })
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.register(dto, res);
  }

  @Post('login')
  @Throttle({ auth: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login — sets refresh cookie' })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(dto, res);
  }

  @Post('refresh')
  @SkipThrottle({ auth: true })
  @ApiCookieAuth('mk_refresh')
  @ApiOperation({ summary: 'Rotate access token (cookie or body)' })
  refresh(
    @Req() req: Request,
    @Body() body: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      body.refreshToken ?? (req.cookies?.[REFRESH_COOKIE_NAME] as string);
    return this.auth.refresh(token, res);
  }

  @Post('logout')
  @SkipThrottle({ auth: true })
  @ApiCookieAuth('mk_refresh')
  @ApiOperation({ summary: 'Invalidate refresh token' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    return this.auth.logout(token, res);
  }

  @Post('forgot-password')
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reset password with token from email' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('me')
  @SkipThrottle({ auth: true })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user profile' })
  me(@Req() req: AuthenticatedRequest) {
    return this.auth.me(req.user.sub);
  }
}
