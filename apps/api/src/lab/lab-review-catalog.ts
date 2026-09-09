import { loadMigrationLedger } from '@mk/matrix-engine';
import { hydrateProvenance, type MethodologyProvenance } from './lab-provenance';

type CatalogSeed = Omit<
  MethodologyProvenance,
  'rafa_verdict' | 'rafa_note' | 'decision_status' | 'decision_by'
>;

const FIDELITY_QUEUE: CatalogSeed[] = [
  {
    id: 'FID-BROOKS',
    subject_kind: 'transformation',
    origin_type: 'V2_UNDOCUMENTED_RESULT',
    change_kind: 'INTENTION_LOSS_RISK',
    title: 'Desarrollo y sentido',
    source_refs: [
      { file: 'Excel original', sheet: 'E-AUD-001', id: 'Q24 a Q33', version: null },
    ],
    previous_state:
      'Incluía disfrute, satisfacción, sentido, trascendencia, familia, amistad y trabajo.',
    current_state: 'Estas preguntas no tienen equivalente actual confirmado.',
    change_summary: 'No forman parte de Matriz v2.',
    rationale: 'No hay una decisión explícita de Matriz v2 que determine el destino de esta intención.',
    why_pending: 'Hay que decidir dónde debería vivir esta información.',
    documented_facts: ['Sabemos que no forman parte de Matriz v2.'],
    undocumented: [
      'No hay una decisión explícita de Matriz v2 que determine si esta intención debía desaparecer, pasar a Dirección, o vivir en una etapa posterior.',
    ],
    decision_question: '¿Dónde debería vivir esta información?',
    composition: null,
    card_kind: 'removed_content',
    in_rafa_queue: true,
    blocks_matrix: false,
    affects_now: 'No cambia el cálculo hasta que se recupere algo para la Matriz.',
    affects_later: 'Dirección, si se recupera ahí.',
    verdict_set: 'fidelity',
  },
  {
    id: 'FID-FRAD003',
    subject_kind: 'transformation',
    origin_type: 'V2_UNDOCUMENTED_RESULT',
    change_kind: 'INTENTION_LOSS_RISK',
    title: 'Proyección financiera',
    source_refs: [
      { file: 'Excel original', sheet: 'F-RAD-003', id: 'Q13 a Q15', version: null },
    ],
    previous_state:
      'Tres preguntas abiertas sobre deuda a erradicar, próximo movimiento de crecimiento y cifra de soberanía.',
    current_state: 'No están en Matriz v2.',
    change_summary: 'v2 no las tradujo a ítems ejecutables de Finanzas.',
    rationale: 'Parecen dirección o planificación más que estado financiero actual.',
    why_pending:
      'Hay que decidir si sirven para diagnosticar Finanzas, para Dirección, o para una etapa posterior.',
    documented_facts: ['Estas preguntas no están en Matriz v2.'],
    undocumented: [
      'No hay una decisión explícita de Matriz v2 que fije si debían desaparecer, pasar a Dirección o a una etapa posterior.',
    ],
    decision_question: '¿Dónde debería vivir esta información?',
    composition: null,
    card_kind: 'removed_content',
    in_rafa_queue: true,
    blocks_matrix: false,
    affects_now: 'No cambia el cálculo hasta que se recupere algo para la Matriz.',
    affects_later: 'Dirección o Intervención, según la salida.',
    verdict_set: 'fidelity',
  },
  {
    id: 'FID-EPER006',
    subject_kind: 'transformation',
    origin_type: 'V2_TRANSFORMATION',
    change_kind: 'INTENTION_LOSS_RISK',
    title: 'Dificultades e integración',
    source_refs: [
      { file: 'Excel original', sheet: 'E-PER-006', id: 'MIG-04', version: 'v2' },
    ],
    previous_state: 'Un total mezclaba interferencia y recursos positivos, y la fórmula era inalcanzable.',
    current_state: 'v2 separa interferencia e integración y no usa un total único.',
    change_summary: 'La corrección técnica está documentada. Queda la granularidad de lo que se pregunta.',
    rationale: 'El total único distorsionaba la lectura.',
    why_pending: 'Confirmar si el recorte de ítems todavía representa lo que querías medir.',
    documented_facts: [
      'v2 separa interferencia e integración.',
      'El total único quedó descartado porque distorsionaba la lectura.',
    ],
    undocumented: ['No está documentado si el recorte de ítems conserva la granularidad que importaba.'],
    decision_question: '¿Esta transformación conserva lo que queríamos conseguir?',
    composition: null,
    card_kind: 'method_transform',
    in_rafa_queue: true,
    blocks_matrix: false,
    affects_now: 'El cálculo actual usa la separación de v2.',
    affects_later: null,
    verdict_set: 'fidelity',
  },
  {
    id: 'FID-LINAJE',
    subject_kind: 'transformation',
    origin_type: 'V2_UNDOCUMENTED_RESULT',
    change_kind: 'INTENTION_LOSS_RISK',
    title: 'Linaje, nombre y arquetipos',
    source_refs: [
      { file: 'Excel original', sheet: 'E-PER-001', id: 'P-PRO-001', version: 'v2' },
    ],
    previous_state:
      'E-PER-001 profundizaba más en historia familiar, origen del nombre, significado o arquetipo asociado, generaciones y patrones heredados.',
    current_state:
      'v2 lo condensó en narrativas de Dirección. No hay equivalencia segura para nombre como arquetipo ni para las diez generaciones.',
    change_summary:
      'La simplificación puede haber conservado el linaje que cambia una decisión, o puede faltar un componente concreto. Los arquetipos no se reponen como clasificación de usuario.',
    rationale: 'Linaje explica de dónde viene la persona, no el estado actual de los cuatro ámbitos.',
    why_pending:
      '¿La simplificación conserva la parte del linaje que realmente cambia una decisión, o falta recuperar algún componente concreto?',
    documented_facts: [
      'Hay una pregunta de Dirección sobre historias y sacrificios familiares.',
      'Nombre como arquetipo y diez generaciones no tienen equivalencia segura en v2.',
    ],
    undocumented: [
      'No está confirmado qué parte del linaje debía sobrevivir.',
      'Que existieran arquetipos no implica que deban convertirse en una clasificación de usuario.',
    ],
    decision_question: '¿Dónde debería vivir esta información?',
    composition: null,
    card_kind: 'removed_content',
    in_rafa_queue: true,
    blocks_matrix: false,
    affects_now: 'No puntúa diagnóstico.',
    affects_later: 'Dirección.',
    verdict_set: 'fidelity',
  },
  {
    id: 'FID-IKIGAI',
    subject_kind: 'transformation',
    origin_type: 'V2_TRANSFORMATION',
    change_kind: 'INTENTION_LOSS_RISK',
    title: 'Ikigai',
    source_refs: [
      { file: 'Excel original', sheet: 'E-PER-008', id: 'MIG-12', version: 'v2' },
    ],
    previous_state:
      'En el Excel original, Ikigai pedía respuestas en cuatro áreas y después las combinaba según la posición en que habían sido escritas. Eso podía unir respuestas que no necesariamente tenían relación entre sí.',
    current_state:
      'En Matriz v2 se mantiene la idea de trabajar esas cuatro áreas, pero se elimina ese cruce automático. La persona construye primero una posible dirección y después la revisa usando seis criterios.',
    change_summary:
      'Se elimina el cruce automático por posición. La persona arma una dirección y la revisa con seis criterios.',
    rationale: 'El cruce por posición podía unir respuestas que no tenían relación entre sí.',
    why_pending: 'Confirmar si se conserva lo importante del Ikigai original o hay que recuperar algo.',
    documented_facts: [
      'Matriz v2 mantiene las cuatro áreas, una dirección construida por la persona y seis criterios de revisión.',
      'v2 no cruza por posición y no da puntaje diagnóstico.',
    ],
    undocumented: [],
    decision_question: '¿Este cambio conserva lo importante del Ikigai original o se perdió algo que deberíamos recuperar?',
    composition: {
      from_v2: [
        'cuatro familias de material',
        'hipótesis',
        'seis criterios',
        'no cruzar filas',
        'sin score diagnóstico',
      ],
      from_legacy: [
        'intención de los cuatro campos',
        'ayudas',
        'ejemplos',
        'lenguaje útil recuperado',
      ],
      from_product: [
        'nombres públicos de los campos',
        'cualificadores',
        'tensiones descriptivas',
        'mapa editable',
        'experiencia de formulación',
        'experimento posterior',
        'UX y copy',
      ],
      note: 'algunas ayudas, ejemplos y nombres que aparecen en la experiencia actual se definieron después de Matriz v2 para hacer el módulo más fácil de usar.',
    },
    card_kind: 'method_transform',
    in_rafa_queue: true,
    blocks_matrix: false,
    affects_now: 'No modifica puntaje ni estados.',
    affects_later: 'Dirección.',
    verdict_set: 'fidelity',
  },
  {
    id: 'FID-MANIFIESTO',
    subject_kind: 'transformation',
    origin_type: 'V2_UNDOCUMENTED_RESULT',
    change_kind: 'INTENTION_LOSS_RISK',
    title: 'Manifiesto y ruta',
    source_refs: [
      { file: 'Excel original', sheet: 'E-PER', id: 'MIG-02, MIG-13', version: 'v1 y v2' },
    ],
    previous_state:
      'En el Excel original había un documento final que reunía lo que la persona había definido sobre sí misma, su dirección y lo que se comprometía a hacer después.',
    current_state:
      'En Matriz v2 ese documento deja de formar parte del diagnóstico. El relato personal se conserva separado del puntaje y de los estados de la Matriz.',
    change_summary: 'El documento deja de formar parte del diagnóstico. El relato queda separado del puntaje y de los estados.',
    rationale: 'El diagnóstico no debe depender de un documento que mezcla relato y compromiso de ejecución.',
    why_pending: 'Decidir en qué momento del proceso debería construirse: Dirección o más adelante.',
    documented_facts: [
      'En Matriz v2 el documento deja de formar parte del diagnóstico.',
      'El relato personal queda separado del puntaje y de los estados.',
    ],
    undocumented: [
      'Lo que Matriz v2 no deja resuelto es en qué momento del proceso debería construirse ese documento: como parte de Dirección o más adelante, cuando ya se define qué hacer.',
    ],
    decision_question: '¿Dónde debería construirse este documento dentro del proceso de MK?',
    composition: null,
    card_kind: 'removed_content',
    in_rafa_queue: true,
    blocks_matrix: false,
    affects_now: 'No modifica el diagnóstico.',
    affects_later: 'Dirección o Intervención.',
    verdict_set: 'fidelity',
  },
];

const REFINEMENT_ITEMS: CatalogSeed[] = [
  {
    id: 'REF-DIRECTION-V01',
    subject_kind: 'decision',
    origin_type: 'POST_V2_REFINEMENT',
    change_kind: 'METHODOLOGICAL_REFINEMENT',
    title: 'Dirección en esta etapa',
    source_refs: [{ file: 'Lab / producto', sheet: null, id: 'DirectionReading 0.1', version: '0.1' }],
    previous_state: 'Matriz v2 contiene material de Propósito y Dirección, pero no infiere el propósito de una persona.',
    current_state:
      'En esta etapa, Dirección conserva y organiza lo que la persona expresa sobre hacia dónde quiere ir, pero no intenta decidir automáticamente cuál es su propósito.',
    change_summary: 'Dirección registra lo que la persona expresa. No define el propósito de forma automática.',
    rationale: 'No modifica la Matriz.',
    why_pending: 'Confirmar que, por ahora, Dirección registre sin definir el propósito automáticamente.',
    documented_facts: [
      'Matriz v2 tiene material de Propósito y Dirección.',
      'No existe una metodología validada para inferir propósito automáticamente.',
    ],
    undocumented: ['La interpretación de ese material queda abierta para una etapa posterior.'],
    decision_question:
      '¿Te parece correcto que, por ahora, Dirección registre lo que la persona expresa sin intentar definir automáticamente su propósito?',
    composition: null,
    card_kind: 'refinement',
    in_rafa_queue: true,
    blocks_matrix: false,
    affects_now: 'No cambia Matriz v2.',
    affects_later: 'Una metodología de Dirección posterior.',
    verdict_set: 'refinement',
  },
  {
    id: 'REF-FOCUS-SPLIT',
    subject_kind: 'decision',
    origin_type: 'FUTURE_PROPOSAL',
    change_kind: 'PRODUCT_PROPOSAL',
    title: 'Separar el ámbito prioritario del diagnóstico del foco de intervención',
    source_refs: [{ file: 'Lab / producto', sheet: null, id: 'foco de intervención', version: null }],
    previous_state: 'Matriz v2 tenía ámbito prioritario y ruta, sin formalizar dos conceptos de producto distintos.',
    current_state:
      'Esta distinción se registró para evitar que el futuro producto modifique retroactivamente el diagnóstico. Se revisará cuando comience la metodología de Intervención.',
    change_summary: 'No requiere decisión en esta fase.',
    rationale: 'El foco de intervención no debe retroalimentarse a la Matriz.',
    why_pending: null,
    documented_facts: ['El ámbito prioritario del diagnóstico pertenece a Matriz v2.'],
    undocumented: [],
    decision_question: null,
    composition: null,
    card_kind: 'later',
    in_rafa_queue: false,
    blocks_matrix: false,
    affects_now: 'No cambia Matriz v2.',
    affects_later: 'Motor de Intervención.',
    verdict_set: 'none',
  },
  {
    id: 'REF-COVERAGE-QA',
    subject_kind: 'decision',
    origin_type: 'TECHNICAL_CORRECTION',
    change_kind: 'TECHNICAL_CORRECTION',
    title: 'Cobertura QA sin test real',
    source_refs: [{ file: 'Lab', sheet: null, id: 'rule coverage', version: null }],
    previous_state: 'Algunas reglas aparecían cubiertas sin un archivo de test que lo anclara.',
    current_state: 'Una regla solo queda cubierta si existe el test anclado.',
    change_summary: 'Corrección técnica. No cambia la metodología de la Matriz.',
    rationale: 'Un verde falso no es cobertura.',
    why_pending: null,
    documented_facts: ['La cobertura QA exige un archivo de test anclado.'],
    undocumented: [],
    decision_question: null,
    composition: null,
    card_kind: 'correction',
    in_rafa_queue: false,
    blocks_matrix: false,
    affects_now: 'La pantalla de cobertura.',
    affects_later: null,
    verdict_set: 'none',
  },
  {
    id: 'REF-HONEST-CONSUMER',
    subject_kind: 'decision',
    origin_type: 'TECHNICAL_CORRECTION',
    change_kind: 'INCONSISTENCY_CORRECTION',
    title: 'Consumidor real de cada pregunta',
    source_refs: [{ file: 'Lab', sheet: null, id: 'question roles', version: null }],
    previous_state: 'La interfaz podía presentar un consumidor que no existía.',
    current_state: 'Cada pregunta declara su consumidor real. Sin consumidor actual no se finge uno.',
    change_summary: 'Corrección de inconsistencia. No pide criterio metodológico.',
    rationale: 'No atribuir a MK una lectura que el código no hace.',
    why_pending: null,
    documented_facts: ['Cada pregunta declara su consumidor real.'],
    undocumented: [],
    decision_question: null,
    composition: null,
    card_kind: 'correction',
    in_rafa_queue: false,
    blocks_matrix: false,
    affects_now: 'Banco y fichas de pregunta.',
    affects_later: null,
    verdict_set: 'none',
  },
];

const QUEUED_LEDGER_IDS = new Set(['MIG-02', 'MIG-04', 'MIG-12', 'MIG-13']);

function ledgerToDocumented(id: string): CatalogSeed | null {
  const row = loadMigrationLedger().find((item) => item.id === id);
  if (!row || QUEUED_LEDGER_IDS.has(id)) return null;
  return {
    id: row.id,
    subject_kind: 'transformation',
    origin_type: 'V2_TRANSFORMATION',
    change_kind: 'V2_TRANSFORMATION',
    title: row.problem,
    source_refs: [{ file: 'Excel original', sheet: row.source_sheets, id: row.id, version: 'v2' }],
    previous_state: row.cause,
    current_state: row.v2_resolution,
    change_summary: row.impact,
    rationale: row.v2_resolution,
    why_pending: null,
    documented_facts: [row.v2_resolution],
    undocumented: [],
    decision_question: null,
    composition: null,
    card_kind: 'documented',
    in_rafa_queue: false,
    blocks_matrix: false,
    affects_now: 'Forma parte de v2. No se vuelve a pedir aprobación.',
    affects_later: null,
    verdict_set: 'none',
  };
}

export const REVIEW_CATALOG: CatalogSeed[] = [
  ...FIDELITY_QUEUE,
  ...REFINEMENT_ITEMS,
  ...loadMigrationLedger()
    .map((row) => ledgerToDocumented(row.id))
    .filter((item): item is CatalogSeed => Boolean(item)),
];

export function catalogById(id: string): CatalogSeed | undefined {
  return REVIEW_CATALOG.find((item) => item.id === id);
}

export function hydrateCatalog(
  stored: Array<{ id: string; rafaVerdict: string | null; rafaNote: string | null }>,
): MethodologyProvenance[] {
  const byId = new Map(stored.map((row) => [row.id, row]));
  return REVIEW_CATALOG.map((item) => hydrateProvenance(item, byId.get(item.id)));
}

export function isQueuedFidelity(item: MethodologyProvenance): boolean {
  return item.in_rafa_queue && item.verdict_set === 'fidelity';
}

export function isQueuedRefinement(item: MethodologyProvenance): boolean {
  return item.in_rafa_queue && item.verdict_set === 'refinement';
}

export function isDocumentedV2(item: MethodologyProvenance): boolean {
  return (
    !item.in_rafa_queue &&
    item.change_kind === 'V2_TRANSFORMATION' &&
    (item.origin_type === 'MATRIX_V2' || item.origin_type === 'V2_TRANSFORMATION')
  );
}

export function isVisibleCorrection(item: MethodologyProvenance): boolean {
  return (
    item.change_kind === 'TECHNICAL_CORRECTION' || item.change_kind === 'INCONSISTENCY_CORRECTION'
  );
}

export function isLaterProposal(item: MethodologyProvenance): boolean {
  return item.change_kind === 'PRODUCT_PROPOSAL';
}
