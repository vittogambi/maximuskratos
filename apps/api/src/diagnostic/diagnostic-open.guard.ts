import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { MemberAccessService } from '../auth/member-access';

/** Runs after JwtAuthGuard: access comes from the verified token subject, never from headers. */
@Injectable()
export class DiagnosticOpenGuard implements CanActivate {
  constructor(private readonly memberAccess: MemberAccessService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Partial<AuthenticatedRequest>>();
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing access token');
    }
    if (!this.memberAccess.forUser(userId).canUseMemberProduct) {
      throw new ForbiddenException(
        'El diagnóstico se activa cuando lancemos la plataforma.',
      );
    }
    return true;
  }
}
