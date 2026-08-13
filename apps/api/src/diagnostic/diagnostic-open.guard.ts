import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { isEarlyAccessMode } from '../product-phase';

@Injectable()
export class DiagnosticOpenGuard implements CanActivate {
  canActivate(): boolean {
    if (isEarlyAccessMode()) {
      throw new ForbiddenException(
        'El diagnóstico se activa cuando lancemos la plataforma.',
      );
    }
    return true;
  }
}
