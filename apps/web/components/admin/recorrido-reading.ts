import { scalePromptFor } from '@/lib/scale-prompts';

export type SheetItem = {
  label?: string;
  text?: string;
  category?: string;
  descriptor?: string;
  commitment?: string;
  kind?: 'plan';
};

export type SheetLine = { label: string; parts: string[]; text: string | null; note: string | null };

const FIELD_LABEL: Record<string, string> = {
  pasion: 'Pasión',
  vocacion: 'Vocación',
  mision: 'Misión',
  profesion: 'Profesión',
};

export function fieldLabel(field: string | null | undefined): string {
  if (!field) return 'Campo no identificado';
  return FIELD_LABEL[field] ?? 'Campo no identificado';
}

export function sessionStatusLabel(status: string): string {
  if (status === 'ACTIVE') return 'En curso';
  if (status === 'COMPLETED') return 'Completada';
  if (status === 'ABANDONED') return 'Abandonada';
  return status;
}

export function directionLabel(status: string | null | undefined): string {
  if (status === 'EXPLORANDO') return 'Explorando';
  if (status === 'PROVISIONAL') return 'Provisional';
  if (status === 'CONFIRMADO_POR_USUARIO') return 'Confirmada por la persona';
  if (!status) return 'Sin estado';
  return status;
}

export function kindLabel(kind: string): string {
  if (kind === 'INITIAL') return 'Lectura inicial';
  if (kind === 'REMEASURE') return 'Medición posterior';
  if (kind === 'RECONSTRUCTED') return 'Reconstrucción';
  if (kind === 'DOCUMENTED') return 'Trabajo documentado';
  return kind;
}

export function catalogLabel(definitionRef: string | null, version: string): string {
  const number = /@(\d+)$/.exec(version)?.[1];
  const name = definitionRef === 'formulario-completo' ? 'Cuestionario completo' : 'Catálogo';
  return number ? `${name}, versión ${number}` : name;
}

export function answerStatusLabel(status: string): string {
  const known: Record<string, string> = {
    ANSWERED: 'Respondida',
    UNANSWERED: 'No respondida',
    UNKNOWN: 'No lo sé',
    NOT_APPLICABLE: 'No aplica',
    DECLINED: 'Prefiero no responder',
    PENDING: 'Pendiente',
    SKIPPED: 'Omitida',
  };
  return known[status] ?? status;
}

export function questionTypeLabel(type: string): string {
  const known: Record<string, string> = {
    SCALE_1_5: 'Escala',
    SINGLE_CHOICE: 'Una opción',
    MULTI_CHOICE: 'Varias opciones',
    FREE_TEXT: 'Texto',
    RANKING: 'Orden',
  };
  return known[type] ?? type;
}

const SHEETS: Record<string, string> = {
  'E-AUD-001': 'Auditoría inicial',
  'F-RAD-001': 'Radiografía física',
  'F-RAD-002': 'Radiografía relacional',
  'F-RAD-003': 'Radiografía financiera',
  'E-PER-000': 'Perfil',
};

export function sheetCode(module: { slug: string; sheet?: string | null }): string {
  if (module.sheet) return module.sheet;
  if (module.slug.startsWith('e-aud')) return 'E-AUD-001';
  if (module.slug.startsWith('f-rad-001')) return 'F-RAD-001';
  if (module.slug.startsWith('f-rad-002')) return 'F-RAD-002';
  if (module.slug.startsWith('f-rad-003')) return 'F-RAD-003';
  if (module.slug.startsWith('e-per')) return 'E-PER-000';
  return '';
}

export function sheetLabel(module: { slug: string; sheet?: string | null }): string {
  const code = sheetCode(module);
  return SHEETS[code] ?? (code || 'Sin hoja');
}

export function sheetHeading(module: { slug: string; sheet?: string | null }): string {
  const code = sheetCode(module);
  const name = SHEETS[code];
  if (code && name) return `${code}. ${name}`;
  return code || 'Sin hoja';
}

export function cellLabel(sourceRef: string | null | undefined): string | null {
  const match = /!(R\d+)$/.exec(sourceRef ?? '');
  return match?.[1] ?? null;
}

export function questionStem(text: string, sourceRef?: string | null): string {
  return presentStem(text, sourceRef).title;
}

export function presentStem(text: string, sourceRef?: string | null): { title: string; separated: boolean } {
  const stored = text.trim();
  const stem = scalePromptFor(sourceRef)?.stem?.trim();
  if (stem && stored.startsWith(stem) && stored.slice(stem.length).trim().length > 0) {
    return { title: stem, separated: true };
  }
  return { title: stored, separated: false };
}

export function pointLabel(value: string | null | undefined, sourceRef?: string | null): string | null {
  if (!value) return null;
  const numeric = Number(value);
  const points = scalePromptFor(sourceRef)?.points;
  if (!points || !Number.isInteger(numeric)) return null;
  const label = points[numeric]?.trim();
  if (!label || label === value) return null;
  return label;
}

const ONBOARDING: Record<string, string> = {
  TERMS_PENDING: 'Términos pendientes',
  DIAGNOSTICO_BIENVENIDA: 'Bienvenida del cuestionario',
  FASE1_EN_CURSO: 'Cuestionario en curso',
  PROFILE_COMPLETE: 'Perfil completo',
  BLUEPRINT_READY: 'Recorrido listo',
};

export function onboardingLabel(step: string): string {
  return ONBOARDING[step] ?? step.replaceAll('_', ' ').toLowerCase();
}

const INSTRUMENTS: Record<string, string> = {
  audit: 'Auditoría',
  sense: 'Desarrollo y sentido',
  body: 'Cuerpo',
  relations: 'Relaciones',
  finance: 'Finanzas',
  'finance-projection': 'Construcción y proyección',
  origin: 'Origen y linaje',
  vision: 'Visión',
  values: 'Valores',
  standards: 'Estándares',
  identity: 'Identidad',
  difficulties: 'Dificultades',
  personality: 'Personalidad',
  ikigai: 'IKIGAI',
  footprint: 'Huella',
};

export function instrumentLabel(instrument: string | null | undefined): string | null {
  if (!instrument) return null;
  return INSTRUMENTS[instrument] ?? null;
}

export function rowLabel(sourceRef: string | null | undefined): string | null {
  const match = /!R(\d+)$/.exec(sourceRef ?? '');
  return match ? `Fila ${match[1]}` : null;
}

export type ReadingAnchor = { label: string; value: string };

export type SavedReading = {
  title: string;
  plainTitle: boolean;
  limitation: string | null;
  captureText: string | null;
  headline: string | null;
  lines: string[];
  fields: { label: string; value: string }[];
  marks: { token: string; chosen: boolean }[] | null;
  options: { label: string; chosen: boolean }[];
  longScale: boolean;
};

const BRIEF_ANCHOR = 42;

export function presentReading(item: {
  text: string;
  type: string;
  status: string;
  sourceRef?: string | null;
  anchors: ReadingAnchor[];
  selected: ReadingAnchor[];
  freeText: string | null;
}): SavedReading {
  const stem = presentStem(item.text, item.sourceRef);
  const scale = item.type === 'SCALE_1_5' && item.anchors.length >= 2 && item.anchors.length <= 7;
  const longScale = scale && item.anchors.some((anchor) => anchor.label.trim().length > BRIEF_ANCHOR);
  const chosen = new Set(item.selected.map((option) => option.value));
  const options = item.anchors.map((anchor) => ({ label: anchor.label, chosen: chosen.has(anchor.value) }));
  const base = {
    title: stem.title,
    plainTitle: !stem.separated,
    limitation: item.type === 'SCALE_1_5' && !stem.separated ? 'El texto de captura no separa el enunciado de los anclajes.' : null,
    captureText: stem.separated ? item.text.trim() : null,
    options,
    longScale,
  };
  if (item.status !== 'ANSWERED') {
    return { ...base, headline: `Estado: ${answerStatusLabel(item.status)}`, lines: [], fields: [], marks: null };
  }
  const activity = structuredText(item.freeText?.trim() ?? '');
  if (activity) {
    return {
      ...base,
      headline: null,
      lines: [activity.answer],
      fields: [
        activity.ambit ? { label: 'Ámbito', value: activity.ambit } : null,
        activity.option ? { label: 'Opción', value: activity.option } : null,
      ].filter((field): field is { label: string; value: string } => Boolean(field)),
      marks: null,
    };
  }
  const loose = item.freeText?.trim() ?? '';
  if (loose.startsWith('{')) {
    return {
      ...base,
      limitation: 'El formato de la respuesta no se reconoce.',
      headline: null,
      lines: [loose],
      fields: [],
      marks: null,
    };
  }
  if (scale) {
    const option = item.selected[0];
    const token = option ? pointToken(option, item.anchors) : '';
    const known = option ? item.anchors.some((anchor) => anchor.value === option.value || anchor.label.trim() === token) : false;
    const meaning = option && option.label.trim() && option.label.trim() !== token ? option.label.trim() : null;
    return {
      ...base,
      headline: token ? `Respuesta guardada: ${token}${known ? ` de ${item.anchors.length}` : ''}` : 'Sin texto guardado',
      lines: meaning ? [meaning] : [],
      fields: [],
      marks: item.anchors.map((anchor) => ({
        token: pointToken(anchor, item.anchors),
        chosen: chosen.has(anchor.value),
      })),
    };
  }
  if (item.type === 'MULTI_CHOICE' || item.type === 'SINGLE_CHOICE' || item.type === 'RANKING') {
    const lines = item.selected.map((option) => option.label.trim()).filter((label) => label.length > 0);
    return { ...base, headline: lines.length ? null : 'Sin texto guardado', lines, fields: [], marks: null };
  }
  const lines = [...item.selected.map((option) => option.label.trim()), loose].filter((line) => line.length > 0);
  return { ...base, headline: null, lines: lines.length ? lines : ['Sin texto guardado'], fields: [], marks: null };
}

function pointToken(option: ReadingAnchor, anchors: ReadingAnchor[]): string {
  const label = option.label.trim();
  const value = option.value.trim();
  if (/^\d+$/.test(value)) return value;
  if (/^\d+$/.test(label)) return label;
  const index = anchors.findIndex((anchor) => anchor.value === option.value);
  return String(index >= 0 ? index + 1 : 1);
}

export function phaseLabel(phase: string | undefined): string {
  if (phase === 'FASE1') return 'Fase 1';
  if (phase === 'FASE2') return 'Fase 2';
  if (phase === 'FASE3') return 'Fase 3';
  return phase || 'Sin etapa';
}

export function roleLabel(role: string): string {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'USER') return 'Miembro';
  return role;
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function presentSheetItem(item: SheetItem): SheetLine {
  const label = item.label?.trim() ?? '';
  const category = item.category?.trim() ?? '';
  const descriptor = item.descriptor?.trim() ?? '';
  const commitment = item.commitment?.trim() ?? '';
  const text = item.text?.trim() ?? '';
  const structured = [category, descriptor, commitment].filter(Boolean);
  if (!text) return { label, parts: structured, text: null, note: null };
  if (descriptor && compact(text).split(compact(descriptor)).length - 1 > 1) {
    return { label, parts: [], text, note: 'El texto guardado repite una frase.' };
  }
  const covered = structured.length > 0 && structured.every((part) => compact(text).includes(compact(part)));
  if (covered) return { label, parts: structured, text: null, note: null };
  if (structured.length) return { label, parts: structured, text, note: null };
  return { label, parts: [], text, note: null };
}

export type StoredActivity = {
  sourceRef?: string | null;
  field?: string | null;
  ambit?: string;
  option?: string;
  answer?: string;
  recognized?: boolean;
  raw?: string | null;
};

export function presentAnswer(item: { status: string; selected: { label: string }[]; freeText: string | null }): { primary: string[]; detail: string[] } {
  const selected = item.selected.map((option) => option.label.trim()).filter(Boolean);
  const text = item.freeText?.trim() ?? '';
  if (item.status !== 'ANSWERED') {
    return { primary: [answerStatusLabel(item.status), ...selected, ...plainText(text)], detail: [] };
  }
  const activity = structuredText(text);
  if (activity) {
    return {
      primary: [...selected, activity.answer],
      detail: [activity.ambit ? `Ámbito: ${activity.ambit}` : '', activity.option ? `Opción: ${activity.option}` : ''].filter(Boolean),
    };
  }
  const primary = [...selected, ...plainText(text)];
  return { primary: primary.length ? primary : ['Sin texto guardado'], detail: [] };
}

function plainText(text: string): string[] {
  return text && !text.startsWith('{') ? [text] : [];
}

function structuredText(text: string): { answer: string; ambit: string; option: string } | null {
  if (!text.startsWith('{')) return null;
  const read = readLoose(text);
  if (read.raw) return null;
  return {
    answer: read.answer,
    ambit: read.ambit === 'Sin ámbito' ? '' : read.ambit,
    option: read.option === 'Sin opción' ? '' : read.option,
  };
}

export function presentActivity(activity: StoredActivity | string): { answer: string; ambit: string; option: string; field: string; raw: string | null } {
  if (typeof activity === 'string') {
    const read = readLoose(activity);
    return { answer: read.answer, ambit: read.ambit, option: read.option, field: 'Campo no identificado', raw: read.raw };
  }
  return {
    answer: activity.answer?.trim() || 'Sin respuesta',
    ambit: activity.ambit?.trim() || 'Sin ámbito',
    option: activity.option?.trim() || 'Sin opción',
    field: fieldLabel(activity.field),
    raw: activity.recognized ? null : activity.raw ?? null,
  };
}

function readLoose(text: string): { answer: string; ambit: string; option: string; raw: string | null } {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return { answer: trimmed, ambit: 'Sin ámbito', option: 'Sin opción', raw: null };
  try {
    const parsed = JSON.parse(trimmed) as { answer?: unknown; activity?: unknown; ambit?: unknown; option?: unknown };
    const answer = typeof parsed.answer === 'string' ? parsed.answer.trim()
      : typeof parsed.activity === 'string' ? parsed.activity.trim() : '';
    if (!answer) return { answer: trimmed, ambit: 'Sin ámbito', option: 'Sin opción', raw: trimmed };
    return {
      answer,
      ambit: typeof parsed.ambit === 'string' && parsed.ambit.trim() ? parsed.ambit.trim() : 'Sin ámbito',
      option: typeof parsed.option === 'string' && parsed.option.trim() ? parsed.option.trim() : 'Sin opción',
      raw: null,
    };
  } catch {
    return { answer: trimmed, ambit: 'Sin ámbito', option: 'Sin opción', raw: trimmed };
  }
}

export function alertRuleConditionLabel(rule: string): string {
  if (rule.startsWith('Dispara si la respuesta es')) {
    return rule.replace(/^Dispara si la respuesta es/, 'Se gatilla con respuesta').replace(/\.$/, ' en la escala.');
  }
  return rule;
}

export function alertModuleContext(
  moduleSlug: string | null,
  modules: { slug: string; sheet?: string; title: string }[] | undefined,
): string | null {
  if (!moduleSlug) return null;
  const module = modules?.find((item) => item.slug === moduleSlug);
  if (!module) return moduleSlug;
  const sheet = sheetHeading({ slug: module.slug, sheet: module.sheet ?? null });
  const title = module.title.trim();
  if (title && !sheet.toLowerCase().includes(title.toLowerCase())) return `${sheet}. ${title}`;
  return sheet;
}

type CrossActivityRef = { sourceRef?: string | null; answer?: string };

function crossActivityLabel(
  ref: string,
  synthesisActivities: CrossActivityRef[],
  sessionActivities: CrossActivityRef[],
): string {
  const synth = synthesisActivities.find((item) => item.sourceRef === ref)?.answer?.trim();
  if (synth) return synth;
  const session = sessionActivities.find((item) => item.sourceRef === ref)?.answer?.trim();
  if (session) return session;
  return ref;
}

function crossLinkStatusLabel(status: string): string {
  if (status === 'NEEDS_REVIEW') return 'Por revisar';
  if (status === 'RETIRED') return 'Retirado';
  if (status === 'ACTIVE') return 'Vigente';
  return status;
}

export type CrossLinkReading = {
  id: string;
  from: string;
  to: string;
  reason: string;
  status: string;
  statusLabel: string;
};

export type CrossCombinationReading = {
  id: string;
  title: string;
  links: CrossLinkReading[];
  reason: string;
  valuation: string | null;
  valuationReason: string;
  experiment: string;
  learningQuestion: string;
  unknownNote: string;
  observed: string;
  fieldStance: { field: string; label: string; stance: string }[];
};

export function presentCrossReading(
  synthesis: unknown,
  sessionActivities: CrossActivityRef[] = [],
): { combinations: CrossCombinationReading[]; orphanLinks: CrossLinkReading[]; purposeDraft: string | null } {
  if (!synthesis || typeof synthesis !== 'object') {
    return { combinations: [], orphanLinks: [], purposeDraft: null };
  }
  const body = synthesis as {
    activities?: CrossActivityRef[];
    links?: { id?: string; fromRef?: string; toRef?: string; combinationId?: string; reason?: string; status?: string }[];
    combinations?: Record<string, unknown>[];
    purpose?: { generated?: string; edited?: string | null };
  };
  const synthesisActivities = Array.isArray(body.activities) ? body.activities : [];
  const links = Array.isArray(body.links) ? body.links : [];
  const combinations = Array.isArray(body.combinations) ? body.combinations : [];
  const purposeDraft = body.purpose?.edited?.trim() || body.purpose?.generated?.trim() || null;

  const readLink = (row: (typeof links)[number]): CrossLinkReading | null => {
    const fromRef = row.fromRef?.trim();
    const toRef = row.toRef?.trim();
    if (!fromRef || !toRef) return null;
    const status = row.status ?? 'ACTIVE';
    return {
      id: row.id ?? `${fromRef}:${toRef}`,
      from: crossActivityLabel(fromRef, synthesisActivities, sessionActivities),
      to: crossActivityLabel(toRef, synthesisActivities, sessionActivities),
      reason: row.reason?.trim() ?? '',
      status,
      statusLabel: crossLinkStatusLabel(status),
    };
  };

  const comboViews: CrossCombinationReading[] = combinations.map((row, index) => {
    const id = String(row.id ?? index);
    const comboLinks = links
      .filter((link) => link.combinationId === row.id)
      .map(readLink)
      .filter((item): item is CrossLinkReading => Boolean(item));
    const fieldStance = row.fieldStance && typeof row.fieldStance === 'object'
      ? Object.entries(row.fieldStance as Record<string, string>).map(([field, stance]) => ({
        field,
        label: fieldLabel(field),
        stance: stanceLabel(stance),
      }))
      : [];
    return {
      id,
      title: `Combinación ${index + 1}`,
      links: comboLinks,
      reason: typeof row.reason === 'string' ? row.reason.trim() : '',
      valuation: typeof row.valuation === 'string' ? row.valuation : null,
      valuationReason: typeof row.valuationReason === 'string' ? row.valuationReason.trim() : '',
      experiment: typeof row.experiment === 'string' ? row.experiment.trim() : '',
      learningQuestion: typeof row.learningQuestion === 'string' ? row.learningQuestion.trim() : '',
      unknownNote: typeof row.unknownNote === 'string' ? row.unknownNote.trim() : '',
      observed: typeof row.observed === 'string' ? row.observed.trim() : '',
      fieldStance,
    };
  });

  const knownComboIds = new Set(combinations.map((row, index) => String(row.id ?? index)));
  const orphanLinks = links
    .filter((link) => !link.combinationId || !knownComboIds.has(String(link.combinationId)))
    .map(readLink)
    .filter((item): item is CrossLinkReading => Boolean(item));

  return { combinations: comboViews, orphanLinks, purposeDraft };
}

function stanceLabel(value: string): string {
  if (value === 'RECOGNIZE') return 'Lo reconoce';
  if (value === 'DOUBT') return 'Lo duda';
  if (value === 'UNKNOWN') return 'Sin información';
  return value;
}

export const VISTAS = ['resumen', 'respuestas', 'perfil', 'proposito', 'alertas'] as const;
export type Vista = (typeof VISTAS)[number];
export const APARTADOS = ['direccion', 'actividades', 'cruce', 'hoja'] as const;
export type Apartado = (typeof APARTADOS)[number];

export function vistaFrom(value: string | null): Vista {
  return VISTAS.includes(value as Vista) ? value as Vista : 'resumen';
}

export function apartadoFrom(value: string | null): Apartado {
  return APARTADOS.includes(value as Apartado) ? value as Apartado : 'direccion';
}

export function patchRecorridoQuery(current: URLSearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(current);
  if (patch.sessionId) {
    next.delete('modulo');
    next.delete('pagina');
  }
  if (patch.modulo) next.set('pagina', '1');
  for (const [key, value] of Object.entries(patch)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  const text = next.toString();
  return text ? `?${text}` : '';
}
