import type { Pillar, Territory } from '../instrumentos/glossary';

/** Product draft. Semantic predicates, not alert thresholds and not the lowest score. */
export const PRIORITY_ENGINE = 'prioridades@0.1';

export type PriorityFocus = 'ORGANIZACION' | 'CONDUCTA' | 'CUIDADO' | 'EXPERIMENTO' | 'PAUSA' | 'PROPIO' | 'ORDEN' | 'ACLARAR' | 'RECONFIRMAR';

export type PriorityInterest = 'TRABAJO' | 'IKIGAI' | 'CUIDADO' | 'CONDUCTA' | 'FINANZAS' | 'RELACIONES' | 'PAUSA' | 'REPARAR' | null;

/** Product vocabulary. Unknown labels stay null instead of being guessed from a story. */
export function normalizeInterest(raw: string | null | undefined): PriorityInterest {
  const key = (raw ?? '').toUpperCase();
  if (['TRABAJO', 'TRABAJO_Y_PROYECTOS', 'TERMINAR_PROPUESTA', 'COMPARTIR_UN_BORRADOR', 'ENSEÑAR_UN_OFICIO', 'RETOMAR'].includes(key)) return 'TRABAJO';
  if (key === 'IKIGAI') return 'IKIGAI';
  if (key === 'CUIDADO') return 'CUIDADO';
  if (key === 'CONDUCTA') return 'CONDUCTA';
  if (['FINANZAS', 'ORDEN_FINANCIERO'].includes(key)) return 'FINANZAS';
  if (['RELACIONES', 'LIMITES_RELACIONALES', 'CUIDAR_UN_VINCULO'].includes(key)) return 'RELACIONES';
  if (key === 'PAUSA') return 'PAUSA';
  if (['REPARAR', 'REPARAR_LECTURA'].includes(key)) return 'REPARAR';
  return null;
}

export type PriorityInput = {
  direction: 'EXPLORANDO' | 'PROVISIONAL' | 'CONFIRMADO_POR_USUARIO' | null;
  /** What the person wants to work. Exploring does not force a direction project. */
  interest: PriorityInterest;
  /** Occasions the person can hold. Null is unknown, not zero. */
  capacity: number | null;
  weeklyMinutes?: number | null;
  healthLimit: boolean;
  /** Eligible raw answers of the core. Missing keys are not zero. */
  raw: Partial<Record<string, number>>;
  hasIkigaiExperiment: boolean;
};

export type PriorityProposal = {
  engineVersion: typeof PRIORITY_ENGINE;
  focus: PriorityFocus;
  pillar: Pillar | null;
  territory: Territory | null;
  reason: string;
  alternatives: PriorityFocus[];
  requiresAction: boolean;
};

const low = (raw: Partial<Record<string, number>>, ref: string, maxInclusive: number) => {
  const value = raw[ref];
  return value != null && value <= maxInclusive;
};

export function proposePriority(input: PriorityInput): PriorityProposal {
  const base = (focus: PriorityFocus, pillar: Pillar | null, territory: Territory | null, reason: string, alternatives: PriorityFocus[], requiresAction = true): PriorityProposal => ({
    engineVersion: PRIORITY_ENGINE,
    focus,
    pillar,
    territory,
    reason,
    alternatives,
    requiresAction,
  });

  if (input.capacity === 0 || input.interest === 'PAUSA') {
    return base('PAUSA', null, null, 'Declaraste capacidad cero o pediste pausar. No hay una acción ni una fecha obligatoria.', [], false);
  }
  if (input.interest === 'REPARAR') {
    return base('RECONFIRMAR', null, null, 'Hay que reconfirmar las respuestas cuya captura no era elegible. Eso no es una mejora ni un déficit de la persona.', [], false);
  }
  if (input.healthLimit && (input.interest === 'CUIDADO' || low(input.raw, 'formulario-v1:E-AUD-001!R18', 2))) {
    return base(
      'CUIDADO',
      'CUERPO',
      'SALUD_FISICA',
      'Hay un límite vigente y la recuperación que declaraste es baja. La propuesta protege esa capacidad. No diagnostica.',
      ['ORGANIZACION', 'CONDUCTA'],
    );
  }
  if (input.interest === 'FINANZAS') {
    return base(
      'ORDEN',
      'MENTE',
      'FINANZAS',
      'Pediste ordenar obligaciones. El total financiero nativo no es un pilar y no propone invertir ni endeudarte.',
      ['ORGANIZACION'],
    );
  }
  if (input.interest === 'RELACIONES') {
    return base(
      'ACLARAR',
      'ESPIRITU',
      'RELACIONES',
      'Pediste cuidar un vínculo o un límite. Primero se aclara si una conversación es viable. No es una confrontación obligatoria.',
      ['PROPIO'],
    );
  }
  if (input.direction === 'EXPLORANDO' && input.interest === 'IKIGAI') {
    return base(
      'EXPERIMENTO',
      'ESPIRITU',
      'MENTALIDAD',
      'Estás explorando y elegiste contrastar una combinación. Eso no exige un propósito cerrado ni monetizarla.',
      ['ORGANIZACION'],
    );
  }
  const sense = input.raw['formulario-v1:E-AUD-001!R62'];
  const lived = input.raw['formulario-v1:E-PER-000!R74'];
  const directionClear = (sense != null && sense >= 4) || (lived != null && lived >= 3);
  const organizationWeak = low(input.raw, 'formulario-v1:E-AUD-001!R26', 2);
  const conductWeak = low(input.raw, 'formulario-v1:E-PER-000!R76', 2) || low(input.raw, 'formulario-v1:E-PER-000!R86', 2);
  if (directionClear && organizationWeak && (input.interest === 'TRABAJO' || input.interest == null)) {
    return base(
      'ORGANIZACION',
      'MENTE',
      'MENTALIDAD',
      'La dirección que reconoces es clara y la planificación que declaraste es débil. Ordenar ocasiones podría ayudar a expresarla. Es una hipótesis, no la causa.',
      conductWeak ? ['CONDUCTA', 'CUIDADO'] : ['CONDUCTA'],
    );
  }
  if (input.interest === 'TRABAJO' && organizationWeak) {
    return base('ORGANIZACION', 'MENTE', 'MENTALIDAD', 'Elegiste trabajar un proyecto y la planificación declarada es débil.', ['CONDUCTA']);
  }
  if (conductWeak && input.interest === 'CONDUCTA') {
    return base('CONDUCTA', 'CUERPO', 'MENTALIDAD', 'Elegiste trabajar una conducta y los hábitos declarados no acompañan lo que dices querer.', ['ORGANIZACION']);
  }
  if (!input.interest && !organizationWeak && !conductWeak) {
    return base('PROPIO', null, null, 'No hay un candidato con evidencia suficiente. Puedes elegir un foco propio o dejarlo pendiente.', [], false);
  }
  return base('PROPIO', null, null, 'Puedes elegir el foco. El índice no impone el territorio más bajo.', input.interest === 'IKIGAI' ? ['EXPERIMENTO'] : ['ORGANIZACION'], false);
}

export type HelpDraft = {
  source: 'SYSTEM_GENERATED';
  evidence: string[];
  outcome: string;
  outcomeFrom: 'USER_GOAL' | 'SYSTEM';
  action: string | null;
  occasion: string | null;
  preparation: string | null;
  criterion: string | null;
  alternative: string | null;
  forbids: string[];
};

/** A usable next step from the proposal and the load the person declared. It does not invent a clock time. */
export function draftHelp(
  proposal: PriorityProposal,
  input: { weeklyMinutes: number | null; occasions: number | null; goal: string | null },
): HelpDraft {
  const goal = input.goal?.trim() ?? '';
  const load = input.occasions != null && input.weeklyMinutes != null
    ? `${input.occasions} ocasiones, ${input.weeklyMinutes} minutos en total. El día lo eliges tú.`
    : 'No declaraste ocasiones o minutos. No invento un horario.';
  const cited = proposal.reason;
  const common = {
    source: 'SYSTEM_GENERATED' as const,
    evidence: [cited],
    outcome: goal || 'Un resultado que puedas mostrar o anotar.',
    outcomeFrom: goal ? 'USER_GOAL' as const : 'SYSTEM' as const,
    alternative: proposal.alternatives[0] ?? null,
    forbids: [] as string[],
  };
  if (!proposal.requiresAction || proposal.focus === 'PAUSA') {
    return { ...common, outcome: 'Sostener la pausa sin una obligación nueva.', outcomeFrom: 'SYSTEM', action: null, occasion: null, preparation: null, criterion: 'No aparece una tarea nueva ni un incumplimiento de días sin ocasión.', alternative: 'Volver cuando elijas una carga.' };
  }
  if (proposal.focus === 'RECONFIRMAR') {
    return { ...common, action: 'Responder de nuevo solo las señales cuya captura no era elegible.', occasion: null, preparation: 'Se conservan las respuestas originales.', criterion: 'La lectura nueva dice de dónde sale y no se llama mejora.', forbids: ['Reescribir la lectura nativa'] };
  }
  if (proposal.focus === 'CUIDADO') {
    return { ...common, action: 'Una gestión compatible con el límite vigente.', occasion: load, preparation: 'Anota qué vas a preguntar o qué trámite falta.', criterion: 'Quedó hecha esa gestión.', forbids: ['Esfuerzo físico', 'Dieta', 'Suplemento', 'Medicación'] };
  }
  if (proposal.focus === 'ORDEN') {
    return { ...common, action: 'Listar obligaciones que ya conoces y lo que todavía no está documentado.', occasion: load, preparation: 'Separa lo conocido de lo que falta.', criterion: 'La lista existe y no incluye una recomendación de invertir o endeudarte.', forbids: ['Inversión', 'Deuda'] };
  }
  if (proposal.focus === 'ACLARAR') {
    return { ...common, action: 'Escribir el límite que quieres proteger y si una conversación es viable.', occasion: load, preparation: 'Puede ser un texto privado, sin enviarlo.', criterion: 'Quedó la decisión: viable, no viable o todavía no lo sé.', forbids: ['Confrontación como primer paso'] };
  }
  if (proposal.focus === 'EXPERIMENTO') {
    return { ...common, action: 'Una prueba pequeña dentro del tiempo declarado.', occasion: load, preparation: 'Define qué vas a observar.', criterion: 'Anotaste qué ocurrió. No completa demanda, profesión ni sostenibilidad.', forbids: ['Monetizar como condición'] };
  }
  if (proposal.focus === 'ORGANIZACION') {
    return { ...common, action: 'Proteger las ocasiones declaradas y empezar por una parte revisable.', occasion: load, preparation: 'Deja el material abierto antes de empezar.', criterion: 'La ocasión ocurrió y quedó algo que se puede revisar.', forbids: ['Un horario que no declaraste'] };
  }
  if (proposal.focus === 'CONDUCTA') {
    return { ...common, action: 'Una conducta observable de esta semana, no un propósito nuevo.', occasion: load, preparation: 'Elige la fricción que vas a quitar.', criterion: 'Puedes decir si ocurrió, aparte de si produjo el resultado.', forbids: [] };
  }
  return { ...common, action: null, occasion: null, preparation: null, criterion: 'Eliges el foco antes de que exista una obligación.', forbids: [] };
}
