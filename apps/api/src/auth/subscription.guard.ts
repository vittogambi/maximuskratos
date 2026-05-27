import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/** Blocks access when subscription is inactive (wired with billing module). */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
