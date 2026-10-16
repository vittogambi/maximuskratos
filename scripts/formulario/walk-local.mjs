const API = 'http://127.0.0.1:4000/api/v1';
const email = `formulario.local.${Date.now()}@fixtures.mk.invalid`;
const password = 'LocalWalk123';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function call(path, token, options = {}) {
  let last;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (response.status === 429) {
      last = body;
      await pause(15000);
      continue;
    }
    if (!response.ok) {
      const error = new Error(`${response.status} ${path} ${typeof body === 'string' ? body : JSON.stringify(body)}`);
      error.status = response.status;
      throw error;
    }
    await pause(800);
    return body;
  }
  throw new Error(`429 ${path} ${JSON.stringify(last)}`);
}

function answerBody(question) {
  if (question.type === 'FREE_TEXT' || !question.options?.length) {
    return { questionId: question.id, freeText: 'Respuesta local de prueba.' };
  }
  return { questionId: question.id, selectedOptionIds: [question.options[0].id] };
}

const registered = await call('/auth/register', null, {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const token = registered.accessToken;
if (!token) throw new Error(`register sin accessToken: ${JSON.stringify(registered)}`);

await call('/diagnostic/start', token, { method: 'POST', body: '{}' });
await call('/diagnostic/welcome-seen', token, { method: 'POST', body: '{}' });

let payload = await call('/diagnostic/state', token);
let answered = 0;
let outros = 0;
for (let step = 0; step < 320; step += 1) {
  if (payload.sessionState?.showWelcomeScreen) {
    await call('/diagnostic/welcome-seen', token, { method: 'POST', body: '{}' });
    payload = await call('/diagnostic/state', token);
    continue;
  }
  const next = payload.nextStep;
  if (next?.type === 'diagnostic_complete') break;
  if (next?.type === 'question') {
    payload = await call('/diagnostic/response', token, {
      method: 'POST',
      body: JSON.stringify(answerBody(next.data)),
    });
    answered += 1;
    if (answered % 25 === 0) console.error(`respondidas ${answered}`);
    continue;
  }
  if (next?.type === 'module_outro') {
    await call(`/diagnostic/outro-seen/${next.data.moduleSlug}`, token, { method: 'POST', body: '{}' });
    outros += 1;
    console.error(`cierre ${outros} ${next.data.moduleSlug}`);
    payload = await call('/diagnostic/state', token);
    continue;
  }
  throw new Error(`paso inesperado: ${JSON.stringify(next)}`);
}

if (payload.nextStep?.type !== 'diagnostic_complete') {
  throw new Error(`no terminó: ${JSON.stringify(payload.nextStep)}`);
}

const profile = await call('/diagnostic/profile', token);
await call('/journey/purpose', token, {
  method: 'POST',
  body: JSON.stringify({
    content: {
      name: 'Cuenta local',
      directionStatus: 'EXPLORANDO',
      statement: 'Quiero probar una ayuda breve, sin cerrar un proposito.',
    },
  }),
});
const alignment = await call('/journey/alignment', token, {
  method: 'POST',
  body: JSON.stringify({
    answers: {
      E1: { value: 4, unknown: false }, E2: { value: 4, unknown: false }, E3: { value: 4, unknown: false },
      M1: { value: 3, unknown: false }, M2: { value: 3, unknown: false }, M3: { value: 3, unknown: false },
      C1: { value: 2, unknown: false }, C2: { value: 2, unknown: false }, C3: { value: 2, unknown: false },
    },
  }),
});
await call('/journey/purpose/confirm', token, { method: 'POST', body: '{}' });
const plan = await call('/journey/plans', token, {
  method: 'POST',
  body: JSON.stringify({
    title: 'Borrador local',
    outcome: 'Existe un texto revisable.',
    priorityNote: 'EXPLORATORY: Ayudo a una persona a lograr un borrador. Queda fuera el diseño.',
  }),
});
const action = await call(`/journey/plans/${plan.id}/actions`, token, {
  method: 'POST',
  body: JSON.stringify({ title: 'Escribir el borrador', doneWhen: 'Hay un parrafo' }),
});
const calendar = await call('/journey/calendar', token);
await call('/journey/records', token, {
  method: 'POST',
  body: JSON.stringify({ actionId: action.id, day: calendar.weekStart, status: 'DONE', note: 'Hecho en local' }),
});
await call('/journey/weeks/close', token, {
  method: 'POST',
  body: JSON.stringify({
    weekStart: calendar.weekStart,
    decisions: { [action.id]: 'MODIFY' },
    revisions: { [action.id]: { doneWhen: 'Hay un parrafo sin diseno' } },
  }),
});

const again = await call('/auth/login', null, {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const plans = await call('/journey/plans', again.accessToken);
const contract = await call('/journey/purpose/contract', again.accessToken);
const profileAgain = await call('/diagnostic/profile', again.accessToken);
const updated = plans.flatMap((item) => item.actions).find((item) => item.id === action.id);

console.log(JSON.stringify({
  email,
  answered,
  outros,
  finished: payload.nextStep.type,
  archetype: payload.nextStep.data?.archetypePrimary ?? null,
  indices: profileAgain?.indices ?? profile?.indices ?? null,
  directionStatus: contract.directionStatus,
  iadTotal: alignment?.results?.total ?? alignment?.total ?? null,
  help: plans[0]?.priorityNote ?? null,
  after: updated?.doneWhen ?? null,
}, null, 2));
