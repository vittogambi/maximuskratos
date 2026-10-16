import type { Pillar, Territory } from '../../instrumentos/glossary';
import type { ContentTag, HealthFact } from '../../instrumentos/restrictions';
import { decideAction } from '../../instrumentos/restrictions';
import { applyOperationalClarification, type ConversationOutcome, type HealthLimitOutcome } from '../plan-gate';
import { familyById, familyIdFor, type FamilyDef } from './families';
import { fitLoad, type LoadFit } from './load';
import { standardCriterion } from './devolution';
import { planningCandidate } from './sources';
import {
  CATALOG_VERSION,
  CONTEXT_REVIEW_DAYS,
  ENGINE_VERSION,
  RULES_VERSION,
  declarationToGoal,
  isGoalKind,
  pillarFor,
  type BarrierChoice,
  type BarrierKind,
  type GoalKind,
  type Mode,
  type ModeStatus,
  type Situation,
} from './vocab';

export type SubjectLimit = {
  subjectRef: string | null;
  outcome: HealthLimitOutcome;
};

export type Indication = {
  activity: string;
  subjectRef: string;
  scope: string;
  restrictions: string;
  allows: ContentTag[];
};

export type AccompanimentInput = {
  goalText: string | null;
  goalKind: GoalKind | null;
  /** A declared label. It does not override an explicit goalKind. Return and pause stay situations. */
  interest: string | null;
  territory: Territory | null;
  situation: Situation | null;
  occasions: number | null;
  weeklyMinutes: number | null;
  minutesPerOccasion: number | null;
  maintenanceMinutes?: number;
  reviewMinutes?: number | null;
  barrier?: { kind: BarrierKind; choice: BarrierChoice; detail?: string | null } | null;
  /** Accepting a plan does not set this. Only an explicit choice does. */
  rawSignals?: Partial<Record<string, number | null>>;
  limits?: SubjectLimit[];
  health?: HealthFact;
  conversation?: ConversationOutcome | null;
  actionSubject?: string | null;
  requestedTags?: ContentTag[];
  declaredProtection?: boolean;
  oldInjuryOnly?: boolean;
  ordinaryAlert?: boolean;
  favorableDistinctOccasions?: number;
  sustainChosen?: boolean;
  loadTolerable?: boolean | null;
  ineligibleCapture?: boolean;
  daysSinceLastRecord?: number | null;
  hadPlannedOccasions?: boolean;
  indication?: Indication | null;
  urgency?: boolean;
  country?: string | null;
  valueRef?: string | null;
  /** Latest accepted goal of this account. Used only when the person is returning and did not send a new kind. */
  recoveredGoal?: { text: string; kind: GoalKind; territory: Territory | null } | null;
  goalSource?: 'REQUEST' | 'RECOVERED';
  helpPreference?: 'GUIADA' | 'PUNTUAL' | 'PROPIO' | null;
  helpRequested?: boolean;
  weeklyStandard?: string | null;
  standardChoice?: 'FULL' | 'PARTIAL' | null;
  postpone?: 'SI' | 'PARCIAL' | 'NO' | 'UNKNOWN' | null;
  /** Present so a test can prove it is not a gate. */
  general?: number | null;
  weekday?: number | null;
  flexible?: boolean;
};

export type Reason = { text: string; refs: string[] };
export type Missing = { key: string; question: string };

export type UrgencyGuide = {
  immediate: true;
  text: string;
  resources: { country: string; name: string; contact: string; source: string }[];
};

export type AccompanimentProposal = {
  engineVersion: typeof ENGINE_VERSION;
  rulesVersion: typeof RULES_VERSION;
  catalogVersion: typeof CATALOG_VERSION;
  familyId: string | null;
  templateVersion: string | null;
  mode: Mode | null;
  modeStatus: ModeStatus;
  situation: Situation;
  territory: Territory | null;
  pillar: Pillar | null;
  links: { pillar: Pillar; territory: Territory; note: string }[];
  reasons: Reason[];
  missing: Missing[];
  requiresAction: boolean;
  actionCount: 0 | 1;
  incompatible: { familyId: string; reason: string } | null;
  alternative: { familyId: string; text: string; requiresApproval: true } | null;
  contextReviewInvitation: boolean;
  criterionNote: string | null;
  suggestion: 'ON' | 'OFF';
  barrierCandidate: { kind: 'PLANIFICACION_POR_ACLARAR'; sourceRef: string } | null;
  barrierRecognized: BarrierKind | null;
  urgency: UrgencyGuide | null;
  load: LoadFit;
  indexUsed: false;
};

const EMPTY_HEALTH: HealthFact = {
  illness: 'UNKNOWN',
  injuryHistory: 'UNKNOWN',
  injuryLimitsNow: null,
  medication: 'UNKNOWN',
  pain: 'UNKNOWN',
  medicalLimit: 'UNKNOWN',
  conversationUnsafe: null,
};

const EXPANSION_KINDS = new Set<GoalKind>(['ENSENAR_O_CONTRIBUIR', 'CONSTRUIR_O_PROBAR', 'EXPLORAR_IKIGAI']);

/** Official public numbers only. Timezone is not a country. */
const OFFICIAL_RESOURCES: UrgencyGuide['resources'] = [
  {
    country: 'CL',
    name: 'SAMU',
    contact: '131',
    source: 'https://www.minsal.cl',
  },
];

export function contextReviewInvitation(input: { daysSinceLastRecord?: number | null; hadPlannedOccasions?: boolean }): boolean {
  return Boolean(input.hadPlannedOccasions) && input.daysSinceLastRecord != null && input.daysSinceLastRecord >= CONTEXT_REVIEW_DAYS;
}

export function limitsForAction(health: HealthFact, limits: SubjectLimit[], actionSubject: string | null, conversation: ConversationOutcome | null): HealthFact {
  let next = health;
  for (const limit of limits) {
    if (limit.subjectRef != null && limit.subjectRef !== actionSubject) continue;
    next = applyOperationalClarification(next, { healthLimit: limit.outcome, conversation, subjectRef: limit.subjectRef });
  }
  if (!limits.length && conversation) {
    next = applyOperationalClarification(next, { healthLimit: null, conversation, subjectRef: actionSubject });
  }
  return next;
}

function urgencyGuide(country: string | null | undefined): UrgencyGuide {
  const code = (country ?? '').trim().toUpperCase();
  return {
    immediate: true,
    text: 'Si esto es urgente, contacta el servicio de emergencias de tu país o a alguien que pueda acompañarte ahora. MK no diagnostica ni sustituye esa atención. Una tarea de la semana no alcanza como respuesta.',
    resources: OFFICIAL_RESOURCES.filter((row) => row.country === code),
  };
}

function selectMode(input: {
  goalKind: GoalKind | null;
  declaredProtection: boolean;
  currentLimitOnSubject: boolean;
  favorableDistinctOccasions: number;
  sustainChosen: boolean;
  loadTolerable: boolean | null;
  hasCapacity: boolean;
  incompatible: boolean;
}): { mode: Mode | null; status: ModeStatus; because: string } {
  if (input.declaredProtection || (input.currentLimitOnSubject && input.goalKind === 'CUIDAR')) {
    return { mode: 'CONTENCION', status: 'PROPOSED', because: 'Hay una necesidad actual declarada de proteger este asunto o de evitar una acción incompatible.' };
  }
  if (input.sustainChosen && input.loadTolerable === true && input.favorableDistinctOccasions >= 2 && !input.incompatible) {
    return { mode: 'CONSOLIDACION', status: 'PROPOSED', because: 'Hay dos observaciones favorables en ocasiones distintas y elegiste sostener la estrategia con una carga tolerable.' };
  }
  if (input.sustainChosen && input.favorableDistinctOccasions === 1) {
    return { mode: 'CONSOLIDACION', status: 'PROVISIONAL', because: 'Hay una sola observación favorable. La consolidación queda provisional. Cuatro semanas de historia no la vuelven estabilidad.' };
  }
  if (input.goalKind && EXPANSION_KINDS.has(input.goalKind)) {
    if (input.hasCapacity && !input.incompatible) {
      return { mode: 'EXPANSION', status: 'PROVISIONAL', because: 'La meta es una candidatura a expansión. Los minutos no demuestran que la prueba sea viable. Preparar no comprueba utilidad.' };
    }
    return { mode: null, status: 'UNDETERMINED', because: 'La meta podría ser una expansión, y falta capacidad compatible o hay una incompatibilidad.' };
  }
  if (input.goalKind) {
    return { mode: 'ESTABILIZACION', status: 'PROPOSED', because: 'Hay una meta y faltan mínimos de preparación, ocasión o continuidad.' };
  }
  return { mode: null, status: 'UNDETERMINED', because: 'Falta una meta suficiente para proponer un modo. Puede haber una aclaración o una preparación.' };
}

function barrierVariant(familyId: string | null, kind: BarrierKind | null): { action: string; doneWhen: string; alternativeText: string } | null {
  if (familyId !== 'MEN-EST' || !kind) return null;
  if (kind === 'ESPERAR_EL_MOMENTO') {
    return {
      action: 'Define una versión que se pueda leer ahora, sin esperar el diseño final ni el momento perfecto.',
      doneWhen: 'Hay una versión legible. No depende del formato definitivo.',
      alternativeText: 'Si no reconoces esa espera, se mantiene la preparación de la meta, sin ese diagnóstico.',
    };
  }
  if (kind === 'PULIR_ANTES_DE_MOSTRAR') {
    return {
      action: 'Define qué necesita una versión legible y redáctala antes del diseño final. Compartirla queda para cuando tú lo elijas.',
      doneWhen: 'Hay un borrador que se puede leer sin el formato final.',
      alternativeText: 'Puedes dejar el borrador sin compartirlo. Compartir depende de tu elección y de que el contacto sea viable.',
    };
  }
  if (kind === 'PLANIFICACION_POR_ACLARAR') {
    return {
      action: 'Protege las ocasiones que declaraste y empieza por una parte revisable, porque reconociste que la preparación se dispersa.',
      doneWhen: 'La ocasión ocurrió y quedó una parte revisable.',
      alternativeText: 'Si la ocasión no existe, no se anota como falta de motivación. Se mueve la fecha o se deja la preparación sin día.',
    };
  }
  if (kind === 'NO_SE_POR_DONDE_EMPEZAR') {
    return {
      action: 'Escribe la primera parte del entregable y deja el resto fuera de esta ocasión.',
      doneWhen: 'La primera parte existe y se puede mostrar.',
      alternativeText: 'Si ni la primera parte cabe, la versión mínima es una frase del resultado.',
    };
  }
  if (kind === 'SIN_OCASION') {
    return {
      action: 'Deja la preparación lista y elige una ocasión flexible, sin inventar un día ni una hora.',
      doneWhen: 'La preparación existe. La ocasión queda flexible hasta que haya una fecha real.',
      alternativeText: 'Sin ocasión, no hay incumplimiento. La preparación puede guardarse igual.',
    };
  }
  return null;
}

function indicationCovers(indication: Indication | null | undefined, tags: ContentTag[]): { ok: boolean; reason: string | null } {
  if (!tags.some((tag) => ['PHYSICAL_EXERTION', 'DIET', 'SUPPLEMENT', 'MEDICATION'].includes(tag))) {
    return { ok: true, reason: null };
  }
  if (!indication || !indication.activity.trim() || !indication.subjectRef.trim() || !indication.scope.trim() || !indication.restrictions.trim()) {
    return { ok: false, reason: 'Falta una indicación declarada con actividad, asunto, alcance y restricciones. MK no la inventa ni verifica una credencial.' };
  }
  const outside = tags.filter((tag) => !indication.allows.includes(tag));
  if (outside.length) {
    return { ok: false, reason: 'La indicación declarada no cubre este contenido. No autoriza otra actividad ni otro asunto.' };
  }
  return { ok: true, reason: null };
}

function resolvedGoal(input: AccompanimentInput): { kind: GoalKind | null; situation: Situation; territory: Territory | null } {
  const declared = declarationToGoal(input.interest);
  const kind = input.goalKind ?? declared.kind;
  const situation = input.situation && input.situation !== 'NONE' ? input.situation : declared.situation ?? 'NONE';
  const territory = input.territory ?? declared.territory;
  return { kind: isGoalKind(kind) ? kind : null, situation, territory };
}

export function proposeAccompaniment(input: AccompanimentInput): AccompanimentProposal {
  void input.general;
  let goal = resolvedGoal(input);
  if (goal.situation === 'RETURN' && !goal.kind && input.recoveredGoal?.kind) {
    goal = {
      kind: input.recoveredGoal.kind,
      situation: 'RETURN',
      territory: input.territory ?? input.recoveredGoal.territory ?? goal.territory,
    };
  }
  const health = input.health ?? EMPTY_HEALTH;
  const limits = input.limits ?? [];
  const subject = input.actionSubject ?? (goal.territory === 'SALUD_FISICA' ? 'salud' : null);
  const resolvedHealth = limitsForAction(health, limits, subject, input.conversation ?? null);
  const currentLimitOnSubject = limits.some((limit) => limit.outcome === 'CURRENT_LIMIT' && (limit.subjectRef == null || limit.subjectRef === subject));
  const candidate = planningCandidate(input.rawSignals?.['formulario-v1:E-AUD-001!R26']);
  const recognized = input.barrier?.choice === 'RECOGNIZE' ? input.barrier.kind : null;
  const invitation = contextReviewInvitation(input);
  const load = fitLoad({
    weeklyMinutes: input.weeklyMinutes,
    occasions: input.occasions,
    minutesPerOccasion: input.minutesPerOccasion ?? (input.occasions && input.weeklyMinutes != null ? Math.floor(input.weeklyMinutes / input.occasions) : null),
    maintenanceMinutes: input.maintenanceMinutes ?? 0,
    reviewMinutes: input.reviewMinutes === undefined ? null : input.reviewMinutes,
  });
  const base = (partial: Partial<AccompanimentProposal> & Pick<AccompanimentProposal, 'familyId' | 'mode' | 'modeStatus' | 'situation' | 'requiresAction'>): AccompanimentProposal => {
    const family = familyById(partial.familyId);
    return {
      engineVersion: ENGINE_VERSION,
      rulesVersion: RULES_VERSION,
      catalogVersion: CATALOG_VERSION,
      templateVersion: family?.templateVersion ?? null,
      territory: partial.territory ?? goal.territory,
      pillar: partial.pillar ?? family?.pillar ?? null,
      links: partial.links ?? [],
      reasons: partial.reasons ?? [],
      missing: partial.missing ?? [],
      actionCount: partial.requiresAction ? 1 : 0,
      incompatible: partial.incompatible ?? null,
      alternative: partial.alternative ?? null,
      contextReviewInvitation: invitation,
      barrierCandidate: candidate,
      barrierRecognized: recognized,
      urgency: partial.urgency ?? null,
      load,
      indexUsed: false,
      criterionNote: partial.criterionNote ?? null,
      suggestion: partial.suggestion ?? 'ON',
      ...partial,
    };
  };

  const reasons: Reason[] = [];
  const missing: Missing[] = [];
  if (input.goalSource === 'RECOVERED' && input.recoveredGoal?.text.trim()) {
    reasons.push({ text: `Recuperamos la meta guardada: ${input.recoveredGoal.text.trim()}`, refs: ['PLAN_GOAL'] });
  } else if (input.goalText?.trim()) {
    reasons.push({ text: `La meta que escribiste: ${input.goalText.trim()}`, refs: ['USER_GOAL'] });
  }
  if (input.valueRef?.trim()) reasons.push({ text: `El valor elegido es ${input.valueRef.trim()}. Orienta la razón y no decide por ti.`, refs: ['VALOR'] });
  if (candidate && recognized !== 'PLANIFICACION_POR_ACLARAR') {
    reasons.push({ text: 'La planificación que declaraste es baja. Es un candidato de preparación por aclarar, no una falta de ocasión ni de motivación.', refs: [candidate.sourceRef] });
    missing.push({ key: 'barrier', question: '¿Reconoces que la preparación se dispersa, no la reconoces, es otra cosa, o todavía no lo sabes?' });
  }
  const postponeCandidate = (input.postpone === 'SI' || input.postpone === 'PARCIAL') && recognized !== 'ESPERAR_EL_MOMENTO';
  if (postponeCandidate && input.barrier?.choice !== 'REJECT') {
    reasons.push({ text: 'Declaraste que postergas esperando el momento perfecto. Es un candidato para esta meta, no un diagnóstico.', refs: ['formulario-v1:E-PER-000!R134'] });
    missing.push({ key: 'postpone', question: '¿Esa espera está desplazando esta entrega, no la reconoces, es otra cosa, o todavía no lo sabes?' });
  }
  if (input.barrier?.choice === 'REJECT' && input.barrier.kind === 'ESPERAR_EL_MOMENTO') {
    reasons.push({ text: 'No reconoces que la espera del momento perfecto desplace esta entrega. Dejo de atribuírtela.', refs: ['BARRIER'] });
  }
  if (recognized) reasons.push({ text: 'Reconociste una barrera para esta conducta. Aceptar el plan no habría bastado para afirmarla.', refs: ['BARRIER'] });
  if (input.barrier?.choice === 'REJECT') reasons.push({ text: 'No reconoces esa barrera. La meta compatible sigue disponible.', refs: ['BARRIER'] });
  if (invitation && goal.situation !== 'RETURN') {
    reasons.push({ text: 'Pasaron al menos catorce días sin registros y había ocasiones planificadas. Es una invitación a revisar el contexto. No cambia el plan ni prueba una ausencia.', refs: ['CONTEXT_REVIEW'] });
  }

  if (input.urgency) {
    return base({
      familyId: null,
      mode: null,
      modeStatus: 'UNDETERMINED',
      situation: goal.situation === 'PAUSE' ? 'PAUSE' : 'NONE',
      requiresAction: false,
      urgency: urgencyGuide(input.country),
      reasons: [...reasons, { text: 'Declaraste una urgencia. No se infiere de un texto ambiguo ni de la zona horaria.', refs: ['URGENCY'] }],
      missing,
    });
  }

  const capacityZero = input.occasions === 0 || input.weeklyMinutes === 0;
  if (goal.situation === 'PAUSE' || capacityZero) {
    return base({
      familyId: 'X-PAUSE',
      mode: null,
      modeStatus: 'UNDETERMINED',
      situation: 'PAUSE',
      territory: null,
      pillar: null,
      requiresAction: false,
      reasons: [...reasons, { text: capacityZero ? 'Declaraste capacidad cero. No hay una acción ni una fecha de regreso.' : 'Pediste pausar. Un borrador incompleto no pausa el plan hasta que confirmes.', refs: ['PAUSE'] }],
      missing,
    });
  }

  if (input.helpPreference === 'PROPIO' && !input.helpRequested) {
    return base({
      familyId: null,
      mode: null,
      modeStatus: 'UNDETERMINED',
      situation: goal.situation === 'RETURN' ? 'RETURN' : 'NONE',
      requiresAction: false,
      suggestion: 'OFF',
      reasons: [...reasons, { text: 'Elegiste seguir tu plan. No inserto una guía ni sustituyo tu estrategia. Puedes pedir una sugerencia cuando quieras.', refs: ['PREFERENCIA'] }],
      missing,
    });
  }

  if (goal.situation === 'RECONFIRM' || input.ineligibleCapture) {
    return base({
      familyId: 'X-RECONFIRM',
      mode: null,
      modeStatus: 'UNDETERMINED',
      situation: 'RECONFIRM',
      territory: null,
      pillar: null,
      requiresAction: true,
      reasons: [...reasons, { text: 'Hay señales cuya captura no era elegible. Reconfirmar no es una mejora ni un déficit.', refs: ['CAPTURE'] }],
      missing,
    });
  }

  if (input.occasions == null || input.weeklyMinutes == null) {
    missing.push({ key: 'capacity', question: '¿Cuántas ocasiones y cuántos minutos puedes usar esta semana? Sin ese dato no invento una carga.' });
  }

  const hasCapacity = (input.occasions ?? 0) > 0 && (input.weeklyMinutes ?? 0) > 0;
  const modePick = selectMode({
    goalKind: goal.kind,
    declaredProtection: Boolean(input.declaredProtection),
    currentLimitOnSubject,
    favorableDistinctOccasions: input.favorableDistinctOccasions ?? 0,
    sustainChosen: Boolean(input.sustainChosen),
    loadTolerable: input.loadTolerable ?? null,
    hasCapacity,
    incompatible: false,
  });

  if (goal.situation === 'RETURN' && !goal.kind) {
    return base({
      familyId: 'X-RETURN',
      mode: null,
      modeStatus: 'UNDETERMINED',
      situation: 'RETURN',
      territory: goal.territory,
      pillar: null,
      requiresAction: true,
      reasons: [...reasons, { text: 'Declaraste que retomas. Se recupera el contexto desde hoy. Volver no es contención ni una pérdida de disciplina.', refs: ['RETURN'] }],
      missing: [...missing, { key: 'goal', question: '¿Qué meta quieres retomar: entregar, enseñar, cuidar, ordenar, un vínculo u otra?' }],
    });
  }

  if (!goal.kind && !input.goalText?.trim()) {
    return base({
      familyId: null,
      mode: null,
      modeStatus: 'UNDETERMINED',
      situation: goal.situation,
      requiresAction: false,
      reasons: [...reasons, { text: 'Falta una meta. La pregunta siguiente cambia la ayuda.', refs: [] }],
      missing: [...missing, { key: 'goal', question: '¿Qué resultado quieres poder mostrar con esta ayuda?' }],
    });
  }

  const territory = goal.territory ?? 'MENTALIDAD';
  const kind = goal.kind ?? 'PROPIA';
  const mode = modePick.mode ?? (kind === 'PROPIA' || input.goalText?.trim() ? 'ESTABILIZACION' : null);
  const status: ModeStatus = modePick.mode ? modePick.status : input.goalText?.trim() ? 'PROVISIONAL' : 'UNDETERMINED';
  if (!mode) {
    return base({
      familyId: null,
      mode: null,
      modeStatus: 'UNDETERMINED',
      situation: goal.situation,
      territory,
      requiresAction: false,
      reasons: [...reasons, { text: modePick.because, refs: [] }],
      missing: [...missing, { key: 'mode', question: '¿Qué capacidad u oportunidad falta para que esta meta tenga un paso compatible?' }],
    });
  }

  let familyId = kind === 'EXPLORAR_IKIGAI' ? 'X-IKIGAI' : familyIdFor(territory, mode);
  if (goal.situation === 'RETURN' && kind === 'EXPLORAR_IKIGAI') familyId = 'X-IKIGAI';
  const family = familyById(familyId) as FamilyDef;
  const tags = [...family.tags, ...(input.requestedTags ?? [])];
  const covered = indicationCovers(input.indication, tags);
  const decision = decideAction(tags, resolvedHealth);
  const moneyForbidden = tags.includes('INVESTMENT') || tags.includes('DEBT');
  let incompatible: AccompanimentProposal['incompatible'] = null;
  let alternative: AccompanimentProposal['alternative'] = null;
  if (!covered.ok) {
    incompatible = { familyId, reason: covered.reason as string };
    alternative = { familyId: territory === 'SALUD_FISICA' ? 'SAL-CONT' : familyId, text: family.alternativeText, requiresApproval: true };
  } else if (!decision.allowed || moneyForbidden) {
    incompatible = { familyId, reason: decision.reason ?? 'Esta ayuda no es compatible con una restricción vigente.' };
    const altId = territory === 'SALUD_FISICA'
      ? (familyId === 'SAL-CONT' ? 'SAL-EST' : 'SAL-CONT')
      : territory === 'FINANZAS'
        ? (familyId === 'FIN-EST' ? 'FIN-CONT' : 'FIN-EST')
        : null;
    const alt = altId ? familyById(altId) : null;
    if (alt && alt.id !== familyId) alternative = { familyId: alt.id, text: alt.action, requiresApproval: true };
  }

  if (kind === 'PROPIA' && !goal.territory) {
    missing.push({ key: 'territory', question: '¿Esta meta es de mentalidad, relaciones, finanzas o salud física? Con eso cambia el paso, no el índice.' });
  }
  const links = family.pillar && family.territory
    ? [{ pillar: 'CUERPO' as Pillar, territory: family.territory, note: 'La ocasión usa la capacidad declarada. No crea una segunda acción.' }].filter((link) => link.pillar !== family.pillar)
    : [];

  let criterionNote: string | null = null;
  if (kind === 'ENTREGAR' || kind === 'PROPIA' || kind === 'SOSTENER') {
    const standard = standardCriterion({
      standard: input.weeklyStandard ?? null,
      choice: input.standardChoice ?? null,
      occasions: input.occasions,
    });
    if (standard?.tension && !input.standardChoice) missing.push({ key: 'standard', question: standard.tension });
    else if (standard) criterionNote = standard.note;
  }

  const situation: Situation = goal.situation === 'RETURN' ? 'RETURN' : 'NONE';
  reasons.push({ text: modePick.mode ? modePick.because : 'La meta tiene texto y el modo queda provisional hasta aclarar el tipo.', refs: ['MODE'] });
  if (situation === 'RETURN') reasons.push({ text: 'El retorno reorganiza desde la fecha en que confirmes. No regenera días pasados ni cambia la lectura fechada.', refs: ['RETURN'] });
  if (input.oldInjuryOnly) reasons.push({ text: 'Una lesión antigua aclarada no es un límite vigente y no activa contención.', refs: ['INJURY_HISTORY'] });
  if (input.ordinaryAlert) reasons.push({ text: 'Una alerta de revisión no es una urgencia ni una contención.', refs: ['AUDIT'] });

  return base({
    familyId,
    mode,
    modeStatus: incompatible ? 'PROVISIONAL' : status,
    situation,
    territory: family.territory,
    pillar: family.pillar ?? pillarFor(territory, mode),
    links,
    requiresAction: !incompatible,
    incompatible,
    alternative,
    reasons,
    missing,
    criterionNote,
    barrierRecognized: recognized,
  });
}

export function variantCopy(familyId: string | null, recognized: BarrierKind | null): { action: string; doneWhen: string; alternativeText: string } | null {
  return barrierVariant(familyId, recognized);
}
