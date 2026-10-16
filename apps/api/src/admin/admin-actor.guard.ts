import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';

/** Admin is the role stored on the account, not the role baked into an old token. */
@Injectable()
export class AdminActorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actorId = req.user?.sub;
    if (!actorId) throw new UnauthorizedException('Missing access token');
    const actor = await this.prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
    if (actor?.role !== 'ADMIN') throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
