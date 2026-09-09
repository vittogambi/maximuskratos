export interface CasebookMeta {
  key: string;
  file: string;
  name: string;
  label: string;
  /** Pre-reveal. Neutral facts about the person. Never engine output. */
  story: string;
  /** Why this fixture exists. Shown as metadata, never inside the person story. */
  testIntent: string;
  /** Post-reveal only. Four human blocks for the reviewer. */
  facilitator_note: string;
  /** True when the fixture answers Purpose items. */
  purpose_answered: boolean;
  /** Short human reading of this side of a pair, when the family needs it. */
  portrait?: string;
}

/** Tokens that must never appear in a pre-reveal participant summary. */
export const PRE_REVEAL_LEAKS = [
  'mentalidad claramente más baja',
  'cuerpo es el ámbito más bajo',
  'cae a contención',
  'entra a estabilización',
  'entra a consolidación',
  'entra a expansión',
  'queda en consolidación',
  'queda en estabilización',
  'borde 39/40',
  'borde 59/60',
  'borde 79/80',
  '39/40',
  '59/60',
  '79/80',
  'comparten headline',
  'comparten el headline',
  'suena sólido',
  'aud suena',
  'full...',
  '50/50',
  'desempate',
  'no_clasificado',
  'insufficient_coverage',
  'item_weighted',
  'item-weighted',
  'counterfactual',
  'contrafactual',
  'critical',
  'blocked',
  'umbral',
  'threshold',
  'prioridad propuesta',
  'resultado esperado',
  'comportamiento esperado',
  'responde en el punto medio',
  'punto medio de la escala',
  'esta versión produce',
  'más orden en la semana',
  'no desaparecer de casa',
  'le cuesta sostener las prioridades',
  'le cuesta mantener al día los controles',
  'se levanta sin energía',
  'le cuesta la dirección',
  'deja mucha más historia',
  'el resultado depende',
  'cuatro ámbitos',
  'dos ámbitos quedan claramente',
  'frontera que estamos',
  'el caso sirve para',
] as const;

export type CasebookFamily = {
  id: string;
  label: string;
  question: string;
  keys: string[];
  core: boolean;
  verdict_at: 'case' | 'pair';
  review_surface: 'matrix' | 'frontier';
  review_prompt?: string;
  /** Family landing copy. Shown before cases. Distinct from the comparison question. */
  intro?: string;
  /** Distinct methodological question for a member. Same family, different thesis. */
  variant_questions?: Record<string, string>;
};

export const CASEBOOK_FAMILIES: CasebookFamily[] = [
  {
    id: 'baseline',
    label: 'Sin un ámbito prioritario claro',
    question: 'Si todos los ámbitos están parejos, ¿te parece correcta la forma en que la Matriz decide cuál va primero?',
    keys: ['R01'],
    core: true,
    verdict_at: 'case',
    review_surface: 'matrix',
  },
  {
    id: 'one_low',
    label: 'Ámbito prioritario claro',
    question:
      'Cuando un ámbito está claramente más comprometido, ¿La Matriz lo reconoce sin distorsionar el resto?',
    keys: ['R02', 'R16', 'R17', 'R03'],
    core: true,
    verdict_at: 'case',
    review_surface: 'matrix',
  },
  {
    id: 'two_low',
    label: 'Dos ámbitos comprometidos',
    question:
      'Cuando dos ámbitos están igual de comprometidos, ¿ambos siguen visibles aunque la Matriz elija un solo ámbito prioritario?',
    keys: ['R05'],
    core: true,
    verdict_at: 'case',
    review_surface: 'matrix',
    review_prompt:
      'Queremos comprobar si la Matriz conserva que Mentalidad y Cuerpo están comprometidos, aunque deba seleccionar un solo ámbito prioritario. El mecanismo de desempate se revisa por separado.',
  },
  {
    id: 'tie',
    label: 'Desempate entre ámbitos prioritarios',
    question: 'Si dos ámbitos empatan, ¿la regla que elige cuál va primero es defendible y estable?',
    keys: ['R01', 'R05', 'R06', 'R18'],
    core: true,
    verdict_at: 'case',
    review_surface: 'matrix',
    review_prompt:
      'Queremos comprobar si la regla que elige cuál va primero es defendible y estable. Que existan dos frentes se revisa por separado.',
  },
  {
    id: 'edge_39_40',
    label: 'Contención o Estabilización',
    question:
      'Dos casos iguales salvo una respuesta. ¿Debería uno quedar en Contención y el otro en Estabilización?',
    keys: ['R07A', 'R07B'],
    core: true,
    verdict_at: 'pair',
    review_surface: 'matrix',
    review_prompt: '¿Te parece defendible que esa diferencia mínima cambie el estado?',
  },
  {
    id: 'edge_59_60',
    label: 'Estabilización o Consolidación',
    question:
      'Dos casos iguales salvo una respuesta. ¿Debería uno quedar en Estabilización y el otro en Consolidación?',
    keys: ['R08A', 'R08B'],
    core: true,
    verdict_at: 'pair',
    review_surface: 'matrix',
    review_prompt: '¿Te parece defendible que esa diferencia mínima cambie el estado?',
  },
  {
    id: 'edge_79_80',
    label: 'Consolidación o Expansión',
    question:
      'Dos casos iguales salvo una respuesta. ¿Debería uno quedar en Consolidación y el otro en Expansión?',
    keys: ['R09A', 'R09B'],
    core: true,
    verdict_at: 'pair',
    review_surface: 'matrix',
    review_prompt: '¿Te parece defendible que esa diferencia mínima cambie el estado?',
  },
  {
    id: 'insufficient',
    label: 'Información insuficiente',
    question:
      '¿La Matriz trata la falta de respuestas como falta de evidencia y no como un resultado bueno o malo?',
    keys: ['R10'],
    core: true,
    verdict_at: 'case',
    review_surface: 'matrix',
  },
  {
    id: 'safety_critical',
    label: 'Alerta crítica corporal',
    question:
      '¿Una señal crítica recibe el tratamiento adecuado aunque el resto del perfil parezca estable?',
    keys: ['R11', 'R11B'],
    core: true,
    verdict_at: 'case',
    review_surface: 'matrix',
    variant_questions: {
      R11B:
        'Cuando falta información suficiente para calcular un puntaje, ¿te parece correcto que una alerta crítica igualmente lleve el ámbito a Contención?',
    },
  },
  {
    id: 'safety_high_unclassified',
    label: 'Alerta financiera con información parcial',
    question:
      '¿La Matriz conserva una alerta financiera importante aunque no haya datos suficientes para clasificar Finanzas?',
    keys: ['R12', 'R12B'],
    core: true,
    verdict_at: 'case',
    review_surface: 'matrix',
    variant_questions: {
      R12B:
        'Cuando Finanzas tiene un puntaje alto pero existe una alerta importante, ¿te parece correcto que la alerta limite el estado máximo?',
    },
  },
  {
    id: 'same_headline',
    label: 'Mismo resultado, distinta composición',
    question: '¿Dos perfiles con un resultado parecido conservan las diferencias internas que importan?',
    keys: ['R13A', 'R13B'],
    core: true,
    verdict_at: 'pair',
    review_surface: 'matrix',
  },
  {
    id: 'aud_vs_full',
    label: 'Evaluación breve vs. completa',
    question:
      '¿La evaluación completa solo cambia la lectura cuando aporta información que realmente lo justifica?',
    keys: ['R14', 'R19'],
    core: true,
    verdict_at: 'case',
    review_surface: 'matrix',
  },
  {
    id: 'purpose_silent',
    label: 'Dirección distinta, mismo diagnóstico',
    intro:
      'Esta prueba revisa si la Matriz mantiene separado el diagnóstico de lo que la persona expresa sobre hacia dónde quiere ir.\n\nRevisa primero las dos versiones del caso. Después compáralas y decide si esa separación te parece correcta.',
    question:
      '¿Te parece correcto que estas diferencias sobre hacia dónde quiere ir Benjamín se conserven sin modificar su diagnóstico?',
    keys: ['R15A', 'R15B'],
    core: false,
    verdict_at: 'pair',
    review_surface: 'frontier',
    review_prompt: '¿La lectura de esta versión te parece defendible?',
  },
];

export function familiesForKey(key: string | null | undefined): CasebookFamily[] {
  if (!key) return [];
  return CASEBOOK_FAMILIES.filter((item) => item.keys.includes(key));
}

export function questionForFamilyCase(family: CasebookFamily, key: string): string {
  return family.variant_questions?.[key] ?? family.review_prompt ?? family.question;
}

export function criterionIdForFamilyCase(family: CasebookFamily, key: string): string {
  return family.variant_questions?.[key] ? `${family.id}:${key}` : family.id;
}

export function pairQuestionFor(pair: string | null | undefined): string {
  if (!pair) {
    return '¿Esta diferencia en las respuestas debería producir esta diferencia en el resultado?';
  }
  const family = CASEBOOK_FAMILIES.find(
    (item) => item.verdict_at === 'pair' && item.keys.includes(`${pair}A`) && item.keys.includes(`${pair}B`),
  );
  return (
    family?.question ?? '¿Esta diferencia en las respuestas debería producir esta diferencia en el resultado?'
  );
}

export const AB_PAIRS = [
  ['R07A', 'R07B'],
  ['R08A', 'R08B'],
  ['R09A', 'R09B'],
  ['R13A', 'R13B'],
  ['R15A', 'R15B'],
] as const;

export function participantSummaryLeaks(text: string): string[] {
  const lower = text.toLowerCase();
  return PRE_REVEAL_LEAKS.filter((leak) => lower.includes(leak));
}

export function assertCasebookStoriesClean(): void {
  for (const meta of CASEBOOK_META) {
    const leaks = participantSummaryLeaks(meta.story);
    if (leaks.length) {
      throw new Error(`${meta.key} story leaks: ${leaks.join(', ')}`);
    }
  }
}

function brief(blocks: { test: string; matrix: string; decision: string; why: string }): string {
  return [
    `## Lo que estamos poniendo a prueba\n${blocks.test}`,
    `## Lo que hace la Matriz actual\n${blocks.matrix}`,
    `## La decisión que queremos revisar\n${blocks.decision}`,
    `## Por qué importa\n${blocks.why}`,
  ].join('\n\n');
}

export const CASEBOOK_META: CasebookMeta[] = [
  {
    key: 'R01',
    file: 'R01.json',
    name: 'Ignacio',
    label: 'R01 · Ignacio',
    purpose_answered: false,
    testIntent: 'Perfil completo con poca señal cualitativa',
    story:
      'Ignacio respondió las preguntas cerradas y dejó casi vacías las preguntas abiertas. Revisa sus respuestas antes de registrar tu lectura.',
    facilitator_note: brief({
      test:
        'Las respuestas de Ignacio hacen que los cuatro ámbitos terminen exactamente iguales. Queremos revisar qué debería hacer la Matriz cuando no existe un ámbito claramente por delante de los demás.',
      matrix:
        'Los cuatro ámbitos terminan en 50 puntos y Estabilización. Como hay empate, la regla actual coloca Mentalidad primero y sugiere Instalar estructura personal. Eso es el candidato de la Matriz, no el foco definitivo del ciclo.',
      decision:
        '¿El candidato Mentalidad es realmente lo que frenaría a Ignacio, o haría falta mirar su dirección y su momento para elegir el foco del ciclo?',
      why: 'Si este desempate no representa tu criterio, el mismo problema puede aparecer cada vez que dos o más ámbitos terminen iguales.',
    }),
  },
  {
    key: 'R02',
    file: 'R02.json',
    name: 'Felipe',
    label: 'R02 · Felipe',
    purpose_answered: false,
    testIntent: 'Resultado basado principalmente en respuestas cerradas',
    story:
      'El cuestionario de Felipe está completo en preguntas cerradas. Las abiertas tienen poco texto.',
    facilitator_note: brief({
      test:
        'Felipe queda claramente más bajo en Mentalidad que en el resto. Queremos revisar si, cuando la diferencia es evidente, la Matriz debería empezar por el ámbito más bajo.',
      matrix:
        'Mentalidad termina en 25 puntos y Contención. Los otros tres ámbitos quedan en 75 y Consolidación. La Matriz pone Mentalidad primero.',
      decision: '¿Coincides en trabajar primero el ámbito que está claramente más bajo?',
      why: 'Si no coinciden, hay que revisar cómo se elige el foco cuando un ámbito se separa del resto.',
    }),
  },
  {
    key: 'R03',
    file: 'R03.json',
    name: 'Rodrigo',
    label: 'R03 · Rodrigo',
    purpose_answered: false,
    testIntent: 'Respuestas abiertas poco interpretables',
    story:
      'El cuestionario de Rodrigo está completo. En sueño hay un número, sin texto abierto.',
    facilitator_note: brief({
      test:
        'Rodrigo queda claramente más bajo en Cuerpo. Queremos revisar si un ámbito bajo de Cuerpo se prioriza igual que uno bajo de Mentalidad.',
      matrix:
        'Cuerpo termina en 25 puntos y Contención. Los otros tres ámbitos quedan en 75 y Consolidación. La Matriz pone Cuerpo primero. Rodrigo también anotó un dato numérico de sueño (D-CUE-07). Hoy la Matriz no lo convierte a puntaje y no entra en Cuerpo. Falta el mapa de escala. Hay que definir cómo interpretarlo.',
      decision: '¿Un Cuerpo claramente más bajo debería ir primero, igual que cuando el más bajo es Mentalidad?',
      why: 'Si Cuerpo se trata distinto, hay que decirlo. Si no, la misma regla tiene que valer para los cuatro ámbitos.',
    }),
  },
  {
    key: 'R04',
    file: 'R04.json',
    name: 'Martín',
    label: 'R04 · Martín',
    purpose_answered: false,
    testIntent: 'Señal corporal moderada sin alarma clínica',
    story:
      'Martín tiene el cuestionario completo. Incluye respuestas de Cuerpo sobre controles y energía al despertar.',
    facilitator_note: brief({
      test:
        'Martín no tiene los controles al día y varias mañanas se levanta sin energía. Queremos revisar si todas las partes de Cuerpo deberían contar igual.',
      matrix:
        'Cuerpo termina en 39 puntos y Contención. La Matriz pone Cuerpo primero. Hoy cada parte de Cuerpo pesa igual.',
      decision: '¿Hay respuestas de Cuerpo que para ti deberían pesar más que las demás?',
      why: 'Si el peso igual diluye lo que tú consideras decisivo, el mismo recorte puede aparecer en otras personas.',
    }),
  },
  {
    key: 'R05',
    file: 'R05.json',
    name: 'Javier',
    label: 'R05 · Javier',
    purpose_answered: false,
    testIntent: 'Caso controlado',
    story:
      'El cuestionario de Javier cubre Mentalidad, Relaciones, Finanzas y Cuerpo.',
    facilitator_note: brief({
      test:
        'Este caso participa en dos pruebas: si Mentalidad y Cuerpo siguen visibles como frentes comprometidos, y si la regla de desempate es defendible. Responde solo a la prueba desde la que llegaste.',
      matrix:
        'Mentalidad y Cuerpo terminan en 25 puntos y Contención. Relaciones y Finanzas quedan en 75. Como hay empate, la regla actual coloca Mentalidad primero.',
      decision: 'Según la prueba abierta, ¿La Matriz conserva los dos frentes, o la regla de desempate te parece estable?',
      why: 'Si juzgas las dos cosas a la vez, el hallazgo queda ambiguo.',
    }),
  },
  {
    key: 'R06',
    file: 'R06.json',
    name: 'Nicolás',
    label: 'R06 · Nicolás',
    purpose_answered: false,
    testIntent: 'Empate intermedio en un perfil estable',
    story:
      'Nicolás tiene respuestas en todos los ámbitos.',
    facilitator_note: brief({
      test:
        'Nicolás queda en el medio en Mentalidad y Cuerpo, y más alto en Relaciones y Finanzas. Queremos revisar si el mismo desempate se acepta cuando nadie está en Contención.',
      matrix:
        'Mentalidad y Cuerpo terminan en 50 puntos y Estabilización. Relaciones y Finanzas quedan en 75. La regla actual coloca Mentalidad primero.',
      decision: '¿También resolverías este empate intermedio con Mentalidad, o aquí mirarías otra cosa?',
      why: 'Si el desempate solo te convence en algunos perfiles, no puede ser una sola regla silenciosa.',
    }),
  },
  {
    key: 'R07A',
    file: 'R07A.json',
    name: 'Esteban',
    label: 'R07A · Esteban',
    purpose_answered: false,
    testIntent: 'Sensibilidad cerca de una frontera',
    story:
      'Este caso de Esteban comparte todas las respuestas con el otro, salvo una pregunta de Mentalidad.',
    facilitator_note: brief({
      test:
        'Esteban y el otro caso de Esteban se parecen. Cambia una sola respuesta de Mentalidad. Queremos revisar si ese cambio pequeño debería pasar de Contención a Estabilización.',
      matrix:
        'Mentalidad termina en 39 puntos y Contención. El resto queda más alto. La Matriz pone Mentalidad primero y trabaja desde Contención.',
      decision: '¿Te parece bien que pasar de 39 a 40 cambie el estado de la persona?',
      why: 'Si el salto de estado no representa tu criterio, el mismo corte va a decidir muchos casos que están cerca de ese límite.',
    }),
  },
  {
    key: 'R07B',
    file: 'R07B.json',
    name: 'Esteban',
    label: 'R07B · Esteban',
    purpose_answered: false,
    testIntent: 'Sensibilidad cerca de una frontera',
    story:
      'Comparte las respuestas con el otro caso de Esteban, salvo esa misma pregunta de Mentalidad.',
    facilitator_note: brief({
      test:
        'Esteban y el otro caso de Esteban se parecen. Cambia una sola respuesta de Mentalidad. Queremos revisar si ese cambio pequeño debería pasar de Contención a Estabilización.',
      matrix:
        'Mentalidad termina en 40 puntos y Estabilización. El resto queda más alto. La Matriz pone Mentalidad primero y trabaja desde Estabilización.',
      decision: '¿Te parece bien que pasar de 39 a 40 cambie el estado de la persona?',
      why: 'Si el salto de estado no representa tu criterio, el mismo corte va a decidir muchos casos que están cerca de ese límite.',
    }),
  },
  {
    key: 'R08A',
    file: 'R08A.json',
    name: 'Diego',
    label: 'R08A · Diego',
    purpose_answered: false,
    testIntent: 'Cambio de ámbito prioritario por una respuesta',
    story:
      'Diego y el otro caso de Diego comparten las respuestas, salvo una pregunta de Mentalidad.',
    facilitator_note: brief({
      test:
        'Diego y el otro caso de Diego se parecen. Cambia una sola respuesta de Mentalidad. Queremos revisar si ese cambio pequeño debería pasar de Estabilización a Consolidación.',
      matrix:
        'Mentalidad termina en 59 puntos y Estabilización. El resto queda en 75. La Matriz pone Mentalidad primero.',
      decision: '¿Te parece bien que pasar de 59 a 60 cambie el estado de la persona?',
      why: 'Si el salto no te representa, el mismo corte va a mover a otras personas de una etapa a otra por un punto.',
    }),
  },
  {
    key: 'R08B',
    file: 'R08B.json',
    name: 'Diego',
    label: 'R08B · Diego',
    purpose_answered: false,
    testIntent: 'Cambio de ámbito prioritario por una respuesta',
    story:
      'Esta versión de Diego cambia solo esa pregunta de Mentalidad. El resto coincide con el otro caso.',
    facilitator_note: brief({
      test:
        'Diego y el otro caso de Diego se parecen. Cambia una sola respuesta de Mentalidad. Queremos revisar si ese cambio pequeño debería pasar de Estabilización a Consolidación.',
      matrix:
        'Mentalidad termina en 60 puntos y Consolidación. El resto queda en 75. La Matriz pone Mentalidad primero.',
      decision: '¿Te parece bien que pasar de 59 a 60 cambie el estado de la persona?',
      why: 'Si el salto no te representa, el mismo corte va a mover a otras personas de una etapa a otra por un punto.',
    }),
  },
  {
    key: 'R09A',
    file: 'R09A.json',
    name: 'Cristóbal',
    label: 'R09A · Cristóbal',
    purpose_answered: false,
    testIntent: 'Estabilidad ante una variación menor',
    story:
      'Entre los dos casos de Cristóbal cambia una pregunta de Mentalidad. El resto coincide.',
    facilitator_note: brief({
      test:
        'Cristóbal y el otro caso de Cristóbal se parecen. Cambia una sola respuesta de Mentalidad. Queremos revisar si ese cambio pequeño debería pasar de Consolidación a Expansión.',
      matrix:
        'Mentalidad termina en 79 puntos y Consolidación. El resto queda en 100 y Expansión. La Matriz pone Mentalidad primero.',
      decision: '¿Te parece bien que pasar de 79 a 80 cambie el estado de la persona?',
      why: 'Si el salto no te representa, el mismo corte va a decidir quién entra a Expansión.',
    }),
  },
  {
    key: 'R09B',
    file: 'R09B.json',
    name: 'Cristóbal',
    label: 'R09B · Cristóbal',
    purpose_answered: false,
    testIntent: 'Estabilidad ante una variación menor',
    story:
      'Esta versión de Cristóbal cambia esa misma pregunta de Mentalidad. El resto coincide con el otro caso.',
    facilitator_note: brief({
      test:
        'Cristóbal y el otro caso de Cristóbal se parecen. Cambia una sola respuesta de Mentalidad. Queremos revisar si ese cambio pequeño debería pasar de Consolidación a Expansión.',
      matrix:
        'Mentalidad termina en 80 puntos y Expansión. El resto queda en 100 y Expansión. La Matriz pone Mentalidad primero.',
      decision: '¿Te parece bien que pasar de 79 a 80 cambie el estado de la persona?',
      why: 'Si el salto no te representa, el mismo corte va a decidir quién entra a Expansión.',
    }),
  },
  {
    key: 'R10',
    file: 'R10.json',
    name: 'Álvaro',
    label: 'R10 · Álvaro',
    purpose_answered: false,
    testIntent: 'Cuestionario parcialmente completado',
    story:
      'El cuestionario de Álvaro está incompleto. Hay respuestas en algunas secciones y otras quedaron vacías.',
    facilitator_note: brief({
      test:
        'Álvaro contestó pocas preguntas. Queremos revisar qué debería hacer la Matriz cuando no hay información suficiente.',
      matrix: 'No clasifica los ámbitos, no elige qué trabajar primero y no entrega un plan.',
      decision:
        '¿Está bien que la Matriz se quede callada cuando faltan respuestas, o esperabas un foco de todas formas?',
      why: 'Si inventa un foco con poca información, puede abrir un trabajo que no corresponde.',
    }),
  },
  {
    key: 'R11',
    file: 'R11.json',
    name: 'Pablo',
    label: 'R11 · Pablo',
    purpose_answered: false,
    testIntent: 'Alerta que debe imponerse al cálculo',
    story:
      'El cuestionario de Pablo incluye una respuesta de dolor en el pecho, desmayo o falta de aire durante el esfuerzo.',
    facilitator_note: brief({
      test:
        'Pablo marca un síntoma de alarma en Cuerpo. Queremos revisar qué debería pasar cuando hay una alerta grave.',
      matrix:
        'Activa la alerta de Cuerpo, deja Cuerpo en Contención y bloquea la recomendación. No entrega una acción para esta semana.',
      decision:
        '¿Coincides en bloquear la ejecución cuando hay esta alerta? ¿El producto debería respetar ese bloqueo?',
      why: 'Si esta regla no representa tu criterio, una persona con una alerta grave podría recibir una acción que no debería ejecutarse.',
    }),
  },
  {
    key: 'R12',
    file: 'R12.json',
    name: 'Gonzalo',
    label: 'R12 · Gonzalo',
    purpose_answered: false,
    testIntent: 'Ámbito incompleto con señal financiera crítica',
    story:
      'Finanzas quedó incompleta. Hay una respuesta que indica que la deuda del mes no cubre gastos esenciales.',
    facilitator_note: brief({
      test:
        'Gonzalo marca que la deuda no le deja cubrir lo esencial y no alcanza a terminar Finanzas. Queremos revisar si una alerta alta puede elegir el foco aunque ese ámbito no esté clasificado.',
      matrix:
        'Activa la alerta de Finanzas. No inventa un estado para Finanzas. Aun así pone Finanzas primero y no entrega un plan.',
      decision: '¿Aceptas que una alerta alta elija el ámbito prioritario aunque ese ámbito no esté clasificado?',
      why: 'Si no, hay que decidir qué hacer cuando la alerta aparece antes de poder leer el ámbito completo.',
    }),
  },
  {
    key: 'R13A',
    file: 'R13A.json',
    name: 'Camilo',
    label: 'R13A · Camilo',
    purpose_answered: false,
    testIntent: 'Significado interno con un resumen similar',
    story:
      'Camilo respondió el cuestionario completo. Hay un caso paralelo con las mismas categorías y otra combinación de respuestas.',
    facilitator_note: brief({
      test:
        'Camilo y el otro caso de Camilo pueden verse iguales en el resumen de Mentalidad, aunque por dentro las partes no coincidan. Queremos revisar si se pierde información importante en ese resumen.',
      matrix:
        'Mentalidad termina en 75 puntos y Consolidación. El resto queda en 100. La Matriz pone Mentalidad primero.',
      decision: '¿Te parece un problema que dos personas se vean iguales en el resumen aunque las partes no coincidan?',
      why: 'Si el resumen tapa diferencias que tú usarías para decidir, hay que mostrar más que el titular del ámbito.',
    }),
  },
  {
    key: 'R13B',
    file: 'R13B.json',
    name: 'Camilo',
    label: 'R13B · Camilo',
    purpose_answered: false,
    testIntent: 'Significado interno con un resumen similar',
    story:
      'Este caso de Camilo usa las mismas categorías que el otro. Cambia la combinación de algunas respuestas.',
    facilitator_note: brief({
      test:
        'Camilo y el otro caso de Camilo pueden verse iguales en el resumen de Mentalidad, aunque por dentro las partes no coincidan. Queremos revisar si se pierde información importante en ese resumen.',
      matrix:
        'Mentalidad termina en 75 puntos y Consolidación. El resto queda en 100. La Matriz pone Mentalidad primero.',
      decision: '¿Te parece un problema que dos personas se vean iguales en el resumen aunque las partes no coincidan?',
      why: 'Si el resumen tapa diferencias que tú usarías para decidir, hay que mostrar más que el titular del ámbito.',
    }),
  },
  {
    key: 'R14',
    file: 'R14.json',
    name: 'Sebastián',
    label: 'R14 · Sebastián',
    purpose_answered: false,
    testIntent: 'Lectura corta frente a evaluación completa',
    story:
      'El cuestionario de Sebastián incluye las preguntas cortas y las de detalle.',
    facilitator_note: brief({
      test:
        'Sebastián se lee distinto si se usan solo las preguntas cortas o la evaluación completa. Queremos revisar si esas dos lecturas deberían llevar a la misma conclusión.',
      matrix:
        'Con la evaluación completa, Mentalidad termina en 33 puntos y Contención. La Matriz pone Mentalidad primero. Esa es la lectura oficial.',
      decision: '¿Te parece un problema que la versión corta y la evaluación completa no coincidan en este caso?',
      why: 'Si la diferencia importa, hay que decidir qué lectura cuenta cuando alguien no completa todo.',
    }),
  },
  {
    key: 'R15A',
    file: 'R15.json',
    name: 'Benjamín',
    label: 'R15A · Benjamín',
    purpose_answered: true,
    testIntent: 'Dirección distinta, mismo diagnóstico',
    portrait:
      'Benjamín habla de construir algo propio, estar más presente en casa y mejorar su situación financiera.',
    story:
      'En esta versión, Benjamín habla de construir algo propio, estar más presente en casa y mejorar su situación financiera.',
    facilitator_note: brief({
      test:
        'Esta prueba mira si lo que Benjamín expresa sobre hacia dónde quiere ir se mantiene separado del diagnóstico. En esta versión habla de construir algo propio, estar más presente en casa y mejorar su situación financiera.',
      matrix:
        'Los cuatro ámbitos quedan en 50 puntos y Estabilización. Por el empate, pone Mentalidad primero. Ese texto no modifica puntaje, estado, cobertura diagnóstica, alertas ni ámbito prioritario.',
      decision: '¿Lo que expresa sobre hacia dónde quiere ir quedó separado del diagnóstico de esta versión?',
      why: 'Si ese texto mueve puntaje o el ámbito prioritario, deja de estar separado. Si no aparece en la lectura, esa diferencia se pierde.',
    }),
  },
  {
    key: 'R15B',
    file: 'R15B.json',
    name: 'Benjamín',
    label: 'R15B · Benjamín',
    purpose_answered: true,
    testIntent: 'Dirección distinta, mismo diagnóstico',
    portrait: 'Benjamín pone más énfasis en su familia, la estabilidad y tener mayor disponibilidad en su día a día.',
    story:
      'En esta versión, Benjamín pone más énfasis en su familia, la estabilidad y tener mayor disponibilidad en su día a día.',
    facilitator_note: brief({
      test:
        'Esta prueba mira si lo que Benjamín expresa sobre hacia dónde quiere ir se mantiene separado del diagnóstico. En esta versión pone más énfasis en su familia, la estabilidad y tener mayor disponibilidad en su día a día.',
      matrix:
        'Los cuatro ámbitos quedan en 50 puntos y Estabilización. Por el empate, pone Mentalidad primero.',
      decision: '¿Lo que expresa sobre hacia dónde quiere ir quedó separado del diagnóstico de esta versión?',
      why: 'Si algo de la clasificación cambia por ese texto, deja de estar separado del diagnóstico.',
    }),
  },
  {
    key: 'R11B',
    file: 'R11B.json',
    name: 'Ramiro',
    label: 'R11B · Ramiro',
    purpose_answered: false,
    testIntent: 'Señal corporal grave con poco resto de Cuerpo',
    story:
      'En Cuerpo, Ramiro dejó preguntas sin responder. Marcó dolor en el pecho, desmayo o falta de aire durante el esfuerzo.',
    facilitator_note: brief({
      test:
        'Ramiro activa la misma señal crítica de Cuerpo que Pablo, pero Cuerpo no alcanza a clasificarse. Queremos revisar si esa señal puede imponer Contención aunque no haya puntaje.',
      matrix:
        'Cuerpo queda sin puntaje y en Contención. El resto queda en 100 y Expansión. Activa la alerta de Cuerpo, pone Cuerpo primero y bloquea la recomendación.',
      decision:
        'Cuando falta información suficiente para calcular un puntaje, ¿te parece correcto que una alerta crítica igualmente lleve el ámbito a Contención?',
      why: 'Si no, hay que decidir qué hacer cuando la seguridad aparece antes de poder leer el ámbito.',
    }),
  },
  {
    key: 'R12B',
    file: 'R12B.json',
    name: 'Vicente',
    label: 'R12B · Vicente',
    purpose_answered: false,
    testIntent: 'Finanzas altas con techo por alerta',
    story:
      'Vicente respondió Finanzas por completo. Hay una respuesta que indica que la deuda del mes no cubre gastos esenciales.',
    facilitator_note: brief({
      test:
        'Vicente tiene Finanzas clasificada en un puntaje alto y, a la vez, una alerta alta activa. Queremos revisar si esa alerta debe limitar el estado máximo.',
      matrix:
        'Finanzas llega a 100 por banda y queda en Estabilización por la alerta. El resto queda en 100 y Expansión. Pone Finanzas primero y bloquea la recomendación.',
      decision:
        'Cuando Finanzas tiene un puntaje alto pero existe una alerta importante, ¿te parece correcto que la alerta limite el estado máximo?',
      why: 'Si el techo no representa tu criterio, una persona con puntaje alto y alerta alta recibiría un estado que no defenderías.',
    }),
  },
  {
    key: 'R16',
    file: 'R16.json',
    name: 'Tomás',
    label: 'R16 · Tomás',
    purpose_answered: false,
    testIntent: 'Relaciones claramente más comprometidas',
    story:
      'El cuestionario de Tomás está completo. Incluye las preguntas de Relaciones.',
    facilitator_note: brief({
      test:
        'Tomás queda claramente más bajo en Relaciones que en el resto. Queremos revisar si, cuando la diferencia es evidente, la Matriz debería empezar por el ámbito más bajo.',
      matrix:
        'Relaciones termina en 25 puntos y Contención. Los otros tres ámbitos quedan en 75 y Consolidación. La Matriz pone Relaciones primero.',
      decision: '¿Coincides en trabajar primero el ámbito que está claramente más bajo?',
      why: 'Si no coinciden, hay que revisar cómo se elige el foco cuando un ámbito se separa del resto.',
    }),
  },
  {
    key: 'R17',
    file: 'R17.json',
    name: 'Lucas',
    label: 'R17 · Lucas',
    purpose_answered: false,
    testIntent: 'Finanzas claramente más comprometidas',
    story:
      'Lucas tiene el cuestionario completo. Incluye las preguntas de Finanzas.',
    facilitator_note: brief({
      test:
        'Lucas queda claramente más bajo en Finanzas que en el resto. Queremos revisar si, cuando la diferencia es evidente, la Matriz debería empezar por el ámbito más bajo.',
      matrix:
        'Finanzas termina en 25 puntos y Contención. Los otros tres ámbitos quedan en 75 y Consolidación. La Matriz pone Finanzas primero.',
      decision: '¿Coincides en trabajar primero el ámbito que está claramente más bajo?',
      why: 'Si no coinciden, hay que revisar cómo se elige el foco cuando un ámbito se separa del resto.',
    }),
  },
  {
    key: 'R18',
    file: 'R18.json',
    name: 'Emilio',
    label: 'R18 · Emilio',
    purpose_answered: false,
    testIntent: 'Empate entre ámbitos de soporte',
    story:
      'El cuestionario de Emilio está completo. Incluye las preguntas de Cuerpo y Finanzas.',
    facilitator_note: brief({
      test:
        'Cuerpo y Finanzas empatan en lo más bajo. Mentalidad no participa. Queremos revisar si la regla que elige cuál va primero es defendible cuando el empate es solo entre ámbitos de soporte.',
      matrix:
        'Cuerpo y Finanzas terminan en 25 puntos y Contención. Mentalidad y Relaciones quedan en 75. La regla actual coloca Cuerpo primero.',
      decision: '¿Resolverías este empate con Cuerpo, o aquí mirarías otra cosa?',
      why: 'Si el orden entre ámbitos de soporte no te convence, no puede quedar validado solo porque Mentalidad gana en otros empates.',
    }),
  },
  {
    key: 'R19',
    file: 'R19.json',
    name: 'Agustín',
    label: 'R19 · Agustín',
    purpose_answered: false,
    testIntent: 'Lectura corta frente a evaluación completa',
    story:
      'Agustín tiene preguntas cortas y de detalle en el mismo cuestionario.',
    facilitator_note: brief({
      test:
        'Agustín se lee distinto si se usan solo las preguntas cortas o la evaluación completa. En la corta parece más comprometido. En el profundo, Mentalidad mejora. Queremos revisar si esa diferencia justifica el cambio de lectura.',
      matrix:
        'Con la evaluación completa, Mentalidad termina en 67 puntos y Consolidación. La Matriz pone Mentalidad primero. Esa es la lectura oficial.',
      decision: '¿Te parece un problema que la versión corta y la evaluación completa no coincidan en este caso?',
      why: 'Si la diferencia importa, hay que decidir qué lectura cuenta cuando alguien no completa todo.',
    }),
  },
];
