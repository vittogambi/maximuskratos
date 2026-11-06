/**
 * Simulated Mentalidad accounts for the local beta walk. Fixture domain only.
 * Every row it writes is marked as a simulation.
 *
 * Run: cd packages/database && npx tsx scripts/seed-sim-mentalidad.ts
 */
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const PASSWORD = 'SimMentalidad2026';
const SIM = { simulation: true, fixture: 'sim-mentalidad' };
const EMAILS = {
  empty: 'sim.mentalidad.vacia@fixtures.mk.invalid',
  answers: 'sim.mentalidad.respuestas@fixtures.mk.invalid',
  tracking: 'sim.mentalidad.seguimiento@fixtures.mk.invalid',
  finanzas: 'sim.finanzas.respuestas@fixtures.mk.invalid',
  relaciones: 'sim.relaciones.respuestas@fixtures.mk.invalid',
  salud: 'sim.salud.respuestas@fixtures.mk.invalid',
};

const ANSWERS: Record<string, string> = {
  'formulario-v1:E-AUD-001!R26': '2',
  'formulario-v1:E-AUD-001!R9': '2',
  'formulario-v1:E-AUD-001!R29': '2',
  'formulario-v1:E-AUD-001!R27': '2',
  'formulario-v1:E-AUD-001!R6': '2',
  'formulario-v1:E-AUD-001!R7': '4',
  'formulario-v1:E-AUD-001!R20': '3',
  'formulario-v1:E-AUD-001!R19': '4',
  'formulario-v1:E-AUD-001!R8': '3',
  'formulario-v1:E-AUD-001!R10': '3',
  'formulario-v1:E-AUD-001!R30': '3',
  'formulario-v1:E-PER-000!R134': '2',
  'formulario-v1:E-PER-000!R135': '1',
  'formulario-v1:E-PER-000!R133': '2',
  'formulario-v1:E-PER-000!R98': '0',
  'formulario-v1:E-PER-000!R33': 'Ser un hombre en quien mi familia puede confiar y que termina lo que empieza.',
};

function civilToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function monday(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDays(day, weekday === 0 ? -6 : 1 - weekday);
}

async function freshUser(prisma: PrismaClient, email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) await prisma.user.delete({ where: { id: existing.id } });
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(PASSWORD, 12),
      onboardingStep: 'PROFILE_COMPLETE',
      subscription: { create: { status: 'TRIAL' } },
    },
  });
}

async function answerSet(prisma: PrismaClient, userId: string, answers: Record<string, string>) {
  const version = await prisma.diagnosticVersion.findFirst({ where: { isActive: true }, include: { modules: true } });
  if (!version) throw new Error('No hay versión activa del cuestionario.');
  const session = await prisma.diagnosticSession.create({
    data: { userId, versionId: version.id, status: 'ACTIVE', metadata: SIM },
  });
  for (const mod of version.modules) {
    await prisma.userModuleProgress.create({ data: { sessionId: session.id, moduleId: mod.id, status: 'AVAILABLE' } });
  }
  for (const [sourceRef, value] of Object.entries(answers)) {
    const question = await prisma.question.findFirst({
      where: { sourceRef, module: { versionId: version.id } },
      include: { options: true },
    });
    if (!question) throw new Error(`${sourceRef} no está en ${version.version}`);
    const option = question.options.find((row) => row.value === value);
    await prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        freeText: option ? null : value,
        selectedOptionIds: option ? [option.id] : [],
        selectedOptions: option ? { connect: [{ id: option.id }] } : undefined,
        revision: 1,
      },
    });
  }
  await prisma.diagnosticEvent.create({ data: { sessionId: session.id, type: 'session_started', payload: SIM } });
  return version.version;
}

async function trackingPlan(prisma: PrismaClient, userId: string) {
  const today = civilToday();
  const activatedDay = addDays(monday(today), -14);
  const plan = await prisma.personalPlan.create({
    data: {
      userId,
      title: 'Una promesa pequeña cumplida',
      outcome: 'Volver a contar contigo para terminar lo que empiezas.',
      priorityNote: 'Datos simulados para revisar el recorrido.',
      status: 'ACTIVE',
      stage: 'ACTIVE',
      entry: 'GOAL',
      territory: 'MENTALIDAD',
      capacityMinutes: 50,
      protectNote: 'El sueño.',
      activatedAt: new Date(`${activatedDay}T12:00:00.000Z`),
      reviewAt: new Date(`${today}T12:00:00.000Z`),
      isFocus: true,
      focusSince: new Date(`${activatedDay}T12:00:00.000Z`),
    },
  });
  await prisma.planProposal.create({
    data: {
      userId,
      planId: plan.id,
      territory: 'MENTALIDAD',
      kind: 'INTERVENTION_PLAN',
      payload: {
        templateId: 'MEN-C1',
        version: 'intervencion-mentalidad@0.1',
        templateSnapshot: {
          id: 'MEN-C1',
          version: 'intervencion-mentalidad@0.1',
          group: 'C',
          goal: 'sostener',
          title: 'Una promesa pequeña cumplida',
          seeks: 'Volver a contar contigo para terminar lo que empiezas.',
          action: 'Elige un compromiso pequeño y cúmplelo.',
          schedule: { kind: 'WEEKLY', occasionsPerWeek: 5, minutesPerOccasion: 10 },
          minimum: { text: 'Tres compromisos de 5 minutos en la semana.', occasionsPerWeek: 3, minutesPerOccasion: 5 },
          doneWhen: 'Lo hiciste ese día, completo aunque sea pequeño.',
          indicators: [
            { ref: 'ind-men-termine@0.1', role: 'RESULT', question: '¿Terminaste esta semana algo que empezaste?', kind: 'YES_NO', better: 'UP' },
            { ref: 'ind-men-confianza@0.1', role: 'PERCEPTION', question: 'Esta semana, ¿cuánto confiaste en terminar lo que empiezas?', kind: 'SCALE_1_5', min: 1, max: 5, better: 'UP' },
          ],
          horizonWeeks: 4,
          notes: [],
        },
        general: false,
        minimum: false,
        horizonWeeks: 3,
        focusText: null,
        stageDefinition: null,
        readings: [{ id: 'sostener', outcome: 'REPRESENTS', signature: 'simulacion', declared: ['En «¿Confío en mí mismo para terminar lo que empiezo?» marcaste 2 de 5.'] }],
        load: { weeklyMinutes: 50, occasionsPerWeek: 5, minutesPerOccasion: 10, confirmed: true },
        environmentAccepted: false,
        ...SIM,
      },
      status: 'ACCEPTED',
      decidedAt: new Date(`${activatedDay}T12:00:00.000Z`),
      engineVersion: 'intervencion-mentalidad@0.1',
      rulesVersion: 'intervencion-mentalidad@0.1',
      templateRef: 'MEN-C1@intervencion-mentalidad@0.1',
      commandKey: 'sim-mentalidad-c1',
    },
  });
  const action = await prisma.planAction.create({
    data: {
      planId: plan.id,
      title: 'Elige un compromiso pequeño y cúmplelo.',
      doneWhen: 'Lo hiciste ese día, completo aunque sea pequeño.',
      occasionsPerWeek: 5,
      minutesPerOccasion: 10,
      origin: 'SYSTEM_TEMPLATE',
      familyId: 'MEN-C1',
      templateVersion: 'intervencion-mentalidad@0.1',
      minimumVersion: 'Tres compromisos de 5 minutos en la semana.',
      effectiveFrom: activatedDay,
    },
  });
  const weeks = [monday(activatedDay), addDays(monday(activatedDay), 7), monday(today)];
  const doneByWeek = [5, 5, 3];
  const measures = [
    { termine: 0, confianza: 2 },
    { termine: 0, confianza: 3 },
    { termine: 0, confianza: 3 },
  ];
  for (const [index, week] of weeks.entries()) {
    for (let day = 0; day < doneByWeek[index]!; day += 1) {
      const date = addDays(week, day);
      if (date > today) break;
      await prisma.actionRecord.create({ data: { actionId: action.id, day: date, status: 'DONE', note: 'Simulación' } });
    }
    const measure = measures[index];
    if (!measure) continue;
    const observed = addDays(week, 6);
    for (const [ref, value] of [['ind-men-termine@0.1', measure.termine], ['ind-men-confianza@0.1', measure.confianza]] as const) {
      await prisma.planEvidence.create({
        data: {
          userId,
          planId: plan.id,
          criterionRevision: 1,
          observedOn: new Date(`${observed}T12:00:00.000Z`),
          kind: 'MEASURE',
          status: 'MEASURED',
          value,
          indicatorRef: ref,
          periodStart: week,
          source: 'SIMULATION',
        },
      });
    }
  }
  return plan.id;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await freshUser(prisma, EMAILS.empty);
    const answers = await freshUser(prisma, EMAILS.answers);
    const catalog = await answerSet(prisma, answers.id, ANSWERS);
    const tracking = await freshUser(prisma, EMAILS.tracking);
    await answerSet(prisma, tracking.id, ANSWERS);
    const planId = await trackingPlan(prisma, tracking.id);
    const finanzas = await freshUser(prisma, EMAILS.finanzas);
    const relaciones = await freshUser(prisma, EMAILS.relaciones);
    const salud = await freshUser(prisma, EMAILS.salud);
    await answerSet(prisma, finanzas.id, {
      'formulario-v1:E-AUD-001!R37': '2',
      'formulario-v1:E-AUD-001!R39': '2',
      'formulario-v1:F-RAD-003!R8': '2',
    });
    await answerSet(prisma, relaciones.id, {
      'formulario-v1:E-AUD-001!R46': '2',
      'formulario-v1:E-AUD-001!R28': '2',
      'formulario-v1:F-RAD-002!R16': '2',
    });
    await answerSet(prisma, salud.id, {
      'formulario-v1:E-AUD-001!R16': '2',
      'formulario-v1:E-AUD-001!R18': '2',
      'formulario-v1:F-RAD-001!R27': 'Sí',
    });
    console.log(JSON.stringify({
      ok: true,
      simulation: true,
      password: PASSWORD,
      accounts: {
        sinCuestionario: EMAILS.empty,
        conRespuestas: EMAILS.answers,
        conSeguimiento: EMAILS.tracking,
        finanzas: EMAILS.finanzas,
        relaciones: EMAILS.relaciones,
        salud: EMAILS.salud,
      },
      catalog,
      trackingPlanId: planId,
      loginUrl: 'http://localhost:3000/login',
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
