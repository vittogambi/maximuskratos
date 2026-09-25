import { PrismaClient } from '@mk/database';
import { EXPECTED_DEFINITION_SHA256, sha256Utf8 } from '@mk/ikigai-engine';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IkigaiService } from '../src/ikigai/ikigai.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ensureIkigaiDefinition } from '../../packages/database/prisma/seed-ikigai';
import { ConflictException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { IkigaiAccessGuard } from '../src/ikigai/ikigai-access.guard';

const hasDb = Boolean(process.env.DATABASE_URL);
const sha = EXPECTED_DEFINITION_SHA256;

function write(draftVersion: number) {
  return { draftVersion, definitionSha256: sha };
}

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

    await service.patchDraft(await loaded(), { ...write(0), step: 'VALOR', patch: { items } });
    await expect(
      service.patchDraft(await loaded(), { ...write(0), patch: { patternNote: 'viejo' } }),
    ).rejects.toBeInstanceOf(ConflictException);

    const current = await loaded();
    await expect(service.complete(current, write(current.draftVersion))).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

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
      ...write(current.draftVersion),
      step: 'HIPOTESIS',
      patch: { hypotheses: [{ ...hyp, criteria: {} }], selectedHypothesisId: 'h1', noHypothesisYet: false },
    });
    const withPhrase = await loaded();
    await service.patchDraft(withPhrase, {
      ...write(withPhrase.draftVersion),
      step: 'CONTRASTE',
      patch: { hypotheses: [hyp], selectedHypothesisId: 'h1' },
    });

    const ready = await loaded();
    const done = await service.complete(ready, write(ready.draftVersion));
    expect(done.revision).toBe(1);
    expect(done.result).not.toHaveProperty('purpose_score');
    const snap1 = await prisma.ikigaiResultSnapshot.findFirst({ where: { sessionId: id, revision: 1 } });
    const frozen = snap1?.payload;

    const closedRow = await loaded();
    await service.reopen(closedRow, write(closedRow.draftVersion));
    const after = await loaded();
    expect(after.currentStep).toBe('REVISION');

    await service.patchDraft(after, {
      ...write(after.draftVersion),
      patch: { patternNote: 'explicar aparece en todos lados' },
    });
    const again = await loaded();
    const done2 = await service.complete(again, write(again.draftVersion));
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
      'Lo que amas',
      'En lo que eres bueno',
      'Lo que el mundo necesita',
      'Por lo que te pueden pagar',
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
      ...write(0),
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
            criteria: {},
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
    const phrased = await loaded();
    await service.patchDraft(phrased, {
      ...write(phrased.draftVersion),
      patch: {
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
      },
    });
    const row = await loaded();
    const draft = row.draft as { fieldClarity: Record<string, string>; selectedHypothesisId: string };
    expect(draft.fieldClarity.VALOR).toBe('UNCLEAR');
    expect(draft.selectedHypothesisId).toBe('h1');
    const done = await service.complete(row, write(row.draftVersion));
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
      ...write(0),
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
    const finished = await loaded();
    const done = await service.complete(finished, write(finished.draftVersion));
    expect(done.revision).toBe(1);
    expect(done.result.hypotheses).toEqual([]);
    expect(done.result.tensions.some((t: { ruleId: string }) => t.ruleId === 'T_NO_HYPOTHESIS')).toBe(true);
    expect(JSON.stringify(done.result)).not.toMatch(/purpose_score/);
  });

  it('accepts exactly one of two patches with the same version', async () => {
    const created = await service.createSession({});
    const loaded = async () =>
      prisma.ikigaiSession.findUniqueOrThrow({
        where: { id: created.session.id },
        include: { definition: true, snapshots: { orderBy: { revision: 'desc' as const }, take: 1 } },
      });
    const row = await loaded();
    const results = await Promise.allSettled([
      service.patchDraft(row, { ...write(row.draftVersion), patch: { patternNote: 'uno' } }),
      service.patchDraft(row, { ...write(row.draftVersion), patch: { patternNote: 'dos' } }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const after = await loaded();
    expect(after.draftVersion).toBe(row.draftVersion + 1);
  });

  it('does not complete a stale version over a newer draft', async () => {
    const created = await service.createSession({});
    const loaded = async () =>
      prisma.ikigaiSession.findUniqueOrThrow({
        where: { id: created.session.id },
        include: { definition: true, snapshots: { orderBy: { revision: 'desc' as const }, take: 1 } },
      });
    await service.patchDraft(await loaded(), {
      ...write(0),
      patch: {
        fieldClarity: { PASION: 'UNCLEAR', CAPACIDAD: 'UNCLEAR', NECESIDAD: 'UNCLEAR', VALOR: 'UNCLEAR' },
        noHypothesisYet: true,
        hypotheses: [],
      },
    });
    const ready = await loaded();
    await service.patchDraft(ready, { ...write(ready.draftVersion), patch: { patternNote: 'mientras tanto' } });
    await expect(service.complete(ready, write(ready.draftVersion))).rejects.toBeInstanceOf(ConflictException);
    const after = await loaded();
    expect(after.status).toBe('IN_PROGRESS');
    expect(after.snapshots).toHaveLength(0);
  });

  it('clears contrast when a shared idea changes and keeps the phrase', async () => {
    const created = await service.createSession({});
    const loaded = async () =>
      prisma.ikigaiSession.findUniqueOrThrow({
        where: { id: created.session.id },
        include: { definition: true, snapshots: { orderBy: { revision: 'desc' as const }, take: 1 } },
      });
    const criteria = {
      DISFRUTE_SOSTENIBLE: 4,
      CAPACIDAD_DEMOSTRABLE: 4,
      UTILIDAD_REAL: 4,
      VALOR_ECONOMICO: 4,
      COHERENCIA_MORAL: 4,
      FACTIBILIDAD: 4,
    };
    await service.patchDraft(await loaded(), {
      ...write(0),
      patch: {
        items: {
          PASION: [{ id: 'p1', text: 'enseñar', evidence: 'SOSTENIDO', order: 0 }],
          CAPACIDAD: [{ id: 'c1', text: 'explicar', evidence: 'RESULTADOS', order: 0 }],
          NECESIDAD: [],
          VALOR: [],
        },
        hypotheses: [
          { id: 'h1', text: 'Una dirección que quiero explorar es enseñar.', itemIds: ['p1', 'c1'], criteria, order: 0 },
          { id: 'h2', text: 'Otra dirección escrita con suficientes palabras.', itemIds: ['c1'], criteria, order: 1 },
        ],
        selectedHypothesisId: null,
      },
    });
    const createdHyps = await loaded();
    await service.patchDraft(createdHyps, {
      ...write(createdHyps.draftVersion),
      patch: {
        hypotheses: [
          { id: 'h1', text: 'Una dirección que quiero explorar es enseñar.', itemIds: ['p1', 'c1'], criteria, order: 0 },
          { id: 'h2', text: 'Otra dirección escrita con suficientes palabras.', itemIds: ['c1'], criteria, order: 1 },
        ],
      },
    });
    const row = await loaded();
    const saved = await service.patchDraft(row, {
      ...write(row.draftVersion),
      patch: {
        items: {
          PASION: [{ id: 'p1', text: 'enseñar de otra manera', evidence: 'SOSTENIDO', order: 0 }],
          CAPACIDAD: [{ id: 'c1', text: 'explicar', evidence: 'RESULTADOS', order: 0 }],
          NECESIDAD: [],
          VALOR: [],
        },
      },
    });
    const h1 = saved.draft.hypotheses.find((hyp) => hyp.id === 'h1');
    const h2 = saved.draft.hypotheses.find((hyp) => hyp.id === 'h2');
    expect(h1?.text).toContain('enseñar');
    expect(h1?.criteria).toEqual({});
    expect(h2?.criteria).toEqual(criteria);
    expect(saved.draft.items.PASION[0].evidence).toBeNull();
    expect(saved.draft.items.CAPACIDAD[0].evidence).toBe('RESULTADOS');
    expect(saved.draft.selectedHypothesisId).toBeNull();
  });
});
