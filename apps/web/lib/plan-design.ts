import type { ContentMark, DesignAction, DesignSchedule, Template } from '@/lib/intervention-api';

export const DESIGN_STEPS = ['Tu cambio', 'Resultado', 'Estrategia', 'Plan de acción', 'Revisar y activar'] as const;

export const NOTHING_TO_PROTECT = 'Por ahora no hay nada que cuidar.';

export const MARK_LABELS: Record<ContentMark, string> = {
  PHYSICAL_EXERTION: 'Esfuerzo físico',
  DIET: 'Un cambio de alimentación',
  SUPPLEMENT: 'Suplementos',
  MEDICATION: 'Medicación',
  CONFRONTATION: 'Una conversación difícil',
  INVESTMENT: 'Invertir dinero',
  DEBT: 'Pedir un préstamo o endeudarme',
};

export const LINK_OPTIONS: { value: string; label: string }[] = [
  { value: 'DIRECT', label: 'Me acerca directamente a mi dirección' },
  { value: 'ENABLING', label: 'Crea condiciones para vivirla' },
  { value: 'PROTECTIVE', label: 'Cuida algo igual de importante' },
  { value: 'EXPLORATORY', label: 'Me ayuda a explorarla' },
];

export const HORIZON_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

export const CHANGE_EXAMPLES: Record<string, string> = {
  MENTALIDAD: 'Ej.: empezar el día sabiendo qué es lo importante.',
  FINANZAS: 'Ej.: saber qué queda del sueldo antes de gastarlo.',
  RELACIONES: 'Ej.: cenar con mi familia sin atender el teléfono.',
  SALUD_FISICA: 'Ej.: dormir siete horas de lunes a viernes.',
};

export function weeksLabel(weeks: number): string {
  return weeks === 1 ? '1 semana' : `${weeks} semanas`;
}

export function scheduleLabel(schedule: DesignSchedule): string {
  if (schedule.kind === 'WEEKLY') {
    const times = schedule.occasionsPerWeek === 1 ? '1 vez por semana' : `${schedule.occasionsPerWeek} veces por semana`;
    return `${times}, ${schedule.minutesPerOccasion} minutos cada vez`;
  }
  if (schedule.kind === 'ONCE') {
    return `Una vez, en la semana ${schedule.week} del ciclo, ${schedule.minutesPerOccasion} minutos`;
  }
  return `${schedule.trigger}, ${schedule.minutesPerOccasion} minutos`;
}

export function emptyAction(horizonWeeks: number): DesignAction {
  return {
    key: '',
    title: '',
    doneWhen: '',
    cue: null,
    minimum: null,
    schedule: horizonWeeks > 1 ? { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 15 } : { kind: 'ONCE', week: 1, minutesPerOccasion: 15 },
    contentTags: [],
    source: { kind: 'MEMBER' },
    basis: 0,
  };
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Switches a template action between its suggested load and the template's minimum, without touching the text. */
export function withTemplateMinimum(action: DesignAction, template: Template, useMinimum: boolean): DesignAction {
  if (action.source.kind !== 'TEMPLATE') return action;
  const minutes = useMinimum ? template.minimum.minutesPerOccasion : template.schedule.minutesPerOccasion;
  let schedule: DesignSchedule;
  if (template.schedule.kind === 'TRIGGER') {
    schedule = { kind: 'TRIGGER', trigger: template.schedule.trigger, minutesPerOccasion: minutes };
  } else {
    const occasions = useMinimum ? template.minimum.occasionsPerWeek ?? 1 : template.schedule.occasionsPerWeek;
    schedule = { kind: 'WEEKLY', occasionsPerWeek: occasions, minutesPerOccasion: minutes };
  }
  return { ...action, schedule, source: { ...action.source, usesMinimum: useMinimum } };
}

/** Body for PATCH actions. Server keeps source and trigger by key. */
export function actionsForSave(actions: DesignAction[]) {
  return actions.map((row) => ({
    key: row.key || undefined,
    title: row.title,
    doneWhen: row.doneWhen,
    cue: row.cue?.trim() ? row.cue : null,
    minimum: row.minimum?.trim() ? row.minimum : null,
    schedule: row.schedule,
    contentTags: row.contentTags,
    usesMinimum: row.source.kind === 'TEMPLATE' ? row.source.usesMinimum : undefined,
  }));
}

/** Same arithmetic as the server, for live feedback while editing. The server stays the authority. */
export function weeklyLoad(actions: DesignAction[], horizonWeeks: number): number[] {
  return Array.from({ length: Math.max(1, horizonWeeks) }, (_, index) => actions.reduce((sum, row) => {
    if (row.schedule.kind === 'WEEKLY') return sum + row.schedule.occasionsPerWeek * row.schedule.minutesPerOccasion;
    if (row.schedule.kind === 'ONCE') return row.schedule.week === index + 1 ? sum + row.schedule.minutesPerOccasion : sum;
    return sum + row.schedule.minutesPerOccasion;
  }, 0));
}

export function loadLine(byWeek: number[]): string {
  if (!byWeek.length) return 'Todavía no hay acciones.';
  const max = Math.max(...byWeek);
  const varies = byWeek.some((value) => value !== byWeek[0]);
  if (!varies) return `${max} minutos por semana.`;
  return `${byWeek.map((value, index) => `semana ${index + 1}: ${value} minutos`).join(', ')}.`;
}

export function formatCivilDate(iso: string | null | undefined): string {
  if (!iso) return 'sin fecha';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d} de ${months[(m ?? 1) - 1]} de ${y}`;
}
