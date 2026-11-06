/**
 * Counts four pilot facts for the emails given on the command line.
 * Does not print diagnostic answers. Does not write to the database.
 *
 * Usage, from the repo root, with DATABASE_URL set:
 *   npx tsx apps/api/scripts/pilot-facts.ts ana@example.com beto@example.com
 */
import { PrismaClient } from '@prisma/client';
import { buildPilotFacts } from '../src/journey/pilot-facts';

const emails = process.argv.slice(2).map((email) => email.trim().toLowerCase()).filter(Boolean);

if (emails.length === 0) {
  console.error('Indica al menos un correo. El script no lista todas las cuentas.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const ids = accounts.map((row) => row.id);
  const [plans, actions, indicators, reviews] = await Promise.all([
    prisma.personalPlan.findMany({
      where: { userId: { in: ids } },
      select: { id: true, userId: true, createdAt: true, activatedAt: true },
    }),
    prisma.actionRecord.findMany({
      where: { action: { plan: { userId: { in: ids } } } },
      select: { status: true, updatedAt: true, action: { select: { planId: true, plan: { select: { userId: true } } } } },
    }),
    prisma.planEvidence.findMany({
      where: { userId: { in: ids }, kind: 'MEASURE', indicatorRef: { not: null } },
      select: { userId: true, planId: true, createdAt: true },
    }),
    prisma.weekReview.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, weekStart: true, closedAt: true, applied: true },
    }),
  ]);
  const report = buildPilotFacts({
    accounts,
    plans: plans.map((row) => ({
      userId: row.userId,
      planId: row.id,
      createdAt: row.createdAt,
      activatedAt: row.activatedAt,
    })),
    actions: actions.map((row) => ({
      userId: row.action.plan.userId,
      planId: row.action.planId,
      status: row.status,
      at: row.updatedAt,
    })),
    indicators: indicators.map((row) => ({
      userId: row.userId,
      planId: row.planId,
      at: row.createdAt,
    })),
    reviews: reviews.map((row) => ({
      userId: row.userId,
      weekStart: row.weekStart,
      at: row.closedAt,
      applied: row.applied,
    })),
  });
  const missing = emails.filter((email) => !accounts.some((row) => row.email.toLowerCase() === email));
  console.log(JSON.stringify({ ...report, missing }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
