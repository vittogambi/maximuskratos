import { createHash } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { scoreAlignment, compareAlignment, type AlignmentIndex, type CoreAnswer } from './core-index';
import { ALIGNMENT_METHOD, ALIGNMENT_NAME, CORE_SIGNALS, DEFINITION_SHA } from './core-definition';
import { scoreDepth, DEPTH_METHOD, DEPTH_NAME, type DepthFact, type DepthIndex } from './depth';
import { PURPOSE_COMPONENTS, type PurposeComponent } from './glossary';
import type { DepthComponentScore } from './depth';
import { territoryMap, type TerritoryEvidence } from './territory-map';

type Db = PrismaClient | Prisma.TransactionClient;

const MODULE_OF: Record<PurposeComponent, string> = {
  origen: 'e-per-origen',
  vision: 'e-per-vision',
  valores: 'e-per-valores',
  estandares: 'e-per-estandares',
  identidad: 'e-per-identidad',
  dificultades: 'e-per-dificultades',
  personalidad: 'e-per-personalidad',
  ikigai: 'e-per-ikigai',
  huella: 'e-per-huella',
};

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

type ResponseLike = {
  exceptionKind: string | null;
  answeredAt: Date;
  question: { sourceRef: string | null; module?: { slug: string } };
  selectedOptions: { value: string }[];
};

function numeric(row: ResponseLike): number | null {
  const raw = row.selectedOptions[0]?.value;
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function answersFrom(rows: ResponseLike[], catalogVersion: string): CoreAnswer[] {
  const byRef = new Map(rows.map((row) => [row.question.sourceRef, row]));
  return CORE_SIGNALS.map((signal) => {
    const row = byRef.get(signal.sourceRef);
    const exception = row?.exceptionKind;
    const known = exception === 'UNKNOWN' || exception === 'NOT_APPLICABLE' || exception === 'DECLINED' || exception === 'PENDING'
      ? exception
      : null;
    return {
      sourceRef: signal.sourceRef,
      value: known ? null : row ? numeric(row) : null,
      exception: known,
      catalogVersion,
      answeredAt: row?.answeredAt?.toISOString() ?? null,
    };
  });
}

export async function materializeInitialAlignment(db: Db, sessionId: string): Promise<void> {
  const session = await db.diagnosticSession.findUnique({
    where: { id: sessionId },
    include: {
      version: true,
      responses: { include: { question: { include: { module: true } }, selectedOptions: true } },
    },
  });
  if (!session || session.version.definitionRef !== 'formulario-completo' || session.status !== 'COMPLETED') return;
  const commandKey = `initial:${sessionId}:${ALIGNMENT_METHOD}`;
  const existing = await db.coreReading.findUnique({ where: { commandKey } });
  if (existing) return;
  const output = scoreAlignment(answersFrom(session.responses, session.version.version));
  try {
    await db.coreReading.create({
      data: {
        userId: session.userId,
        kind: 'INITIAL',
        methodVersion: ALIGNMENT_METHOD,
        definitionSha: DEFINITION_SHA,
        sessionId,
        commandKey,
        input: asJson(answersFrom(session.responses, session.version.version)),
        output: asJson(output),
      },
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') return;
    throw err;
  }
}

export type IndexCard = {
  name: string;
  methodVersion: string;
  kind: string;
  general: number | null;
  partial: number | null;
  pillars: { espiritu: number | null; mente: number | null; cuerpo: number | null } | null;
  coverage: { eligible?: number; scored?: number; required: number };
  pending: string[];
  answeredAt: string | null;
  computedAt: string;
  explanation: string;
  delta: number | null;
};

function cardFromAlignment(row: { kind: string; output: unknown; computedAt: Date }, delta: number | null): IndexCard {
  const output = row.output as AlignmentIndex;
  const dates = output.signals.map((item) => item.answeredAt).filter((item): item is string => Boolean(item)).sort();
  return {
    name: ALIGNMENT_NAME,
    methodVersion: ALIGNMENT_METHOD,
    kind: row.kind,
    general: output.general,
    partial: null,
    pillars: {
      espiritu: output.pillars.ESPIRITU,
      mente: output.pillars.MENTE,
      cuerpo: output.pillars.CUERPO,
    },
    coverage: { eligible: output.coverage.eligible, required: output.coverage.required },
    pending: output.pending,
    answeredAt: dates[0] ?? null,
    computedAt: row.computedAt.toISOString(),
    explanation: row.kind === 'REMEASURE'
      ? 'Medición posterior del núcleo. No se mezcla con respuestas antiguas.'
      : row.kind === 'RECONSTRUCTED'
        ? 'Reconstrucción de la captura. No se presenta como mejora frente a una captura que no era elegible.'
        : output.general == null
          ? 'Lectura inicial del cuestionario. Falta cobertura para el general. No es cero.'
          : 'Índice de alineación MK. Lectura inicial del cuestionario. Método en revisión.',
    delta,
  };
}

export async function alignmentViews(db: Db, userId: string): Promise<{ current: IndexCard | null; initial: IndexCard | null; history: IndexCard[]; signals: AlignmentIndex['signals'] }> {
  const rows = await db.coreReading.findMany({
    where: { userId, methodVersion: ALIGNMENT_METHOD },
    orderBy: { computedAt: 'asc' },
  });
  const history = rows.map((row) => cardFromAlignment(row, null));
  const initialRow = rows.find((row) => row.kind === 'INITIAL');
  const latestComplete = [...rows].reverse().find((row) => (row.output as AlignmentIndex).general != null);
  const shown = latestComplete ?? initialRow ?? null;
  let delta: number | null = null;
  if (shown && initialRow && shown.id !== initialRow.id) {
    const compared = compareAlignment(initialRow.output as AlignmentIndex, shown.output as AlignmentIndex, 'INITIAL');
    delta = compared.allowed ? compared.delta : null;
  }
  return {
    current: shown ? cardFromAlignment(shown, delta) : null,
    initial: initialRow ? cardFromAlignment(initialRow, null) : null,
    history,
    signals: shown ? (shown.output as AlignmentIndex).signals ?? [] : [],
  };
}

const IDENTITY_REFS = new Set(['formulario-v1:E-PER-000!R73', 'formulario-v1:E-PER-000!R74', 'formulario-v1:E-PER-000!R76', 'formulario-v1:E-PER-000!R77', 'formulario-v1:E-PER-000!R80', 'formulario-v1:E-PER-000!R86']);

export type DepthCard = IndexCard & {
  components: Pick<DepthComponentScore, 'component' | 'label' | 'stage' | 'reason'>[];
};

export async function depthView(db: Db, userId: string): Promise<DepthCard | null> {
  const session = await db.diagnosticSession.findFirst({
    where: { userId, status: 'COMPLETED', version: { definitionRef: 'formulario-completo' } },
    orderBy: { completedAt: 'desc' },
    include: {
      version: true,
      responses: { include: { question: { include: { module: true } }, selectedOptions: true } },
    },
  });
  if (!session) return null;
  const confirmations = await db.depthConfirmation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  const latest = new Map<string, { payload: unknown; purposeRevisionId: string | null }>();
  for (const row of confirmations) {
    if (!latest.has(row.component)) latest.set(row.component, { payload: row.payload, purposeRevisionId: row.purposeRevisionId });
  }
  const purpose = await db.purposeRevision.findFirst({ where: { userId }, orderBy: { revision: 'desc' } });
  const facts: DepthFact[] = PURPOSE_COMPONENTS.map((component) => {
    const rows = session.responses.filter((row) => row.question.module.slug === MODULE_OF[component]);
    const unreliable = component === 'identidad'
      && session.version.version !== 'formulario-completo@1'
      && session.version.version !== 'formulario-completo@2'
      && session.version.version !== 'formulario-completo@3'
      && session.version.version !== 'formulario-completo@6'
      && rows.some((row) => row.question.sourceRef && IDENTITY_REFS.has(row.question.sourceRef));
    let record: DepthFact['record'] = 'ABSENT';
    if (rows.length) {
      const declined = rows.every((row) => row.exceptionKind === 'DECLINED');
      record = declined ? 'DECLINED' : unreliable ? 'UNRELIABLE' : 'VALID';
    }
    const saved = latest.get(component)?.payload as Partial<DepthFact> | undefined;
    const linkCurrent = !saved?.integrated || latest.get(component)?.purposeRevisionId == null || latest.get(component)?.purposeRevisionId === purpose?.id;
    return {
      component,
      record,
      recognized: saved?.recognized ?? null,
      integrated: saved?.integrated ?? null,
      linkCurrent,
      contrasted: saved?.contrasted ?? null,
    };
  });
  const output = scoreDepth(facts);
  return {
    name: DEPTH_NAME,
    methodVersion: DEPTH_METHOD,
    kind: 'DOCUMENTED',
    general: output.general,
    partial: output.partial,
    pillars: null,
    coverage: { scored: output.coverage.scored, required: output.coverage.required },
    pending: output.components.filter((item) => item.score == null).map((item) => `${item.label}: ${item.reason}`),
    answeredAt: null,
    computedAt: new Date().toISOString(),
    explanation: 'Índice de profundidad MK. Mide trabajo documentado de la hoja, no profundidad psicológica. Método en revisión.',
    delta: null,
    components: output.components.map((item) => ({
      component: item.component,
      label: item.label,
      stage: item.stage,
      reason: item.reason,
    })),
  };
}

export function evidenceForMap(output: AlignmentIndex): TerritoryEvidence[] {
  return output.signals
    .filter((item) => item.raw != null)
    .map((item) => ({ sourceRef: item.sourceRef, role: 'senal' as const, note: `${item.id} ${item.raw}` }));
}

export async function openMeasurement(db: Db, userId: string, kind: 'RECONFIRM' | 'REMEASURE', sessionId: string | null): Promise<{ id: string }> {
  const commandKey = `${kind}:${userId}:${Date.now()}`;
  return db.questionnaireMeasurement.create({
    data: { userId, kind, status: 'DRAFT', methodVersion: ALIGNMENT_METHOD, sessionId, commandKey },
    select: { id: true },
  });
}

export async function saveMeasurementAnswer(
  db: Db,
  userId: string,
  measurementId: string,
  sourceRef: string,
  value: number | null,
  exception: string | null,
): Promise<void> {
  const measurement = await db.questionnaireMeasurement.findFirst({ where: { id: measurementId, userId, status: 'DRAFT' } });
  if (!measurement) throw new Error('MEASUREMENT_CLOSED');
  if (!CORE_SIGNALS.some((item) => item.sourceRef === sourceRef)) throw new Error('NOT_IN_CORE');
  const existing = await db.measurementResponse.findUnique({ where: { measurementId_sourceRef: { measurementId, sourceRef } } });
  if (existing) {
    await db.measurementResponse.update({
      where: { id: existing.id },
      data: { value: value == null ? null : String(value), exceptionKind: exception, revision: existing.revision + 1, answeredAt: new Date() },
    });
    return;
  }
  await db.measurementResponse.create({
    data: { measurementId, sourceRef, value: value == null ? null : String(value), exceptionKind: exception, answeredAt: new Date() },
  });
}

export async function closeMeasurement(db: Db, userId: string, measurementId: string): Promise<{ general: number | null; kind: string }> {
  const measurement = await db.questionnaireMeasurement.findFirst({
    where: { id: measurementId, userId },
    include: { responses: true },
  });
  if (!measurement) throw new Error('NOT_FOUND');
  if (measurement.status === 'CLOSED') {
    const prior = await db.coreReading.findFirst({ where: { measurementId, methodVersion: ALIGNMENT_METHOD } });
    return { general: (prior?.output as AlignmentIndex | undefined)?.general ?? null, kind: prior?.kind ?? measurement.kind };
  }
  const session = measurement.sessionId
    ? await db.diagnosticSession.findFirst({
      where: { id: measurement.sessionId, userId },
      include: { version: true, responses: { include: { question: true, selectedOptions: true } } },
    })
    : null;
  const overlay = new Map(measurement.responses.map((row) => [row.sourceRef, row]));
  const freshAnswer = (sourceRef: string): CoreAnswer | null => {
    const fresh = overlay.get(sourceRef);
    if (!fresh) return null;
    const exception = fresh.exceptionKind === 'UNKNOWN' || fresh.exceptionKind === 'DECLINED' || fresh.exceptionKind === 'PENDING' || fresh.exceptionKind === 'NOT_APPLICABLE'
      ? fresh.exceptionKind
      : null;
    return {
      sourceRef,
      value: exception ? null : fresh.value == null ? null : Number(fresh.value),
      exception,
      catalogVersion: 'formulario-completo@6',
      answeredAt: fresh.answeredAt?.toISOString() ?? null,
    };
  };
  const base = session && measurement.kind === 'RECONFIRM' ? answersFrom(session.responses, session.version.version) : [];
  const merged: CoreAnswer[] = CORE_SIGNALS.map((signal) => freshAnswer(signal.sourceRef) ?? base.find((item) => item.sourceRef === signal.sourceRef) ?? {
    sourceRef: signal.sourceRef,
    value: null,
    catalogVersion: 'formulario-completo@6',
  });
  const output = scoreAlignment(merged);
  const kind = measurement.kind === 'RECONFIRM' ? 'RECONSTRUCTED' : 'REMEASURE';
  if (output.general == null && measurement.kind === 'REMEASURE') {
    return { general: null, kind: 'DRAFT' };
  }
  const initial = session
    ? await db.coreReading.findFirst({ where: { sessionId: session.id, kind: 'INITIAL', methodVersion: ALIGNMENT_METHOD } })
    : null;
  await db.coreReading.create({
    data: {
      userId,
      kind,
      methodVersion: ALIGNMENT_METHOD,
      definitionSha: DEFINITION_SHA,
      sessionId: session?.id ?? null,
      measurementId,
      baselineReadingId: initial?.id ?? null,
      commandKey: `${kind}:${measurementId}:${ALIGNMENT_METHOD}`,
      input: asJson(merged),
      output: asJson(output),
    },
  });
  await db.questionnaireMeasurement.update({ where: { id: measurementId }, data: { status: 'CLOSED', closedAt: new Date() } });
  return { general: output.general, kind };
}

export function readingDigest(output: AlignmentIndex | null): string {
  return createHash('sha256').update(JSON.stringify(output?.general ?? null)).digest('hex').slice(0, 16);
}

export { territoryMap, DEPTH_NAME, ALIGNMENT_NAME };
