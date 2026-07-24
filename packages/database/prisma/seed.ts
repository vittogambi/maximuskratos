import { PrismaClient, Role, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ensureDiagnosticCatalog } from '../src/bootstrap-diagnostic';

const prisma = new PrismaClient();

const DEMO_LEADS = [
  {
    email: 'carlos.mendoza@empresa.cl',
    name: 'Carlos Mendoza',
    message: 'Interesado en el diagnóstico y acceso anticipado para mi equipo directivo.',
    source: 'contact',
  },
  {
    email: 'javier.torres@gmail.com',
    name: 'Javier Torres',
    message: 'Quiero saber más sobre la app móvil y el blueprint personalizado.',
    source: 'contact',
  },
  {
    email: 'miguel.rios@outlook.com',
    name: 'Miguel Ríos',
    message: 'Solicito información para programa corporativo.',
    source: 'eventos',
  },
  {
    email: 'andres.vargas@startup.io',
    name: 'Andrés Vargas',
    message: '¿Cuándo estará disponible la versión móvil en iOS?',
    source: 'sistema',
  },
  {
    email: 'pablo.henriquez@mail.com',
    name: 'Pablo Henríquez',
    message: 'Me registré y quiero completar el diagnóstico completo.',
    source: 'contact',
  },
] as const;

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
    // Decoy: poco ahorro vs mensual para el mismo tipo de compromiso corto.
    // Hace que el salto al semestral se sienta claramente superior.
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
    // Target: sweet spot compromiso / precio. Única opción empujada.
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
    // Mejor unitario, pero sin badge que compita con el target.
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

const DEMO_USERS = [
  {
    email: 'demo.user1@maximuskratos.local',
    password: 'DemoUser123!',
    onboardingStep: 'TERMS_PENDING',
    status: SubscriptionStatus.TRIAL,
  },
  {
    email: 'demo.user2@maximuskratos.local',
    password: 'DemoUser123!',
    onboardingStep: 'PROFILE_COMPLETE',
    status: SubscriptionStatus.TRIAL,
  },
  {
    email: 'demo.user3@maximuskratos.local',
    password: 'DemoUser123!',
    onboardingStep: 'BLUEPRINT_READY',
    status: SubscriptionStatus.ACTIVE,
  },
] as const;

async function main() {
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL ?? 'admin@maximuskratos.local'
  ).toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!';

  const adminHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  for (const lead of DEMO_LEADS) {
    const existing = await prisma.lead.findFirst({
      where: { email: lead.email },
    });
    if (!existing) {
      await prisma.lead.create({ data: lead });
    }
  }

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
        benefits: PLAN_BENEFITS,
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
        benefits: PLAN_BENEFITS,
      },
    });
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + settings.trialDays);

  for (const demo of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(demo.password, 12);
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        passwordHash,
        onboardingStep: demo.onboardingStep,
      },
      create: {
        email: demo.email,
        passwordHash,
        onboardingStep: demo.onboardingStep,
      },
    });

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        status: demo.status,
        trialEnd: demo.status === SubscriptionStatus.TRIAL ? trialEnd : null,
      },
      create: {
        userId: user.id,
        status: demo.status,
        trialEnd: demo.status === SubscriptionStatus.TRIAL ? trialEnd : null,
      },
    });
  }

  await ensureDiagnosticCatalog(prisma);

  console.log(`Seeded admin: ${adminEmail}`);
  console.log(`Seeded ${DEMO_LEADS.length} demo leads (if missing)`);
  console.log(`Seeded ${DEMO_USERS.length} demo users`);
  console.log(`Seeded ${BILLING_PLANS.length} billing plans + settings (trial: ${settings.trialDays}d)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
