import { PrismaClient } from '@prisma/client';

export { PrismaClient, Role } from '@prisma/client';
export { ensureDiagnosticCatalog, ensureDiagnosticV1 } from './bootstrap-diagnostic';
export { ensureFormulariosXPaso, FORMULARIOS_X_PASO_REF } from './formularios-previos';
export { ensureFormularioCompleto, FORMULARIO_COMPLETO_REF, FORMULARIO_COMPLETO_VERSION } from './formulario-completo';

let prisma: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
