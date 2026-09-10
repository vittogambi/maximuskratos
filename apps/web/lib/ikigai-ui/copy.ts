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
    editorLabel: 'Añade una idea',
    adoptQuestion: '¿Cómo aparece esto en tu vida?',
    writeEmpty: 'Añadir',
  },
  CAPACIDAD: {
    editorLabel: 'Añade una idea',
    adoptQuestion: '¿Cómo aparece esto en tu vida?',
    writeEmpty: 'Añadir',
  },
  NECESIDAD: {
    editorLabel: 'Añade una idea',
    adoptQuestion: '¿Cómo aparece esto en tu vida?',
    writeEmpty: 'Añadir',
  },
  VALOR: {
    editorLabel: 'Añade una idea',
    adoptQuestion: '¿Cómo aparece esto en tu vida?',
    writeEmpty: 'Añadir',
  },
};

export const EXPLORE_LEAD = 'Puedes escribir las tuyas o explorar algunas ideas.';
export const EXPLORE_DISCLAIMER = 'Son ideas para reconocer, no respuestas que tengas que elegir.';
export const EXPLORE_ALL = 'Todas';
export const EXPLORE_SEARCH = 'Buscar';
export const EXAMPLES_DISCLAIMER = EXPLORE_DISCLAIMER;
export const UNCLEAR_LABEL = 'Todavía no tengo claro qué poner aquí';
export const CONTINUE_NUDGE = 'Puedes seguir. Si se te ocurre algo más después, podrás volver.';
export const REVIEW_LABEL = 'Versión en revisión';
export const HYPOTHESIS_PLACEHOLDER = 'Una dirección que quiero explorar es…';
export const CONTRAST_ONE_NOTE =
  'En esta versión contrastas primero una dirección. Si escribiste más, quedan en el mapa.';

export const HYPOTHESIS_GUIDE_ITEMS = [
  'qué te mueve;',
  'qué puedes aportar;',
  'a quién o a qué atiendes;',
  'cómo puede sostenerse.',
];

export const HYPOTHESIS_GUIDE_NOTE =
  'Puedes pensar en esas cuatro lentes. No hace falta que todas entren. No declares un propósito cerrado.';

export const RELATE_LEAD = 'Toca las piezas que, para ti, parecen formar parte de una misma dirección.';
