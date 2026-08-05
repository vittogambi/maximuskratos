/**
 * Upsert billing settings + plans only.
 * Safe for production: does not touch users, leads, or demo accounts.
 *
 * Usage: SEED_PLANS_ONLY=1 is not required; run via `npm run db:seed:plans`.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLAN_BENEFITS = [
  'Diagnóstico completo en Espíritu, Mente y Cuerpo',
  'Perfil Maestro MK: arquetipo, sombra e índices del sistema',
  'Ruta MK y actualizaciones de la plataforma bajo la misma cuenta',
] as const;

const BILLING_PLANS = [
  {
    code: 'mensual',
    name: 'Mensual',
    periodMonths: 1,
    priceAmount: 29990,
    discountPct: null,
    sortOrder: 0,
    highlightLabel: null,
    promoText: null,
  },
  {
    code: 'trimestral',
    name: 'Trimestral',
    periodMonths: 3,
    priceAmount: 84990,
    discountPct: 5,
    sortOrder: 1,
    highlightLabel: null,
    promoText: null,
  },
  {
    code: 'semestral',
    name: 'Semestral',
    periodMonths: 6,
    priceAmount: 139990,
    discountPct: 22,
    sortOrder: 2,
    highlightLabel: 'Recomendado',
    promoText: null,
  },
  {
    code: 'anual',
    name: 'Anual',
    periodMonths: 12,
    priceAmount: 239990,
    discountPct: 33,
    sortOrder: 3,
    highlightLabel: null,
    promoText: null,
  },
] as const;

async function main() {
  const existingSettings = await prisma.billingSettings.findFirst();
  const settings =
    existingSettings ?? (await prisma.billingSettings.create({ data: { trialDays: 30 } }));

  for (const plan of BILLING_PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        periodMonths: plan.periodMonths,
        priceAmount: plan.priceAmount,
        discountPct: plan.discountPct,
        sortOrder: plan.sortOrder,
        highlightLabel: plan.highlightLabel,
        promoText: plan.promoText,
        benefits: [...PLAN_BENEFITS],
      },
      create: {
        code: plan.code,
        name: plan.name,
        periodMonths: plan.periodMonths,
        priceAmount: plan.priceAmount,
        discountPct: plan.discountPct,
        sortOrder: plan.sortOrder,
        highlightLabel: plan.highlightLabel,
        promoText: plan.promoText,
        benefits: [...PLAN_BENEFITS],
      },
    });
  }

  const count = await prisma.plan.count();
  console.log(`Plans upserted. trialDays=${settings.trialDays}. planCount=${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
