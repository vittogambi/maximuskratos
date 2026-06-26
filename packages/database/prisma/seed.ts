import fs from 'fs';
import path from 'path';
import { PrismaClient, DiagnosticPhase, QuestionType, Role, SubscriptionStatus } from '@prisma/client';
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

  await seedDiagnosticV1();

  console.log(`Seeded admin: ${adminEmail}`);
  console.log(`Seeded ${DEMO_LEADS.length} demo leads (if missing)`);
  console.log(`Seeded ${DEMO_USERS.length} demo users`);
}

// ─── Types for the questionnaire JSON ─────────────────────────────────────────

type QuestionnaireOption = {
  order: number;
  textEs: string;
  value: string;
  scoreDeltas: Record<string, number>;
  flags: string[];
  tags: string[];
};

type QuestionnaireQuestion = {
  order: number;
  type: string;
  scaleType?: string;
  textEs: string;
  contextEs?: string;
  maxSelections?: number;
  reasonThreshold?: number;
  reasonPromptEs?: string;
  options: QuestionnaireOption[];
};

type QuestionnaireModule = {
  slug: string;
  phase: string;
  dimensionKey: string;
  order: number;
  titleEs: string;
  introEs: string;
  outroTemplateEs: string;
  iconKey: string;
  estimatedMinutes: number;
  isConditional: boolean;
  questions: QuestionnaireQuestion[];
};

type Questionnaire = {
  version: string;
  modules: QuestionnaireModule[];
};

// ─── Diagnostic seed ──────────────────────────────────────────────────────────

function loadQuestionnaire(): Questionnaire {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data/fase1.questionnaire.json'), 'utf-8'),
  );
}

/** Update labels/metadata from JSON without wiping user sessions. */
async function syncQuestionnaireFromJson(
  versionId: string,
  questionnaire: Questionnaire,
): Promise<{ updatedQuestions: number; updatedOptions: number }> {
  let updatedQuestions = 0;
  let updatedOptions = 0;

  for (const mod of questionnaire.modules) {
    const dbModule = await prisma.diagnosticModule.findFirst({
      where: { versionId, slug: mod.slug },
      include: { questions: { include: { options: { orderBy: { order: 'asc' } } } } },
    });
    if (!dbModule) continue;

    for (const jq of mod.questions) {
      const dbQ =
        dbModule.questions.find((q) => q.textEs === jq.textEs) ??
        dbModule.questions.find((q) => q.order === jq.order && q.type === jq.type);
      if (!dbQ) continue;

      await prisma.question.update({
        where: { id: dbQ.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          textEs: jq.textEs,
          contextEs: jq.contextEs ?? null,
          scaleType: jq.scaleType ?? null,
          reasonPromptEs: jq.reasonPromptEs ?? null,
          reasonThreshold: jq.reasonThreshold ?? null,
          maxSelections: jq.maxSelections ?? null,
        } as any,
      });
      updatedQuestions++;

      for (const jo of jq.options) {
        const dbOpt = dbQ.options.find((o) => o.order === jo.order);
        if (!dbOpt || dbOpt.textEs === jo.textEs) continue;
        await prisma.answerOption.update({
          where: { id: dbOpt.id },
          data: { textEs: jo.textEs },
        });
        updatedOptions++;
      }
    }
  }

  return { updatedQuestions, updatedOptions };
}

async function seedDiagnosticV1() {
  const questionnaire = loadQuestionnaire();

  const existing = await prisma.diagnosticVersion.findUnique({ where: { version: '1.0' } });
  if (existing) {
    const sessionCount = await prisma.diagnosticSession.count({ where: { versionId: existing.id } });
    if (sessionCount > 0) {
      const { updatedQuestions, updatedOptions } = await syncQuestionnaireFromJson(
        existing.id,
        questionnaire,
      );
      console.log(
        `Synced questionnaire content (${updatedQuestions} questions, ${updatedOptions} option labels) — sessions preserved`,
      );
      return;
    }
    // Delete in dependency order before deleting the version (no user sessions)
    await prisma.diagnosticSession.deleteMany({ where: { versionId: existing.id } });
    const modules = await prisma.diagnosticModule.findMany({ where: { versionId: existing.id }, select: { id: true } });
    const moduleIds = modules.map((m) => m.id);
    if (moduleIds.length) {
      const questions = await prisma.question.findMany({ where: { moduleId: { in: moduleIds } }, select: { id: true } });
      const questionIds = questions.map((q) => q.id);
      if (questionIds.length) {
        await prisma.answerOption.deleteMany({ where: { questionId: { in: questionIds } } });
        await prisma.question.deleteMany({ where: { id: { in: questionIds } } });
      }
      await prisma.diagnosticModule.deleteMany({ where: { id: { in: moduleIds } } });
    }
    await prisma.rule.deleteMany({ where: { versionId: existing.id } });
    await prisma.diagnosticVersion.delete({ where: { id: existing.id } });
  }

  const version = await prisma.diagnosticVersion.create({
    data: { version: '1.0', isActive: true, publishedAt: new Date() },
  });

  let totalModules = 0;
  let totalQuestions = 0;

  for (const mod of questionnaire.modules) {
    const dbModule = await prisma.diagnosticModule.create({
      data: {
        versionId: version.id,
        phase: mod.phase as DiagnosticPhase,
        dimensionKey: mod.dimensionKey,
        slug: mod.slug,
        order: mod.order,
        titleEs: mod.titleEs,
        introEs: mod.introEs,
        outroTemplateEs: mod.outroTemplateEs,
        iconKey: mod.iconKey,
        estimatedMinutes: mod.estimatedMinutes,
        isConditional: mod.isConditional,
      },
    });
    totalModules++;

    for (const q of mod.questions) {
      const dbQuestion = await prisma.question.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          moduleId: dbModule.id,
          order: q.order,
          type: q.type as QuestionType,
          textEs: q.textEs,
          contextEs: q.contextEs ?? null,
          maxSelections: q.maxSelections ?? null,
          scaleType: q.scaleType ?? null,
          reasonPromptEs: q.reasonPromptEs ?? null,
          reasonThreshold: q.reasonThreshold ?? null,
        } as any,
      });
      totalQuestions++;

      await prisma.answerOption.createMany({
        data: q.options.map((opt) => ({
          questionId: dbQuestion.id,
          order: opt.order,
          textEs: opt.textEs,
          value: opt.value,
          scoreDeltas: opt.scoreDeltas,
          flags: opt.flags,
          tags: opt.tags,
        })),
      });
    }
  }

  console.log(
    `Seeded DiagnosticVersion 1.0: ${totalModules} módulos, ${totalQuestions} preguntas`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
