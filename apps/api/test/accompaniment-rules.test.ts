import { describe, expect, it } from 'vitest';
import { scoreDepth } from '../src/instrumentos/depth';
import { applyOperationalClarification, healthFactFromAnswers } from '../src/journey/plan-gate';
import { draftAccompanimentHelp } from '../src/journey/accompaniment/help';
import { assessObservation, depthContrast, nextHypothesis } from '../src/journey/accompaniment/experiments';
import { NOT_CONNECTED, READ_BY_ACCOMPANIMENT } from '../src/journey/accompaniment/sources';
import { proposeAccompaniment, type AccompanimentInput } from '../src/journey/accompaniment/rules';
import { FAMILIES } from '../src/journey/accompaniment/families';
import { planningCandidate, SOURCE_INVENTORY } from '../src/journey/accompaniment/sources';
import { fitLoad } from '../src/journey/accompaniment/load';
import { occasionTally } from '../src/journey/execution';

const plain = (over: Record<string, string> = {}) => (ref: string) => ({ R18: 'No', R20: 'No', R22: 'No', R24: 'No', R27: 'No', ...over })[ref] ?? null;

function base(over: Partial<AccompanimentInput> = {}): AccompanimentInput {
  return {
    goalText: 'Preparar una explicación útil de una tarea del oficio.',
    goalKind: 'ENSENAR_O_CONTRIBUIR',
    interest: null,
    territory: 'MENTALIDAD',
    situation: null,
    occasions: 1,
    weeklyMinutes: 45,
    minutesPerOccasion: 45,
    reviewMinutes: 0,
    rawSignals: { 'formulario-v1:E-AUD-001!R62': 5, 'formulario-v1:E-AUD-001!R26': 5 },
    general: 67.284,
    ...over,
  };
}

describe('acompañamiento', () => {
  it('S06 propone expansión por la meta, no por el índice', () => {
    const high = proposeAccompaniment(base());
    const low = proposeAccompaniment(base({ general: 10 }));
    expect(high.familyId).toBe('MEN-EXP');
    expect(high.mode).toBe('EXPANSION');
    expect(high.modeStatus).toBe('PROVISIONAL');
    expect(high.familyId).toBe(low.familyId);
    expect(high.indexUsed).toBe(false);
    expect(JSON.stringify(high.reasons)).not.toContain('67.284');
    const help = draftAccompanimentHelp(high, base());
    expect(help.action).toMatch(/secuencia/);
    expect(help.forbids.join(' ')).toMatch(/utilidad/);
    expect(help.actionCount ?? help.links.length).toBeLessThan(2);
    expect(high.actionCount).toBe(1);
  });

  it('otra meta de enseñanza usa la misma familia', () => {
    const other = proposeAccompaniment(base({ goalText: 'Mostrar cómo se afila una herramienta a quien está aprendiendo.' }));
    expect(other.familyId).toBe('MEN-EXP');
  });

  it('R26 bajo es un candidato de preparación y no acredita SIN_OCASION', () => {
    const source = SOURCE_INVENTORY.find((row) => row.id === 'R26');
    expect(source?.forbids).toMatch(/ocasión/);
    expect(planningCandidate(1)?.kind).toBe('PLANIFICACION_POR_ACLARAR');
    const proposal = proposeAccompaniment(base({
      goalKind: 'ENTREGAR',
      goalText: 'Preparar una propuesta breve.',
      rawSignals: { 'formulario-v1:E-AUD-001!R26': 1 },
    }));
    expect(proposal.barrierCandidate?.kind).toBe('PLANIFICACION_POR_ACLARAR');
    expect(proposal.barrierRecognized).toBeNull();
    expect(proposal.familyId).toBe('MEN-EST');
    const help = draftAccompanimentHelp(proposal, base({ goalKind: 'ENTREGAR', goalText: 'Preparar una propuesta breve.' }));
    expect(help.action).not.toMatch(/dispersa/);
  });

  it('confirmar no es reconocer la barrera; reconocerla cambia la ayuda', () => {
    const shared = { goalKind: 'ENTREGAR' as const, goalText: 'Tener un borrador legible.', rawSignals: { 'formulario-v1:E-AUD-001!R26': 1 }, general: 49.8457 };
    const plain = proposeAccompaniment(base(shared));
    const recognized = proposeAccompaniment(base({
      ...shared,
      barrier: { kind: 'PULIR_ANTES_DE_MOSTRAR', choice: 'RECOGNIZE', detail: 'Rehacer el formato desplaza la escritura.' },
    }));
    const rejected = proposeAccompaniment(base({
      ...shared,
      barrier: { kind: 'PULIR_ANTES_DE_MOSTRAR', choice: 'REJECT' },
    }));
    expect(plain.barrierRecognized).toBeNull();
    expect(draftAccompanimentHelp(recognized, base(shared)).action).toMatch(/legible/);
    expect(draftAccompanimentHelp(plain, base(shared)).action).not.toMatch(/diseño final/);
    expect(rejected.familyId).toBe('MEN-EST');
    expect(rejected.mode).not.toBeNull();
  });

  it('la misma meta con otra carga cambia la ocasión', () => {
    const short = draftAccompanimentHelp(proposeAccompaniment(base({ weeklyMinutes: 15, minutesPerOccasion: 15, reviewMinutes: 0 })), base({ weeklyMinutes: 15, minutesPerOccasion: 15, reviewMinutes: 0 }));
    const long = draftAccompanimentHelp(proposeAccompaniment(base()), base());
    expect(short.occasion?.minutesPerOccasion).toBe(15);
    expect(long.occasion?.minutesPerOccasion).toBe(45);
  });

  it('metas distintas con el mismo índice no comparten familia', () => {
    const teach = proposeAccompaniment(base());
    const money = proposeAccompaniment(base({ goalKind: 'ORDENAR', territory: 'FINANZAS', goalText: 'Tener una lista de obligaciones.' }));
    expect(teach.familyId).not.toBe(money.familyId);
    expect(money.familyId).toBe('FIN-EST');
    expect(money.mode).not.toBe('CONTENCION');
  });

  it('capacidad cero pausa sin acción y la ausencia solo invita', () => {
    const pause = proposeAccompaniment(base({ occasions: 0, weeklyMinutes: 0 }));
    expect(pause.situation).toBe('PAUSE');
    expect(pause.requiresAction).toBe(false);
    expect(pause.familyId).toBe('X-PAUSE');
    const away = proposeAccompaniment(base({ daysSinceLastRecord: 20, hadPlannedOccasions: true }));
    expect(away.contextReviewInvitation).toBe(true);
    expect(away.familyId).toBe('MEN-EXP');
    expect(away.situation).not.toBe('PAUSE');
  });

  it('una revisión de cero minutos cabe en ocho minutos', () => {
    const fit = fitLoad({ weeklyMinutes: 8, occasions: 1, minutesPerOccasion: 8, maintenanceMinutes: 0, reviewMinutes: 0 });
    expect(fit.fits).toBe(true);
    expect(fit.totalMinutes).toBe(8);
    const estimated = fitLoad({ weeklyMinutes: 8, occasions: 1, minutesPerOccasion: 8, maintenanceMinutes: 0, reviewMinutes: null });
    expect(estimated.adaptedReview).toBe(true);
    expect(estimated.fits).toBe(true);
    expect(estimated.reviewMinutes).toBe(0);
  });

  it('el retorno no impone contención y conserva la meta de enseñanza', () => {
    const back = proposeAccompaniment(base({ situation: 'RETURN', weeklyMinutes: 30, minutesPerOccasion: 30, reviewMinutes: 0 }));
    expect(back.situation).toBe('RETURN');
    expect(back.mode).not.toBe('CONTENCION');
    expect(back.familyId).toBe('MEN-EXP');
    const help = draftAccompanimentHelp(back, base({ situation: 'RETURN' }));
    expect(help.futureEffect).toMatch(/futuro/);
    const unclear = proposeAccompaniment(base({ situation: 'RETURN', goalKind: null, goalText: null, interest: 'RETOMAR' }));
    expect(unclear.familyId).toBe('X-RETURN');
    expect(unclear.missing.some((row) => row.key === 'goal')).toBe(true);
  });

  it('un núcleo parcial no bloquea la ficha de experimento', () => {
    const proposal = proposeAccompaniment(base({
      goalKind: 'EXPLORAR_IKIGAI',
      goalText: 'Aprender qué parte de enseñar escritura le interesa.',
      general: null,
      occasions: 1,
      weeklyMinutes: 45,
      reviewMinutes: 0,
    }));
    expect(proposal.familyId).toBe('X-IKIGAI');
    expect(proposal.requiresAction).toBe(true);
    const help = draftAccompanimentHelp(proposal, base({ goalKind: 'EXPLORAR_IKIGAI' }));
    expect(help.artifact?.kind).toBe('FICHA_EXPERIMENTO');
    expect(help.artifact?.fields.filter((field) => field.pending).length).toBeGreaterThan(1);
  });

  it('una alerta ordinaria no es urgencia y una lesión antigua no es contención', () => {
    const alert = proposeAccompaniment(base({ ordinaryAlert: true, goalKind: 'ENTREGAR', goalText: 'Un entregable.' }));
    expect(alert.urgency).toBeNull();
    expect(alert.mode).not.toBe('CONTENCION');
    const old = proposeAccompaniment(base({
      goalKind: 'CUIDAR',
      territory: 'SALUD_FISICA',
      goalText: 'Organizar el cuidado ya elegido.',
      oldInjuryOnly: true,
    }));
    expect(old.mode).not.toBe('CONTENCION');
    const current = proposeAccompaniment(base({
      goalKind: 'CUIDAR',
      territory: 'SALUD_FISICA',
      goalText: 'Pedir la hora de control.',
      limits: [{ subjectRef: 'salud', outcome: 'CURRENT_LIMIT' }],
      actionSubject: 'salud',
    }));
    expect(current.mode).toBe('CONTENCION');
    expect(current.familyId).toBe('SAL-CONT');
  });

  it('un límite de un asunto no clasifica la cuenta y no autoriza fuera de la indicación', () => {
    const finance = proposeAccompaniment(base({
      goalKind: 'ORDENAR',
      territory: 'FINANZAS',
      goalText: 'Listar obligaciones.',
      limits: [{ subjectRef: 'rodilla', outcome: 'CURRENT_LIMIT' }],
      actionSubject: 'finanzas',
    }));
    expect(finance.incompatible).toBeNull();
    expect(finance.familyId).toBe('FIN-EST');
    const physical = proposeAccompaniment(base({
      goalKind: 'CUIDAR',
      territory: 'SALUD_FISICA',
      goalText: 'Aumentar la carga de entrenamiento.',
      general: 90,
      limits: [{ subjectRef: 'rodilla', outcome: 'CURRENT_LIMIT' }],
      actionSubject: 'rodilla',
      requestedTags: ['PHYSICAL_EXERTION'],
    }));
    expect(physical.incompatible).not.toBeNull();
    expect(physical.indexUsed).toBe(false);
    const covered = proposeAccompaniment(base({
      goalKind: 'CONSTRUIR_O_PROBAR',
      territory: 'SALUD_FISICA',
      goalText: 'Caminar según lo indicado.',
      indication: { activity: 'caminar', subjectRef: 'rodilla', scope: 'caminar suave', restrictions: 'sin pendiente', allows: ['PHYSICAL_EXERTION'] },
      health: healthFactFromAnswers(plain()),
    }));
    expect(covered.familyId).toBe('SAL-EXP');
    expect(covered.incompatible).toBeNull();
    const bare = proposeAccompaniment(base({
      goalKind: 'CONSTRUIR_O_PROBAR',
      territory: 'SALUD_FISICA',
      goalText: 'Correr más.',
      health: healthFactFromAnswers(plain()),
    }));
    expect(bare.incompatible).not.toBeNull();
    expect(bare.alternative?.requiresApproval).toBe(true);
    const diet = proposeAccompaniment(base({
      goalKind: 'CONSTRUIR_O_PROBAR',
      territory: 'SALUD_FISICA',
      goalText: 'Cambiar la comida.',
      requestedTags: ['DIET'],
      indication: { activity: 'caminar', subjectRef: 'rodilla', scope: 'caminar', restrictions: 'sin pendiente', allows: ['PHYSICAL_EXERTION'] },
      health: healthFactFromAnswers(plain()),
    }));
    expect(diet.incompatible).not.toBeNull();
  });

  it('una urgencia explícita no se responde con la tarea semanal', () => {
    const urgent = proposeAccompaniment(base({ urgency: true, country: null }));
    expect(urgent.requiresAction).toBe(false);
    expect(urgent.urgency?.resources).toEqual([]);
    const chile = proposeAccompaniment(base({ urgency: true, country: 'CL' }));
    expect(chile.urgency?.resources[0]?.contact).toBe('131');
    const help = draftAccompanimentHelp(urgent, base({ urgency: true }));
    expect(help.action).toBeNull();
    expect(help.futureEffect).toMatch(/semana/);
  });

  it('cada familia tiene un paso usable o una alternativa concreta', () => {
    for (const family of FAMILIES) {
      expect(family.action.trim().length).toBeGreaterThan(10);
      expect(family.doneWhen.trim().length).toBeGreaterThan(5);
      expect(family.minimumVersion.trim().length).toBeGreaterThan(5);
      expect(family.alternativeText.trim().length).toBeGreaterThan(5);
      expect(family.learningQuestion.trim().length).toBeGreaterThan(5);
      expect(family.action.includes('[')).toBe(false);
    }
  });

  it('la reconfirmación no se llama mejora', () => {
    const proposal = proposeAccompaniment(base({ ineligibleCapture: true, goalKind: 'ENTREGAR' }));
    expect(proposal.familyId).toBe('X-RECONFIRM');
    expect(draftAccompanimentHelp(proposal, base()).doneWhen).toMatch(/no se llama mejora|No se llama mejora/);
  });

  it('MK-V preparación: R26 bajo es candidato y R26 alto no, con la misma meta', () => {
    const low = proposeAccompaniment(base({ goalKind: 'ENTREGAR', goalText: 'Preparar una propuesta.', rawSignals: { 'formulario-v1:E-AUD-001!R26': 1 } }));
    const high = proposeAccompaniment(base({ goalKind: 'ENTREGAR', goalText: 'Preparar una propuesta.', rawSignals: { 'formulario-v1:E-AUD-001!R26': 5 } }));
    expect(low.familyId).toBe(high.familyId);
    expect(low.barrierCandidate?.kind).toBe('PLANIFICACION_POR_ACLARAR');
    expect(low.barrierRecognized).toBeNull();
    expect(high.barrierCandidate).toBeNull();
    expect(low.missing.some((row) => row.key === 'barrier')).toBe(true);
    expect(high.missing.some((row) => row.key === 'barrier')).toBe(false);
  });

  it('un valor elegido cambia la razón y no la familia; una señal ajena no', () => {
    const plainGoal = proposeAccompaniment(base({ goalKind: 'ENTREGAR', goalText: 'Preparar una propuesta.', valueRef: null }));
    const withValue = proposeAccompaniment(base({ goalKind: 'ENTREGAR', goalText: 'Preparar una propuesta.', valueRef: 'Claridad' }));
    expect(withValue.familyId).toBe(plainGoal.familyId);
    expect(withValue.reasons.some((row) => row.refs.includes('VALOR'))).toBe(true);
    const extra = proposeAccompaniment(base({
      goalKind: 'ENTREGAR',
      goalText: 'Preparar una propuesta.',
      rawSignals: { 'formulario-v1:E-AUD-001!R26': 5, 'formulario-v1:F-RAD-003!R48': 1 },
    }));
    expect(extra.familyId).toBe(plainGoal.familyId);
    expect(JSON.stringify(extra.reasons)).not.toMatch(/origen|linaje|R48/);
  });

  it('MK-V10 el general 100 no abre un beneficio ni cambia la familia', () => {
    const normal = proposeAccompaniment(base({ goalKind: 'ENTREGAR', goalText: 'Preparar una propuesta.', general: 54.4753 }));
    const maxed = proposeAccompaniment(base({ goalKind: 'ENTREGAR', goalText: 'Preparar una propuesta.', general: 100 }));
    expect(maxed.familyId).toBe(normal.familyId);
    expect(maxed.indexUsed).toBe(false);
    expect(JSON.stringify(maxed.reasons)).not.toContain('100');
  });

  it('al retomar usa la meta guardada si no envían otro tipo', () => {
    const back = proposeAccompaniment(base({
      situation: 'RETURN',
      goalKind: null,
      goalText: null,
      interest: 'RETOMAR',
      goalSource: 'RECOVERED',
      recoveredGoal: { text: 'Preparar una explicación de una tarea.', kind: 'ENSENAR_O_CONTRIBUIR', territory: 'MENTALIDAD' },
      weeklyMinutes: 30,
      minutesPerOccasion: 30,
      reviewMinutes: 0,
    }));
    expect(back.situation).toBe('RETURN');
    expect(back.familyId).toBe('MEN-EXP');
    expect(back.mode).toBe('EXPANSION');
    expect(back.reasons.some((row) => row.refs.includes('PLAN_GOAL'))).toBe(true);
    expect(back.missing.some((row) => row.key === 'goal')).toBe(false);
  });
});

describe('límites por asunto', () => {
  it('NO_CURRENT_LIMIT no borra dolor ni otro límite', () => {
    const health = healthFactFromAnswers(plain({ R20: 'Lesión antigua', R24: 'Sí, duele', R27: 'Respuesta local de prueba.' }));
    const cleared = applyOperationalClarification(health, { healthLimit: 'NO_CURRENT_LIMIT', conversation: null, subjectRef: 'rodilla' });
    expect(cleared.pain).toBe(health.pain);
    expect(cleared.illness).toBe(health.illness);
    expect(cleared.medication).toBe(health.medication);
    expect(cleared.injuryLimitsNow).toBe(false);
    expect(cleared.medicalLimit).toBe(health.medicalLimit);
  });
});

describe('experimentos', () => {
  it('sin respuesta no prueba demanda y una respuesta vacía no prueba utilidad', () => {
    const silent = assessObservation({ aspect: 'USEFULNESS', status: 'FAVORABLE', recipient: 'NO_RESPONSE', observed: 'pidió un ejemplo' });
    expect(silent.allowed).toBe(false);
    expect(silent.provesDemand).toBe(false);
    expect(silent.provesUsefulness).toBe(false);
    const empty = assessObservation({ aspect: 'USEFULNESS', status: 'FAVORABLE', recipient: 'RESPONDED', observed: '   ' });
    expect(empty.provesUsefulness).toBe(false);
    const useful = assessObservation({ aspect: 'USEFULNESS', status: 'FAVORABLE', recipient: 'RESPONDED', observed: 'Pudo repetir el paso.' });
    expect(useful.provesUsefulness).toBe(true);
    expect(useful.provesDemand).toBe(false);
  });

  it('cambiar la hipótesis conserva las observaciones anteriores', () => {
    const next = nextHypothesis({ id: 'e1', hypothesis: 'Enseñar sirve', observations: [{ revisionId: 'r1', aspect: 'INTEREST' }] }, 'Prefiere una guía');
    expect(next.observations).toEqual([{ revisionId: 'r1', aspect: 'INTEREST' }]);
    expect(next.revisionId).not.toBe('r1');
  });

  it('MK-profundidad: vacío, corchetes, plantilla y captura ausente no suben el nivel', () => {
    expect(depthContrast({})).toBeNull();
    expect(depthContrast({
      meaning: 'Enseñar es [la contribución].',
      matters: 'Importa.',
      change: 'Preparo una secuencia.',
      link: 'La hipótesis.',
      evidence: 'Repitió el paso.',
      decision: 'KEEP',
    })).toBeNull();
    expect(depthContrast({
      meaning: 'Valor: ejemplo. Esta semana escribo la conducta. Excepción: ninguna.',
      matters: 'Importa.',
      change: 'Preparo una secuencia.',
      link: 'La hipótesis.',
      evidence: 'Repitió el paso.',
      decision: 'KEEP',
    })).toBeNull();
    const full = depthContrast({
      meaning: 'Enseñar es la contribución.',
      matters: 'Quiero que el oficio se entienda.',
      change: 'Preparo una secuencia.',
      link: 'La hipótesis de la combinación.',
      evidence: 'La persona repitió el paso.',
      decision: 'KEEP',
    });
    const absent = scoreDepth([{
      component: 'ikigai', record: 'ABSENT', recognized: full!.recognized, integrated: full!.integrated, linkCurrent: true, contrasted: full!.contrasted,
    }]);
    const valid = scoreDepth([{
      component: 'ikigai', record: 'VALID', recognized: full!.recognized, integrated: full!.integrated, linkCurrent: true, contrasted: full!.contrasted,
    }]);
    const repeated = scoreDepth([{
      component: 'ikigai', record: 'VALID', recognized: full!.recognized, integrated: full!.integrated, linkCurrent: true, contrasted: full!.contrasted,
    }]);
    const stale = scoreDepth([{
      component: 'ikigai', record: 'VALID', recognized: full!.recognized, integrated: full!.integrated, linkCurrent: false, contrasted: full!.contrasted,
    }]);
    const notYet = scoreDepth([{
      component: 'ikigai', record: 'VALID', recognized: full!.recognized, integrated: full!.integrated, linkCurrent: true, contrasted: null,
    }]);
    expect(absent.components.find((row) => row.component === 'ikigai')?.level).toBe(0);
    expect(valid.components.find((row) => row.component === 'ikigai')?.level).toBe(4);
    expect(repeated.components.find((row) => row.component === 'ikigai')?.level).toBe(4);
    expect(stale.components.find((row) => row.component === 'ikigai')?.level).toBeLessThan(4);
    expect(notYet.components.find((row) => row.component === 'ikigai')?.level).toBe(3);
    expect(NOT_CONNECTED).toContain('R62');
    expect(READ_BY_ACCOMPANIMENT.map((row) => row.id)).toContain('R26');
  });

  it('el contraste aporta a profundidad solo si cumple el método y no toca la forma del índice', () => {
    const missing = depthContrast({ evidence: 'Se entendió el paso.', decision: 'KEEP' });
    expect(missing).toBeNull();
    const full = depthContrast({
      meaning: 'Enseñar es la contribución.',
      matters: 'Quiero que el oficio se entienda.',
      change: 'Preparo una secuencia.',
      link: 'La hipótesis de la combinación.',
      evidence: 'La persona repitió el paso.',
      decision: 'KEEP',
    });
    expect(full?.contrasted.decision).toBe('KEEP');
    const before = scoreDepth([]);
    const after = scoreDepth([{
      component: 'ikigai',
      record: 'VALID',
      recognized: full!.recognized,
      integrated: full!.integrated,
      linkCurrent: true,
      contrasted: full!.contrasted,
    }]);
    expect(after.components.find((row) => row.component === 'ikigai')?.level).toBe(4);
    expect(before.components.find((row) => row.component === 'ikigai')?.level).toBe(0);
  });
});

describe('ocasiones', () => {
  it('sin ocasiones válidas el porcentaje es nulo y no aplica no es cancelación', () => {
    const empty = occasionTally(
      [{ id: 'a', weekday: null, occasionsPerWeek: null, active: true }],
      [],
      [],
      '2026-10-12',
      '2026-10-18',
      () => [],
    );
    expect(empty.percent).toBeNull();
    expect(empty.valid).toBe(0);
    const legacy = occasionTally(
      [{ id: 'a', weekday: 1, occasionsPerWeek: null, active: true }],
      [{ actionId: 'a', day: '2026-10-12', status: 'NOT_APPLICABLE' }],
      [],
      '2026-10-12',
      '2026-10-18',
      () => ['2026-10-12'],
    );
    expect(legacy.legacyNotApplicable).toBe(1);
    expect(legacy.cancelled).toBe(0);
    const cancelled = occasionTally(
      [{ id: 'a', weekday: 1, occasionsPerWeek: null, active: true }],
      [{ actionId: 'a', day: '2026-10-12', status: 'DONE' }],
      [{ actionId: 'a', day: '2026-10-19' }],
      '2026-10-12',
      '2026-10-18',
      () => ['2026-10-12'],
    );
    expect(cancelled.done).toBe(1);
    expect(cancelled.cancelled).toBe(0);
    expect(cancelled.originalPlanned).toBe(1);
  });

  it('un día sin registro no es una omisión', () => {
    const tally = occasionTally(
      [{ id: 'a', weekday: 1, occasionsPerWeek: null, active: true }],
      [],
      [],
      '2026-10-12',
      '2026-10-18',
      () => ['2026-10-12'],
    );
    expect(tally.omitted).toBe(0);
    expect(tally.noInformation).toBe(1);
    expect(tally.percent).toBeNull();
  });
});
