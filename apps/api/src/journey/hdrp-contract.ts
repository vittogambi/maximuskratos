import { bandOf15 } from '../diagnostic/excel-score';
import { personalityBandForAverage } from '../instrumentos/personality-reading';

export type HdrpFacts = {
  name?: string | null;
  heritage?: string | null;
  values?: string[];
  standards?: { label: string; text: string }[];
  identity?: string | null;
  pattern?: string | null;
  vision?: string | null;
  lenses?: { vivo?: string; bueno?: string; necesita?: string; pagan?: string };
  activities?: string[];
  seal?: string | null;
  /** Raw 1 to 5 answers, 15 items, middle of each trio is inverse. */
  ocean?: number[];
  relation?: Array<number | null>;
  finance?: Array<number | null>;
  /** Couple gate. never means those three scales do not apply. */
  partner?: 'now' | 'last' | 'never' | null;
};

export type HdrpItem = {
  label: string;
  text: string;
  category?: string;
  descriptor?: string;
  commitment?: string;
  kind?: 'plan';
};
export type HdrpArticle = { title: string; items: HdrpItem[] };

const RELATION_PLACES = ['Círculo íntimo', 'Familia', 'Amistades', 'Trabajo'];

function clean(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function block(values: Array<number | null> | undefined, index: number): { sum: number; band: string } | null {
  const chunk = (values ?? []).slice(index * 3, index * 3 + 3);
  if (chunk.length < 3 || chunk.some((value) => value == null)) return null;
  const sum = chunk.reduce<number>((acc, value) => acc + (value ?? 0), 0);
  return { sum, band: bandOf15(sum) };
}

function purposeSentence(lenses: HdrpFacts['lenses'], activities?: string[]): string {
  const vivo = clean(lenses?.vivo);
  const bueno = clean(lenses?.bueno);
  const necesita = clean(lenses?.necesita);
  const pagan = clean(lenses?.pagan);
  if (!vivo || !bueno || !necesita || !pagan) {
    if (activities?.length) {
      return 'Pendiente de tu elección: hay actividades guardadas y el cruce entre los cuatro campos no está elegido.';
    }
    return 'Pendiente';
  }
  return `Mi propósito es poner mi ${vivo} y mi talento en ${bueno} al servicio de ${necesita}, generando valor a través de ${pagan}.`;
}

const FACTORS = ['Apertura', 'Responsabilidad', 'Extraversión', 'Amabilidad', 'Sensibilidad emocional'];
const INTRO_TITLE = 'El Manifiesto de su Propósito: Su Contrato Soberano';
const INTRO = 'La exploración de su historia, su mente y sus aspiraciones culmina en este documento. Lo que sigue a continuación no es un texto genérico; es la síntesis arquitectónica de su identidad y el decreto fundamental de su futuro. Al completar y firmar esta hoja de ruta, usted no está respondiendo un cuestionario: está firmando un contrato inquebrantable consigo mismo, asumiendo la responsabilidad absoluta de manifestar su máximo potencial en el mundo.';
const CLOSING = 'Como testimonio de aceptación de mi propio diseño y como orden directa hacia mi voluntad, firmo este manifiesto en pleno uso de mi soberanía personal.';

function item(label: string, text: string): HdrpItem {
  return { label, text };
}

type Band = { sum: number; band: string };

/** Big Five labels from E-PER-000. Items 2, 5, 8, 11 and 14 are inverse (6 minus the answer). */
export function oceanLabels(raw: number[]): string[] | null {
  if (raw.length !== 15 || raw.some((value) => !Number.isFinite(value))) return null;
  const labels: string[] = [];
  for (let group = 0; group < 5; group += 1) {
    const start = group * 3;
    const scores = [0, 1, 2].map((offset) => {
      const index = start + offset;
      const value = raw[index];
      return offset === 1 ? 6 - value : value;
    });
    const average = scores.reduce((acc, value) => acc + value, 0) / 3;
    labels.push(personalityBandForAverage(group, average));
  }
  return labels;
}

type BandName = 'Reestructuración' | 'Calibración' | 'Fluido';

function bandName(row: Band | null): BandName | null {
  if (!row || row.band === 'Sin desarrollo') return null;
  if (row.band === 'Reestructuración' || row.band === 'Calibración' || row.band === 'Fluido') return row.band;
  return null;
}

const FINANCE_NAMES = ['Flujo', 'Ahorro', 'Inversión', 'Deuda'];
const RELATION_MODULES = ['f-rad-002-s1', 'f-rad-002-s2', 'f-rad-002-s3', 'f-rad-002-s4'];
const FINANCE_MODULES = ['f-rad-003-s1', 'f-rad-003-s2', 'f-rad-003-s3', 'f-rad-003-s4'];

const RELATION_READING: Array<Record<BandName, string>> = [
  {
    Reestructuración: 'Lazos familiares invasivos o conflictivos. Ausencia de límites que interfiere directamente en su autonomía y paz mental.',
    Calibración: 'Relación cordial, pero que requiere ajustes. Aún persisten sutiles manipulaciones, culpas o deudas emocionales que pulir.',
    Fluido: 'Relaciones saludables y liberadas. Existe un respeto absoluto mutuo por la soberanía y el camino de vida de cada integrante.',
  },
  {
    Reestructuración: 'Entorno social tóxico o anclado en la baja frecuencia. Amistades que restan, promueven el estancamiento o exigen mediocridad para pertenecer.',
    Calibración: 'Círculo plano o recreativo. Compañeros de distracción con los que comparte el pasado, pero que no aportan valor ni desafíos hacia su visión de futuro.',
    Fluido: 'Tribu propulsora de élite. Un entorno de pares que eleva sus estándares, celebra sus victorias y lo confronta éticamente a mejorar.',
  },
  {
    Reestructuración: 'Entorno laboral hostil, desgastante o de alta desconfianza. Fricciones constantes que amenazan su enfoque profesional y su paz.',
    Calibración: 'Relaciones meramente transaccionales o políticas. Cumplen el mínimo operativo, pero existe resistencia pasiva o falta de alianzas estratégicas reales.',
    Fluido: 'Entorno de alta colaboración y sinergia. Su liderazgo o posicionamiento es respetado, facilitando la ejecución limpia de sus tareas.',
  },
  {
    Reestructuración: 'Su entorno actual opera como un punto de fuga de recursos emocionales y temporales. Hay alertas individuales activas. La prioridad antes de emprender cualquier proyecto expansivo es blindar su energía y ejecutar una reestructuración de límites de emergencia.',
    Calibración: 'Usted sostiene relaciones funcionales pero aisladas o asimétricas, un patrón donde usted suele sostener a todos, pero nadie lo sostiene a usted. Requiere intervenciones específicas en los bloques que puntuaron bajo para transicionar hacia la fluidez.',
    Fluido: 'Usted cuenta con una infraestructura relacional madura, blindada y sinérgica. Su entorno respeta su soberanía, expande su mentalidad y actúa como una red de soporte sólida que impulsa directamente su propósito.',
  },
];

const RELATION_COMMITMENT: Array<Record<BandName, string>> = [
  {
    Reestructuración: 'Dedicaré un mínimo de 12 horas al mes a reconstruir la seguridad, el apoyo mutuo y la justicia en mi relación de pareja o núcleo íntimo, mediante un espacio semanal de conversación honesta, tiempo exclusivo sin distracciones, una revisión explícita de las responsabilidades y cargas emocionales, acuerdos concretos de apoyo a los proyectos de ambos y, si después de seis a ocho semanas no existe avance o persisten conflictos graves, buscaré orientación profesional especializada.',
    Calibración: 'Dedicaré un mínimo de 8 horas al mes a fortalecer la sinergia de mi relación de pareja o núcleo íntimo, protegiendo semanalmente tiempo de conexión sin distracciones, expresando con claridad mis necesidades y preocupaciones, corrigiendo progresivamente los desequilibrios en las responsabilidades y realizando acciones concretas de apoyo al crecimiento personal y profesional de ambos.',
    Fluido: 'Dedicaré un mínimo de 6 horas al mes a conservar y profundizar la sinergia de mi relación de pareja o núcleo íntimo, manteniendo espacios semanales de presencia exclusiva, revisando preventivamente nuestros acuerdos y responsabilidades, apoyando activamente los proyectos individuales de ambos y desarrollando al menos un objetivo compartido que fortalezca nuestra conexión, pertenencia y propósito común.',
  },
  {
    Reestructuración: 'Dedicaré un mínimo de 6 horas al mes a recuperar mi autonomía dentro de mis relaciones familiares, identificando los patrones de culpa, dependencia, invasión o rescate que afectan mi paz, estableciendo límites claros sobre mi tiempo, dinero, decisiones y responsabilidades, reduciendo cuando sea necesario la exposición a interacciones destructivas y buscando orientación profesional si existen conflictos persistentes, manipulación, violencia o dependencia que no pueda gestionar saludablemente.',
    Calibración: 'Dedicaré un mínimo de 4 horas al mes a fortalecer mi independencia y mejorar mis relaciones familiares, revisando y comunicando los límites que todavía son inconsistentes, abordando conflictos o culpas pendientes, ofreciendo apoyo sin asumir responsabilidades que corresponden a otros adultos y cultivando encuentros conscientes que permitan conservar el afecto sin sacrificar mi paz, mis decisiones ni mi progreso personal.',
    Fluido: 'Dedicaré un mínimo de 2 horas al mes a conservar relaciones familiares afectuosas, libres y respetuosas, manteniendo límites claros, cultivando encuentros de calidad, ofreciendo apoyo sin reemplazar la responsabilidad personal de cada integrante y revisando preventivamente cualquier señal de culpa, dependencia, rescate o invasión que pueda afectar nuestra autonomía y paz.',
  },
  {
    Reestructuración: 'Dedicaré un mínimo de 8 horas al mes a reconstruir mi entorno social, evaluando honestamente la influencia de las personas con quienes más interactúo, reduciendo mi exposición a vínculos dominados por la queja, el chisme, los vicios, la manipulación o el estancamiento, estableciendo límites claros, participando en espacios compatibles con mis valores y contactando semanalmente a personas íntegras y disciplinadas que puedan contribuir a mi crecimiento, buscando apoyo profesional si existe aislamiento grave, coerción o dependencia de círculos destructivos.',
    Calibración: 'Dedicaré un mínimo de 6 horas al mes a elevar la calidad de mi círculo social, profundizando las relaciones que poseen potencial de confianza y crecimiento, sustituyendo parte de la convivencia meramente recreativa por conversaciones auténticas, actividades constructivas, desafíos compartidos y mecanismos de rendición de cuentas que estimulen el progreso mutuo, mientras reduzco gradualmente mi participación en dinámicas basadas en la queja, el chisme o el estancamiento.',
    Fluido: 'Dedicaré un mínimo de 4 horas al mes a conservar y fortalecer mi tribu de influencia, manteniendo encuentros y conversaciones auténticas, celebrando los avances de mis amigos, ofreciendo y recibiendo corrección honesta, colaborando en proyectos o desafíos compartidos y protegiendo nuestras relaciones de la complacencia, la arrogancia, el pensamiento grupal y cualquier dinámica que debilite nuestros valores o propósitos.',
  },
  {
    Reestructuración: 'Dedicaré un mínimo de 6 horas al mes a reestructurar mis relaciones laborales y profesionales, identificando las personas, conflictos y dinámicas que afectan mi desempeño, estableciendo límites y responsabilidades claras, preparando conversaciones difíciles desde hechos verificables y objetivos comunes, documentando acuerdos relevantes, reconstruyendo alianzas necesarias y recurriendo a la jefatura, Recursos Humanos o asesoría especializada cuando existan hostigamiento, abuso de poder o conflictos que no pueda resolver de manera segura y directa.',
    Calibración: 'Dedicaré un mínimo de 4 horas al mes a fortalecer mis alianzas laborales y ampliar mi red profesional, transformando relaciones meramente transaccionales en vínculos de confianza y colaboración, manteniendo conversaciones periódicas con actores estratégicos, ofreciendo valor antes de solicitar apoyo, pidiendo retroalimentación y gestionando los desacuerdos mediante hechos, intereses comunes y acuerdos concretos, sin interpretarlos automáticamente como ataques personales.',
    Fluido: 'Dedicaré un mínimo de 3 horas al mes a conservar y ampliar una red profesional basada en confianza, respeto y reciprocidad, manteniendo contacto intencional con aliados clave, compartiendo conocimiento y oportunidades, apoyando el desarrollo de otros, abordando preventivamente las tensiones y promoviendo colaboraciones que fortalezcan mis objetivos, los de la organización y los de mi comunidad profesional.',
  },
];

function relationItem(place: string, index: number, row: Band | null, partner?: HdrpFacts['partner']): HdrpItem {
  const band = bandName(row);
  if (!band && index === 0 && partner === 'never') return item(place, 'Sin pareja. Esta parte no se responde.');
  if (!band) return item(place, 'Pendiente: faltan las tres respuestas de este ámbito.');
  const descriptor = RELATION_READING[index][band];
  const commitment = RELATION_COMMITMENT[index][band];
  return {
    label: place,
    category: band,
    descriptor,
    commitment,
    text: `${band}. ${descriptor} ${commitment}`,
  };
}

function financePlan(finance: Array<number | null> | undefined): HdrpItem[] {
  const rows = [0, 1, 2, 3].map((index) => block(finance, index));
  const bands = rows.map(bandName);
  if (bands.some((band) => !band)) {
    return [item('Plan', 'Completa los cuatro diagnósticos financieros.')];
  }
  const [cash, savings, investment, debt] = bands as BandName[];
  return [
    ...bands.map((band, index) => item([
      'Suficiencia y flujo de caja',
      'Hábitos de ahorro y respaldo',
      'Hábitos de inversión y multiplicación',
      'Gestión de deudas y techo de valor',
    ][index], band as string)),
    { ...item('Plan', integratedFinance(cash, savings, investment, debt)), kind: 'plan' },
  ];
}

function integratedFinance(cash: BandName, savings: BandName, investment: BandName, debt: BandName): string {
  if (cash === 'Reestructuración' || debt === 'Reestructuración') {
    const flow = cash === 'Reestructuración'
      ? 'Reduzca el costo de vida total hasta un máximo del 90% de sus ingresos líquidos, procure que los costos fijos bajen del 60% y recupere al menos un 10% de margen mensual. Priorice fuentes de ingreso recurrentes que cubran el 100% de sus necesidades esenciales. '
      : 'Conserve el flujo positivo y no aumente sus costos fijos mientras corrige las demás brechas. ';
    const dues = debt === 'Reestructuración'
      ? 'Dentro del margen disponible, destine prioritariamente entre el 15% y el 25% de sus ingresos al pago de deudas de consumo de alto interés. Si la carga total supera el 30% o compromete necesidades básicas, renegocie antes de efectuar abonos extraordinarios. Defina además un valor mínimo rentable para su trabajo y deje de reducirlo por miedo al rechazo. '
      : debt === 'Calibración'
        ? 'Destine entre el 10% y el 20% de sus ingresos a reducir deuda pendiente, mantenga las cuotas al día y ajuste sus precios u honorarios según costos, experiencia y valor entregado. '
        : 'Mantenga en 0% la deuda de consumo de alto interés y evite asumir nuevas obligaciones. Revise periódicamente el valor de su trabajo. ';
    const reserve = savings === 'Reestructuración'
      ? 'Controle las compras impulsivas y reserve entre el 1% y el 5% de sus ingresos para crear un respaldo inicial equivalente a un mes de gastos esenciales. '
      : savings === 'Calibración'
        ? 'Mantenga protegido el ahorro ya acumulado y limite temporalmente su aporte a entre el 1% y el 5% mientras estabiliza el flujo o la deuda. '
        : 'Conserve intacto su Fondo de Emergencia y úselo solo para contingencias reales. ';
    return `Plan financiero integrado. Reestructuración. ${flow}${dues}${reserve}Destine 0% a nuevas inversiones hasta recuperar flujo positivo, controlar las deudas de alto interés y contar al menos con un mes de respaldo. Dedique tiempo mensual a educación financiera, pero no coloque recursos en instrumentos que aún no comprenda. Por tratarse de un escenario crítico, debe revisar su situación con un asesor financiero.`;
  }
  if (cash === 'Fluido' && savings === 'Fluido' && investment === 'Fluido' && debt === 'Fluido') {
    return 'Plan financiero integrado. Fluido. Mantenga los costos fijos en torno al 50% o menos, el costo de vida total bajo el 80%, un margen mensual mínimo del 20% y al menos el 90% de ingresos predecibles. Conserve 0% de deuda de consumo de alto interés y limite las cuotas de deuda justificada al 15% a 20% de sus ingresos. Destine entre el 3% y el 5% al mantenimiento del Fondo de Emergencia y metas de corto plazo, y entre el 15% y el 20% o más a una cartera diversificada de largo plazo. Revise rentabilidad, costos, liquidez y riesgos, actualice periódicamente el valor de su trabajo y evite que el aumento de ingresos se convierta automáticamente en mayor consumo.';
  }
  const flow = cash === 'Calibración'
    ? 'Ordene su flujo para mantener los costos fijos bajo el 55%, el costo de vida total entre el 80% y el 85%, un margen estable del 15% a 20% y al menos el 80% de ingresos predecibles. '
    : 'Mantenga los costos fijos en torno al 50% o menos, el costo de vida total bajo el 80% y un margen mínimo del 20%. ';
  const dues = debt === 'Calibración'
    ? 'Destine entre el 10% y el 20% de sus ingresos a eliminar deuda de consumo pendiente, priorizando las tasas más altas. Ajuste sus precios u honorarios según costos, experiencia y valor entregado. '
    : 'Mantenga en 0% la deuda de consumo de alto interés y limite las cuotas de deuda justificada al 15% a 20% de sus ingresos. Revise periódicamente el valor de su trabajo. ';
  const reserve = savings === 'Reestructuración'
    ? 'Controle el consumo impulsivo y destine entre el 10% y el 15% de sus ingresos a construir primero un respaldo de un mes de gastos esenciales y luego ampliarlo a 3 a 6 meses. '
    : savings === 'Calibración'
      ? 'Automatice entre el 10% y el 15% de sus ingresos hasta completar un Fondo de Emergencia de 3 a 6 meses y reduzca las compras no planificadas. '
      : 'Destine entre el 3% y el 5% al mantenimiento del Fondo de Emergencia y a metas de corto plazo. ';
  let invest: string;
  if (savings === 'Reestructuración') {
    invest = 'Destine 0% a inversión hasta contar con al menos un mes de respaldo. Después, inicie con aportes del 1% a 5% en instrumentos simples y regulados.';
  } else if (debt === 'Calibración') {
    invest = 'Limite temporalmente la inversión al 0% a 5% y dirija el resto del margen al pago de deuda.';
  } else if (cash === 'Calibración') {
    invest = investment === 'Reestructuración'
      ? 'Destine inicialmente entre el 1% y el 5% a inversiones simples, una vez cubierto el respaldo mínimo.'
      : 'Destine entre el 5% y el 10% a inversiones diversificadas, siempre dentro del margen disponible.';
  } else if (investment === 'Reestructuración') {
    invest = 'Comience con aportes del 1% a 5% en instrumentos simples, regulados y que comprenda.';
  } else {
    invest = 'Destine entre el 5% y el 10% a inversiones diversificadas y revise mensualmente su estrategia.';
  }
  return `Plan financiero integrado. Calibración. ${flow}${dues}${reserve}${invest}`;
}

export type HdrpGap = { id: string; label: string; moduleSlug: string };

function lensesReady(lenses: HdrpFacts['lenses']): boolean {
  return Boolean(clean(lenses?.vivo) && clean(lenses?.bueno) && clean(lenses?.necesita) && clean(lenses?.pagan));
}

/** Parts of E-PER-HdRP that stay empty until the person answers them. */
export function hdrpGaps(facts: HdrpFacts, chosen?: string | null): HdrpGap[] {
  const gaps: HdrpGap[] = [];
  if (!clean(facts.heritage)) gaps.push({ id: 'origen', label: 'Origen', moduleSlug: 'e-per-origen' });
  if (!(facts.values ?? []).some((value) => clean(value))) gaps.push({ id: 'valores', label: 'Valores', moduleSlug: 'e-per-valores' });
  if (!(facts.standards ?? []).some((row) => clean(row.text))) gaps.push({ id: 'estandares', label: 'Estándares', moduleSlug: 'e-per-estandares' });
  if (!clean(facts.identity)) gaps.push({ id: 'identidad', label: 'Identidad', moduleSlug: 'e-per-identidad' });
  if (!oceanLabels(facts.ocean ?? [])) gaps.push({ id: 'personalidad', label: 'Personalidad', moduleSlug: 'e-per-personalidad' });
  if (!clean(facts.pattern)) gaps.push({ id: 'dificultades', label: 'Dificultades', moduleSlug: 'e-per-dificultades' });
  if (!clean(facts.vision)) gaps.push({ id: 'vision', label: 'Visión', moduleSlug: 'e-per-vision' });
  const chosenOk = Boolean(chosen?.trim()) && !chosen!.includes('[');
  if (!chosenOk && !lensesReady(facts.lenses)) {
    gaps.push({
      id: 'proposito',
      label: 'Propósito',
      moduleSlug: facts.activities?.length ? 'e-per-huella' : 'e-per-ikigai',
    });
  }
  if (!clean(facts.seal)) gaps.push({ id: 'huella', label: 'Huella', moduleSlug: 'e-per-huella' });
  RELATION_PLACES.forEach((label, index) => {
    if (index === 0 && facts.partner === 'never') return;
    if (!bandName(block(facts.relation, index))) gaps.push({ id: `relacion-${index}`, label, moduleSlug: RELATION_MODULES[index] });
  });
  FINANCE_NAMES.forEach((label, index) => {
    if (!bandName(block(facts.finance, index))) gaps.push({ id: `finanza-${index}`, label: `Finanzas, ${label.toLowerCase()}`, moduleSlug: FINANCE_MODULES[index] });
  });
  return gaps;
}

/** Uses a sentence the person chose. An unresolved bracket template is not a purpose. */
export function withChosenPurpose(articles: HdrpArticle[], text: string | null | undefined): HdrpArticle[] {
  const chosen = text?.trim() ?? '';
  if (!chosen || chosen.includes('[')) return articles;
  return articles.map((article) => ({
    ...article,
    items: article.items.map((row) => (row.label.includes('IKIGAI') ? { ...row, text: chosen } : row)),
  }));
}

export function buildHdrpContract(facts: HdrpFacts): {
  name: string | null;
  introTitle: string;
  intro: string;
  lead: string;
  closing: string;
  articles: HdrpArticle[];
} {
  const name = clean(facts.name);
  const values = (facts.values ?? []).map(clean).filter((value): value is string => Boolean(value));
  const standards = (facts.standards ?? []).filter((row) => clean(row.text));
  const personality = oceanLabels(facts.ocean ?? []);

  const articles: HdrpArticle[] = [
    {
      title: 'I. El origen y el fundamento',
      items: [
        item(
          'Reconozco y asumo con orgullo la herencia e historia familiar de mi ascendencia',
          clean(facts.heritage) ?? 'Pendiente: no hay respuesta guardada en origen.',
        ),
        item(
          'Honraré a mis ancestros y a mi historia tomando como base innegociable mis valores fundamentales de:',
          values.length ? values.join('\n') : 'Pendiente: no hay valores guardados.',
        ),
        item('los cuales expresaré con firmeza en cada una de mis acciones cotidianas mediante el cumplimiento estricto de mis estándares de vida:', ''),
        ...(standards.length
          ? standards.map((row) => item(row.label, row.text.trim()))
          : [item('Estándares', 'Pendiente: no hay un estándar semanal guardado.')]),
      ],
    },
    {
      title: 'II. La gestión de la identidad y el carácter',
      items: [
        item(
          'Entendiendo que mi identidad actual es',
          clean(facts.identity) ?? 'Pendiente: no hay respuestas de identidad.',
        ),
        item('y reconociendo objetivamente que la estructura de mi personalidad se define por una', ''),
        ...(personality
          ? personality.map((label, index) => item(FACTORS[index], label))
          : [item('Personalidad', 'Pendiente: faltan las quince respuestas.')]),
        item(
          'me comprometo a trabajar conscientemente con estas herramientas psicológicas. Utilizaré mis fortalezas naturales y aprenderé a integrar, mitigar y superar mis dificultades específicas en',
          '',
        ),
        ...(clean(facts.pattern)
          ? clean(facts.pattern)!.split('\n').filter(Boolean).map((line) => item('', line))
          : [item('', 'Pendiente: no hay una lectura de dificultades para revisar.')]),
        item('impidiendo que cualquier limitación interna frene mi avance.', ''),
      ],
    },
    {
      title: 'III. La dirección y la trascendencia',
      items: [
        item(
          'Dirijo toda mi energía vital hacia la construcción de mi visión de futuro:',
          clean(facts.vision) ?? 'Pendiente: no hay respuesta guardada de visión.',
        ),
        item(
          'Ejecutaré este camino logrando la convergencia de mis pasiones, vocación y capacidades a través de mi IKIGAI:',
          purposeSentence(facts.lenses, facts.activities),
        ),
        item(
          'Todo ello con el propósito definitivo de manifestar mi paso por este mundo y legar mi',
          clean(facts.seal) ?? 'Pendiente: no hay respuesta guardada de huella.',
        ),
        item('impactando positivamente en mi entorno y en las generaciones venideras.', ''),
      ],
    },
    {
      title: 'IV. Las relaciones',
      items: ['Círculo íntimo (pareja, hijos)', 'Familiares', 'Amistades de valor', 'Entorno social y profesional']
        .map((place, index) => relationItem(place, index, block(facts.relation, index), facts.partner)),
    },
    {
      title: 'V. Las finanzas',
      items: financePlan(facts.finance),
    },
  ];

  const who = name ?? '';
  return {
    name,
    introTitle: INTRO_TITLE,
    intro: INTRO,
    lead: who
      ? `Yo, ${who}, consciente de mi historia, dueño de mi presente y arquitecto de mi destino, declaro solemnemente los pilares que rigen y regirán mi existencia a partir de este momento.`
      : 'Yo, consciente de mi historia, dueño de mi presente y arquitecto de mi destino, declaro solemnemente los pilares que rigen y regirán mi existencia a partir de este momento.',
    closing: CLOSING,
    articles,
  };
}

export function contractText(contract: { lead: string; closing: string; articles: HdrpArticle[] }): string {
  const body = contract.articles
    .map((article) => `${article.title}\n${article.items.map((row) => `${row.label}: ${row.text}`).join('\n')}`)
    .join('\n\n');
  return `${contract.lead}\n\n${body}\n\n${contract.closing}`;
}
