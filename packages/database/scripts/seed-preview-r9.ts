/**
 * Preview account stopped at E-PER-000 R9 (arquetipo). Inserts responses via Prisma
 * to avoid API throttling. Player shows the real question on /diagnostico.
 *
 * Run: cd packages/database && npx tsx scripts/seed-preview-r9.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcrypt';
import { PrismaClient, type ModuleStatus } from '@prisma/client';

const STOP_SOURCE = 'formulario-v1:E-PER-000!R9';
const BIRTHDATE_SOURCE = 'formulario-v1:F-RAD-001!R6';
const DEFAULT_BIRTHDATE = '1990-06-15';
const EMAIL = (process.env.PREVIEW_EMAIL ?? 'preview.arquetipo.r9@fixtures.mk.invalid').toLowerCase();
const PASSWORD = process.env.PREVIEW_PASSWORD ?? 'PlayerR9-2026';

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
  capture?: unknown;
  module: { id: string; slug: string; order: number };
};

const scenario = JSON.parse(
  readFileSync(resolve(__dirname, '../../../apps/api/test/journey-scenario.json'), 'utf8'),
) as { answers: Record<string, Spec> };

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
    if (!option) throw new Error(`${ref} opción ${spec.value} no encontrada en catálogo`);
    return { selectedOptionIds: [option.id] };
  }
  if (ref === BIRTHDATE_SOURCE) {
    const value = spec.value.includes('-') ? spec.value : DEFAULT_BIRTHDATE;
    return { freeText: value };
  }
  return { freeText: spec.value };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (existing) await prisma.user.delete({ where: { id: existing.id } });

    const version = await prisma.diagnosticVersion.findFirst({
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
    if (!version) throw new Error('No hay versión activa del cuestionario.');

    const ordered: Q[] = version.modules.flatMap((mod) =>
      mod.questions.map((q) => ({ ...q, module: mod })),
    );
    const stopIdx = ordered.findIndex((q) => q.sourceRef === STOP_SOURCE);
    if (stopIdx < 0) throw new Error(`${STOP_SOURCE} no está en la versión activa.`);
    const toAnswer = ordered.slice(0, stopIdx);
    const stopModule = ordered[stopIdx]!.module;

    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const user = await prisma.user.create({
      data: {
        email: EMAIL,
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
        currentModuleId: stopModule.id,
      },
    });

    for (const mod of version.modules) {
      let status: ModuleStatus = 'LOCKED';
      let outroSeen = false;
      const startedAt = mod.order <= stopModule.order ? new Date() : null;
      const completedAt = mod.order < stopModule.order ? new Date() : null;
      if (mod.id === stopModule.id) status = 'IN_PROGRESS';
      else if (mod.order < stopModule.order) {
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
        payload: { versionId: version.id, seeded: 'preview-r9' },
      },
    });

    const stopQuestion = ordered[stopIdx]!;
    console.log(
      JSON.stringify(
        {
          ok: true,
          email: EMAIL,
          password: PASSWORD,
          userId: user.id,
          sessionId: session.id,
          catalogVersion: version.version,
          answeredCount: toAnswer.length,
          stopModule: stopModule.slug,
          stopSourceRef: stopQuestion.sourceRef,
          stopQuestionText: stopQuestion.textEs,
          loginUrl: 'http://localhost:3000/login',
          diagnosticoUrl: 'http://localhost:3000/diagnostico',
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
