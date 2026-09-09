import type { ExperienceProjection, UserView } from './types';

const DOMAIN_LABEL: Record<string, string> = {
  MENTALIDAD: 'Mentalidad',
  RELACIONES: 'Relaciones',
  FINANZAS: 'Finanzas',
  CUERPO: 'Cuerpo',
  PURPOSE: 'Propósito',
  NONE: 'Ninguno',
};

function formatDay(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

export function toUserView(projection: ExperienceProjection): UserView {
  let focus = 'Todavía no confirmamos un foco.';
  if (projection.restrictions.includes('INSUFFICIENT_DATA')) {
    focus = 'Todavía no tenemos información suficiente para recomendar un foco.';
  } else if (projection.focus.awaiting_selection && projection.focus.tie_break_provisional) {
    focus =
      'Matrix sugiere Mentalidad como candidato. Los cuatro ámbitos están empatados y el desempate es provisional.';
  } else if (projection.focus.awaiting_selection && projection.focus.matrix_candidate) {
    focus = `Matrix sugiere ${DOMAIN_LABEL[projection.focus.matrix_candidate] ?? projection.focus.matrix_candidate} como candidato. Falta tu confirmación.`;
  } else if (projection.focus.selected_focus === 'NONE') {
    focus = 'Este mes no hay foco confirmado.';
  } else if (projection.focus.selected_focus === 'PURPOSE') {
    focus = 'El foco elegido es explorar Propósito.';
  } else if (projection.focus.selected_focus) {
    focus = `El foco de este ciclo es ${DOMAIN_LABEL[projection.focus.selected_focus]}.`;
  }

  let whyNow = 'Aún no hay una decisión de foco.';
  if (projection.safety.blocked) {
    whyNow = 'Hay una alerta que impide una acción ejecutable. La dirección puede seguir visible.';
  } else if (projection.restrictions.includes('INSUFFICIENT_DATA')) {
    whyNow = 'Falta información para recomendar un foco.';
  } else if (projection.focus.tie_break_provisional && projection.focus.awaiting_selection) {
    whyNow = 'Los cuatro ámbitos salieron empatados. El candidato de Matrix es un desempate provisional, no una certeza.';
  } else if (projection.focus.selected_focus === 'PURPOSE') {
    whyNow = 'Elegiste trabajar Propósito. Eso no es un plan de Matrix.';
  } else if (projection.focus.selected_focus && projection.focus.selected_focus !== 'NONE') {
    const reason = projection.focus.selection_reason?.trim();
    whyNow = reason || 'No se registró una justificación para esta elección.';
  }

  let thisWeek = 'Todavía no hay una acción escrita para esta semana.';
  if (projection.safety.blocked) {
    thisWeek = 'No hay acción ejecutable mientras la alerta crítica siga activa.';
  } else if (projection.action.text) {
    thisWeek = projection.action.text;
  }

  let objective = 'Todavía no hay un objetivo elegido.';
  if (projection.objective.needs_human_curation && !projection.objective.selected_id) {
    objective = 'Esta ruta de Propósito necesita curación humana. No hay objetivos inventados.';
  } else if (projection.objective.selected_id) {
    objective = projection.objective.selected_id;
  }

  return {
    direction: projection.direction.display,
    cycle: {
      start: projection.cycle.start,
      end: projection.cycle.end,
      label: `Ciclo 1, ${formatDay(projection.cycle.start)} a ${formatDay(projection.cycle.end)}`,
    },
    focus,
    why_now: whyNow,
    objective,
    this_week: thisWeek,
    map: projection.profile.domains.map((domain) => ({
      key: DOMAIN_LABEL[domain.key] ?? domain.key,
      state: domain.state,
    })),
  };
}

export function userViewHasForbiddenMetadata(view: UserView, projection: ExperienceProjection): boolean {
  const blob = JSON.stringify(view);
  if (blob.includes('LAB-')) return true;
  if (blob.includes('PH-')) return true;
  if (blob.includes('dimension_scores')) return true;
  if (blob.includes('Purpose Score') || blob.includes('PurposeScore')) return true;
  if (blob.includes(projection.provenance.matrix_definition_sha256)) return true;
  if (view.focus.includes('experimental')) return true;
  return false;
}
