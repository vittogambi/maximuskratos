import type { ContentTag } from '../../instrumentos/restrictions';
import type { Pillar, Territory } from '../../instrumentos/glossary';
import type { Mode } from './vocab';

export type ArtifactKind = 'GUION' | 'LISTA' | 'DEFINICION_TERMINADO' | 'FICHA_EXPERIMENTO' | 'NOTA';

export type FamilyField = {
  key: string;
  label: string;
};

export type FamilyDef = {
  id: string;
  templateVersion: string;
  territory: Territory | null;
  pillar: Pillar | null;
  mode: Mode | null;
  tags: ContentTag[];
  action: string;
  artifactKind: ArtifactKind;
  fields: FamilyField[];
  doneWhen: string;
  minimumVersion: string;
  alternativeText: string;
  learningQuestion: string;
  expectedEvidence: string;
  forbids: string[];
  stopIf: string[];
  /** Editorial origin only. It does not import a matrix runtime. */
  editorialRef: string;
};

const version = 'catalogo-acompanamiento@0.1';

function family(row: Omit<FamilyDef, 'templateVersion'>): FamilyDef {
  return { ...row, templateVersion: version };
}

export const FAMILIES: FamilyDef[] = [
  family({
    id: 'MEN-CONT',
    territory: 'MENTALIDAD',
    pillar: 'MENTE',
    mode: 'CONTENCION',
    tags: [],
    action: 'Escribe qué es esencial sostener esta semana y qué acción queda fuera porque no es compatible.',
    artifactKind: 'NOTA',
    fields: [
      { key: 'esencial', label: 'Qué proteges' },
      { key: 'fuera', label: 'Qué queda fuera' },
    ],
    doneWhen: 'Quedó escrito el límite de esta semana y la acción que no vas a hacer.',
    minimumVersion: 'Una frase con el límite. Sin una tarea extra.',
    alternativeText: 'Si ni siquiera esa frase cabe, la pausa sigue disponible y no tiene fecha de regreso.',
    learningQuestion: '¿El límite quedó claro, o todavía falta un dato para decidirlo?',
    expectedEvidence: 'El texto del límite. No certifica una resolución profesional.',
    forbids: ['Diagnosticar', 'Subir la exigencia para compensar'],
    stopIf: ['Aparece una incompatibilidad nueva'],
    editorialRef: 'Mentalidad, contención. Referencia editorial, no un programa de semanas.',
  }),
  family({
    id: 'MEN-EST',
    territory: 'MENTALIDAD',
    pillar: 'MENTE',
    mode: 'ESTABILIZACION',
    tags: [],
    action: 'Prepara una parte revisable del entregable y protégela en las ocasiones que declaraste.',
    artifactKind: 'DEFINICION_TERMINADO',
    fields: [
      { key: 'entregable', label: 'Qué se puede revisar' },
      { key: 'primera', label: 'Primera parte' },
    ],
    doneWhen: 'La ocasión ocurrió y quedó una parte que otra persona podría revisar.',
    minimumVersion: 'Una página o un bloque, sin cerrar el trabajo completo.',
    alternativeText: 'Si la ocasión no existe, deja el material abierto y mueve solo la fecha futura.',
    learningQuestion: '¿La preparación hizo avanzar el entregable, o solo ordenó el entorno?',
    expectedEvidence: 'La parte revisable, separada de si alguien ya la comentó.',
    forbids: ['Inventar un horario', 'Exigir el trabajo completo'],
    stopIf: ['La carga no cabe en lo declarado'],
    editorialRef: 'Mentalidad, estabilización.',
  }),
  family({
    id: 'MEN-CONS',
    territory: 'MENTALIDAD',
    pillar: 'MENTE',
    mode: 'CONSOLIDACION',
    tags: [],
    action: 'Repite la estrategia que ya dio un resultado y anota la fricción que todavía la hace frágil.',
    artifactKind: 'NOTA',
    fields: [
      { key: 'estrategia', label: 'Qué se repite' },
      { key: 'friccion', label: 'Fricción a resolver' },
    ],
    doneWhen: 'La estrategia se usó otra vez y quedó escrito el criterio con el que la sostienes.',
    minimumVersion: 'Una repetición, no un rediseño.',
    alternativeText: 'Si la carga ya no es tolerable, vuelve a una versión más corta en lugar de ampliar.',
    learningQuestion: '¿El resultado se mantuvo con una carga que puedes sostener?',
    expectedEvidence: 'Una observación favorable nueva, en una ocasión distinta.',
    forbids: ['Subir de modo por un porcentaje de tareas'],
    stopIf: ['La evidencia favorable era de una sola ocasión y no elegiste sostenerla'],
    editorialRef: 'Mentalidad, consolidación.',
  }),
  family({
    id: 'MEN-EXP',
    territory: 'MENTALIDAD',
    pillar: 'ESPIRITU',
    mode: 'EXPANSION',
    tags: [],
    action: 'Prepara la secuencia de una tarea que ya dominas y una forma de comprobar si la explicación se entiende.',
    artifactKind: 'GUION',
    fields: [
      { key: 'tarea', label: 'Tarea que vas a explicar' },
      { key: 'secuencia', label: 'Secuencia' },
      { key: 'comprobacion', label: 'Cómo sabrás si se entendió' },
      { key: 'destinatario', label: 'Destinatario, si lo hay' },
    ],
    doneWhen: 'Quedó escrita la secuencia y la comprobación. Preparar el material no prueba que haya sido útil.',
    minimumVersion: 'La secuencia de una sola tarea, sin destinatario si todavía no hay uno.',
    alternativeText: 'Si no hay destinatario, preparar el material es un paso distinto. Todavía no prueba utilidad.',
    learningQuestion: '¿Qué se entendió, y qué solo te quedó claro a ti mientras preparabas?',
    expectedEvidence: 'La secuencia preparada. La utilidad queda pendiente hasta una observación separada.',
    forbids: ['Tomar la preparación como utilidad', 'Inventar un destinatario', 'Exigir que todos los ámbitos estén altos'],
    stopIf: ['No hay una tarea que ya domines', 'La ocasión no cabe'],
    editorialRef: 'Mentalidad, expansión. Enseñar o entregar un incremento.',
  }),
  family({
    id: 'REL-CONT',
    territory: 'RELACIONES',
    pillar: 'ESPIRITU',
    mode: 'CONTENCION',
    tags: [],
    action: 'Identifica una vía de apoyo que no empiece por confrontar, y escribe qué límite quieres proteger.',
    artifactKind: 'NOTA',
    fields: [
      { key: 'limite', label: 'Límite a proteger' },
      { key: 'via', label: 'Vía de apoyo sin confrontación' },
    ],
    doneWhen: 'Quedó la vía y el límite. No se envió un mensaje.',
    minimumVersion: 'El límite por escrito, aunque la vía siga pendiente.',
    alternativeText: 'Puedes dejar la conversación para otro momento y conservar el texto privado.',
    learningQuestion: '¿La vía que elegiste evita una confrontación que no quieres tener ahora?',
    expectedEvidence: 'El texto privado. El silencio de otra persona no es consentimiento.',
    forbids: ['Confrontación como primer paso', 'Interpretar el silencio como acuerdo'],
    stopIf: ['Declaraste que la conversación no es segura'],
    editorialRef: 'Relaciones, contención.',
  }),
  family({
    id: 'REL-EST',
    territory: 'RELACIONES',
    pillar: 'ESPIRITU',
    mode: 'ESTABILIZACION',
    tags: [],
    action: 'Escribe el pedido o el cuidado que sería viable para las dos partes, y decide si el contacto cabe ahora.',
    artifactKind: 'GUION',
    fields: [
      { key: 'pedido', label: 'Pedido o cuidado' },
      { key: 'viabilidad', label: 'Viable, no viable o todavía no lo sé' },
    ],
    doneWhen: 'Quedó la decisión de viabilidad. El mensaje no se envía si la decisión es no viable o todavía no lo sé.',
    minimumVersion: 'La decisión escrita, sin enviar nada.',
    alternativeText: 'Un texto privado cumple el paso si el contacto no es viable.',
    learningQuestion: '¿La viabilidad quedó decidida, o sigues sin el dato que la cambia?',
    expectedEvidence: 'La decisión. No un acuerdo que la otra persona no haya dado.',
    forbids: ['Empezar por confrontar', 'Contar el silencio como respuesta favorable'],
    stopIf: ['La conversación se declaró no segura'],
    editorialRef: 'Relaciones, estabilización.',
  }),
  family({
    id: 'REL-CONS',
    territory: 'RELACIONES',
    pillar: 'ESPIRITU',
    mode: 'CONSOLIDACION',
    tags: [],
    action: 'Revisa un acuerdo que ya funcionó y una fricción que hayas observado, sin abrir un conflicto nuevo.',
    artifactKind: 'NOTA',
    fields: [
      { key: 'acuerdo', label: 'Acuerdo que se sostiene' },
      { key: 'friccion', label: 'Fricción observada' },
    ],
    doneWhen: 'Quedó qué se mantiene del acuerdo y qué fricción vas a tratar.',
    minimumVersion: 'Una nota del acuerdo, si la conversación no cabe esta semana.',
    alternativeText: 'Si la otra persona no está disponible, la nota queda y el contacto espera.',
    learningQuestion: '¿El acuerdo se sostuvo sin una carga que no habías elegido?',
    expectedEvidence: 'La nota del acuerdo y de la fricción. No una métrica de cantidad de vínculos.',
    forbids: ['Medir la relación por cantidad de contactos'],
    stopIf: ['No hay un resultado favorable previo de esa estrategia'],
    editorialRef: 'Relaciones, consolidación.',
  }),
  family({
    id: 'REL-EXP',
    territory: 'RELACIONES',
    pillar: 'ESPIRITU',
    mode: 'EXPANSION',
    tags: [],
    action: 'Define una colaboración pequeña que tú elegiste, con un resultado observable y una salida si no hay respuesta.',
    artifactKind: 'GUION',
    fields: [
      { key: 'colaboracion', label: 'Colaboración' },
      { key: 'resultado', label: 'Resultado observable' },
      { key: 'salida', label: 'Qué harás si no hay respuesta' },
    ],
    doneWhen: 'Quedó el encargo y la salida. La falta de respuesta no se anota como rechazo ni como demanda.',
    minimumVersion: 'El encargo escrito, sin enviarlo si falta la ocasión.',
    alternativeText: 'Preparar el encargo no es lo mismo que comprobar que la colaboración sirvió.',
    learningQuestion: '¿Qué se pudo hacer juntos, y qué sigue sin evidencia?',
    expectedEvidence: 'El encargo. La utilidad queda en una observación aparte.',
    forbids: ['Inventar un acuerdo', 'Tomar el silencio como demanda'],
    stopIf: ['No hay una colaboración que hayas elegido'],
    editorialRef: 'Relaciones, expansión.',
  }),
  family({
    id: 'FIN-CONT',
    territory: 'FINANZAS',
    pillar: 'MENTE',
    mode: 'CONTENCION',
    tags: [],
    action: 'Anota las obligaciones y los documentos que ya conoces, y marca lo que todavía no está a la vista.',
    artifactKind: 'LISTA',
    fields: [
      { key: 'conocidas', label: 'Obligaciones conocidas' },
      { key: 'documentos', label: 'Documentos que ya tienes' },
      { key: 'faltan', label: 'Qué falta ver' },
    ],
    doneWhen: 'La lista distingue lo conocido de lo que falta. No incluye una recomendación de invertir o de endeudarte.',
    minimumVersion: 'Las obligaciones que recuerdas, aunque falten fechas.',
    alternativeText: 'Si falta un documento, la lista queda incompleta a propósito y no se inventa el dato.',
    learningQuestion: '¿Qué fecha o documento, si apareciera, cambiaría la próxima decisión?',
    expectedEvidence: 'La lista. No un diagnóstico de insolvencia.',
    forbids: ['Inversión', 'Deuda', 'Inventar montos'],
    stopIf: ['La ayuda pedida exige invertir o endeudarte'],
    editorialRef: 'Finanzas, contención.',
  }),
  family({
    id: 'FIN-EST',
    territory: 'FINANZAS',
    pillar: 'MENTE',
    mode: 'ESTABILIZACION',
    tags: [],
    action: 'Arma un registro de obligaciones conocidas y un recordatorio en una ocasión que sí puedes usar.',
    artifactKind: 'LISTA',
    fields: [
      { key: 'obligaciones', label: 'Obligaciones' },
      { key: 'fechas', label: 'Fechas conocidas' },
      { key: 'pendientes', label: 'Fechas que faltan' },
    ],
    doneWhen: 'El registro existe y separa fechas conocidas de fechas pendientes.',
    minimumVersion: 'Una obligación con su fecha, o con la fecha marcada como pendiente.',
    alternativeText: 'Si no hay una hora fija por turnos, el recordatorio queda en una ocasión flexible, sin un día inventado.',
    learningQuestion: '¿El registro te alcanzó para ver la próxima fecha, o todavía falta un documento?',
    expectedEvidence: 'El registro. Un ingreso distinto no cambia el índice.',
    forbids: ['Inversión', 'Deuda', 'Una hora fija para cualquier turno'],
    stopIf: ['Se pide invertir o endeudarte para seguir'],
    editorialRef: 'Finanzas, estabilización.',
  }),
  family({
    id: 'FIN-CONS',
    territory: 'FINANZAS',
    pillar: 'MENTE',
    mode: 'CONSOLIDACION',
    tags: [],
    action: 'Revisa la información que ya usaste y la asignación que tú declaraste, sin abrir una decisión de inversión.',
    artifactKind: 'LISTA',
    fields: [
      { key: 'informacion', label: 'Información que se sostiene' },
      { key: 'asignacion', label: 'Asignación declarada' },
    ],
    doneWhen: 'Quedó qué información sigue vigente y qué asignación declarada se mantiene.',
    minimumVersion: 'Una revisión de la lista, sin un producto financiero nuevo.',
    alternativeText: 'Si falta un dato verificable, se anota como pendiente y no se completa con una cifra.',
    learningQuestion: '¿La asignación declarada sigue siendo usable con la carga de esta semana?',
    expectedEvidence: 'La revisión de la lista. No un rendimiento.',
    forbids: ['Inversión', 'Deuda', 'Mezclar monedas y conteos en un índice'],
    stopIf: ['No hay un resultado favorable de ese registro'],
    editorialRef: 'Finanzas, consolidación.',
  }),
  family({
    id: 'FIN-EXP',
    territory: 'FINANZAS',
    pillar: 'MENTE',
    mode: 'EXPANSION',
    tags: [],
    action: 'Define un proyecto pequeño dentro de los límites que ya expresaste, con el dinero y las fechas que conoces.',
    artifactKind: 'DEFINICION_TERMINADO',
    fields: [
      { key: 'proyecto', label: 'Proyecto' },
      { key: 'limite', label: 'Límite expreso' },
      { key: 'recurso', label: 'Recurso conocido' },
    ],
    doneWhen: 'El proyecto cabe en el límite escrito. No pide invertir ni endeudarte.',
    minimumVersion: 'El límite y el primer gasto o trámite conocido, si lo hay.',
    alternativeText: 'Si el proyecto solo avanza invirtiendo o endeudándote, esa vía no se propone. Puedes ordenar obligaciones en su lugar, si lo apruebas.',
    learningQuestion: '¿El proyecto avanzó dentro del límite, o apareció un dato que lo cambia?',
    expectedEvidence: 'El límite escrito y el paso. No una rentabilidad.',
    forbids: ['Inversión', 'Deuda'],
    stopIf: ['El paso pide invertir o endeudarte'],
    editorialRef: 'Finanzas, expansión.',
  }),
  family({
    id: 'SAL-CONT',
    territory: 'SALUD_FISICA',
    pillar: 'CUERPO',
    mode: 'CONTENCION',
    tags: [],
    action: 'Prepara la gestión que ya elegiste, compatible con el límite vigente, y anota qué no vas a hacer.',
    artifactKind: 'LISTA',
    fields: [
      { key: 'gestion', label: 'Gestión' },
      { key: 'datos', label: 'Información que vas a llevar' },
      { key: 'fuera', label: 'Qué queda fuera' },
    ],
    doneWhen: 'La gestión quedó preparada o pedida. No es una prescripción.',
    minimumVersion: 'La lista de lo que vas a preguntar o el trámite, sin una sesión física.',
    alternativeText: 'Si el turno cambia, se mueve la ocasión futura. Los días sin ocasión no son incumplimientos.',
    learningQuestion: '¿La gestión era compatible con el límite que declaraste hoy?',
    expectedEvidence: 'La gestión preparada. No un diagnóstico ni una progresión física.',
    forbids: ['Esfuerzo físico', 'Dieta', 'Suplemento', 'Medicación', 'Borrar un límite vigente al cerrar la semana'],
    stopIf: ['La acción contradice un límite vigente de este asunto'],
    editorialRef: 'Salud física, contención. Gestión, no prescripción.',
  }),
  family({
    id: 'SAL-EST',
    territory: 'SALUD_FISICA',
    pillar: 'CUERPO',
    mode: 'ESTABILIZACION',
    tags: [],
    action: 'Organiza el cuidado que ya elegiste y que sigue siendo compatible con tus límites actuales.',
    artifactKind: 'LISTA',
    fields: [
      { key: 'cuidado', label: 'Cuidado elegido' },
      { key: 'ocasion', label: 'Ocasión real' },
      { key: 'restriccion', label: 'Restricción vigente' },
    ],
    doneWhen: 'El cuidado quedó en una ocasión compatible, o quedó anotado por qué esta semana no cabe.',
    minimumVersion: 'Una ocasión del cuidado ya elegido, sin agregar carga.',
    alternativeText: 'Si hoy no es compatible, prepara la pregunta para quien te atiende y no inventes una progresión.',
    learningQuestion: '¿El cuidado elegido pudo ocurrir sin contradecir el límite?',
    expectedEvidence: 'La ocasión o la razón de la pausa. No una marca de adherencia.',
    forbids: ['Esfuerzo físico no indicado', 'Dieta', 'Suplemento', 'Medicación'],
    stopIf: ['El cuidado elegido contradice un límite vigente'],
    editorialRef: 'Salud física, estabilización.',
  }),
  family({
    id: 'SAL-CONS',
    territory: 'SALUD_FISICA',
    pillar: 'CUERPO',
    mode: 'CONSOLIDACION',
    tags: [],
    action: 'Revisa si el cuidado que ya dio una señal favorable sigue siendo sostenible con la carga actual.',
    artifactKind: 'NOTA',
    fields: [
      { key: 'cuidado', label: 'Cuidado que se sostiene' },
      { key: 'carga', label: 'Carga de esta semana' },
    ],
    doneWhen: 'Quedó si el cuidado se mantiene, se acorta o se pausa, con la carga escrita.',
    minimumVersion: 'La nota de sostenibilidad, aunque esta semana la ocasión sea más corta.',
    alternativeText: 'Si la carga ya no es tolerable, acortar es la alternativa. No se compensa con más exigencia.',
    learningQuestion: '¿El cuidado se sostuvo sin una carga que no podías usar?',
    expectedEvidence: 'La nota. No un índice de sueño, dolor y desempeño mezclados.',
    forbids: ['Progresión física', 'Dieta', 'Suplemento'],
    stopIf: ['No hay evidencia favorable de ese cuidado'],
    editorialRef: 'Salud física, consolidación.',
  }),
  family({
    id: 'SAL-EXP',
    territory: 'SALUD_FISICA',
    pillar: 'CUERPO',
    mode: 'EXPANSION',
    tags: ['PHYSICAL_EXERTION'],
    action: 'Organiza una meta de actividad dentro de la indicación que declaraste: actividad, asunto, alcance y restricciones.',
    artifactKind: 'DEFINICION_TERMINADO',
    fields: [
      { key: 'actividad', label: 'Actividad indicada' },
      { key: 'asunto', label: 'Asunto' },
      { key: 'alcance', label: 'Alcance declarado' },
      { key: 'restricciones', label: 'Restricciones declaradas' },
    ],
    doneWhen: 'La meta cabe en el alcance declarado. MK no verifica una credencial ni redacta una prescripción.',
    minimumVersion: 'El alcance escrito, sin aumentar la carga si la indicación no lo incluye.',
    alternativeText: 'Sin una indicación que cubra esta actividad, la alternativa es una gestión o el cuidado ya elegido, y hace falta tu aprobación.',
    learningQuestion: '¿La actividad quedó dentro del alcance que declaraste, o se salió de él?',
    expectedEvidence: 'El alcance declarado por ti. No una autorización profesional verificada por MK.',
    forbids: ['Prescripción', 'Dieta', 'Suplemento', 'Medicación', 'Otra actividad fuera del alcance'],
    stopIf: ['Falta actividad, asunto, alcance o restricciones', 'El límite vigente contradice la actividad'],
    editorialRef: 'Salud física, expansión. Solo dentro de una indicación declarada.',
  }),
  family({
    id: 'X-PAUSE',
    territory: null,
    pillar: null,
    mode: null,
    tags: [],
    action: 'Sostener la pausa. No hay una acción nueva ni una fecha para volver.',
    artifactKind: 'NOTA',
    fields: [{ key: 'motivo', label: 'Por qué pausas, si quieres anotarlo' }],
    doneWhen: 'No aparece una tarea nueva ni un incumplimiento de días sin ocasión.',
    minimumVersion: 'La pausa, sin texto obligatorio.',
    alternativeText: 'Puedes volver cuando elijas una carga. Ese regreso no está programado.',
    learningQuestion: '¿La pausa era lo que necesitabas, o falta aclarar un límite?',
    expectedEvidence: 'La decisión de pausar. No una racha ni un abandono.',
    forbids: ['Fecha obligatoria de regreso', 'Obligaciones retroactivas', 'Contención automática'],
    stopIf: [],
    editorialRef: 'Pausa. Situación del recorrido, no un modo.',
  }),
  family({
    id: 'X-RETURN',
    territory: null,
    pillar: null,
    mode: null,
    tags: [],
    action: 'Recupera la meta, la dirección y los límites, y elige qué conservar, cambiar o dejar en pausa desde hoy.',
    artifactKind: 'NOTA',
    fields: [
      { key: 'vigente', label: 'Qué sigue vigente' },
      { key: 'cambia', label: 'Qué cambia desde hoy' },
      { key: 'pausa', label: 'Qué queda en pausa' },
    ],
    doneWhen: 'Confirmaste el ajuste del futuro. Los registros y la lectura anterior siguen en su fecha.',
    minimumVersion: 'La elección de conservar, cambiar o pausar, aunque la meta siga por aclarar.',
    alternativeText: 'Si falta el contexto, se pregunta antes de proponer un modo. No se inventan incumplimientos.',
    learningQuestion: '¿Qué del plan anterior sigue siendo compatible con la capacidad de ahora?',
    expectedEvidence: 'La decisión de hoy. La lectura anterior no se presenta como una medición nueva.',
    forbids: ['Regenerar obligaciones pasadas', 'Aplicar un cierre atrasado', 'Pasar a contención por haber faltado'],
    stopIf: ['Falta la disponibilidad actual'],
    editorialRef: 'Retorno. Situación del recorrido, no un modo.',
  }),
  family({
    id: 'X-RECONFIRM',
    territory: null,
    pillar: null,
    mode: null,
    tags: [],
    action: 'Responde de nuevo solo las señales cuya captura no era elegible.',
    artifactKind: 'NOTA',
    fields: [{ key: 'señales', label: 'Señales a reconfirmar' }],
    doneWhen: 'La lectura nueva dice de dónde sale. No se llama mejora.',
    minimumVersion: 'Las señales no elegibles, sin repetir el cuestionario entero si no hace falta.',
    alternativeText: 'Puedes dejar la reconfirmación para cuando quieras. La lectura anterior sigue fechada.',
    learningQuestion: '¿La captura nueva es elegible, o sigue sin ser comparable?',
    expectedEvidence: 'La procedencia de la lectura. La diferencia automática no se anuncia como mejora.',
    forbids: ['Reescribir respuestas viejas', 'Anunciar una mejora'],
    stopIf: [],
    editorialRef: 'Reconfirmación.',
  }),
  family({
    id: 'X-IKIGAI',
    territory: 'MENTALIDAD',
    pillar: 'ESPIRITU',
    mode: 'EXPANSION',
    tags: [],
    action: 'Arma una prueba pequeña de la combinación: hipótesis, muestra y qué vas a observar por separado.',
    artifactKind: 'FICHA_EXPERIMENTO',
    fields: [
      { key: 'hipotesis', label: 'Hipótesis' },
      { key: 'muestra', label: 'Muestra o actividad' },
      { key: 'interes', label: 'Interés o aprendizaje' },
      { key: 'utilidad', label: 'Utilidad para alguien' },
      { key: 'sostenibilidad', label: 'Sostenibilidad' },
    ],
    doneWhen: 'La ficha existe. Las tres observaciones siguen pendientes hasta que las registres.',
    minimumVersion: 'La hipótesis y la muestra, aunque falte destinatario.',
    alternativeText: 'Sin destinatario, la prueba puede terminar igual. Eso no valida demanda ni se anota como rechazo.',
    learningQuestion: '¿Qué pasó con el interés, con la utilidad y con la sostenibilidad, por separado?',
    expectedEvidence: 'Observaciones separadas. Un gusto al preparar no es utilidad. Una respuesta sin contenido no es demanda.',
    forbids: ['Monetizar como condición', 'Fabricar profesión o demanda', 'Subir alineación por cerrar la ficha'],
    stopIf: ['No hay una combinación o una hipótesis que quieras contrastar'],
    editorialRef: 'IKIGAI. Recorrido transversal, no un plan duplicado por pilar.',
  }),
];

const BY_ID = new Map(FAMILIES.map((row) => [row.id, row]));

export function familyById(id: string | null | undefined): FamilyDef | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

const SEEKS: Record<string, string> = {
  'MEN-CONT': 'Dejar claro qué vas a sostener y qué queda fuera esta semana.',
  'MEN-EST': 'Avanzar una parte revisable en las ocasiones que sí puedes usar.',
  'MEN-CONS': 'Repetir una estrategia que ya dio resultado y anotar qué la hace frágil.',
  'MEN-EXP': 'Preparar la explicación de una tarea que ya dominas y cómo comprobar si se entiende.',
  'REL-CONT': 'Nombrar el vínculo que quieres cuidar y el límite de esta semana.',
  'REL-EST': 'Preparar una conversación concreta y qué harás si no hay respuesta.',
  'REL-CONS': 'Repetir un trato que ya funcionó y anotar la fricción.',
  'REL-EXP': 'Dejar escrito un encargo conjunto y la salida si no hay respuesta.',
  'FIN-CONT': 'Distinguir obligaciones conocidas de lo que todavía no está a la vista.',
  'FIN-EST': 'Armar un registro de obligaciones y un recordatorio en una ocasión real.',
  'FIN-CONS': 'Revisar la información y la asignación que ya declaraste, sin abrir una inversión.',
  'FIN-EXP': 'Definir un proyecto pequeño dentro de un límite de dinero y fechas conocidas.',
  'SAL-CONT': 'Preparar una gestión compatible con el límite vigente y anotar qué no vas a hacer.',
  'SAL-EST': 'Organizar el cuidado que ya elegiste en una ocasión compatible.',
  'SAL-CONS': 'Revisar si ese cuidado sigue siendo sostenible con la carga de esta semana.',
};

const SUGGESTED: Record<string, { weeklyMinutes: number; occasions: number; minutesPerOccasion: number }> = {
  'MEN-CONT': { weeklyMinutes: 15, occasions: 1, minutesPerOccasion: 15 },
  'MEN-EST': { weeklyMinutes: 40, occasions: 2, minutesPerOccasion: 20 },
  'MEN-CONS': { weeklyMinutes: 30, occasions: 2, minutesPerOccasion: 15 },
  'MEN-EXP': { weeklyMinutes: 45, occasions: 1, minutesPerOccasion: 45 },
  'REL-CONT': { weeklyMinutes: 20, occasions: 1, minutesPerOccasion: 20 },
  'REL-EST': { weeklyMinutes: 30, occasions: 1, minutesPerOccasion: 30 },
  'REL-CONS': { weeklyMinutes: 25, occasions: 2, minutesPerOccasion: 12 },
  'REL-EXP': { weeklyMinutes: 40, occasions: 1, minutesPerOccasion: 40 },
  'FIN-CONT': { weeklyMinutes: 20, occasions: 1, minutesPerOccasion: 20 },
  'FIN-EST': { weeklyMinutes: 25, occasions: 2, minutesPerOccasion: 12 },
  'FIN-CONS': { weeklyMinutes: 20, occasions: 1, minutesPerOccasion: 20 },
  'FIN-EXP': { weeklyMinutes: 35, occasions: 1, minutesPerOccasion: 35 },
  'SAL-CONT': { weeklyMinutes: 20, occasions: 1, minutesPerOccasion: 20 },
  'SAL-EST': { weeklyMinutes: 30, occasions: 2, minutesPerOccasion: 15 },
  'SAL-CONS': { weeklyMinutes: 15, occasions: 1, minutesPerOccasion: 15 },
};

export type StartingPoint = {
  id: string;
  templateVersion: string;
  seeks: string;
  action: string;
  doneWhen: string;
  expectedEvidence: string;
  learningQuestion: string;
  minimumVersion: string;
  suggested: { weeklyMinutes: number; occasions: number; minutesPerOccasion: number };
};

/** Plantillas reales del ámbito que se pueden proponer sin una lectura personal. */
export function generalStartingPoints(territory: Territory): StartingPoint[] {
  return FAMILIES.filter((row) => row.territory === territory && row.mode && row.tags.length === 0).map((row) => ({
    id: row.id,
    templateVersion: row.templateVersion,
    seeks: SEEKS[row.id] ?? row.learningQuestion,
    action: row.action,
    doneWhen: row.doneWhen,
    expectedEvidence: row.expectedEvidence,
    learningQuestion: row.learningQuestion,
    minimumVersion: row.minimumVersion,
    suggested: SUGGESTED[row.id] ?? { weeklyMinutes: 20, occasions: 1, minutesPerOccasion: 20 },
  }));
}

export function familyIdFor(territory: Territory, mode: Mode): string {
  const prefix = { MENTALIDAD: 'MEN', RELACIONES: 'REL', FINANZAS: 'FIN', SALUD_FISICA: 'SAL' }[territory];
  const suffix = { CONTENCION: 'CONT', ESTABILIZACION: 'EST', CONSOLIDACION: 'CONS', EXPANSION: 'EXP' }[mode];
  return `${prefix}-${suffix}`;
}
