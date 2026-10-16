export type NextStep = { href: string; label: string; detail: string };

export type NextStepInput = {
  /** A persisted reading of a completed formulario completo session exists. */
  formularioCompleted: boolean;
  hasActiveSession: boolean;
  activeResponses: number | null;
  /** The latest direction is one that lets a member plan. Confirmation is not required. */
  directionWorks: boolean;
  activePlan: { actions: { id: string }[] } | null;
  weekClosed: boolean;
  weekRecords: number;
};

export function nextStep(input: NextStepInput): NextStep {
  if (input.hasActiveSession && (input.activeResponses ?? 0) === 0) {
    return { href: '/diagnostico', label: 'Comenzar la auditoría', detail: 'La sesión está abierta y todavía no tiene respuestas.' };
  }
  if (input.hasActiveSession) {
    return { href: '/diagnostico', label: 'Continuar la auditoría', detail: 'Retoma tu auditoría donde la dejaste.' };
  }
  if (!input.formularioCompleted) {
    return { href: '/diagnostico', label: 'Comenzar la auditoría', detail: 'Todavía no hay una ficha cerrada.' };
  }
  if (!input.directionWorks) {
    return {
      href: '/proposito',
      label: 'Abrir la hoja de ruta',
      detail: 'Falta elegir una dirección en la hoja. Puedes dejarla en exploración.',
    };
  }
  if (!input.activePlan) {
    return { href: '/planes', label: 'Crear el plan', detail: 'Ya hay una dirección en la hoja y no hay un plan vigente.' };
  }
  if (input.activePlan.actions.length === 0) {
    return { href: '/planes', label: 'Agregar una acción', detail: 'El plan vigente no tiene acciones.' };
  }
  if (!input.weekClosed && input.weekRecords === 0) {
    return { href: '/calendario', label: 'Abrir el calendario', detail: 'Hay acciones de esta semana sin registro.' };
  }
  if (!input.weekClosed) {
    return { href: '/calendario', label: 'Revisar la semana', detail: 'Hay registros y la semana sigue abierta.' };
  }
  return {
    href: '/calendario',
    label: 'Continuar',
    detail: 'Esta semana está cerrada. Las decisiones de cierre ya quedaron en el plan vigente.',
  };
}
