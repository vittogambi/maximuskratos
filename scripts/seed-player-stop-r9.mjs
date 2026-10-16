/**
 * Register a preview account and walk the diagnostic until E-PER-000 R9 (arquetipo),
 * with all prior questions answered. R9 is left open for manual testing in the player.
 *
 * Usage: node scripts/seed-player-stop-r9.mjs
 * Requires API on localhost:4000 and DATABASE_URL in packages/database/.env
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STOP_SOURCE = 'formulario-v1:E-PER-000!R9';
const BIRTHDATE_SOURCE = 'formulario-v1:F-RAD-001!R6';
const DEFAULT_BIRTHDATE = '1990-06-15';
const API = process.env.API_ORIGIN ?? 'http://localhost:4000/api/v1';
const EMAIL = process.env.PREVIEW_EMAIL ?? 'preview.arquetipo.r9@fixtures.mk.invalid';
const PASSWORD = process.env.PREVIEW_PASSWORD ?? 'PlayerR9-2026';

const scenario = JSON.parse(
  readFileSync(resolve(ROOT, 'apps/api/test/journey-scenario.json'), 'utf8'),
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(token, method, path, body, attempt = 0) {
  const headers = { 'Content-Type': 'application/json', Connection: 'close' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (res.status === 429 && attempt < 8) {
    await sleep(400 * (attempt + 1));
    return api(token, method, path, body, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

const RESPONSE_PACE_MS = Number(process.env.SEED_RESPONSE_PACE_MS ?? 650);

function payloadFor(question, exceptions = {}) {
  const ref = question.sourceRef ?? '';
  const exception = exceptions[ref];
  if (exception) {
    return { exceptionKind: exception };
  }
  const spec = scenario.answers[ref];
  if (!spec) {
    if (question.type === 'SCALE_1_5' && question.options?.length) {
      const mid = question.options[Math.floor(question.options.length / 2)];
      return { selectedOptionIds: [mid.id] };
    }
    if (question.type === 'SINGLE_CHOICE' && question.options?.length) {
      return { selectedOptionIds: [question.options[0].id] };
    }
    if (question.type === 'MULTI_CHOICE' && question.options?.length) {
      return { selectedOptionIds: [question.options[0].id] };
    }
    if (question.type === 'FREE_TEXT') {
      return { freeText: 'Respuesta de recorrido de prueba.' };
    }
    throw new Error(`Sin escenario ni fallback para ${ref} (${question.type})`);
  }
  if (spec.kind === 'activity') {
    const ambit = question.capture?.ambits?.find((item) => item.label === spec.ambit);
    if (!ambit) throw new Error(`${ref} ámbito ${spec.ambit} no encontrado`);
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
    const value = spec.value?.includes('-') ? spec.value : DEFAULT_BIRTHDATE;
    return { freeText: value };
  }
  return { freeText: spec.value };
}

async function removeExistingUser(prisma) {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!existing) return;
  await prisma.user.delete({ where: { id: existing.id } });
}

async function register(prisma) {
  await removeExistingUser(prisma);
  try {
    const res = await api(null, 'POST', '/auth/register', { email: EMAIL, password: PASSWORD });
    return res.accessToken;
  } catch (err) {
    throw new Error(`Registro falló: ${err instanceof Error ? err.message : err}`);
  }
}

async function walk(token) {
  let state = await api(token, 'POST', '/diagnostic/start', {});
  if (state.sessionState?.showWelcomeScreen || !state.nextStep) {
    await api(token, 'POST', '/diagnostic/welcome-seen', {});
    state = await api(token, 'GET', '/diagnostic/state');
  }
  let seen = '';
  let repeats = 0;
  let answered = 0;
  for (let step = 0; step < 500; step += 1) {
    const next = state.nextStep;
    if (next?.type === 'diagnostic_complete') {
      throw new Error('El cuestionario terminó antes de llegar a R9. Revisa el catálogo activo.');
    }
    if (next?.type === 'module_outro') {
      await api(token, 'POST', `/diagnostic/outro-seen/${next.data?.moduleSlug}`, {});
      state = await api(token, 'GET', '/diagnostic/state');
      continue;
    }
    if (next?.type !== 'question' || !next.data) {
      throw new Error(`Paso inesperado: ${JSON.stringify(next)?.slice(0, 300)}`);
    }
    if (next.data.sourceRef === STOP_SOURCE) {
      return { answered, question: next.data, state };
    }
    if (next.data.id === seen) repeats += 1;
    else {
      seen = next.data.id;
      repeats = 0;
    }
    if (repeats > 2) throw new Error(`Sin progreso en ${next.data.sourceRef}`);
    await sleep(RESPONSE_PACE_MS);
    state = await api(token, 'POST', '/diagnostic/response', {
      questionId: next.data.id,
      expectedRevision: next.data.answerRevision ?? 0,
      ...payloadFor(next.data),
    });
    answered += 1;
  }
  throw new Error('Demasiados pasos sin llegar a R9');
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const token = await register(prisma);
    const result = await walk(token);
    const q = result.question;
    console.log(JSON.stringify({
      ok: true,
      email: EMAIL,
      password: PASSWORD,
      answeredBeforeStop: result.answered,
      stopSourceRef: q.sourceRef,
      stopQuestionId: q.id,
      stopModule: q.moduleSlug ?? stateModule(result.state),
      stopText: q.textEs,
      loginUrl: 'http://localhost:3000/login',
      diagnosticoUrl: 'http://localhost:3000/diagnostico',
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

function stateModule(state) {
  return state?.sessionState?.currentModuleSlug ?? state?.nextStep?.data?.moduleSlug ?? null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
