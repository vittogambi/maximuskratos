import type { Pillar, Territory } from '../../instrumentos/glossary';

/**
 * What the accompaniment may use from the questionnaire and the nine purpose components.
 * A cell without a reference stays without information. It is not filled with a stereotype.
 */
export type SourceUse = {
  id: string;
  sourceRef: string | null;
  uses: string;
  allows: string;
  forbids: string;
  unknown: string;
  candidate: boolean;
  changes: string;
};

export const SOURCE_INVENTORY: SourceUse[] = [
  {
    id: 'R26',
    sourceRef: 'formulario-v1:E-AUD-001!R26',
    uses: 'Respuesta de planificación del núcleo.',
    allows: 'Si el valor es bajo, un candidato de preparación por aclarar.',
    forbids: 'No prueba falta de ocasión ni falta de motivación.',
    unknown: 'Sin respuesta, no se usa.',
    candidate: true,
    changes: 'La variante de preparación, solo si la persona reconoce el candidato.',
  },
  {
    id: 'R62',
    sourceRef: 'formulario-v1:E-AUD-001!R62',
    uses: 'Señal de sentido del núcleo.',
    allows: 'Citar que la persona reconoció una dirección, como contexto.',
    forbids: 'No elige el modo ni demuestra que la meta sea correcta.',
    unknown: 'Sin respuesta, la dirección se lee de la revisión de propósito, no se inventa.',
    candidate: false,
    changes: 'La razón puede citarla. No cambia la familia por sí sola.',
  },
  {
    id: 'R18',
    sourceRef: 'formulario-v1:F-RAD-001!R18',
    uses: 'Texto de salud guardado.',
    allows: 'Solo un no exacto cuenta como ausencia. Otro texto queda ambiguo.',
    forbids: 'No diagnostica ni baja el índice.',
    unknown: 'Sin respuesta, la acción que lo necesita pide aclaración.',
    candidate: true,
    changes: 'La compatibilidad de una acción con marcas de salud.',
  },
  {
    id: 'R20',
    sourceRef: 'formulario-v1:F-RAD-001!R20',
    uses: 'Historia de lesión.',
    allows: 'Contexto. Una lesión antigua no es un límite vigente.',
    forbids: 'No activa contención ni borra otros límites.',
    unknown: 'Sin respuesta, no se asume una lesión.',
    candidate: true,
    changes: 'Nada, hasta una aclaración de vigencia.',
  },
  {
    id: 'valores',
    sourceRef: null,
    uses: 'Valor elegido en la revisión de propósito o en el plan.',
    allows: 'Orientar una renuncia o la razón de la ayuda.',
    forbids: 'No demuestra cuál es la decisión correcta.',
    unknown: 'Si no hay valor elegido, la ayuda no inventa uno.',
    candidate: false,
    changes: 'La razón citada, no el modo.',
  },
  {
    id: 'estandares',
    sourceRef: null,
    uses: 'Estándar que la persona escribió.',
    allows: 'Servir de criterio si ella lo vincula a la meta.',
    forbids: 'No se convierte en una nota de cumplimiento.',
    unknown: 'Sin estándar, el criterio de terminado sale de la familia.',
    candidate: false,
    changes: 'El criterio, solo cuando está escrito.',
  },
  {
    id: 'vision',
    sourceRef: null,
    uses: 'Visión documentada en la hoja.',
    allows: 'Citarla si la meta la nombra.',
    forbids: 'No obliga a reconstruir el propósito.',
    unknown: 'Sin visión, no se completa la frase.',
    candidate: false,
    changes: 'Nada, salvo que la persona la use como razón.',
  },
  {
    id: 'dificultades',
    sourceRef: null,
    uses: 'Dificultad documentada.',
    allows: 'Recordar que puede haber una barrera por confirmar.',
    forbids: 'No se infiere la barrera ni la personalidad.',
    unknown: 'Sin texto, se pregunta si hace falta para la familia.',
    candidate: true,
    changes: 'La alternativa, solo tras una elección explícita.',
  },
  {
    id: 'identidad',
    sourceRef: null,
    uses: 'Trabajo de identidad en la hoja.',
    allows: 'Contexto de la dirección vivida.',
    forbids: 'No asigna un arquetipo ni un modo global.',
    unknown: 'Declinado o no fiable no se castiga en la ayuda.',
    candidate: false,
    changes: 'Nada de la familia.',
  },
  {
    id: 'personalidad',
    sourceRef: null,
    uses: 'Preferencia de ayuda, si está escrita.',
    allows: 'Ajustar el formato de la preparación cuando ella lo pidió.',
    forbids: 'No infiere la barrera de un borrador ni un diagnóstico.',
    unknown: 'Sin preferencia, se usa la familia tal como está.',
    candidate: false,
    changes: 'El formato, no la barrera.',
  },
  {
    id: 'origen',
    sourceRef: null,
    uses: 'Origen, solo si la persona quiere elaborarlo.',
    allows: 'Una reflexión voluntaria.',
    forbids: 'No inventa linaje ni baja la alineación si falta.',
    unknown: 'Desconocido, no aplica o declinado se conservan como tales.',
    candidate: false,
    changes: 'Nada de la meta, salvo una elaboración que ella pida.',
  },
  {
    id: 'ikigai',
    sourceRef: null,
    uses: 'Combinación e hipótesis de la síntesis.',
    allows: 'Una hipótesis contrastable, con observaciones separadas.',
    forbids: 'No confirma el propósito ni sube la alineación.',
    unknown: 'Sin combinación, la ficha deja la hipótesis pendiente.',
    candidate: false,
    changes: 'La ficha de experimento y su revisión.',
  },
  {
    id: 'huella',
    sourceRef: null,
    uses: 'Huella documentada.',
    allows: 'Citar una contribución que la persona ya eligió.',
    forbids: 'No prueba impacto en terceros.',
    unknown: 'Sin huella, la meta de contribución no se descarta.',
    candidate: false,
    changes: 'La razón de una meta de enseñanza, si ella la vinculó.',
  },
];

export type CrossCell = {
  territory: Territory;
  pillar: Pillar;
  meaning: string;
};

export const CROSS_CELLS: CrossCell[] = [
  { territory: 'MENTALIDAD', pillar: 'ESPIRITU', meaning: 'Qué merece la atención según visión y valores.' },
  { territory: 'MENTALIDAD', pillar: 'MENTE', meaning: 'Cómo decidir, preparar y aprender.' },
  { territory: 'MENTALIDAD', pillar: 'CUERPO', meaning: 'Qué se puede ejecutar con la capacidad disponible.' },
  { territory: 'RELACIONES', pillar: 'ESPIRITU', meaning: 'Qué vínculo y qué trato importan.' },
  { territory: 'RELACIONES', pillar: 'MENTE', meaning: 'Qué se comprende, se comunica o falta aclarar.' },
  { territory: 'RELACIONES', pillar: 'CUERPO', meaning: 'Qué encuentro o acuerdo es viable y consentido.' },
  { territory: 'FINANZAS', pillar: 'ESPIRITU', meaning: 'A qué prioridades servirán los recursos.' },
  { territory: 'FINANZAS', pillar: 'MENTE', meaning: 'Qué información verificable falta para decidir.' },
  { territory: 'FINANZAS', pillar: 'CUERPO', meaning: 'Qué obligaciones, fechas y recursos existen.' },
  { territory: 'SALUD_FISICA', pillar: 'ESPIRITU', meaning: 'Qué vida se quiere sostener o recuperar.' },
  { territory: 'SALUD_FISICA', pillar: 'MENTE', meaning: 'Qué límites e indicaciones se entienden.' },
  { territory: 'SALUD_FISICA', pillar: 'CUERPO', meaning: 'Qué cuidado o gestión resulta compatible.' },
];

export function cellEvidence(territory: Territory, pillar: Pillar, refs: string[]): { meaning: string; status: 'CON_REFERENCIA' | 'SIN_INFORMACION'; refs: string[] } {
  const cell = CROSS_CELLS.find((row) => row.territory === territory && row.pillar === pillar);
  return {
    meaning: cell?.meaning ?? 'Sin definición.',
    status: refs.length ? 'CON_REFERENCIA' : 'SIN_INFORMACION',
    refs,
  };
}

/** What the accompaniment rules actually read. The rest of the inventory is not a promise of use. */
export const READ_BY_ACCOMPANIMENT = [
  { id: 'R26', effect: 'Si el valor es bajo, candidato de preparación. No confirma la barrera ni prueba falta de ocasión.' },
  { id: 'valor-elegido', effect: 'Si la revisión de propósito trae value, entra en la razón. No cambia la familia.' },
  { id: 'limite-declarado', effect: 'Un límite vigente del mismo asunto bloquea una marca incompatible. Otro asunto no clasifica la cuenta.' },
  { id: 'salud-F-RAD-001', effect: 'R18, R20, R22, R24 y R27 arman el hecho de salud. Un no exacto es ausencia. Otro texto queda ambiguo.' },
  { id: 'ikigai-combinacion', effect: 'El experimento ya escrito llena la hipótesis de la ficha. No confirma el propósito.' },
  { id: 'meta-guardada', effect: 'Al retomar, sin un tipo nuevo, se usa el tipo de la última decisión aceptada.' },
] as const;

/** Listed in the inventory and not consulted by the rules. */
export const NOT_CONNECTED = ['R62', 'identidad', 'personalidad', 'origen', 'huella'] as const;

export function planningCandidate(raw: number | null | undefined): { kind: 'PLANIFICACION_POR_ACLARAR'; sourceRef: string } | null {
  if (raw == null || raw > 2) return null;
  return { kind: 'PLANIFICACION_POR_ACLARAR', sourceRef: 'formulario-v1:E-AUD-001!R26' };
}
