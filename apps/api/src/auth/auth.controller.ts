import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE_NAME } from './auth.constants';
import { CLIENT_HEADER, parseClientKind, presentedRefreshToken } from './client-kind';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

const ClientContractHeader = () =>
  ApiHeader({
    name: 'X-MK-Client',
    required: false,
    enum: ['web', 'ios', 'android'],
    description:
      'Response contract. web (or absent): refresh token only in the httpOnly cookie. ios/android: refresh token in the JSON body. Not an authorization signal.',
  });

function cookieRefreshToken(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ auth: { limit: 30, ttl: 60_000 } })
  @ClientContractHeader()
  @ApiOperation({ summary: 'Register with email and password' })
  register(
    @Body() dto: RegisterDto,
    @Headers(CLIENT_HEADER) client: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.register(dto, parseClientKind(client), res);
  }

  @Post('login')
  @Throttle({ auth: { limit: 30, ttl: 60_000 } })
  @ClientContractHeader()
  @ApiOperation({ summary: 'Login. Web: refresh cookie. ios/android: refresh token in body' })
  login(
    @Body() dto: LoginDto,
    @Headers(CLIENT_HEADER) client: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.login(dto, parseClientKind(client), res);
  }

  @Post('refresh')
  @SkipThrottle({ auth: true })
  @ApiCookieAuth('mk_refresh')
  @ClientContractHeader()
  @ApiOperation({ summary: 'Rotate refresh token. Body wins over cookie; ios/android require body' })
  refresh(
    @Req() req: Request,
    @Headers(CLIENT_HEADER) clientHeader: string | undefined,
    @Body() body: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const client = parseClientKind(clientHeader);
    const token = presentedRefreshToken(client, body.refreshToken, cookieRefreshToken(req));
    return this.auth.refresh(token, client, res);
  }

  @Post('logout')
  @SkipThrottle({ auth: true })
  @ApiCookieAuth('mk_refresh')
  @ClientContractHeader()
  @ApiOperation({ summary: 'Revoke one refresh token. Body wins over cookie; ios/android require body' })
  logout(
    @Req() req: Request,
    @Headers(CLIENT_HEADER) clientHeader: string | undefined,
    @Body() body: LogoutDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const client = parseClientKind(clientHeader);
    const token = presentedRefreshToken(client, body.refreshToken, cookieRefreshToken(req));
    return this.auth.logout(token, client, res);
  }

  @Post('logout-all')
  @SkipThrottle({ auth: true })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ClientContractHeader()
  @ApiOperation({
    summary:
      'Revoke every refresh token of the account. Access tokens already issued stay valid until they expire (15 min).',
  })
  logoutAll(
    @Req() req: AuthenticatedRequest,
    @Headers(CLIENT_HEADER) clientHeader: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.logoutAll(req.user.sub, parseClientKind(clientHeader), res);
  }

  @Post('forgot-password')
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.auth.forgotPassword(dto, req.headers.origin);
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
  @ApiOperation({ summary: 'Current user profile, including member access capability' })
  me(@Req() req: AuthenticatedRequest) {
    return this.auth.me(req.user.sub);
  }
}
