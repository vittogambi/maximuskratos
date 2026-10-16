/**
 * Anchors of a scale item. `stem` exists when the catalog carries the question with its anchors inline.
 * `points` holds the printed label of each point when the workbook gives one for every point.
 */
export type ScalePrompt = {
  stem?: string;
  low: string;
  high: string;
  points?: Partial<Record<number, string>>;
  /** Longer definition of a point, from an Excel comment. The short name stays in `points`. */
  details?: Partial<Record<number, string>>;
};

type CatalogPrompt = ScalePrompt & { stem: string };

/** Presentation of concatenated scale prompts. Keyed by sourceRef. Words are exact catalog slices. */
export const SCALE_PROMPTS: Record<string, CatalogPrompt> = {
  "formulario-v1:E-AUD-001!R6": { stem: "¿Mis decisiones diarias reflejan al hombre que digo que quiero llegar a ser?", low: "Casi nunca; la mayoría de mis decisiones contradicen lo que digo querer.", high: "Casi siempre; mis decisiones reflejan claramente al hombre que quiero ser." },
  "formulario-v1:E-AUD-001!R7": { stem: "Cuando siento presión o una emoción intensa, ¿puedo reconocer lo que siento y elegir una respuesta coherente con mis principios?", low: "La emoción suele gobernar mis decisiones.", high: "Reconozco la emoción, comprendo su mensaje y respondo deliberadamente." },
  "formulario-v1:E-AUD-001!R8": { stem: "¿Qué tan seguido uso excusas que suenan razonables, pero no lo son?", low: "Uso excusas con frecuencia y las justifico fácilmente.", high: "Rara vez uso excusas; asumo responsabilidad directa." },
  "formulario-v1:E-AUD-001!R9": { stem: "¿Confío en mí mismo para terminar lo que empiezo?", low: "No confío; suelo abandonar lo que inicio.", high: "Confío plenamente; soy consistente y confiable conmigo mismo." },
  "formulario-v1:E-AUD-001!R10": { stem: "¿Qué historia me cuento a mí mismo cuando las cosas se ponen difíciles?", low: "Una historia de víctima o resignación.", high: "Una historia de responsabilidad, crecimiento y dominio personal." },
  "formulario-v1:E-AUD-001!R16": { stem: "¿Qué tan seguido realiza entrenamiento físico?", low: "No entreno", high: "5 ó más días a la semana" },
  "formulario-v1:E-AUD-001!R17": { stem: "¿Qué tan constante he sido con la alimentación — no perfecto, sino honesto?", low: "Muy desordenado; sin estructura ni control.", high: "Muy consistente; alimentación alineada al objetivo." },
  "formulario-v1:E-AUD-001!R18": { stem: "¿Mi calidad de sueño está apoyando mi progreso o lo está saboteando silenciosamente?", low: "Sabotea claramente mi progreso.", high: "Apoya plenamente mi progreso y rendimiento." },
  "formulario-v1:E-AUD-001!R19": { stem: "¿Con qué frecuencia utilizo comida, alcohol, sexo, compras, pantallas o entretenimiento para evitar emociones, conversaciones o responsabilidades que debería enfrentar?", low: "Muy frecuentemente.", high: "Casi nunca; puedo reconocer y procesar lo que siento." },
  "formulario-v1:E-AUD-001!R20": { stem: "¿Sus hábitos le están haciendo avanzar con claridad o drenando su energía?", low: "La mayoría de mis hábitos drenan energía.", high: "Mis hábitos están claramente alineados con avanzar." },
  "formulario-v1:E-AUD-001!R26": { stem: "¿Planifico mi semana o, en su mayoría, solo reacciono a ella?", low: "Solo reacciono; no planifico.", high: "Planifico con claridad y propósito" },
  "formulario-v1:E-AUD-001!R27": { stem: "¿Mi entorno está configurado para apoyar la disciplina o la comodidad?", low: "Favorece claramente la comodidad.", high: "Diseñado intencionalmente para la disciplina." },
  "formulario-v1:E-AUD-001!R28": { stem: "¿Quiénes están a mi alrededor elevan mis estándares o los bajan silenciosamente?", low: "Mi entorno baja claramente mis estándares.", high: "Estoy rodeado de personas que elevan mis estándares." },
  "formulario-v1:E-AUD-001!R29": { stem: "Cuando me desvío del rumbo, ¿qué tan rápido corrijo el curso?", low: "No corrijo; sigo desviándome.", high: "Corrijo casi de inmediato." },
  "formulario-v1:E-AUD-001!R30": { stem: "Si siguiera viviendo exactamente de esta manera durante un año más, ¿me sentiría orgulloso del lugar al que me lleva?", low: "No; me decepcionaría profundamente.", high: "Muy orgulloso; este camino refleja quién quiero ser." },
  "formulario-v1:E-AUD-001!R39": { stem: "Planificación Financiera: ¿Cuentas con un presupuesto escrito o un plan estructurado para tus finanzas a corto y largo plazo?", low: "Cero planificación", high: "Plan financiero profesional y seguimiento semanal)." },
  "formulario-v1:E-AUD-001!R46": { stem: "Dinámica de Pareja: ¿Qué tan sólida, alineada y nutritiva es tu relación de pareja actual (o tu preparación para tener una)?", low: "Conflicto constante/Tóxica", high: "Alineación total en valores y apoyo mutuo" },
  "formulario-v1:E-AUD-001!R47": { stem: "Relación Familiar (Padres/Hijos): ¿Qué tan sano es el vínculo con tu núcleo familiar y qué tan presente estás en su desarrollo?", low: "Distante/Conflictivo", high: "Presencia activa, respeto y armonía" },
  "formulario-v1:E-AUD-001!R48": { stem: "Círculo de Influencia (Amistades): ¿Qué tanto te impulsan tus relaciones sociales y amigos hacia la excelencia y el sentido de propósito?", low: "Amigos que me restan/vicio", high: "Círculo de hierro que me exige y apoya" },
  "formulario-v1:E-AUD-001!R49": { stem: "Entorno Laboral/Social: ¿Qué tan respetado y funcional es tu liderazgo en tu entorno de trabajo o comunidad?", low: "Invisible o en conflicto", high: "Referente de orden y liderazgo." },
};

/**
 * Only the printed endpoints of the Big Five items. Source: `260529-FORMULARIOS-X-PASO.xlsx`, sheet E-PER-000,
 * column C (Observación), rows 187 to 205. The catalog v6 dropped them (its `contextEs` holds the block title).
 * Points 2 to 4 have no text in the source, so they get none here. Closing period removed, as in the other labels.
 */
export const WORKBOOK_ENDPOINTS: Record<string, ScalePrompt> = {
  "formulario-v1:E-PER-000!R10": { low: "Nada alineado", high: "Totalmente alineado" },
  "formulario-v1:E-PER-000!R187": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C187
  "formulario-v1:E-PER-000!R188": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C188
  "formulario-v1:E-PER-000!R189": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C189
  "formulario-v1:E-PER-000!R191": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C191
  "formulario-v1:E-PER-000!R192": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C192
  "formulario-v1:E-PER-000!R193": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C193
  "formulario-v1:E-PER-000!R195": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C195
  "formulario-v1:E-PER-000!R196": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C196
  "formulario-v1:E-PER-000!R197": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C197
  "formulario-v1:E-PER-000!R199": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C199
  "formulario-v1:E-PER-000!R200": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C200
  "formulario-v1:E-PER-000!R201": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C201
  "formulario-v1:E-PER-000!R203": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C203
  "formulario-v1:E-PER-000!R204": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C204
  "formulario-v1:E-PER-000!R205": { low: "Totalmente en desacuerdo", high: "Totalmente de acuerdo" }, // C205
};

const FREQUENCY_POINTS: Record<number, string> = {
  1: "Nunca ocurre",
  2: "Rara vez ocurre",
  3: "Ocurre a veces",
  4: "Ocurre frecuentemente",
  5: "Ocurre siempre",
};

/**
 * F-RAD-002 items whose workbook legend (column C) is a frequency scale. Catalog v6 applies the agreement set to the
 * whole family (`scripts/formulario/build_formulario_next.mjs`, AGREE). Source: `260529-FORMULARIOS-X-PASO.xlsx`,
 * sheet F-RAD-002, cells C6, C8, C17, C25, C26, C27. Only the shown text changes: the catalog and the option ids stay.
 */
export const WORKBOOK_POINT_LABELS: Record<string, ScalePrompt> = {
  "formulario-v1:F-RAD-002!R6": { low: FREQUENCY_POINTS[1], high: FREQUENCY_POINTS[5], points: FREQUENCY_POINTS },
  "formulario-v1:F-RAD-002!R8": { low: FREQUENCY_POINTS[1], high: FREQUENCY_POINTS[5], points: FREQUENCY_POINTS },
  "formulario-v1:F-RAD-002!R17": { low: FREQUENCY_POINTS[1], high: FREQUENCY_POINTS[5], points: FREQUENCY_POINTS },
  "formulario-v1:F-RAD-002!R25": { low: FREQUENCY_POINTS[1], high: FREQUENCY_POINTS[5], points: FREQUENCY_POINTS },
  "formulario-v1:F-RAD-002!R26": { low: FREQUENCY_POINTS[1], high: FREQUENCY_POINTS[5], points: FREQUENCY_POINTS },
  "formulario-v1:F-RAD-002!R27": { low: FREQUENCY_POINTS[1], high: FREQUENCY_POINTS[5], points: FREQUENCY_POINTS },
};

/**
 * Excel comments for E-AUD-001 R37 to R40. The catalog keeps the short option text and the same values.
 * Shown text is the comment: a level name plus its definition. Dashes from the comment are not copied into the UI.
 */
const FINANCE_LEVELS: Record<string, ScalePrompt> = {
  "formulario-v1:E-AUD-001!R37": {
    low: "Sobreendeudado / Asfixiado",
    high: "Sin deudas problemáticas o deuda productiva bajo control total",
    points: {
      1: "Sobreendeudado / Asfixiado",
      2: "Deuda crítica / Alta presión",
      3: "Deuda manejable, pero vulnerable",
      4: "Deuda controlada",
      5: "Sin deudas problemáticas o deuda productiva bajo control total",
    },
    details: {
      1: "No puedo cubrir regularmente las cuotas o gastos básicos. Presento atrasos, cobranza, uso permanente de nuevas deudas para pagar obligaciones anteriores o una carga financiera que amenaza vivienda, alimentación o servicios esenciales.",
      2: "Aún pago la mayoría de las obligaciones, pero las cuotas consumen una parte excesiva de mis ingresos. Frecuentemente debo postergar gastos básicos, usar tarjetas o líneas de crédito para llegar a fin de mes y la deuda me genera preocupación constante.",
      3: "Cumplo los pagos y no tengo atrasos relevantes, pero la deuda limita considerablemente mi capacidad de ahorrar, enfrentar emergencias o desarrollar otros objetivos. Un imprevisto importante podría desestabilizarme.",
      4: "Todas mis obligaciones están al día, las cuotas son compatibles con mis ingresos y dispongo de un plan definido para reducirlas. La deuda no compromete mis necesidades básicas ni genera una presión mental significativa.",
      5: "No tengo deudas de consumo, o mantengo únicamente obligaciones justificadas y sostenibles, por ejemplo hipotecarias, educativas o productivas, con tasas, plazos y cuotas plenamente controladas. La deuda no limita mi ahorro ni mi estabilidad.",
    },
  },
  "formulario-v1:E-AUD-001!R38": {
    low: "Vivo al día / Cero ahorro",
    high: "Ahorro e inversión consolidados",
    points: {
      1: "Vivo al día / Cero ahorro",
      2: "Ahorro ocasional e inestable",
      3: "Ahorro inicial, pero irregular",
      4: "Ahorro sistemático y protegido",
      5: "Ahorro e inversión consolidados",
    },
    details: {
      1: "Utilizo la totalidad de mis ingresos para gastos y deudas. No ahorro regularmente y cualquier emergencia debe financiarse mediante deuda, ayuda externa o venta de bienes.",
      2: "Ahorro solo algunos meses o cuando sobra dinero, normalmente menos del 5% de mis ingresos. Suelo retirar lo ahorrado para cubrir gastos corrientes o imprevistos.",
      3: "Logro separar aproximadamente entre 5% y 10% de mis ingresos en la mayoría de los meses, aunque todavía existen interrupciones. Estoy formando un fondo de emergencia, pero aún no alcanzo una estructura estable de ahorro e inversión.",
      4: "Separo automáticamente alrededor de 10% a 20% de mis ingresos todos los meses. Cuento con un fondo de emergencia en desarrollo o consolidado y comienzo a destinar recursos a objetivos de mediano y largo plazo.",
      5: "Ahorro o invierto sistemáticamente más del 20% de mis ingresos, mediante transferencias automatizadas y objetivos definidos. Cuento con un fondo de emergencia adecuado y una estrategia diversificada de largo plazo.",
    },
  },
  "formulario-v1:E-AUD-001!R39": {
    low: "Cero planificación",
    high: "Plan integral y seguimiento sistemático",
    points: {
      1: "Cero planificación",
      2: "Conciencia básica, sin sistema",
      3: "Presupuesto básico con seguimiento irregular",
      4: "Plan financiero estructurado y seguimiento mensual",
      5: "Plan integral y seguimiento sistemático",
    },
    details: {
      1: "No registro ingresos, gastos ni deudas. Desconozco cuánto gasto mensualmente, tomo decisiones financieras de manera reactiva y no tengo metas ni plazos definidos.",
      2: "Tengo una idea general de mis ingresos y gastos, pero no utilizo un presupuesto escrito o actualizado. Reviso mis finanzas solo cuando aparece un problema y mis objetivos son vagos o no tienen fechas.",
      3: "Mantengo un registro simple de ingresos, gastos y deudas, y cuento con algunas metas financieras. Sin embargo, actualizo la información de forma irregular y no siempre ajusto mis decisiones según los resultados.",
      4: "Cuento con un presupuesto escrito, categorías de gasto, metas de ahorro, estrategia de deuda y proyecciones de corto y mediano plazo. Reviso el plan al menos una vez al mes y corrijo desviaciones.",
      5: "Dispongo de un plan financiero completo que integra presupuesto, deuda, fondo de emergencia, seguros, ahorro, inversión, jubilación y objetivos de largo plazo. Realizo seguimiento semanal o quincenal, evaluación mensual y ajustes periódicos, con apoyo profesional cuando corresponde.",
    },
  },
  "formulario-v1:E-AUD-001!R40": {
    low: "Muy insuficientes",
    high: "Superiores a las necesidades y metas actuales",
    points: {
      1: "Muy insuficientes",
      2: "Insuficientes / Alta fragilidad",
      3: "Suficientes para el presente, limitados para progresar",
      4: "Adecuados y alineados con mis objetivos",
      5: "Superiores a las necesidades y metas actuales",
    },
    details: {
      1: "Mis ingresos no cubren regularmente necesidades básicas y obligaciones esenciales. Dependo de deuda, ayuda externa o incumplimientos para mantenerme. No tengo capacidad real de ahorro ni de avanzar hacia mis objetivos.",
      2: "Cubro la mayoría de mis necesidades básicas, pero con estrés frecuente, restricciones importantes o uso ocasional de deuda. No puedo absorber imprevistos ni financiar metas relevantes.",
      3: "Mis ingresos cubren necesidades y obligaciones habituales, pero dejan poco margen para ahorro, inversión, formación, ocio significativo o proyectos de largo plazo. Mantengo estabilidad básica, aunque con poca capacidad de crecimiento.",
      4: "Mis ingresos cubren responsablemente necesidades, obligaciones y un estilo de vida razonable. Puedo ahorrar, enfrentar imprevistos y avanzar de manera sostenida hacia metas personales, familiares y profesionales.",
      5: "Mis ingresos exceden de forma sostenible mis costos de vida y obligaciones. Puedo ahorrar e invertir ampliamente, financiar objetivos significativos, apoyar a otros y elegir con mayor libertad cómo utilizar mi tiempo y capacidades.",
    },
  },
};

export function scalePromptFor(sourceRef: string | null | undefined): ScalePrompt | null {
  if (!sourceRef) return null;
  const base = SCALE_PROMPTS[sourceRef] ?? WORKBOOK_ENDPOINTS[sourceRef] ?? WORKBOOK_POINT_LABELS[sourceRef] ?? null;
  const levels = FINANCE_LEVELS[sourceRef];
  if (!levels) return base;
  return base ? { ...base, points: levels.points, details: levels.details } : levels;
}
