import { PrismaClient } from '@mk/database';
import { sha256Utf8 } from '@mk/ikigai-engine';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IkigaiService } from '../src/ikigai/ikigai.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ensureIkigaiDefinition } from '../../packages/database/prisma/seed-ikigai';
import { ConflictException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { IkigaiAccessGuard } from '../src/ikigai/ikigai-access.guard';

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)('ikigai API', () => {
  let prisma: PrismaService;
  let service: IkigaiService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    await ensureIkigaiDefinition(prisma as unknown as PrismaClient);
    service = new IkigaiService(prisma);
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('creates a session with hashed token, never stores raw token', async () => {
    const created = await service.createSession({});
    expect(created.token).toBeTruthy();
    const row = await prisma.ikigaiSession.findUnique({ where: { id: created.session.id } });
    expect(row?.tokenHash).toBe(sha256Utf8(created.token));
    expect(JSON.stringify(row)).not.toContain(created.token);
  });

  it('rejects missing and wrong tokens', async () => {
    const created = await service.createSession({});
    const guard = new IkigaiAccessGuard(prisma);
    const makeCtx = (id: string, token?: string) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id },
            headers: token ? { 'x-ikigai-token': token } : {},
          }),
        }),
      }) as never;

    await expect(guard.canActivate(makeCtx(created.session.id))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(makeCtx(created.session.id, 'nope'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(guard.canActivate(makeCtx(created.session.id, created.token))).resolves.toBe(true);
  });

  it('patches, 409s on stale draftVersion, completes, reopens, revision 2 immutable', async () => {
    const created = await service.createSession({});
    const id = created.session.id;
    const loaded = async () => {
      const row = await prisma.ikigaiSession.findUniqueOrThrow({
        where: { id },
        include: {
          definition: true,
          snapshots: { orderBy: { revision: 'desc' as const }, take: 1 },
        },
      });
      return row;
    };

    const item = (fid: string, text: string, evidence: string, order = 0) => ({
      id: fid,
      text,
      evidence,
      order,
    });
    const items = {
      PASION: [item('p1', 'enseñar personas', 'SOSTENIDO'), item('p2', 'escribir ensayos', 'ATRACCION', 1)],
      CAPACIDAD: [item('c1', 'explicar sistemas', 'RESULTADOS'), item('c2', 'organizar equipos', 'EXPERIENCIA', 1)],
      NECESIDAD: [item('n1', 'aprendizaje frustrado', 'VIVIDA'), item('n2', 'soledad urbana', 'OBSERVADA', 1)],
      VALOR: [item('v1', 'consultoría de procesos', 'SOSTUVO_A_MI'), item('v2', 'formación in company', 'NO_PROBADO', 1)],
    };

    await service.patchDraft(await loaded(), { draftVersion: 0, step: 'VALOR', patch: { items } });
    await expect(
      service.patchDraft(await loaded(), { draftVersion: 0, patch: { patternNote: 'viejo' } }),
    ).rejects.toBeInstanceOf(ConflictException);

    const current = await loaded();
    await expect(service.complete(current)).rejects.toBeInstanceOf(UnprocessableEntityException);

    const hyp = {
      id: 'h1',
      text: 'Una dirección que quiero explorar es enseñar con sistemas para equipos.',
      itemIds: ['p1', 'c1', 'n1', 'v1'],
      criteria: {
        DISFRUTE_SOSTENIBLE: 4,
        CAPACIDAD_DEMOSTRABLE: 5,
        UTILIDAD_REAL: 4,
        VALOR_ECONOMICO: 3,
        COHERENCIA_MORAL: 5,
        FACTIBILIDAD: 4,
      },
      order: 0,
    };
    await service.patchDraft(await loaded(), {
      draftVersion: current.draftVersion,
      step: 'CONTRASTE',
      patch: { hypotheses: [hyp], noHypothesisYet: false },
    });

    const done = await service.complete(await loaded());
    expect(done.revision).toBe(1);
    expect(done.result).not.toHaveProperty('purpose_score');
    const snap1 = await prisma.ikigaiResultSnapshot.findFirst({ where: { sessionId: id, revision: 1 } });
    const frozen = snap1?.payload;

    await service.reopen(await loaded());
    const after = await loaded();
    expect(after.currentStep).toBe('REVISION');

    await service.patchDraft(after, {
      draftVersion: after.draftVersion,
      patch: { patternNote: 'explicar aparece en todos lados' },
    });
    const done2 = await service.complete(await loaded());
    expect(done2.revision).toBe(2);
    const snap1b = await prisma.ikigaiResultSnapshot.findFirst({ where: { sessionId: id, revision: 1 } });
    expect(snap1b?.payload).toEqual(frozen);
  });

  it('pins the session to its definition', async () => {
    const created = await service.createSession({});
    expect(created.session.definitionRef).toBe('ikigai-v0.1@1');
    const row = await prisma.ikigaiSession.findUniqueOrThrow({ where: { id: created.session.id } });
    const def = await prisma.ikigaiDefinition.findUniqueOrThrow({ where: { id: row.definitionId } });
    expect(def.ref).toBe('ikigai-v0.1@1');
    const payload = created.definition as { fields: Array<{ title: string }> };
    expect(payload.fields.map((f) => f.title)).toEqual([
      'Lo que te mueve',
      'Lo que puedes aportar',
      'Lo que vale la pena atender',
      'Lo que puede sostenerte',
    ]);
  });

  it('persists fieldClarity and selectedHypothesisId and completes with one contrasted hypothesis', async () => {
    const created = await service.createSession({});
    const loaded = async () =>
      prisma.ikigaiSession.findUniqueOrThrow({
        where: { id: created.session.id },
        include: { definition: true, snapshots: { orderBy: { revision: 'desc' as const }, take: 1 } },
      });
    const item = (fid: string, text: string, order = 0) => ({
      id: fid,
      text,
      evidence: null,
      order,
    });
    await service.patchDraft(await loaded(), {
      draftVersion: 0,
      patch: {
        items: {
          PASION: [item('p1', 'enseñar cosas que ya aprendí')],
          CAPACIDAD: [item('c1', 'explicar temas difíciles')],
          NECESIDAD: [item('n1', 'personas que están empezando')],
          VALOR: [],
        },
        fieldClarity: {
          PASION: 'ANSWERED',
          CAPACIDAD: 'ANSWERED',
          NECESIDAD: 'ANSWERED',
          VALOR: 'UNCLEAR',
        },
        hypotheses: [
          {
            id: 'h1',
            text: 'Ayudar a personas que están empezando a dominar herramientas complejas.',
            itemIds: ['p1', 'c1', 'n1'],
            criteria: {
              DISFRUTE_SOSTENIBLE: 4,
              CAPACIDAD_DEMOSTRABLE: 5,
              UTILIDAD_REAL: 4,
              VALOR_ECONOMICO: null,
              COHERENCIA_MORAL: 5,
              FACTIBILIDAD: 4,
            },
            order: 0,
          },
          {
            id: 'h2',
            text: 'Construir un producto para equipos que dependen de una sola persona.',
            itemIds: ['c1', 'n1'],
            criteria: {},
            order: 1,
          },
        ],
        selectedHypothesisId: 'h1',
        noHypothesisYet: false,
      },
    });
    const row = await loaded();
    const draft = row.draft as { fieldClarity: Record<string, string>; selectedHypothesisId: string };
    expect(draft.fieldClarity.VALOR).toBe('UNCLEAR');
    expect(draft.selectedHypothesisId).toBe('h1');
    const done = await service.complete(row);
    expect(done.result.selectedHypothesisId).toBe('h1');
    expect(done.result.fieldClarity.VALOR).toBe('UNCLEAR');
    expect(done.result).not.toHaveProperty('purpose_score');
  });

  it('completes without hypotheses and keeps snapshots immutable', async () => {
    const created = await service.createSession({});
    const loaded = async () =>
      prisma.ikigaiSession.findUniqueOrThrow({
        where: { id: created.session.id },
        include: { definition: true, snapshots: { orderBy: { revision: 'desc' as const }, take: 1 } },
      });
    const item = (fid: string, text: string, evidence: string, order = 0) => ({
      id: fid,
      text,
      evidence,
      order,
    });
    await service.patchDraft(await loaded(), {
      draftVersion: 0,
      patch: {
        items: {
          PASION: [item('p1', 'enseñar personas', 'SOSTENIDO'), item('p2', 'escribir ensayos', 'ATRACCION', 1)],
          CAPACIDAD: [item('c1', 'explicar sistemas', 'RESULTADOS'), item('c2', 'organizar equipos', 'EXPERIENCIA', 1)],
          NECESIDAD: [item('n1', 'aprendizaje frustrado', 'VIVIDA'), item('n2', 'soledad urbana', 'OBSERVADA', 1)],
          VALOR: [item('v1', 'consultoría de procesos', 'SOSTUVO_A_MI'), item('v2', 'formación in company', 'NO_PROBADO', 1)],
        },
        noHypothesisYet: true,
        hypotheses: [],
      },
    });
    const done = await service.complete(await loaded());
    expect(done.revision).toBe(1);
    expect(done.result.hypotheses).toEqual([]);
    expect(done.result.tensions.some((t: { ruleId: string }) => t.ruleId === 'T_NO_HYPOTHESIS')).toBe(true);
    expect(JSON.stringify(done.result)).not.toMatch(/purpose_score/);
  });
});
