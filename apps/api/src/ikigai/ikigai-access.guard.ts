import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { sha256Utf8 } from '@mk/ikigai-engine';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IkigaiAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      params: { id?: string };
      headers: Record<string, string | string[] | undefined>;
      ikigai?: unknown;
    }>();
    const id = req.params.id;
    if (!id) throw new NotFoundException({ statusCode: 404, message: 'No encontrado', reason: 'NOT_FOUND' });

    const session = await this.prisma.ikigaiSession.findUnique({
      where: { id },
      include: {
        definition: true,
        snapshots: { orderBy: { revision: 'desc' }, take: 1 },
      },
    });
    if (!session) {
      throw new NotFoundException({ statusCode: 404, message: 'No encontrado', reason: 'NOT_FOUND' });
    }

    const header = req.headers['x-ikigai-token'];
    const token = Array.isArray(header) ? header[0] : header;
    if (!token || !session.tokenHash) {
      throw new ForbiddenException({ statusCode: 403, message: 'No autorizado', reason: 'FORBIDDEN' });
    }
    const incoming = Buffer.from(sha256Utf8(token), 'utf8');
    const stored = Buffer.from(session.tokenHash, 'utf8');
    if (incoming.length !== stored.length || !timingSafeEqual(incoming, stored)) {
      throw new ForbiddenException({ statusCode: 403, message: 'No autorizado', reason: 'FORBIDDEN' });
    }
    req.ikigai = { session };
    return true;
  }
}
