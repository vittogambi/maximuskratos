/**
 * Demo accounts for Rafa player QA (intros, back, finanzas, cierre auditoría, cintura).
 *
 * Run: cd packages/database && npx tsx scripts/seed-demo-rafa-player.ts
 * Requires: active catalog in DB (npm run db:seed from repo root).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcrypt';
import { PrismaClient, type ModuleStatus } from '@prisma/client';

const PASSWORD = process.env.DEMO_RAFA_PASSWORD ?? 'DemoRafa2026';
const BIRTHDATE_SOURCE = 'formulario-v1:F-RAD-001!R6';
const DEFAULT_BIRTHDATE = '1990-06-15';

type Spec =
  | { kind: 'activity'; field: string; ambit: string; option: string; answer: string }
  | { kind: 'choice'; value: string }
  | { kind: 'text'; value: string };

type Q = {
  id: string;
  moduleId: string;
  sourceRef: string | null;
  type: string;
  textEs: string;
  contextEs: string | null;
  options: { id: string; value: string; textEs: string }[];
  module: { id: string; slug: string; order: number };
};

const scenario = JSON.parse(
  readFileSync(resolve(__dirname, '../../../apps/api/test/journey-scenario.json'), 'utf8'),
) as { answers: Record<string, Spec> };

type DemoAccount = {
  email: string;
  label: string;
  /** Primera pregunta sin responder (la verá al entrar al player). */
  stopSourceRef: string;
  note: string;
};

const ACCOUNTS: DemoAccount[] = [
  {
    email: 'demo.rafa.intro@fixtures.mk.invalid',
    label: 'intro',
    stopSourceRef: 'formulario-v1:E-AUD-001!R16',
    note: 'Intro e-aud-s2 y barra de secciones (Hábitos).',
  },
  {
    email: 'demo.rafa.back@fixtures.mk.invalid',
    label: 'back',
    stopSourceRef: 'formulario-v1:E-AUD-001!R26',
    note: 'Decisiones (s3): Anterior a última de Hábitos con respuesta guardada.',
  },
  {
    email: 'demo.rafa.finanzas@fixtures.mk.invalid',
    label: 'finanzas',
    stopSourceRef: 'formulario-v1:E-AUD-001!R37',
    note: 'Soberanía financiera: cinco niveles cortos sin párrafo.',
  },
  {
    email: 'demo.rafa.audit-close@fixtures.mk.invalid',
    label: 'audit-close',
    stopSourceRef: 'formulario-v1:F-RAD-001!R6',
    note: 'Tras terminar e-aud-s6: pantalla de cierre 115 en /diagnostico/outro/e-aud-s6.',
  },
  {
    email: 'demo.rafa.cintura@fixtures.mk.invalid',
    label: 'cintura',
    stopSourceRef: 'formulario-v1:F-RAD-001!R11',
    note: 'Radiografía, selector de cintura desde 35 cm (prueba 35 y 56).',
  },
];

function payloadFor(question: Q): {
  freeText?: string;
  selectedOptionIds?: string[];
  exceptionKind?: string;
} {
  const ref = question.sourceRef ?? '';
  const spec = scenario.answers[ref];
  if (!spec) {
    if (question.type === 'SCALE_1_5' && question.options.length) {
      const mid = question.options[Math.floor(question.options.length / 2)]!;
      return { selectedOptionIds: [mid.id] };
    }
    if (question.type === 'SINGLE_CHOICE' && question.options.length) {
      return { selectedOptionIds: [question.options[0]!.id] };
    }
    if (question.type === 'MULTI_CHOICE' && question.options.length) {
      return { selectedOptionIds: [question.options[0]!.id] };
    }
    if (question.type === 'FREE_TEXT') {
      if (ref === 'formulario-v1:F-RAD-001!R11') return { freeText: '56' };
      return { freeText: 'Respuesta de recorrido de prueba.' };
    }
    throw new Error(`Sin escenario ni fallback para ${ref} (${question.type})`);
  }
  if (spec.kind === 'activity') {
    return {
      freeText: JSON.stringify({ ambit: spec.ambit, option: spec.option, answer: spec.answer }),
    };
  }
  if (spec.kind === 'choice') {
    const option = question.options.find((item) => item.value === spec.value);
    if (!option) throw new Error(`${ref} opción ${spec.value} no encontrada`);
    return { selectedOptionIds: [option.id] };
  }
  if (ref === BIRTHDATE_SOURCE) {
    const value = spec.value.includes('-') ? spec.value : DEFAULT_BIRTHDATE;
    return { freeText: value };
  }
  return { freeText: spec.value };
}

async function seedOne(
  prisma: PrismaClient,
  version: NonNullable<Awaited<ReturnType<typeof loadVersion>>>,
  ordered: Q[],
  account: DemoAccount,
) {
  const existing = await prisma.user.findUnique({ where: { email: account.email.toLowerCase() } });
  if (existing) await prisma.user.delete({ where: { id: existing.id } });

  const stopIdx = ordered.findIndex((q) => q.sourceRef === account.stopSourceRef);
  if (stopIdx < 0) throw new Error(`${account.stopSourceRef} no está en la versión activa.`);

  const toAnswer = ordered.slice(0, stopIdx);
  const nextModule = ordered[stopIdx]!.module;
  const lastAnswered = toAnswer[toAnswer.length - 1];
  let displayModule = nextModule;
  if (
    lastAnswered?.module.slug === 'e-aud-s6' &&
    nextModule.slug.startsWith('f-rad-001') &&
    !toAnswer.some((a) => a.module.id === nextModule.id)
  ) {
    displayModule = lastAnswered.module;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      email: account.email.toLowerCase(),
      passwordHash,
      onboardingStep: 'FASE1_EN_CURSO',
      subscription: { create: { status: 'TRIAL' } },
    },
  });

  const session = await prisma.diagnosticSession.create({
    data: {
      userId: user.id,
      versionId: version.id,
      status: 'ACTIVE',
      currentModuleId: displayModule.id,
    },
  });

  const moduleQuestions = ordered.filter((q) => q.module.id === displayModule.id);
  const displayModuleFullyAnswered =
    moduleQuestions.length > 0 && moduleQuestions.every((q) => toAnswer.some((a) => a.id === q.id));

  for (const mod of version.modules) {
    let status: ModuleStatus = 'LOCKED';
    let outroSeen = false;
    const startedAt = mod.order <= displayModule.order ? new Date() : null;
    let completedAt: Date | null = mod.order < displayModule.order ? new Date() : null;

    if (mod.id === displayModule.id) {
      if (displayModuleFullyAnswered) {
        status = 'COMPLETE';
        completedAt = new Date();
        outroSeen = mod.slug !== 'e-aud-s6';
      } else {
        status = 'IN_PROGRESS';
      }
    } else if (mod.order < displayModule.order) {
      status = 'COMPLETE';
      outroSeen = true;
    }

    await prisma.userModuleProgress.create({
      data: {
        sessionId: session.id,
        moduleId: mod.id,
        status,
        outroSeen,
        startedAt,
        completedAt,
      },
    });
  }

  for (const q of toAnswer) {
    const payload = payloadFor(q);
    await prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: q.id,
        freeText: payload.freeText ?? null,
        exceptionKind: payload.exceptionKind ?? null,
        selectedOptionIds: payload.selectedOptionIds ?? [],
        selectedOptions: payload.selectedOptionIds?.length
          ? { connect: payload.selectedOptionIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  await prisma.diagnosticEvent.create({
    data: {
      sessionId: session.id,
      type: 'session_started',
      payload: { versionId: version.id, seeded: `demo-rafa-${account.label}` },
    },
  });

  const nextQ = ordered[stopIdx];
  const outroModule =
    displayModuleFullyAnswered && displayModule.slug === 'e-aud-s6' ? displayModule.slug : null;
  return {
    email: account.email,
    password: PASSWORD,
    label: account.label,
    note: account.note,
    moduleSlug: displayModule.slug,
    nextSourceRef: nextQ?.sourceRef ?? null,
    answeredCount: toAnswer.length,
    auditCloseUrl: outroModule ? `http://localhost:3000/diagnostico/outro/${outroModule}` : null,
    loginUrl: 'http://localhost:3000/login',
    diagnosticoUrl: 'http://localhost:3000/diagnostico',
  };
}

async function loadVersion(prisma: PrismaClient) {
  return prisma.diagnosticVersion.findFirst({
    where: { isActive: true },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        where: { isConditional: false },
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { options: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
  });
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const version = await loadVersion(prisma);
    if (!version) throw new Error('No hay versión activa. Ejecuta npm run db:seed en la raíz.');

    const ordered: Q[] = version.modules.flatMap((mod) =>
      mod.questions.map((q) => ({ ...q, module: mod })),
    );

    const results = [];
    for (const account of ACCOUNTS) {
      results.push(await seedOne(prisma, version, ordered, account));
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          password: PASSWORD,
          catalogVersion: version.version,
          accounts: results,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
