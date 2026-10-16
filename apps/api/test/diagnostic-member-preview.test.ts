import { ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { SubscriptionStatus } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withoutInternalAlerts } from '../src/admin/public-reading';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { MemberAccessService } from '../src/auth/member-access';
import { DiagnosticCatalogService } from '../src/diagnostic/diagnostic-catalog.service';
import { DiagnosticOpenGuard } from '../src/diagnostic/diagnostic-open.guard';
import { DiagnosticController } from '../src/diagnostic/diagnostic.controller';
import { DiagnosticService } from '../src/diagnostic/diagnostic.service';
import { ResponseWriteHook } from '../src/diagnostic/response-write-hook';
import type { QuestionDto } from '../src/diagnostic/types/diagnostic.types';
import { ambitsOf } from '../src/instrumentos/ikigai-lists';
import { PrismaService } from '../src/prisma/prisma.service';

const hasDb = Boolean(process.env.DATABASE_URL);
const RUN = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

function config(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function guardContext(userId: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { sub: userId, role: 'USER' } }) }),
  } as never;
}

function answerFor(q: QuestionDto) {
  const options = [...q.options].sort((a, b) => a.order - b.order);
  const cap = q.capture;
  if (cap?.kind === 'birthdate') return { freeText: '1990-05-15' };
  if (cap?.kind === 'number' || cap?.kind === 'hours') {
    const mid = Math.floor((cap.min + cap.max) / 2);
    return { freeText: String(mid) };
  }
  if (cap?.kind === 'activity') {
    const ambits = cap.ambits ?? ambitsOf(cap.field);
    const ambit = ambits[0];
    return {
      freeText: JSON.stringify({
        ambit: ambit.label,
        option: ambit.options[0],
        answer: 'Actividad de prueba',
      }),
    };
  }
  if (cap?.kind === 'ikigai') {
    return {
      freeText: JSON.stringify({ activity: 'Actividad de prueba', also: cap.others.slice(0, 1) }),
    };
  }
  if (q.type === 'FREE_TEXT') return { freeText: 'Respuesta de prueba' };
  if (q.type === 'MULTI_CHOICE') {
    const need =
      q.sourceRef === 'formulario-v1:E-PER-000!R40'
        ? Math.min(4, options.length)
        : q.sourceRef === 'formulario-v1:E-PER-000!R51'
          ? Math.min(3, options.length)
          : 1;
    return { selectedOptionIds: options.slice(0, need).map((item) => item.id) };
  }
  return { selectedOptionIds: [options[Math.floor(options.length / 2)].id] };
}

describe('diagnostic routes keep the member access guard', () => {
  it('skips the 30/min credential throttler (the global default limit still applies)', () => {
    expect(Reflect.getMetadata('THROTTLER:SKIPauth', DiagnosticController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPdefault', DiagnosticController)).toBeUndefined();
  });

  it.each(['start', 'state', 'submitResponse', 'welcomeSeen', 'outroSeen'] as const)(
    '%s runs DiagnosticOpenGuard after JwtAuthGuard',
    (handler) => {
      const classGuards = Reflect.getMetadata(GUARDS_METADATA, DiagnosticController) as unknown[];
      const routeGuards = Reflect.getMetadata(
        GUARDS_METADATA,
        DiagnosticController.prototype[handler],
      ) as unknown[];
      expect(classGuards).toContain(JwtAuthGuard);
      expect(routeGuards).toContain(DiagnosticOpenGuard);
    },
  );
});

describe.skipIf(!hasDb)('diagnostic in the private review build', () => {
  let prisma: PrismaService;
  let service: DiagnosticService;
  let guard: DiagnosticOpenGuard;
  let previewId: string;
  let normalId: string;

  async function createMember(label: string) {
    const user = await prisma.user.create({
      data: {
        email: `diag-${RUN}-${label}@test.local`,
        passwordHash: 'not-used',
        subscription: { create: { status: SubscriptionStatus.TRIAL, trialEnd: null } },
      },
    });
    return user.id;
  }

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    previewId = await createMember('preview');
    normalId = await createMember('normal');
    guard = new DiagnosticOpenGuard(
      new MemberAccessService(config({ MEMBER_PREVIEW_USER_IDS: previewId })),
    );
    service = new DiagnosticService(prisma, new DiagnosticCatalogService(prisma), new ResponseWriteHook());
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { contains: `diag-${RUN}-` } } });
    await prisma?.$disconnect();
  });

  it('the guard lets the designated account in and every other authenticated account too', () => {
    expect(guard.canActivate(guardContext(previewId))).toBe(true);
    expect(guard.canActivate(guardContext(normalId))).toBe(true);
  });

  it('answers persist on the server: another device resumes at the next question', async () => {
    const started = await service.startOrResume(previewId);
    expect(started.nextStep.type).toBe('question');
    if (started.nextStep.type !== 'question') return;
    const first = started.nextStep.data;

    await service.submitResponse(previewId, { questionId: first.id, ...answerFor(first) });

    const elsewhere = await service.getState(previewId);
    expect(elsewhere.nextStep.type).toBe('question');
    if (elsewhere.nextStep.type !== 'question') return;
    expect(elsewhere.nextStep.data.id).not.toBe(first.id);
    expect(elsewhere.sessionState.currentQuestionIndex).toBe(2);

    const second = elsewhere.nextStep.data;
    await service.submitResponse(previewId, { questionId: second.id, ...answerFor(second) });
    await service.submitResponse(previewId, { questionId: second.id, ...answerFor(second) });
    const session = await prisma.diagnosticSession.findFirstOrThrow({
      where: { userId: previewId, status: 'ACTIVE' },
    });
    expect(await prisma.response.count({ where: { sessionId: session.id } })).toBe(2);
  });

  it('completing the diagnostic creates the profile the client reads, even with concurrent reads', async () => {
    let state = await service.getState(previewId);
    for (let step = 0; step < 400 && state.nextStep.type !== 'diagnostic_complete'; step++) {
      if (state.nextStep.type === 'question') {
        const q = state.nextStep.data;
        state = await service.submitResponse(previewId, { questionId: q.id, ...answerFor(q) });
      } else if (state.nextStep.type === 'module_outro') {
        // The outro screen reads /state while the person presses Continuar.
        await Promise.all([
          service.markOutroSeen(previewId, state.nextStep.data.moduleSlug),
          service.getState(previewId),
          service.getState(previewId),
          service.getState(previewId),
        ]);
        state = await service.getState(previewId);
        if (state.nextStep.type !== 'diagnostic_complete') {
          const session = await prisma.diagnosticSession.findFirstOrThrow({
            where: { userId: previewId, status: 'ACTIVE' },
            include: { profile: true },
          });
          expect(session.completedAt).toBeNull();
          expect(session.profile).toBeNull();
        }
      } else {
        throw new Error(`unexpected step ${state.nextStep.type}`);
      }
    }
    expect(state.nextStep.type).toBe('diagnostic_complete');
    expect(await prisma.masterProfile.count({ where: { userId: previewId } })).toBe(1);

    const stored = await prisma.masterProfile.findFirstOrThrow({
      where: { userId: previewId, isCurrent: true },
    });
    const served = await service.getProfile(previewId);
    expect(served).not.toBeNull();
    expect(served?.archetypePrimary).toBe(stored.archetypePrimary);
    expect(served?.indices).toEqual(withoutInternalAlerts(stored.indices));
    expect(served?.scores).toEqual(stored.scores);

    const progress = await service.getProgress(previewId);
    expect(progress?.modules.every((m) => m.status === 'COMPLETE')).toBe(true);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: previewId } });
    expect(user.onboardingStep).toBe('PROFILE_COMPLETE');
    expect(user.role).toBe('USER');
  }, 120_000);

  it('the normal account never got a session', async () => {
    expect(await prisma.diagnosticSession.findFirst({ where: { userId: normalId } })).toBeNull();
  });

  it('never finalises while a later module is still locked', async () => {
    const userId = await createMember('locked');
    let state = await service.startOrResume(userId);
    while (state.nextStep.type === 'question') {
      const q = state.nextStep.data;
      state = await service.submitResponse(userId, { questionId: q.id, ...answerFor(q) });
    }
    expect(state.nextStep.type).toBe('module_outro');

    // The half-written state that a non-atomic outro write used to expose.
    const session = await prisma.diagnosticSession.findFirstOrThrow({
      where: { userId, status: 'ACTIVE' },
    });
    const first = await prisma.userModuleProgress.findFirstOrThrow({
      where: { sessionId: session.id, status: 'COMPLETE' },
    });
    await prisma.userModuleProgress.update({ where: { id: first.id }, data: { outroSeen: true } });

    await expect(service.getState(userId)).rejects.toBeInstanceOf(ConflictException);
    const after = await prisma.diagnosticSession.findFirstOrThrow({
      where: { userId, status: 'ACTIVE' },
      include: { profile: true },
    });
    expect(after.completedAt).toBeNull();
    expect(after.profile).toBeNull();
  });
});
