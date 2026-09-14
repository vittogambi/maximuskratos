import type { IkigaiFieldKey } from '@/lib/ikigai-api';

/** Chrome only. Lens prompt, help and title come from the definition. */
export const FIELD_UI: Record<
  IkigaiFieldKey,
  {
    editorLabel: string;
    adoptQuestion: string;
    writeEmpty: string;
  }
> = {
  PASION: {
    editorLabel: 'Escribe tu pieza',
    adoptQuestion: '¿Cómo aparece esto en tu vida?',
    writeEmpty: 'Escribir una pieza',
  },
  CAPACIDAD: {
    editorLabel: 'Escribe tu pieza',
    adoptQuestion: '¿Cómo aparece esto en tu vida?',
    writeEmpty: 'Escribir una pieza',
  },
  NECESIDAD: {
    editorLabel: 'Escribe tu pieza',
    adoptQuestion: '¿Cómo aparece esto en tu vida?',
    writeEmpty: 'Escribir una pieza',
  },
  VALOR: {
    editorLabel: 'Escribe tu pieza',
    adoptQuestion: '¿Cómo aparece esto en tu vida?',
    writeEmpty: 'Escribir una pieza',
  },
};

export const PIECES_TITLE = 'Mis piezas';
export const PIECES_EMPTY = 'Todavía no hay piezas en este lente.';
export const PIECES_EMPTY_LEAD = 'Empieza con algo tuyo o mira ideas para inspirarte.';
export const PIECES_FULL = 'Cinco piezas es suficiente para este lente.';

export const EXPLORE_LEAD = 'Puedes escribir las tuyas o explorar algunas ideas.';
export const EXPLORE_DISCLAIMER = 'Son ideas para reconocer, no respuestas que tengas que elegir.';
export const BANK_TITLE = 'Explorar ideas';
export const EXPLORE_CTA = 'Ver ideas';
export const EXIT_TITLE = '¿Salir por ahora?';
export const EXIT_BODY = 'Tu avance queda guardado y puedes continuar después.';
export const EXIT_STAY = 'Seguir aquí';
export const EXIT_LEAVE = 'Salir';
export const BACK_LABEL = 'Atrás';
export const EXPLORE_ALL = 'Todas';
export const EXPLORE_SEARCH = 'Buscar';
export const EXAMPLES_DISCLAIMER = EXPLORE_DISCLAIMER;
export const UNCLEAR_LABEL = 'Todavía no lo tengo claro';
export const CONTINUE_NUDGE = 'Puedes seguir. Si se te ocurre algo más después, podrás volver.';
export const FIELD_CTA_HINT = 'Para continuar, escribe una pieza o marca que todavía no lo tienes claro.';
export const REVIEW_LABEL = 'Versión en revisión';
export const HYPOTHESIS_PLACEHOLDER = 'Una dirección que quiero explorar es…';
export const CONTRAST_SUBJECT = 'La dirección que estás contrastando';
export const CONTRAST_ONE_NOTE =
  'En esta versión contrastas primero una dirección. Si escribiste más, quedan en el mapa.';
export const ANSWERS_FRAME = 'Según tus respuestas';
export const EXPERIMENT_INVITE = 'Ponerla a prueba';

export const HYPOTHESIS_GUIDE_ITEMS = [
  'qué te mueve;',
  'qué puedes aportar;',
  'a quién o a qué atiendes;',
  'cómo puede sostenerse.',
];

export const HYPOTHESIS_GUIDE_NOTE =
  'Puedes pensar en esas cuatro lentes. No hace falta que todas entren. No declares un propósito cerrado.';

export const RELATE_LEAD = 'Toca las piezas que, para ti, parecen formar parte de una misma dirección.';
export const RELATE_EMPTY =
  'Todavía no hay piezas para conectar. Vuelve a explorar y añade al menos una.';
export const RELATE_NO_PIECES_PREFIX = 'Sin piezas todavía:';
export const TRAY_LABEL = 'Esta dirección';
export const TRAY_EMPTY = 'Toca piezas y aparecerán aquí.';
export const WRITE_PIECES_LABEL = 'Piezas de esta dirección';
export const SAVE_DIRECTION = 'Guardar dirección';
export const EMPTY_AREAS_LEAD = 'Todavía no hay piezas en:';
export const THIN_AREAS_LEAD = 'Todavía hay poco material en:';
