import { PrismaClient, Role, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

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

  console.log(`Seeded admin: ${adminEmail}`);
  console.log(`Seeded ${DEMO_LEADS.length} demo leads (if missing)`);
  console.log(`Seeded ${DEMO_USERS.length} demo users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
