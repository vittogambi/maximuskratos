import type { PrismaClient } from '@prisma/client';
import { hashDefinition, loadDefinition } from '../../ikigai-engine/src/index';

export async function ensureIkigaiDefinition(prisma: PrismaClient): Promise<void> {
  const payload = loadDefinition();
  const sha256 = hashDefinition(payload);

  const existing = await prisma.ikigaiDefinition.findUnique({
    where: { ref: payload.ref },
  });

  if (!existing) {
    await prisma.ikigaiDefinition.create({
      data: {
        definitionId: payload.definitionId,
        revision: payload.revision,
        ref: payload.ref,
        status: 'DRAFT',
        sha256,
        engineMin: payload.engineMin,
        payload,
      },
    });
    return;
  }

  if (existing.status !== 'DRAFT') return;
  if (existing.sha256 === sha256) return;

  await prisma.ikigaiDefinition.update({
    where: { id: existing.id },
    data: { sha256, engineMin: payload.engineMin, payload },
  });
}
