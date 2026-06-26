import { PrismaClient } from '@prisma/client';

export { PrismaClient, Role } from '@prisma/client';
export { ensureDiagnosticCatalog, ensureDiagnosticV1 } from './bootstrap-diagnostic';

let prisma: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
