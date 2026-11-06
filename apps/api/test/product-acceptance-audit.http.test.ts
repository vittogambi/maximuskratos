/**
 * Auditoría de aceptación S01–S16.
 * Vitest en verde no significa historias aprobadas.
 * El último test exige ACEPTADA y falla si algún escenario no está COMPLETO.
 * Evidencia: tmp/audit-aceptacion-2026-10-28/
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { weekStartForDay } from '../src/journey/civil-week';
import { bootApi } from './journey-http-app';

const AUDIT_DIR = resolve(__dirname, '../../../tmp/audit-aceptacion-2026-10-28');
const EVIDENCE = resolve(AUDIT_DIR, 'evidencia.jsonl');
const START = '2026-10-28';
const WEEK = '2026-10-26';
const AFTER = '2026-11-02';

type ScenarioStatus = 'COMPLETO' | 'PARCIAL' | 'FALLO' | 'NO_EJECUTADO' | 'OBSERVACION_HUMANA';

type Row = {
  id: string;
  persona: string;
  email: string;
  status: ScenarioStatus;
  human: string | null;
  esperado: string;
  observado: string;
  evidencia: string;
  propuestaMk: string;
  aporte: string;
  limite: string;
  pasadaAnterior: string;
};

const rows: Row[] = [];
process.env.MK_CLOCK_DAY = START;
const clock = { today() { return process.env.MK_CLOCK_DAY ?? START; } };

let app: INestApplication;
let prisma: PrismaClient;

function server() { return app.getHttpServer(); }
function setDay(day: string) { process.env.MK_CLOCK_DAY = day; }

function log(row: Row) {
  rows.push(row);
  appendFileSync(EVIDENCE, `${JSON.stringify({ at: new Date().toISOString(), ...row })}\n`);
}

function aceptacionGlobal(list: Row[]) {
  const human = list.filter((row) => row.status === 'OBSERVACION_HUMANA');
  const pending = list.filter((row) => row.status !== 'COMPLETO' && row.status !== 'OBSERVACION_HUMANA');
  return {
    aceptacionTecnica: pending.length ? 'NO_ACEPTADA' as const : 'ACEPTADA' as const,
    observacionHumanaPendiente: human.map((row) => row.id),
    motivo: pending.length
      ? 'Hay escenarios técnicos incompletos o fallidos.'
      : 'Los escenarios técnicos quedaron completos. La observación humana no corta esta suite.',
    pendientes: pending.map((row) => `${row.id} ${row.status}`),
  };
}

async function call(token: string, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const started = Date.now();
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', `Bearer ${token}`);
  const res = body === undefined ? await req : await req.send(body);
  return { status: res.status, body: res.body, ms: Date.now() - started, path, method: method.toUpperCase() };
}

async function account(label: string) {
  const email = `audit.${label}.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  return { token: res.body.accessToken as string, userId: res.body.user.id as string, email, register: res.status };
}

async function relogin(email: string) {
  const res = await request(server()).post('/api/v1/auth/login').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  return { status: res.status, token: res.body.accessToken as string | undefined };
}

async function activateIntervention(token: string, territory: string, planId: string, load?: { occasions?: number; minutes?: number; weekly?: number }, reviewAt?: string) {
  const occasions = load?.occasions ?? 2;
  const minutes = load?.minutes ?? 30;
  const weekly = load?.weekly ?? occasions * minutes;
  const patch = await call(token, 'patch', `/journey/intervention/${territory}/plans/${planId}`, {
    minimum: false,
    horizonWeeks: 3,
    weeklyMinutes: weekly,
    occasionsPerWeek: occasions,
    minutesPerOccasion: minutes,
    protectNote: 'Por ahora no hay nada que cuidar.',
    environmentAccepted: false,
  });
  const act = await call(token, 'post', `/journey/intervention/${territory}/plans/${planId}/activate`, {
    confirmed: true,
    commandKey: `act-${planId}-${Date.now()}`,
    ...(reviewAt ? { reviewAt } : {}),
  });
  return { patch, act };
}

async function answerDiagnostic(token: string, sourceRef: string, value: string | { exception: 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED' }) {
  const started = await call(token, 'post', '/diagnostic/start', {});
  const question = await call(token, 'get', `/diagnostic/question?sourceRef=${encodeURIComponent(sourceRef)}`);
  if (question.status >= 400) {
    return { ok: false, start: started.status, question: question.status, body: question.body, sent: null as string | null };
  }
  const dto = question.body.question as { id: string; options: { id: string; value: string; textEs: string }[]; allowedExceptions?: string[] };
  const payload: Record<string, unknown> = { questionId: dto.id };
  if (typeof value === 'object') {
    payload.exceptionKind = value.exception;
  } else {
    const option = dto.options.find((row) => row.value === value);
    if (!option) {
      return {
        ok: false,
        start: started.status,
        question: question.status,
        body: { options: dto.options.map((row) => `${row.value}:${row.textEs}`) },
        sent: null,
      };
    }
    payload.selectedOptionIds = [option.id];
  }
  const saved = await call(token, 'post', '/diagnostic/response', payload);
  return { ok: saved.status < 400, start: started.status, question: question.status, response: saved.status, body: saved.body, sent: typeof value === 'string' ? value : value.exception };
}

async function record(token: string, actionId: string, day: string, status: 'DONE' | 'SKIPPED') {
  return call(token, 'post', '/journey/records', { actionId, day, status });
}

beforeAll(async () => {
  mkdirSync(AUDIT_DIR, { recursive: true });
  writeFileSync(EVIDENCE, '');
  setDay(START);
  app = await bootApi({ clock });
  prisma = new PrismaClient();
}, 120_000);

afterAll(async () => {
  const verdict = aceptacionGlobal(rows);
  writeFileSync(resolve(AUDIT_DIR, 'resumen.json'), JSON.stringify({
    commit: 'b9298dc6f592a1142fa80cce98b31a2343e77488',
    clockStart: START,
    ...verdict,
    rows,
  }, null, 2));
  console.log(JSON.stringify(verdict, null, 2));
  await prisma?.$disconnect();
  await app?.close();
}, 60_000);

describe('Auditoría S01-S16 (no equivale a aceptación)', () => {
  it('S01 sin dirección: catálogo no es orientación', async () => {
    setDay(START);
    const acc = await account('s01');
    const dash = await call(acc.token, 'get', '/journey/dashboard');
    const dir = await call(acc.token, 'get', '/journey/direction');
    const view = await call(acc.token, 'get', '/journey/intervention/mentalidad');
    const byGoal = await call(acc.token, 'get', '/journey/intervention/mentalidad?goal=organizar');
    const goals = (view.body.goals ?? []).map((row: { id: string; label: string }) => row.label);
    const templates = view.body.templates?.length ?? 0;
    const goalTemplates = byGoal.body.templates?.length ?? 0;
    const readings = view.body.readings?.length ?? 0;
    const canContinue = dash.status === 200 && (dir.body?.statement == null || dir.body?.statement === '');
    log({
      id: 'S01',
      persona: 'Camila, saturada, sin propósito',
      email: acc.email,
      status: 'OBSERVACION_HUMANA',
      human: 'Hace falta ver si los seis tipos de cambio y las dos sugerencias de la pantalla le alcanzan para elegir. Esta pasada no observa a una persona.',
      esperado: 'Ayuda a elegir un cambio, o una exploración honesta, sin inventar un propósito.',
      observado: `Puede entrar sin dirección (${canContinue}). API devuelve ${templates} plantillas con o sin goal (${goalTemplates}) y ${readings} lecturas. Objetivos: ${goals.join('; ') || 'ninguno'}.`,
      evidencia: 'GET /journey/intervention/mentalidad y ?goal=organizar. La pantalla DesignChangeFirst filtra a dos plantillas solo después de que la persona elige un objetivo; eso no se ejecutó en navegador.',
      propuestaMk: goals.length ? goals.join(' | ') : 'sin objetivos',
      aporte: 'No exige propósito para ver el ámbito. Ofrece categorías de cambio en el contrato.',
      limite: 'Nueve plantillas y un 201 no demuestran que MK elija el cambio.',
      pasadaAnterior: 'PASS por catálogo y activación',
    });
  }, 60_000);

  it('S02 meta clara sin cuestionario', async () => {
    setDay(START);
    const acc = await account('s02');
    const plan = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-B1',
      readingIds: [],
      focusText: 'Cerrar propuesta al cliente',
      stageDefinition: 'Borrador enviado al cliente',
      commandKey: `s02-${Date.now()}`,
      change: 'Entregar la propuesta sin trabajar todas las noches',
      why: 'El cliente la espera esta semana',
      observableResult: 'El cliente tiene un borrador revisable',
      criterion: 'Llegó confirmación de lectura o comentarios',
      evidenceHint: 'Correo o mensaje',
    });
    const planId = plan.body.plan?.id as string;
    const act = planId ? await activateIntervention(acc.token, 'mentalidad', planId, { occasions: 2, minutes: 25 }, START) : null;
    const other = await relogin(acc.email);
    const read = other.token ? await call(other.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`) : { status: 0, body: {} };
    const out = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'NOT_YET',
      text: 'El cliente todavía no responde',
      commandKey: `s02-out-${Date.now()}`,
    });
    const kept = read.body?.focusText === 'Cerrar propuesta al cliente' && read.body?.readings?.length === 0 && read.body?.general === true;
    const ok = plan.status < 400 && act?.act.status < 400 && kept && out.status < 400 && other.status < 400;
    log({
      id: 'S02',
      persona: 'Diego, propuesta a un cliente',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: null,
      esperado: 'Conserva la meta y hace seguimiento sin lecturas inventadas.',
      observado: `plan ${plan.status}, activate ${act?.act.status}, otra sesión ${other.status}, general=${read.body?.general}, readings=${read.body?.readings?.length}, focus=${read.body?.focusText}, assessment=${out.status}`,
      evidencia: `plan ${planId}`,
      propuestaMk: 'MEN-B1 general, sin lecturas',
      aporte: 'Guarda el foco y el resultado escrito por la persona.',
      limite: 'La acción sigue siendo la de la plantilla, no un plan de horas del cliente.',
      pasadaAnterior: 'PASS',
    });
  }, 90_000);

  it('S03 cuestionario por la ruta real y comparación', async () => {
    setDay(START);
    const acc = await account('s03');
    const before = await call(acc.token, 'get', '/journey/intervention/mentalidad');
    const beforeIds = (before.body.readings ?? []).map((row: { id: string }) => row.id);
    const beforeTemplates = (before.body.templates ?? []).map((row: { id: string }) => row.id).join(',');
    const blocked = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2',
      readingIds: ['planificacion'],
      commandKey: `s03-before-${Date.now()}`,
    });
    const answered = await answerDiagnostic(acc.token, 'formulario-v1:E-AUD-001!R26', '2');
    const after = await call(acc.token, 'get', '/journey/intervention/mentalidad');
    const reading = (after.body.readings ?? []).find((row: { id: string }) => row.id === 'planificacion');
    const afterTemplates = (after.body.templates ?? []).map((row: { id: string }) => row.id).join(',');
    let recognized = 0;
    let linked = 0;
    let declaredOnPlan = '';
    if (reading?.signature) {
      const rec = await call(acc.token, 'post', '/journey/intervention/mentalidad/recognition', {
        readingId: 'planificacion',
        outcome: 'REPRESENTS',
        signature: reading.signature,
      });
      recognized = rec.status;
      const created = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
        templateId: 'MEN-A2',
        readingIds: ['planificacion'],
        commandKey: `s03-after-${Date.now()}`,
        change: 'Dejar la semana escrita',
        observableResult: 'Mañana tiene tres bloques',
        criterion: 'La lista existe',
      });
      linked = created.status;
      declaredOnPlan = created.body?.plan ? 'plan creado' : JSON.stringify(created.body).slice(0, 180);
      const view = created.body?.plan?.id
        ? await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${created.body.plan.id}`)
        : null;
      declaredOnPlan = view ? JSON.stringify(view.body?.readings ?? []).slice(0, 400) : declaredOnPlan;
    }
    const changedReading = !beforeIds.includes('planificacion') && Boolean(reading);
    const sameCatalog = beforeTemplates === afterTemplates;
    const ok = answered.ok && changedReading && recognized < 400 && linked < 400;
    log({
      id: 'S03',
      persona: 'Elena, respuestas de planificación',
      email: acc.email,
      status: ok ? 'COMPLETO' : answered.ok ? 'FALLO' : 'NO_EJECUTADO',
      human: null,
      esperado: 'Responder R26 por el diagnóstico y ver qué cambia en la propuesta.',
      observado: `respuesta ${answered.response ?? answered.question} valor=${answered.sent}. Lecturas antes=[${beforeIds.join(',')}] después incluye planificación=${Boolean(reading)}. Catálogo idéntico=${sameCatalog}. Crear con lectura antes=${blocked.status}. Reconocer=${recognized}. Crear después=${linked}.`,
      evidencia: `declarado=${reading?.declared?.join(' ') ?? 'sin lectura'}. En el plan: ${declaredOnPlan}`,
      propuestaMk: reading?.interpretation ?? 'sin lectura',
      aporte: ok ? 'Aparece la lectura de planificación con la marca 2 de 5 y se puede vincular al plan.' : 'No se pudo comparar.',
      limite: 'El texto de la acción de MEN-A2 no cambia. La personalización es la lectura, no otra estrategia.',
      pasadaAnterior: 'PARTIAL sin respuestas',
    });
  }, 90_000);

  it('S04 respuestas altas reales', async () => {
    setDay(START);
    const acc = await account('s04');
    const scales = [6, 7, 8, 9, 19, 20, 26, 27, 29, 30].map((row) => `formulario-v1:E-AUD-001!R${row}`);
    const noDifficulty = [98, 99, 109, 133, 134, 135, 137, 139].map((row) => `formulario-v1:E-PER-000!R${row}`);
    const failed: string[] = [];
    for (const ref of scales) {
      const saved = await answerDiagnostic(acc.token, ref, '5');
      if (!saved.ok) failed.push(`${ref}:${saved.response ?? saved.question}`);
    }
    for (const ref of noDifficulty) {
      const saved = await answerDiagnostic(acc.token, ref, '0');
      if (!saved.ok) failed.push(`${ref}:${saved.response ?? saved.question}`);
    }
    const reservesTime = await answerDiagnostic(acc.token, 'formulario-v1:E-PER-000!R148', '2');
    if (!reservesTime.ok) failed.push(`R148:${reservesTime.response ?? reservesTime.question}`);
    const view = await call(acc.token, 'get', '/journey/intervention/mentalidad');
    const readingIds = (view.body.readings ?? []).map((row: { id: string }) => row.id);
    const created = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-F1',
      readingIds: [],
      commandKey: `s04-${Date.now()}`,
      change: 'Sacar adelante el proyecto del taller',
      observableResult: 'Existe el siguiente hito del proyecto',
      criterion: 'Puedo enseñar ese hito',
    });
    const noDeficit = !readingIds.includes('planificacion') && !readingIds.includes('sostener') && !readingIds.includes('coherencia');
    const ok = failed.length === 0 && view.body.hasAnswers === true && noDeficit && created.status < 400 && view.body.modifiers?.suggestMinimum == null;
    log({
      id: 'S04',
      persona: 'Felipe, recursos altos',
      email: acc.email,
      status: failed.length ? 'PARCIAL' : ok ? 'COMPLETO' : 'FALLO',
      human: null,
      esperado: 'Con respuestas altas hay siguiente paso y no aparece un déficit inventado.',
      observado: `fallos de respuesta=${failed.join(',') || 'ninguno'}. hasAnswers=${view.body.hasAnswers}. lecturas=${readingIds.join(',') || 'ninguna'}. create MEN-F1=${created.status}. suggestMinimum=${Boolean(view.body.modifiers?.suggestMinimum)}`,
      evidencia: 'POST /diagnostic/response en escalas 5 y dificultades 0',
      propuestaMk: created.status < 400 ? 'MEN-F1 creado sin lectura de déficit' : 'sin plan',
      aporte: ok ? 'El catálogo sigue disponible y no propone una lectura por respuestas bajas inexistentes.' : 'El perfil alto no quedó limpio.',
      limite: 'MEN-F1 sigue siendo una plantilla general, no un plan del taller.',
      pasadaAnterior: 'PASS sin respuestas',
    });
  }, 120_000);

  it('S05 camino web de plan propio', async () => {
    setDay(START);
    const acc = await account('s05');
    const catalog = 'Reserva un bloque para lo importante, sin las interrupciones que puedas evitar.';
    const ownAction = 'Leer en voz alta el borrador con el temporizador de cocina';
    const ownDone = 'El temporizador sonó y el borrador quedó marcado';
    const ownTitle = 'Repaso en voz alta';
    const ownCriterion = 'El cliente explica el método sin que yo esté';
    const draft = await call(acc.token, 'post', '/journey/plans/draft', { entry: 'OWN_PLAN', territory: 'MENTALIDAD' });
    const planId = draft.body.id as string;
    const patched = await call(acc.token, 'patch', `/journey/plans/${planId}/draft`, {
      title: ownTitle,
      outcome: 'El cliente entiende el método',
      territory: 'MENTALIDAD',
      criterionText: ownCriterion,
      criterionStatus: 'CONFIRMED',
      capacityMinutes: 90,
      protectNote: 'No uso las noches.',
    });
    const own = await call(acc.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/own-contract`, {
      seeks: 'Que el cliente entienda el método sin que yo esté al lado',
      action: ownAction,
      doneWhen: ownDone,
      indicatorQuestion: '¿El cliente pudo explicar el método solo?',
      horizonWeeks: 4,
    });
    const adjusted = await call(acc.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      minimum: false,
      horizonWeeks: 4,
      weeklyMinutes: 90,
      occasionsPerWeek: 2,
      minutesPerOccasion: 45,
      protectNote: 'No uso las noches.',
    });
    const activated = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, {
      confirmed: true,
      commandKey: `s05-act-${Date.now()}`,
    });
    const other = await relogin(acc.email);
    const view = other.token ? await call(other.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`) : { body: {}, status: 0 };
    const action = planId ? await prisma.planAction.findFirst({ where: { planId } }) : null;
    const proposal = planId ? await prisma.planProposal.findFirst({ where: { planId }, orderBy: { createdAt: 'desc' } }) : null;
    const payload = proposal?.payload as { templateId?: string; templateSnapshot?: { action?: string; id?: string } } | undefined;
    const conserved = action?.title === ownAction
      && action?.doneWhen === ownDone
      && view.body?.changeTitle === ownTitle
      && view.body?.template?.action === ownAction
      && !String(view.body?.template?.action ?? '').includes(catalog)
      && view.body?.load?.occasionsPerWeek === 2
      && view.body?.load?.weeklyMinutes === 90;
    const probeDraft = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2',
      readingIds: [],
      commandKey: `s05-probe-${Date.now()}`,
    });
    const probeId = probeDraft.body.plan?.id as string | undefined;
    let probe = 'no corrida';
    if (probeId) {
      const overwritten = await call(acc.token, 'patch', `/journey/intervention/mentalidad/plans/${probeId}/own-contract`, {
        seeks: 'Probe',
        action: ownAction,
        doneWhen: ownDone,
        indicatorQuestion: '¿Sigue mi acción?',
        horizonWeeks: 3,
      });
      const probeProposal = await prisma.planProposal.findFirst({ where: { planId: probeId }, orderBy: { createdAt: 'desc' } });
      const probePayload = probeProposal?.payload as { templateId?: string; templateSnapshot?: { id?: string; action?: string } } | undefined;
      probe = `status ${overwritten.status}, templateId=${probePayload?.templateId}, snapshot=${probePayload?.templateSnapshot?.id}, action=${probePayload?.templateSnapshot?.action}`;
    }
    log({
      id: 'S05',
      persona: 'Gabriela, estrategia propia',
      email: acc.email,
      status: conserved && activated.status < 400 ? 'COMPLETO' : 'FALLO',
      human: 'No se pulsó el botón en el navegador. Se reprodujo la secuencia HTTP de DesignStudio.activate cuando camino es OWN.',
      esperado: 'Título, acción, criterio y carga propios se conservan. La acción no pasa a ser la de una plantilla.',
      observado: `draft ${draft.status}, patch ${patched.status}, own ${own.status}, adjust ${adjusted.status}, activate ${activated.status}. action=${action?.title}. templateId payload=${payload?.templateId}. snapshot=${payload?.templateSnapshot?.id}. criterion=${view.body?.outcomeContract?.criterion}. probe MEN-A2 luego own: ${probe}`,
      evidencia: `plan ${planId}. Acción de catálogo MEN-A2: «${catalog}».`,
      propuestaMk: view.body?.template?.action ?? 'sin vista',
      aporte: conserved ? 'La secuencia de la web guarda la acción propia en el snapshot OWN.' : 'La acción propia no sobrevivió a la activación.',
      limite: 'La pasada anterior llamó template.action al texto que el propio guion había enviado. No era la frase del catálogo.',
      pasadaAnterior: 'PASS de own-contract sobre un plan MEN-A2, con el rótulo equivocado de acción de plantilla',
    });
  }, 90_000);

  it('S06 ejecución de herramienta sin resultado', async () => {
    setDay(START);
    const acc = await account('s06');
    const plan = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A1',
      commandKey: `s06-${Date.now()}`,
      change: 'Enseñar mi método',
      observableResult: 'Otra persona aplica el método sola',
      criterion: 'Alguien lo usa con la guía escrita',
    });
    const planId = plan.body.plan?.id as string;
    await activateIntervention(acc.token, 'mentalidad', planId, { occasions: 1, minutes: 20 }, START);
    await call(acc.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep`, {
      weekStart: WEEK,
      commandKey: `s06-prep-${Date.now()}`,
      payload: {
        priorities: [
          { id: 'p1', advance: 'Explicar', recognize: 'Entienden', nextStep: 'Practicar' },
          { id: 'p2', advance: 'Guía', recognize: 'Escrita', nextStep: 'Probar' },
          { id: 'p3', advance: 'Sesión', recognize: 'Hecha', nextStep: 'Pedir feedback' },
        ],
        primaryId: 'p1',
      },
    });
    await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/week-prep/confirm`, { weekStart: WEEK, commandKey: `s06-c-${Date.now()}` });
    await call(acc.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep/review-outcomes`, {
      weekStart: WEEK,
      outcomes: { priorities: [{ id: 'p1', outcome: 'ACHIEVED' }, { id: 'p2', outcome: 'ACHIEVED' }, { id: 'p3', outcome: 'ACHIEVED' }] },
      commandKey: `s06-r-${Date.now()}`,
    });
    await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'NOT_YET',
      text: 'Nadie pudo aplicarlo solo',
      weekStart: WEEK,
      commandKey: `s06-o-${Date.now()}`,
    });
    const view = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const tool = view.body.indicators?.some((row: { latest?: { value: number | null } }) => row.latest?.value != null);
    const ok = tool && view.body.outcomeAssessment?.status === 'NOT_YET' && view.body.review?.choices?.includes('MODIFY');
    log({
      id: 'S06',
      persona: 'Helena, el método no se replica',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: null,
      esperado: 'Prioridades hechas no equivalen al resultado.',
      observado: `indicador=${tool}, assessment=${view.body.outcomeAssessment?.status}, code=${view.body.review?.code}, choices=${view.body.review?.choices?.join(',')}`,
      evidencia: view.body.review?.outcomeText ?? '',
      propuestaMk: view.body.review?.outcomeText ?? '',
      aporte: 'Separa la herramienta MEN-A1 del resultado propio.',
      limite: 'Las prioridades son el guion de la historia, no un uso humano.',
      pasadaAnterior: 'PASS, se conserva',
    });
  }, 120_000);

  it('S07 menos actividad y efecto futuro', async () => {
    setDay(START);
    const acc = await account('s07');
    const plan = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2',
      readingIds: [],
      commandKey: `s07-${Date.now()}`,
      observableResult: 'Otra persona aplica el método',
      criterion: 'Lo hizo con la guía',
    });
    const planId = plan.body.plan?.id as string;
    const act = await activateIntervention(acc.token, 'mentalidad', planId, { occasions: 2, minutes: 30 }, START);
    const action = await prisma.planAction.findFirst({ where: { planId } });
    const done = action ? await record(acc.token, action.id, '2026-10-26', 'DONE') : { status: 0, body: {} };
    const skipped = action ? await record(acc.token, action.id, '2026-10-27', 'SKIPPED') : { status: 0, body: {} };
    const beforeRecords = action ? await prisma.actionRecord.findMany({ where: { actionId: action.id }, orderBy: { day: 'asc' } }) : [];
    setDay(AFTER);
    const mid = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const assessed = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'ACHIEVED',
      text: 'La otra persona lo aplicó con una sola ocasión',
      weekStart: WEEK,
      commandKey: `s07-o-${Date.now()}`,
    });
    const view = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const saved = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'REDUCE',
      weekStart: WEEK,
      meaning: 'STILL',
      commandKey: `s07-d-${Date.now()}`,
    });
    const applied = await call(acc.token, 'post', '/journey/intervention/week-review/apply', { weekStart: WEEK, commandKey: `s07-apply-${Date.now()}` });
    const afterAction = action ? await prisma.planAction.findFirst({ where: { id: action.id } }) : null;
    const successor = action ? await prisma.planAction.findFirst({ where: { replacesActionId: action.id } }) : null;
    const afterRecords = action ? await prisma.actionRecord.findMany({ where: { actionId: action.id }, orderBy: { day: 'asc' } }) : [];
    const exec = mid.body.execution;
    const pastIntact = JSON.stringify(beforeRecords.map((row) => [row.day, row.status])) === JSON.stringify(afterRecords.map((row) => [row.day, row.status]));
    const lighter = view.body.review?.code === 'LIGHTER_OK' && view.body.review?.choices?.includes('REDUCE');
    const future = afterAction?.occasionsPerWeek === 2 && afterAction?.active === false && successor?.occasionsPerWeek === 1 && applied.status < 400;
    const ok = act.act.status < 400 && done.status < 400 && skipped.status < 400 && exec?.done === 1 && exec?.notDone === 1 && exec?.coverage === 'COMPLETE' && lighter && future && pastIntact && saved.status < 400;
    log({
      id: 'S07',
      persona: 'Iván, resultado con menos ocasiones',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: null,
      esperado: '1 hecha y 1 no hecha, resultado conseguido, aligerar la carga hacia adelante y dejar el registro anterior.',
      observado: `records ${done.status}/${skipped.status} skipBody=${JSON.stringify(skipped.body).slice(0, 160)}. execution done=${exec?.done} notDone=${exec?.notDone} noInfo=${exec?.noInformation} coverage=${exec?.coverage} level=${exec?.levelForReview}. assessment=${assessed.status} code=${view.body.review?.code} choices=${view.body.review?.choices?.join(',')}. save=${saved.status} apply=${applied.status} body=${JSON.stringify(applied.body).slice(0, 220)}. occasions ${action?.occasionsPerWeek} -> ${afterAction?.occasionsPerWeek}. pastIntact=${pastIntact}`,
      evidencia: view.body.review?.outcomeText ?? '',
      propuestaMk: view.body.review?.text ?? '',
      aporte: lighter ? 'Reconoce el resultado aunque la ejecución no sea suficiente.' : 'No separó el resultado de la actividad.',
      limite: 'Semana simulada con reloj 2026-11-02, después de la activación real.',
      pasadaAnterior: 'PASS solo con ACHIEVED y sin registros',
    });
  }, 120_000);

  it('S08 fecha de comprobación no alcanzada', async () => {
    setDay(START);
    const acc = await account('s08');
    const plan = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2',
      readingIds: [],
      commandKey: `s08-${Date.now()}`,
      observableResult: 'El proyecto queda en la siguiente etapa',
      criterion: 'Se ve al cerrar el mes',
      checkAt: '2026-12-01',
    });
    const planId = plan.body.plan?.id as string;
    await activateIntervention(acc.token, 'mentalidad', planId, { occasions: 2, minutes: 30 }, '2026-12-01');
    const view = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const ok = view.body.outcomeCheckDue === 'NOT_YET' && view.body.horizonReached === false;
    log({
      id: 'S08',
      persona: 'Julia, el resultado pide más tiempo',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: 'La pantalla esconde las decisiones de estrategia hasta la fecha. No se miró en navegador.',
      esperado: 'No sustituir la estrategia porque la fecha de comprobación no llegó.',
      observado: `checkDue=${view.body.outcomeCheckDue}, horizonReached=${view.body.horizonReached}, reviewAt=${view.body.reviewAt}`,
      evidencia: 'InterventionReviewDecision solo muestra botones de estrategia si horizonReached.',
      propuestaMk: `checkDue=${view.body.outcomeCheckDue}`,
      aporte: 'El contrato marca NOT_YET y la UI no ofrece sustituir todavía.',
      limite: 'La API igual calcula choices. La persona no las ve hasta la fecha.',
      pasadaAnterior: 'PASS',
    });
  }, 60_000);

  it('S09 una ocasión hecha y varias sin registro', async () => {
    setDay(START);
    const acc = await account('s09');
    const plan = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2',
      readingIds: [],
      commandKey: `s09-${Date.now()}`,
      observableResult: 'El método queda aplicado',
      criterion: 'Hay evidencia de la otra persona',
    });
    const planId = plan.body.plan?.id as string;
    await activateIntervention(acc.token, 'mentalidad', planId, { occasions: 4, minutes: 20, weekly: 80 }, START);
    const action = await prisma.planAction.findFirst({ where: { planId } });
    const done = action ? await record(acc.token, action.id, '2026-10-28', 'DONE') : { status: 0 };
    setDay(AFTER);
    const assessed = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'INSUFFICIENT',
      text: 'No alcanza para saber si el método quedó aplicado',
      weekStart: WEEK,
      commandKey: `s09-o-${Date.now()}`,
    });
    const view = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const exec = view.body.execution;
    const ok = done.status < 400
      && exec?.done === 1
      && exec?.noInformation === 3
      && exec?.coverage === 'INCOMPLETE'
      && exec?.scheduled === 4
      && view.body.outcomeAssessment?.status === 'INSUFFICIENT'
      && view.body.review?.code === 'NO_RECORDS'
      && assessed.status < 400;
    log({
      id: 'S09',
      persona: 'Karina, pocos registros',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: null,
      esperado: '1 hecha, 3 sin registro, cobertura incompleta y resultado desconocido. No tratar el 100 % de lo registrado como éxito del plan.',
      observado: `done=${exec?.done} notDone=${exec?.notDone} noInfo=${exec?.noInformation} scheduled=${exec?.scheduled} resolved=${exec?.resolved} ratio=${exec?.ratioOfResolved} coverage=${exec?.coverage} level=${exec?.level} levelForReview=${exec?.levelForReview} assessment=${view.body.outcomeAssessment?.status} review=${view.body.review?.code}`,
      evidencia: view.body.review?.outcomeText ?? '',
      propuestaMk: view.body.review?.outcomeText ?? '',
      aporte: ok ? 'Separa cumplimiento de lo registrado, cobertura y resultado.' : 'Los números no distinguen las tres capas.',
      limite: 'Cuatro ocasiones flexibles de una semana simulada.',
      pasadaAnterior: 'PASS con un DONE y cobertura NONE por el reloj',
    });
  }, 90_000);

  it('S10 finanzas de punta a punta', async () => {
    setDay(START);
    const acc = await account('s10');
    const view = await call(acc.token, 'get', '/journey/intervention/finanzas');
    const template = (view.body.templates ?? []).find((row: { id: string }) => row.id === 'FIN-A1');
    const text = JSON.stringify(template ?? {});
    const prescriptive = /invertir|deuda nueva|%\s*de\s*ahorro|debes ahorrar/i.test(text);
    const plan = await call(acc.token, 'post', '/journey/intervention/finanzas/plans', {
      templateId: 'FIN-A1',
      readingIds: [],
      commandKey: `s10-${Date.now()}`,
      change: 'Entender compromisos y margen',
      observableResult: 'Sé cuánto queda este mes después de los costos fijos',
      criterion: 'Están escritos ingresos, costos fijos y margen',
    });
    const planId = plan.body.plan?.id as string;
    const act = planId ? await activateIntervention(acc.token, 'finanzas', planId, { occasions: 1, minutes: 25, weekly: 25 }, START) : null;
    const action = planId ? await prisma.planAction.findFirst({ where: { planId } }) : null;
    const done = action ? await record(acc.token, action.id, '2026-10-28', 'DONE') : { status: 0 };
    setDay(AFTER);
    const assessed = planId ? await call(acc.token, 'post', `/journey/intervention/finanzas/plans/${planId}/outcome-assessment`, {
      status: 'ACHIEVED',
      text: 'Quedan 40000 después de los costos fijos. El número lo miré yo.',
      weekStart: WEEK,
      commandKey: `s10-o-${Date.now()}`,
    }) : { status: 0 };
    const reviewed = planId ? await call(acc.token, 'get', `/journey/intervention/finanzas/plans/${planId}`) : { body: {} };
    const saved = planId ? await call(acc.token, 'post', `/journey/intervention/finanzas/plans/${planId}/review-decision`, {
      choice: 'KEEP',
      weekStart: WEEK,
      meaning: 'STILL',
      commandKey: `s10-d-${Date.now()}`,
    }) : { status: 0 };
    const applied = await call(acc.token, 'post', '/journey/intervention/week-review/apply', { weekStart: WEEK, commandKey: `s10-apply-${Date.now()}` });
    const again = await call(acc.token, 'post', '/journey/intervention/week-review/apply', { weekStart: WEEK, commandKey: `s10-apply-2-${Date.now()}` });
    const reviewText = `${reviewed.body?.review?.text ?? ''} ${reviewed.body?.review?.outcomeText ?? ''}`;
    const reviewPrescribes = /invertir|deuda nueva|debes ahorrar/i.test(reviewText);
    const ok = !prescriptive && !reviewPrescribes && plan.status < 400 && act?.act.status < 400 && done.status < 400 && assessed.status < 400 && saved.status < 400 && applied.status < 400 && again.status >= 400;
    log({
      id: 'S10',
      persona: 'Luis, margen del mes',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: null,
      esperado: 'Activar, registrar, revisar y aplicar sin consejo de inversión ni porcentaje.',
      observado: `create=${plan.status} activate=${act?.act.status} record=${done.status} assessment=${assessed.status} save=${saved.status} apply=${applied.status} repeat=${again.status}. prescriptiveTemplate=${prescriptive} prescriptiveReview=${reviewPrescribes}. notes=${(template?.notes ?? []).join(' ')}`,
      evidencia: reviewText,
      propuestaMk: template?.action ?? '',
      aporte: 'La plantilla pide anotar ingresos, costos y margen. El número lo declara la persona.',
      limite: 'No calcula el margen. Solo guarda el texto.',
      pasadaAnterior: 'PASS solo de creación y copy',
    });
  }, 120_000);

  it('S11 relaciones: no aplica y viabilidad incierta', async () => {
    setDay(START);
    const acc = await account('s11');
    const before = await call(acc.token, 'get', '/journey/intervention/relaciones');
    const refs = [
      'formulario-v1:E-AUD-001!R46',
      'formulario-v1:F-RAD-002!R6',
      'formulario-v1:F-RAD-002!R7',
      'formulario-v1:F-RAD-002!R8',
    ];
    const answers = [];
    for (const ref of refs) {
      answers.push({ ref, ...(await answerDiagnostic(acc.token, ref, { exception: 'NOT_APPLICABLE' })) });
    }
    const after = await call(acc.token, 'get', '/journey/intervention/relaciones');
    const readingIds = (after.body.readings ?? []).map((row: { id: string }) => row.id);
    const ineligible = (after.body.ineligible ?? []).map((row: { key: string; reason: string }) => `${row.key}:${row.reason}`);
    const plan = await call(acc.token, 'post', '/journey/intervention/relaciones/plans', {
      templateId: 'REL-A1',
      readingIds: [],
      focusText: 'Una amistad. No sé si puede conversar',
      commandKey: `s11-${Date.now()}`,
      change: 'Hablar de un límite, si es viable',
      observableResult: 'O hubo conversación o quedó una fecha escrita',
      criterion: 'Existe la conversación o la fecha',
    });
    const planId = plan.body.plan?.id as string;
    const act = planId ? await activateIntervention(acc.token, 'relaciones', planId, { occasions: 1, minutes: 30, weekly: 30 }, START) : null;
    const action = planId ? await prisma.planAction.findFirst({ where: { planId } }) : null;
    const marked = action ? await record(acc.token, action.id, '2026-10-28', 'SKIPPED') : { status: 0 };
    setDay(AFTER);
    const assessed = planId ? await call(acc.token, 'post', `/journey/intervention/relaciones/plans/${planId}/outcome-assessment`, {
      status: 'NOT_YET',
      text: 'No supe si la otra persona podía hablar. Dejé la nota, no forcé la conversación.',
      weekStart: WEEK,
      commandKey: `s11-o-${Date.now()}`,
    }) : { status: 0 };
    const view = planId ? await call(acc.token, 'get', `/journey/intervention/relaciones/plans/${planId}`) : { body: {} };
    const blob = `${view.body?.template?.action ?? ''} ${view.body?.template?.seeks ?? ''} ${view.body?.review?.text ?? ''} ${view.body?.review?.outcomeText ?? ''}`;
    const assumes = /tu pareja está disponible|reciprocidad garantizada|debe responder/i.test(blob);
    const exceptionsOk = answers.every((row) => row.ok);
    const noParejaDeficit = !readingIds.includes('pareja');
    const ok = exceptionsOk && noParejaDeficit && !assumes && plan.status < 400 && act?.act.status < 400 && marked.status < 400 && assessed.status < 400;
    log({
      id: 'S11',
      persona: 'Marta, vínculo con viabilidad incierta',
      email: acc.email,
      status: ok ? 'COMPLETO' : exceptionsOk ? 'FALLO' : 'NO_EJECUTADO',
      human: null,
      esperado: 'No aplica no crea déficit de pareja. La conversación incierta se puede registrar sin asumir disponibilidad.',
      observado: `respuestas=${answers.map((row) => `${row.ref.split('!').pop()}:${row.response ?? row.question}`).join(',')}. lecturas antes=${(before.body.readings ?? []).length} después=${readingIds.join(',') || 'ninguna'}. ineligible=${ineligible.join(',')}. create=${plan.status} activate=${act?.act.status} record=${marked.status} assessment=${assessed.status}. assumes=${assumes}`,
      evidencia: blob.slice(0, 500),
      propuestaMk: view.body?.template?.action ?? '',
      aporte: noParejaDeficit ? 'La excepción no se vuelve una lectura de pareja.' : 'Apareció una lectura de pareja pese a no aplica.',
      limite: 'REL-A1 sigue ofreciéndose en el catálogo general. La persona tiene que elegirla.',
      pasadaAnterior: 'PASS solo del texto seeks',
    });
  }, 120_000);

  it('S12 límite vigente y lesión aclarada', async () => {
    setDay(START);
    const limited = await account('s12a');
    const draft = await call(limited.token, 'post', '/journey/plans/draft', { entry: 'OWN_PLAN', territory: 'SALUD_FISICA' });
    const declared = await call(limited.token, 'post', `/journey/plans/${draft.body.id}/actions`, {
      title: 'Aclaración',
      doneWhen: 'Quedó dicha',
      contentTags: ['PHYSICAL_EXERTION'],
      healthLimit: 'CURRENT_LIMIT',
    });
    const created = await call(limited.token, 'post', '/journey/intervention/salud_fisica/plans', { templateId: 'SAL-A1', commandKey: `s12a-${Date.now()}` });
    const planId = created.body.plan?.id as string;
    if (planId) {
      await call(limited.token, 'patch', `/journey/intervention/salud_fisica/plans/${planId}`, {
        weeklyMinutes: 90, occasionsPerWeek: 3, minutesPerOccasion: 30, horizonWeeks: 4, protectNote: 'Rodilla vigente.',
      });
    }
    const activated = planId ? await call(limited.token, 'post', `/journey/intervention/salud_fisica/plans/${planId}/activate`, { confirmed: true, commandKey: `s12a-act-${Date.now()}` }) : { status: 0, body: {} };
    const actions = planId ? await prisma.planAction.count({ where: { planId, active: true } }) : -1;

    const cleared = await account('s12b');
    const draftB = await call(cleared.token, 'post', '/journey/plans/draft', { entry: 'OWN_PLAN', territory: 'SALUD_FISICA' });
    const old = await call(cleared.token, 'post', `/journey/plans/${draftB.body.id}/actions`, {
      title: 'Lesión antigua',
      doneWhen: 'Aclarada',
      contentTags: ['PHYSICAL_EXERTION'],
      healthLimit: 'NO_CURRENT_LIMIT',
    });
    const createdB = await call(cleared.token, 'post', '/journey/intervention/salud_fisica/plans', { templateId: 'SAL-A1', commandKey: `s12b-${Date.now()}` });
    const planB = createdB.body.plan?.id as string;
    if (planB) {
      await call(cleared.token, 'patch', `/journey/intervention/salud_fisica/plans/${planB}`, {
        weeklyMinutes: 90, occasionsPerWeek: 3, minutesPerOccasion: 30, horizonWeeks: 4, protectNote: 'La lesión ya no limita.',
      });
    }
    const activatedB = planB ? await call(cleared.token, 'post', `/journey/intervention/salud_fisica/plans/${planB}/activate`, { confirmed: true, commandKey: `s12b-act-${Date.now()}` }) : { status: 0, body: {} };
    const blocked = declared.status >= 400 && activated.status === 403 && actions === 0;
    const allowed = old.status < 400 && activatedB.status < 400;
    log({
      id: 'S12',
      persona: 'Nico, limitación vigente frente a una ya aclarada',
      email: `${limited.email} / ${cleared.email}`,
      status: blocked && allowed ? 'COMPLETO' : 'FALLO',
      human: null,
      esperado: 'Con límite vigente no se activa SAL-A1. Con límite aclarado sí se puede activar.',
      observado: `vigente declare=${declared.status} activate=${activated.status} actions=${actions} body=${JSON.stringify(activated.body).slice(0, 180)}. aclarada declare=${old.status} activate=${activatedB.status}`,
      evidencia: 'POST /journey/plans/:id/actions con healthLimit, luego activate de intervención',
      propuestaMk: 'SAL-A1 PHYSICAL_EXERTION',
      aporte: blocked ? 'El límite vigente bloquea la acción incompatible.' : 'No bloqueó el caso vigente.',
      limite: 'La aclaración entra por el alta de una acción, no por una pantalla dedicada de salud en este recorrido.',
      pasadaAnterior: 'PASS con insert directo en memberClarification. Esta pasada no escribe la tabla a mano.',
    });
  }, 90_000);

  it('S13 dos decisiones distintas', async () => {
    setDay(START);
    const acc = await account('s13');
    async function open(label: string) {
      const created = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
        templateId: 'MEN-A2',
        readingIds: [],
        commandKey: `s13-${label}-${Date.now()}`,
        change: label,
        observableResult: 'El bloque sirvió',
        criterion: 'Quedó hecho lo importante',
      });
      const id = created.body.plan.id as string;
      await activateIntervention(acc.token, 'mentalidad', id, { occasions: 2, minutes: 30 }, START);
      const action = await prisma.planAction.findFirstOrThrow({ where: { planId: id } });
      return { id, actionId: action.id, before: action.occasionsPerWeek };
    }
    const planA = await open('mantener');
    const planB = await open('aligerar');
    const recA1 = await record(acc.token, planA.actionId, '2026-10-26', 'DONE');
    const recA2 = await record(acc.token, planA.actionId, '2026-10-27', 'DONE');
    const recB1 = await record(acc.token, planB.actionId, '2026-10-26', 'DONE');
    const recB2 = await record(acc.token, planB.actionId, '2026-10-27', 'SKIPPED');
    const pastA = await prisma.actionRecord.findMany({ where: { actionId: planA.actionId } });
    const pastB = await prisma.actionRecord.findMany({ where: { actionId: planB.actionId } });
    setDay(AFTER);
    const assess = async (id: string) => call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${id}/outcome-assessment`, {
      status: 'ACHIEVED',
      text: 'El resultado de ese plan ocurrió',
      weekStart: WEEK,
      commandKey: `s13-o-${id}`,
    });
    await assess(planA.id);
    await assess(planB.id);
    const viewA = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planA.id}`);
    const viewB = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planB.id}`);
    const saveA = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planA.id}/review-decision`, {
      choice: 'KEEP', weekStart: WEEK, meaning: 'STILL', commandKey: `s13-keep-${Date.now()}`,
    });
    const saveB = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planB.id}/review-decision`, {
      choice: 'REDUCE', weekStart: WEEK, meaning: 'STILL', commandKey: `s13-reduce-${Date.now()}`,
    });
    const pending = await call(acc.token, 'get', `/journey/intervention/week-review/pending?weekStart=${WEEK}`);
    const applyKey = `s13-apply-${Date.now()}`;
    const applied = await call(acc.token, 'post', '/journey/intervention/week-review/apply', { weekStart: WEEK, commandKey: applyKey });
    const replay = await call(acc.token, 'post', '/journey/intervention/week-review/apply', { weekStart: WEEK, commandKey: applyKey });
    const otherKey = await call(acc.token, 'post', '/journey/intervention/week-review/apply', { weekStart: WEEK, commandKey: `s13-apply-other-${Date.now()}` });
    const otherNote = await call(acc.token, 'post', '/journey/intervention/week-review/apply', { weekStart: WEEK, note: 'otra nota', commandKey: applyKey });
    const afterA = await prisma.planAction.findFirst({ where: { id: planA.actionId } });
    const afterB = await prisma.planAction.findFirst({ where: { id: planB.actionId } });
    const successorB = await prisma.planAction.findFirst({ where: { replacesActionId: planB.actionId } });
    const byDay = (rows: { day: string; status: string }[]) => [...rows].sort((a, b) => a.day.localeCompare(b.day) || a.status.localeCompare(b.status));
    const recordsA = byDay(await prisma.actionRecord.findMany({ where: { actionId: planA.actionId } }));
    const recordsB = byDay(await prisma.actionRecord.findMany({ where: { actionId: planB.actionId } }));
    const pastIntact = JSON.stringify(recordsA.map((row) => [row.day, row.status])) === JSON.stringify(byDay(pastA).map((row) => [row.day, row.status]))
      && JSON.stringify(recordsB.map((row) => [row.day, row.status])) === JSON.stringify(byDay(pastB).map((row) => [row.day, row.status]));
    const choices = pending.body.pending?.map((row: { choice: string }) => row.choice).sort().join(',');
    const ok = viewA.body.execution?.coverage === 'COMPLETE'
      && viewB.body.execution?.notDone === 1
      && saveA.status < 400 && saveB.status < 400
      && choices === 'KEEP,REDUCE'
      && applied.status < 400 && applied.body.applied === 2 && applied.body.repeated !== true
      && replay.status < 400 && replay.body.repeated === true && replay.body.applied === 2
      && otherKey.status === 409 && otherKey.body.code === 'WEEK_ALREADY_CLOSED'
      && otherNote.status === 409 && otherNote.body.code === 'STALE_REVIEW'
      && afterA?.occasionsPerWeek === 2
      && afterA?.active !== false
      && afterB?.occasionsPerWeek === planB.before
      && afterB?.active === false
      && successorB?.occasionsPerWeek === (planB.before ?? 1) - 1
      && pastIntact
      && await prisma.weekReview.count({ where: { userId: acc.userId, weekStart: WEEK } }) === 1;
    log({
      id: 'S13',
      persona: 'Olga, dos planes',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: 'El panel de cierre está en la revisión y en la semana. No se pulsó.',
      esperado: 'KEEP y REDUCE, efectos distintos, pasado intacto. La misma clave repite el efecto. Otra clave no vuelve a aplicar.',
      observado: `records ${recA1.status},${recA2.status},${recB1.status},${recB2.status}. A exec=${viewA.body.execution?.done}/${viewA.body.execution?.notDone}/${viewA.body.execution?.coverage}. B exec=${viewB.body.execution?.done}/${viewB.body.execution?.notDone}. pending=${choices}. apply=${applied.status}:${applied.body.applied} repeated=${applied.body.repeated}. mismaClave=${replay.status}:${replay.body.repeated}. otraClave=${otherKey.status}:${otherKey.body.code}. mismaClaveOtraNota=${otherNote.status}:${otherNote.body.code}. occasions ${planA.before}->${afterA?.occasionsPerWeek} y ${planB.before}->${afterB?.occasionsPerWeek}. pastIntact=${pastIntact}`,
      evidencia: JSON.stringify(applied.body).slice(0, 300),
      propuestaMk: 'KEEP en el plan completo y REDUCE en el parcial',
      aporte: ok ? 'Aplica las dos decisiones una vez y no reescribe registros.' : 'No se sostuvieron decisiones distintas.',
      limite: 'Ambos resultados se declararon conseguidos para que REDUCE fuera una decisión válida.',
      pasadaAnterior: 'Dos KEEP. El FAIL inicial fue el guion, que pedía REDUCE sin evidencia.',
    });
  }, 120_000);

  it('S14 cerrar una meta sin reformular el propósito', async () => {
    setDay(START);
    const acc = await account('s14');
    const direction = await call(acc.token, 'post', '/journey/direction', {
      mode: 'CLEAR',
      statement: 'Quiero un oficio que me deje las tardes libres',
      commandKey: `s14-dir-${Date.now()}`,
    });
    const revision = direction.body?.current?.purposeRevisionId ?? direction.body?.purposeRevisionId ?? direction.body?.id;
    const plan = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2',
      readingIds: [],
      commandKey: `s14-${Date.now()}`,
      change: 'Terminar el curso de noche',
      why: 'Me quita las tardes',
      observableResult: 'El curso deja de ocupar las noches',
      criterion: 'No hay tarea pendiente del curso',
      purposeRevisionId: typeof revision === 'string' ? revision : undefined,
    });
    const planId = plan.body.plan?.id as string;
    await activateIntervention(acc.token, 'mentalidad', planId, { occasions: 1, minutes: 20, weekly: 20 }, START);
    const closed = await call(acc.token, 'post', `/journey/plans/${planId}/transition`, {
      toStage: 'CLOSED',
      reason: 'NO_LONGER_MATTERS',
      learningNote: 'El curso ya no me importa. El oficio de las tardes sigue.',
    });
    const memory = await call(acc.token, 'get', '/journey/memory');
    const directionAfter = await call(acc.token, 'get', '/journey/direction');
    const statement = JSON.stringify(directionAfter.body);
    const keptDirection = statement.includes('tardes libres');
    const learning = JSON.stringify(memory.body).includes('ya no me importa');
    const ok = closed.status < 400 && keptDirection && learning;
    log({
      id: 'S14',
      persona: 'Paula, la meta concreta dejó de importar',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: 'El botón de la pantalla llama a esta misma transición cuando el sentido es NO_LONGER. No se pulsó.',
      esperado: 'Cerrar el plan con aprendizaje y dejar el propósito.',
      observado: `direction=${direction.status} transition=${closed.status} stage=${closed.body?.plan?.stage}. proposito sigue=${keptDirection}. aprendizaje=${learning}`,
      evidencia: 'POST transition CLOSED reason NO_LONGER_MATTERS. UI: InterventionReviewDecision.closeWithLearning',
      propuestaMk: 'Cerrar este plan con lo aprendido',
      aporte: 'El propósito no se reescribe al cerrar el plan.',
      limite: 'No se recorrió el clic. El contrato HTTP es el que usa el botón.',
      pasadaAnterior: 'PASS por transition sin comprobar el propósito',
    });
  }, 90_000);

  it('S15 pausa y semanas de ausencia', async () => {
    setDay(START);
    const acc = await account('s15');
    await call(acc.token, 'post', '/journey/direction', { mode: 'EXPLORE', statement: 'Sigo buscando oficio', commandKey: `s15-dir-${Date.now()}` });
    const plan = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2',
      readingIds: [],
      commandKey: `s15-${Date.now()}`,
      change: 'Una hora de oficio',
      observableResult: 'Avancé el oficio',
      criterion: 'Hay una pieza nueva',
    });
    const planId = plan.body.plan?.id as string;
    await activateIntervention(acc.token, 'mentalidad', planId, { occasions: 2, minutes: 30 }, START);
    const action = await prisma.planAction.findFirstOrThrow({ where: { planId } });
    await record(acc.token, action.id, '2026-10-28', 'DONE');
    const decision = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'KEEP',
      weekStart: WEEK,
      meaning: 'STILL',
      commandKey: `s15-d-${Date.now()}`,
    });
    const schedulesBefore = await prisma.actionSchedule.count({ where: { actionId: action.id } });
    const recordsBefore = await prisma.actionRecord.count({ where: { actionId: action.id } });
    const paused = await call(acc.token, 'post', `/journey/plans/${planId}/transition`, { toStage: 'PAUSED' });
    setDay('2026-11-18');
    const returned = await call(acc.token, 'get', '/journey/return');
    const still = await prisma.personalPlan.findUnique({ where: { id: planId } });
    const calendar = await call(acc.token, 'get', '/journey/calendar');
    const occasionDays = (calendar.body.occasions ?? [])
      .filter((row: { actionId: string }) => row.actionId === action.id)
      .flatMap((row: { days?: string[] }) => row.days ?? []);
    const schedulesAfter = await prisma.actionSchedule.count({ where: { actionId: action.id } });
    const recordsAfter = await prisma.actionRecord.count({ where: { actionId: action.id } });
    const whilePaused = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const staleApply = await call(acc.token, 'post', '/journey/intervention/week-review/apply', { weekStart: WEEK, commandKey: `s15-apply-${Date.now()}` });
    const staleDecision = await call(acc.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'KEEP', weekStart: '2026-11-16', meaning: 'STILL', commandKey: `s15-late-${Date.now()}`,
    });
    const resumed = await call(acc.token, 'post', `/journey/plans/${planId}/transition`, { toStage: 'ACTIVE', reason: 'RETURN' });
    const after = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const records = await prisma.actionRecord.count({ where: { actionId: action.id, status: 'DONE' } });
    const context = returned.body?.stage === 'PAUSED'
      && returned.body?.planId === planId
      && returned.body?.headline === 'Avancé el oficio'
      && still?.stage === 'PAUSED';
    const noNewDuties = schedulesAfter === schedulesBefore
      && recordsAfter === recordsBefore
      && occasionDays.length === 0
      && whilePaused.body?.execution?.scheduled === 2
      && whilePaused.body?.execution?.done === 1;
    const rejected = staleApply.status === 409 && staleDecision.status >= 400;
    const recovered = after.body?.observableOutcome === 'Avancé el oficio' && records === 1 && resumed.status < 400 && after.body?.stage === 'ACTIVE';
    const ok = decision.status < 400 && paused.status < 400 && context && noNewDuties && rejected && recovered;
    log({
      id: 'S15',
      persona: 'Quique, ausente varias semanas',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: 'La pantalla de inicio ofrece retomar, seguir en pausa o ver el plan. No se pulsó.',
      esperado: 'Tras varias semanas, el retorno muestra el plan en pausa. No se reactiva solo ni crea ocasiones. La decisión vieja se rechaza. Retomar es un paso aparte y la historia sigue.',
      observado: `decisionAntes=${decision.status} pausa=${paused.status}. return stage=${returned.body?.stage} planId=${returned.body?.planId} headline=${returned.body?.headline} daysAway=${returned.body?.daysAway}. dbStage=${still?.stage}. schedules ${schedulesBefore}->${schedulesAfter} records ${recordsBefore}->${recordsAfter} occasionDays=${occasionDays.length} scheduled=${whilePaused.body?.execution?.scheduled} done=${whilePaused.body?.execution?.done} noInfo=${whilePaused.body?.execution?.noInformation}. applyEnPausa=${staleApply.status}:${staleApply.body?.code}. decisionEnPausa=${staleDecision.status}. resume=${resumed.status} stage=${after.body?.stage} recordsDone=${records}`,
      evidencia: 'GET /journey/return y GET /journey/calendar occasions del plan pausado',
      propuestaMk: returned.body?.headline ?? 'sin titular',
      aporte: context ? 'Recupera resultado y estado sin reactivar.' : 'El retorno no trajo el plan pausado.',
      limite: 'El clic de retomar en la pantalla no se ejecutó. El POST de transición sí.',
      pasadaAnterior: 'PARCIAL: headline null',
    });
  }, 120_000);

  it('S16 logro y mantenimiento en intervención', async () => {
    setDay(START);
    const acc = await account('s16');
    const plan = await call(acc.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2',
      readingIds: [],
      commandKey: `s16-${Date.now()}`,
      change: 'Sostener el bloque',
      observableResult: 'El bloque ya forma parte de la semana',
      criterion: 'Dos semanas con el bloque hecho',
      criterionStatus: 'CONFIRMED',
    });
    const planId = plan.body.plan?.id as string;
    const act = await activateIntervention(acc.token, 'mentalidad', planId, { occasions: 1, minutes: 25, weekly: 25 }, START);
    const contract = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const preview = await call(acc.token, 'get', `/journey/plans/${planId}/maintenance/preview`);
    const blocked = await call(acc.token, 'post', `/journey/plans/${planId}/achievement`, { confirm: true });
    const maintained = await call(acc.token, 'post', `/journey/plans/${planId}/transition`, {
      toStage: 'MAINTENANCE',
      reason: 'MAINTENANCE_MINIMUM',
    });
    const during = await call(acc.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    const evidence = await call(acc.token, 'post', `/journey/plans/${planId}/evidence`, {
      kind: 'DELIVERABLE',
      status: 'OBSERVED',
      text: 'El bloque ocurrió dos semanas',
    });
    const achieved = evidence.status < 400
      ? await call(acc.token, 'post', `/journey/plans/${planId}/achievement`, {
        confirm: true,
        commandKey: `s16-ach-${Date.now()}`,
        learningNote: 'Conseguí el bloque. Funcionó la hora fija. Aprendí a no agregar otro objetivo.',
      })
      : { status: 0, body: {} };
    const reopen = await call(acc.token, 'post', `/journey/plans/${planId}/transition`, { toStage: 'MAINTENANCE' });
    const closedStage = achieved.body?.plan?.stage;
    const ok = act.act.status < 400
      && contract.body.outcomeContract?.criterion
      && maintained.status < 400
      && during.body.stage === 'MAINTENANCE'
      && evidence.status < 400
      && achieved.status < 400
      && closedStage === 'CLOSED'
      && reopen.status >= 400;
    log({
      id: 'S16',
      persona: 'Rosa, logro y mantenimiento',
      email: acc.email,
      status: ok ? 'COMPLETO' : 'FALLO',
      human: 'La ficha y el paso posterior al logro se inspeccionaron en código. No se recorrieron en navegador.',
      esperado: 'Plan de intervención con contrato, mantenimiento antes del cierre, logro con evidencia, y no reabrir un CLOSED.',
      observado: `activate=${act.act.status} criterion=${contract.body.outcomeContract?.criterionStatus}. preview=${preview.status}. maintenance=${maintained.status} stage=${during.body.stage}. evidence=${evidence.status}. achievementSinEvidencia=${blocked.status}. achievement=${achieved.status} stage=${closedStage}. reabrir=${reopen.status}`,
      evidencia: 'Con el plan abierto la ficha ofrece mantenimiento. Cerrado, ofrece historial y otro cambio. El paso sigue del logro ya no enlaza a mantener.',
      propuestaMk: 'Guardar el mantenimiento y declarar logro',
      aporte: ok ? 'El ciclo de intervención admite mantener y luego cerrar por logro.' : 'El ciclo no se completó.',
      limite: 'Mantener sigue disponible solo mientras el plan está activo o en mantenimiento.',
      pasadaAnterior: 'PASS en un plan legacy, sin mantenimiento',
    });
  }, 120_000);

  it('veredicto global', () => {
    const verdict = aceptacionGlobal(rows);
    expect(rows.map((row) => row.id)).toEqual([
      'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16',
    ]);
    expect(verdict.aceptacionTecnica, `${verdict.motivo} Pendientes: ${verdict.pendientes.join(', ') || 'ninguno'}. Observación humana: ${verdict.observacionHumanaPendiente.join(', ')}`).toBe('ACEPTADA');
    expect(verdict.observacionHumanaPendiente).toEqual(['S01']);
  });
});
