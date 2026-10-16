# Hoja de ruta de propósito (HDRP)

Paquete de código para corregir la pantalla existente. No es una especificación nueva.

Ruta visible: `/diagnostico/resultado` renderiza `RoadmapClose`.
`/proposito` está en próximamente y no muestra este contrato.

## Mapa

| Pieza | Archivo |
|---|---|
| Constructor del documento, relaciones, finanzas, personalidad | `apps/api/src/journey/hdrp-contract.ts` |
| Lectura de respuestas, identidad, dificultades, guardado y firma | `apps/api/src/journey/journey.service.ts` |
| Rutas HTTP | `apps/api/src/journey/journey.controller.ts` |
| Tipos y llamadas del cliente | `apps/web/lib/journey-api.ts` |
| Pantalla | `apps/web/components/journey/RoadmapClose.tsx` |
| Bloques | `apps/web/components/journey/ContractSections.tsx` |
| Página | `apps/web/app/(member)/diagnostico/resultado/page.tsx` |
| Estilos | `apps/web/app/globals.css` |
| Pruebas del constructor | `apps/api/test/hdrp-contract.test.ts` |

`journey.service.ts` y `globals.css` van recortados a lo que arma o pinta la hoja. El resto de esos archivos no es de esta pantalla.

## Mapeo actual de autocompletado

- Origen: `formulario-v1:E-PER-000!R12` (celda D12, cultura de los apellidos).
- Valores: opciones de `R51`, si no hay, `R40`.
- Estándares: texto libre de `R62`, partido por etiquetas Trascendencia, Familia, Amistad, Trabajo significativo, Cualquier otro.
- Identidad: suma de las 10 opciones de `e-per-identidad`, bandas de D88.
- Personalidad: 15 ítems de `e-per-personalidad`, ítem del medio invertido, cortes 4 y 2,4.
- Dificultades: cuatro familias A–D por `sourceRef` R94–R143, textos de D161, D165, D169 y D173.
- Visión: `R34`, si no hay, `R33`.
- Propósito: `statement` guardado si no trae corchetes. Si no, el texto visible de la síntesis.
- Huella: `R277`.
- Relaciones: 12 escalas de `f-rad-002-s1` a `s4`. La puerta `mk:f-rad-002-pareja-puerta` no puntúa. «No tengo ni he tenido pareja» saca el círculo íntimo.
- Finanzas: 12 escalas de `f-rad-003-s1` a `s4` y el plan de D41.
- Nombre y firma: `purpose_revisions.content`. Lo firmado se congela en `contract` y `contractView`.

## `apps/api/src/journey/hdrp-contract.ts` (1:401)

```ts
import { bandOf15 } from '../diagnostic/excel-score';

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

/** Integrated plan from E-PER-HdRP-v2, cell D41. C41 cash, C42 savings, C43 investment, C44 debt. */
const OCEAN_LABELS: Array<[string, string, string]> = [
  [
    'Mentalidad exploradora e ideal para innovación',
    'Prefiere procesos claros y enfoque pragmático',
    'Equilibrio entre creatividad y sentido práctico',
  ],
  [
    'Ejecutora disciplinada con foco en metas',
    'Espontánea, requiere estructura externa',
    'Flexible en ejecución, organizada sin rigidez',
  ],
  [
    'Orientada a personas y liderazgo expuesto',
    'Trabajo reflexivo en ambientes independientes',
    'Ambivalente, disfruta lo social con pausas a solas',
  ],
  [
    'Vocación de servicio y altamente cooperativo',
    'Analítico, orientado a resultados o competencia',
    'Empatía selectiva, cuida sus límites personales',
  ],
  [
    'Alta reactividad emocional y alerta a riesgos',
    'Estable, tolera alta presión laboral',
    'Sensibilidad moderada, reacciona según el contexto',
  ],
];

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
    const [high, low, mid] = OCEAN_LABELS[group];
    labels.push(average >= 4 ? high : average <= 2.4 ? low : mid);
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
```

## `apps/api/test/hdrp-contract.test.ts` (1:93)

```ts
import { describe, expect, it } from 'vitest';
import { buildHdrpContract, hdrpGaps } from '../src/journey/hdrp-contract';

describe('buildHdrpContract', () => {
  it('builds the v2 contract from answers and leaves gaps visible', () => {
    const contract = buildHdrpContract({
      name: 'Mateo',
      heritage: 'Quiero romper el silencio familiar.',
      values: ['Lealtad', 'Orden'],
      standards: [{ label: 'Trabajo', text: 'Cuatro bloques a la semana.' }],
      vision: 'Un hombre que cumple lo que dice.',
      lenses: { vivo: 'enseñar', bueno: 'ordenar', necesita: 'la gente perdida', pagan: 'la consultoría' },
      ocean: [3, 4, 3, 2, 4, 2, 2, 4, 3, 4, 3, 4, 4, 2, 3],
      relation: [5, 5, 5, 2, 2, 2, 3, 3, 3, 4, 4, 4],
      finance: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    });
    const text = [contract.lead, contract.closing, ...contract.articles.flatMap((article) => article.items.map((row) => `${row.label} ${row.text}`))].join('\n');
    expect(text).toContain('Yo, Mateo');
    expect(text).toContain('Lealtad');
    expect(text).toContain('Orden');
    expect(text).toContain('Mi propósito es poner mi enseñar y mi talento en ordenar');
    expect(text).not.toMatch(/\d+ de 15/);
    expect(text).not.toContain('pendiente de nombre');
    expect(text).toContain('Relaciones saludables y liberadas');
    expect(text).toContain('6 horas al mes');
    expect(text).toContain('3 horas al mes');
    expect(text).toContain('Plan financiero integrado. Calibración.');
    expect(text).toContain('0% a 5%');
    expect(text).not.toContain('asesor financiero');
    expect(text).not.toContain('—');
    expect(text).not.toMatch(/\d+-\d+/);
    expect(text).toContain('Como testimonio de aceptación de mi propio diseño y como orden directa hacia mi voluntad, firmo este manifiesto en pleno uso de mi soberanía personal.');
    expect(text).toContain('Equilibrio entre creatividad y sentido práctico');
    expect(text).toContain('requiere estructura externa');
    expect(text).toContain('declaro solemnemente los pilares');
    expect(text).toContain('Apertura');
  });

  it('uses the reestructuración branch when cash flow or debt is in that band', () => {
    const contract = buildHdrpContract({
      finance: [1, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    });
    const text = contract.articles.find((article) => article.title === 'V. Las finanzas')?.items.map((row) => row.text).join(' ');
    expect(text).toContain('Plan financiero integrado. Reestructuración.');
    expect(text).toContain('90%');
    expect(text).toContain('asesor financiero');
    expect(text).not.toContain('55%');
    const relation = contract.articles.find((article) => article.title === 'IV. Las relaciones')?.items.map((row) => row.text).join(' ');
    expect(relation).toContain('faltan las tres respuestas');
    expect(relation).not.toContain('horas');
  });

  it('uses the fluido plan only when the four finance blocks are fluido', () => {
    const contract = buildHdrpContract({
      finance: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    });
    const text = contract.articles.find((article) => article.title === 'V. Las finanzas')?.items.map((row) => row.text).join(' ');
    expect(text).toContain('Plan financiero integrado. Fluido.');
    expect(text).toContain('15% a 20%');
    expect(text).toContain('cartera diversificada');
  });

  it('lists the sheet pieces that are still empty', () => {
    const gaps = hdrpGaps({ finance: [5, 5, 5, null, null, null, 5, 5, 5, 5, 5, 5] });
    expect(gaps.map((gap) => gap.id)).toContain('finanza-1');
    expect(gaps.map((gap) => gap.moduleSlug)).toContain('f-rad-003-s2');
    expect(gaps.map((gap) => gap.id)).toContain('proposito');
    const filled = hdrpGaps({
      heritage: 'Una historia',
      values: ['Lealtad'],
      standards: [{ label: 'Trabajo', text: 'Cuatro bloques.' }],
      identity: 'Una frase',
      pattern: 'Un patrón',
      vision: 'Una visión',
      seal: 'Una huella',
      lenses: { vivo: 'enseñar', bueno: 'ordenar', necesita: 'alguien', pagan: 'un oficio' },
      ocean: [3, 4, 3, 2, 4, 2, 2, 4, 3, 4, 3, 4, 4, 2, 3],
      relation: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      finance: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    });
    expect(filled).toEqual([]);
  });

  it('does not treat a skipped couple block as a missing answer', () => {
    const contract = buildHdrpContract({
      partner: 'never',
      relation: [null, null, null, 5, 5, 5, 4, 4, 4, 3, 3, 3],
    });
    const text = contract.articles.find((article) => article.title === 'IV. Las relaciones')?.items[0]?.text;
    expect(text).toBe('Sin pareja. Esta parte no se responde.');
    expect(hdrpGaps({ partner: 'never', relation: [null, null, null, 5, 5, 5, 4, 4, 4, 3, 3, 3] }).some((gap) => gap.id === 'relacion-0')).toBe(false);
  });
});
```

## `apps/web/components/journey/RoadmapClose.tsx` (1:138)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ContractSections, SHEET_ANCHORS } from './ContractSections';
import { confirmPurpose, journeyContract, savePurpose, type HdrpContract } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function civilDate(iso?: string | null): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(iso ? new Date(iso) : new Date());
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const year = parts.find((part) => part.type === 'year')?.value;
  return `${day} ${MONTHS[month - 1] ?? ''} ${year ?? ''}`.trim();
}

export function RoadmapClose() {
  const reduced = useReducedMotion();
  const [contract, setContract] = useState<HdrpContract | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'signing' | 'signed'>('idle');
  const [savingName, setSavingName] = useState(false);

  function load() {
    const token = getAccessToken();
    if (!token) return;
    journeyContract(token)
      .then((row) => {
        setContract(row);
        setName(row.name ?? '');
        if (row.confirmed) setPhase('signed');
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => { load(); }, []);

  const signed = phase === 'signed' || Boolean(contract?.confirmed);

  async function persistName() {
    const token = getAccessToken();
    if (!token || signed) return;
    const trimmed = name.trim();
    if (trimmed === (contract?.name ?? '')) return;
    setSavingName(true);
    try {
      await savePurpose(token, { name: trimmed });
      setContract((current) => current ? { ...current, name: trimmed } : current);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el nombre.');
    } finally {
      setSavingName(false);
    }
  }

  async function onConfirm() {
    const token = getAccessToken();
    if (!token || phase === 'signing') return;
    if (!name.trim()) {
      setError('Escribe tu nombre para firmar.');
      return;
    }
    setError('');
    setPhase('signing');
    try {
      await new Promise((resolve) => window.setTimeout(resolve, reduced ? 0 : 700));
      await savePurpose(token, { name: name.trim() });
      await confirmPurpose(token);
      const next = await journeyContract(token);
      setContract(next);
      setName(next.name ?? name.trim());
      setPhase('signed');
    } catch (err) {
      setPhase('idle');
      setError(err instanceof Error ? err.message : 'No se pudo firmar.');
    }
  }

  return (
    <div className="mk-dashboard mk-sheet-page">
      <article className="mk-contract mk-sheet">
        <header className="mk-sheet__mast">
          <h1>Hoja de ruta de propósito</h1>
          <p className="mk-contract__subtitle">Contrato de compromiso soberano y propósito de vida</p>
        </header>
        {!contract ? <p>Leyendo la hoja.</p> : null}
        {contract ? (
          <>
            <nav className="mk-sheet__toc" aria-label="Contenido">
              {SHEET_ANCHORS.map((link) => (
                <a key={link.href} href={link.href}>{link.label}</a>
              ))}
            </nav>
            <p className="mk-sheet__kicker">{contract.introTitle ?? 'El Manifiesto de su Propósito: Su Contrato Soberano'}</p>
            {contract.intro ? <p className="mk-sheet__intro">{contract.intro}</p> : null}
            <p className="mk-contract__opening">
              Yo,{' '}
              {signed ? <span className="mk-contract__name is-set">{name.trim()}</span> : (
                <input
                  className="mk-contract__name"
                  value={name}
                  placeholder="Tu nombre"
                  aria-label="Tu nombre"
                  disabled={savingName}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => { void persistName(); }}
                />
              )}
              {', consciente de mi historia, dueño de mi presente y arquitecto de mi destino, declaro solemnemente los pilares que rigen y regirán mi existencia a partir de este momento.'}
            </p>
            <ContractSections articles={contract.articles} />
            <section id="ratificacion" className="mk-sheet__section mk-sheet__ratify">
              <h2>Ratificación del compromiso</h2>
              <p>{contract.closing}</p>
              <p className="mk-sheet__meta">Fecha: {civilDate(signed ? contract.confirmedAt : null)}</p>
              <p className="mk-sheet__meta">{signed ? `Firmado por ${name.trim()}.` : 'Firma pendiente.'}</p>
              {signed ? null : (
                <button type="button" className="mk-btn-primary mk-sheet__sign" onClick={() => void onConfirm()} disabled={phase === 'signing'}>
                  {phase === 'signing' ? 'Firmando' : 'Firmar'}
                </button>
              )}
            </section>
          </>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
      </article>
    </div>
  );
}
```

## `apps/web/components/journey/ContractSections.tsx` (1:69)

```tsx
const ANCHORS = ['origen', 'identidad', 'direccion', 'relaciones', 'finanzas'];

type Item = {
  label: string;
  text: string;
  category?: string;
  descriptor?: string;
  commitment?: string;
  kind?: 'plan';
};

function lines(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

export function ContractSections({ articles }: { articles: { title: string; items: Item[] }[] }) {
  return (
    <>
      {articles.map((section, sectionIndex) => (
        <section key={section.title} id={ANCHORS[sectionIndex]} className="mk-sheet__section">
          <h2>{section.title}</h2>
          {section.items.map((row, index) => {
            if (row.commitment || row.category) {
              return (
                <article key={`${section.title}-${index}`} className="mk-sheet__relation">
                  <h3>{row.label}</h3>
                  {row.category ? <p className="mk-sheet__category">{row.category}</p> : null}
                  {row.descriptor ? <p>{row.descriptor}</p> : null}
                  {row.commitment ? <p>{row.commitment}</p> : null}
                </article>
              );
            }
            if (row.kind === 'plan') {
              return (
                <div key={`${section.title}-${index}`} className="mk-sheet__plan">
                  <h3>{row.label}</h3>
                  <p>{row.text}</p>
                </div>
              );
            }
            const filled = lines(row.text);
            const pending = row.text.toLowerCase().includes('pendiente') || row.text.toLowerCase().includes('sin pareja');
            return (
              <div key={`${section.title}-${index}`} className={pending ? 'mk-sheet__unit is-pending' : 'mk-sheet__unit'}>
                {row.label ? <p className="mk-sheet__say">{row.label}</p> : null}
                {filled.length > 1 ? (
                  <ul className="mk-sheet__list">
                    {filled.map((line, lineIndex) => <li key={`${line}-${lineIndex}`}>{line}</li>)}
                  </ul>
                ) : filled.length === 1 ? (
                  <p className={row.label && row.label.length < 42 ? 'mk-sheet__pair' : 'mk-sheet__fill'}>{filled[0]}</p>
                ) : null}
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}

export const SHEET_ANCHORS = [
  { href: '#origen', label: 'Origen' },
  { href: '#identidad', label: 'Identidad' },
  { href: '#direccion', label: 'Dirección' },
  { href: '#relaciones', label: 'Relaciones' },
  { href: '#finanzas', label: 'Finanzas' },
  { href: '#ratificacion', label: 'Ratificación' },
] as const;
```

## `apps/web/app/(member)/diagnostico/resultado/page.tsx` (1:11)

```tsx
import type { Metadata } from 'next';
import { RoadmapClose } from '@/components/journey/RoadmapClose';

export const metadata: Metadata = {
  title: 'Hoja de ruta',
  robots: { index: false, follow: false },
};

export default function DiagnosticResultPage() {
  return <RoadmapClose />;
}
```

## `apps/api/src/journey/journey.controller.ts` (71:81)

```ts
  @Post('purpose/confirm')
  confirmPurpose(@Request() req: AuthenticatedRequest) {
    return this.journey.confirmPurpose(req.user.sub);
  }

  @Post('purpose/reopen')
  reopenGap(@Request() req: AuthenticatedRequest, @Body() body: { moduleSlug?: string }) {
    const moduleSlug = body.moduleSlug?.trim() ?? '';
    if (!moduleSlug) throw new BadRequestException('Falta el módulo.');
    return this.journey.reopenGap(req.user.sub, moduleSlug);
  }
```

## `apps/api/src/journey/journey.service.ts` (73:250)

```ts
type FactRow = {
  freeText: string | null;
  skipped: boolean;
  question: { order: number; sourceRef: string | null; module: { slug: string } };
  selectedOptions: { order: number; value: string; textEs: string }[];
};

function cell(rows: FactRow[], sheet: string, ref: string): FactRow | undefined {
  return rows.find((row) => row.question.sourceRef === `formulario-v1:${sheet}!${ref}`);
}

function answerText(row: FactRow | undefined): string | null {
  if (!row || row.skipped) return null;
  const free = row.freeText?.trim();
  if (free) return free;
  const option = [...row.selectedOptions].sort((left, right) => left.order - right.order)[0];
  return option?.textEs?.trim() || null;
}

function optionValue(row: FactRow): number | null {
  const option = [...row.selectedOptions].sort((left, right) => left.order - right.order)[0];
  const value = option?.value == null ? null : Number(option.value);
  return Number.isFinite(value) ? value : null;
}

const PARTNER_GATE_REF = 'mk:f-rad-002-pareja-puerta';
const PARTNER_NEVER = 'No tengo ni he tenido pareja';

function moduleNumbers(rows: FactRow[], slugs: string[]): Array<number | null> {
  return slugs.flatMap((slug) => rows
    .filter((row) => row.question.module.slug === slug && row.question.sourceRef !== PARTNER_GATE_REF)
    .sort((left, right) => left.question.order - right.question.order)
    .map(optionValue));
}

function activityAnswer(text: string | null): string | null {
  if (!text) return null;
  if (!text.startsWith('{')) return text;
  try {
    const parsed = JSON.parse(text) as { answer?: string };
    return parsed.answer?.trim() || null;
  } catch {
    return text;
  }
}

function optionTexts(row: FactRow | undefined): string[] {
  if (!row) return [];
  return [...row.selectedOptions]
    .sort((left, right) => left.order - right.order)
    .map((option) => option.textEs.trim())
    .filter(Boolean);
}

function labeledStandards(text: string | null): { label: string; text: string }[] {
  if (!text?.trim()) return [];
  const labels: [string, string][] = [
    ['Trascendencia', 'Trascendencia'],
    ['Familia', 'Familia'],
    ['Amistad', 'Amistad'],
    ['Trabajo significativo', 'Trabajo significativo'],
    ['Cualquier otro|Otro', 'Cualquier otro'],
  ];
  const found = labels.flatMap(([pattern, label]) => {
    const match = text.match(new RegExp(`(?:${pattern}):\\s*([^\\n]+)`, 'i'));
    return match?.[1]?.trim() ? [{ label, text: match[1].trim() }] : [];
  });
  return found.length ? found : [{ label: 'Semana', text: text.trim() }];
}

function identityReading(sum: number | null): string | null {
  if (sum == null) return null;
  if (sum < 18) return 'Difusa: opera desde hábitos heredados o reactivos.';
  if (sum < 26) return 'Inestable: existe intención, pero falta coherencia y estándares.';
  if (sum <= 35) return 'En construcción: proceso activo de alineación.';
  return 'Encarnada: hábitos y decisiones reflejan la identidad declarada.';
}

const DIFFICULTY_FAMILIES: { refs: string[]; read: (score: number) => string }[] = [
  {
    refs: ['R94', 'R95', 'R96', 'R98', 'R99', 'R100', 'R102', 'R103', 'R104'],
    read: (score) => score <= 3
      ? 'Ausente: comportamiento libre de bloqueos históricos.'
      : score <= 12
        ? 'Sombra latente: existen conductas semiautomáticas de autosabotaje.'
        : 'Dominante: ciclo crítico y activo de boicot.',
  },
  {
    refs: ['R107', 'R108', 'R109', 'R111', 'R112', 'R113', 'R115', 'R116', 'R117'],
    read: (score) => score <= 4
      ? 'Sin sombra aparente en esta área.'
      : score <= 11
        ? 'Sombra latente: máscara de coraza e hiperindependencia.'
        : 'Sombra dominante: represión emocional por miedo a la vulnerabilidad.',
  },
  {
    refs: ['R120', 'R121', 'R122', 'R124', 'R125', 'R126', 'R128', 'R129', 'R130'],
    read: (score) => score <= 4
      ? 'Sin sombra aparente en esta área.'
      : score <= 11
        ? 'Sombra latente: juicio restrictivo hacia el entorno.'
        : 'Sombra dominante: proyección de sus propios límites en otros.',
  },
  {
    refs: ['R133', 'R134', 'R135', 'R137', 'R138', 'R139', 'R141', 'R142', 'R143'],
    read: (score) => score <= 4
      ? 'Sin sombra aparente en esta área.'
      : score <= 11
        ? 'Sombra latente: parálisis por análisis y postergación.'
        : 'Sombra dominante: evasión de la responsabilidad del cambio.',
  },
];

function difficultyReading(rows: FactRow[]): string | null {
  const lines = DIFFICULTY_FAMILIES.map((family) => {
    const values = family.refs.map((ref) => {
      const row = cell(rows, 'E-PER-000', ref);
      return row ? optionValue(row) : null;
    });
    if (values.some((value) => value == null)) return null;
    const names = ['Patrones repetitivos', 'Emociones rechazadas', 'Proyección', 'Excusas y autoengaño'];
    return `${names[DIFFICULTY_FAMILIES.indexOf(family)]}. ${family.read(values.reduce<number>((sum, value) => sum + (value ?? 0), 0))}`;
  });
  return lines.every(Boolean) ? lines.join('\n') : null;
}

function partnerOf(rows: FactRow[]): HdrpFacts['partner'] {
  const text = answerText(rows.find((row) => row.question.sourceRef === PARTNER_GATE_REF)) ?? '';
  if (text === PARTNER_NEVER) return 'never';
  if (text.startsWith('No tengo pareja ahora')) return 'last';
  if (text.startsWith('Tengo pareja')) return 'now';
  return null;
}

function formularioFacts(rows: FactRow[]): HdrpFacts | null {
  if (!rows.some((row) => row.question.sourceRef?.startsWith('formulario-v1:'))) return null;
  const chosenValues = optionTexts(cell(rows, 'E-PER-000', 'R51'));
  const values = chosenValues.length ? chosenValues : optionTexts(cell(rows, 'E-PER-000', 'R40'));
  const standardText = answerText(cell(rows, 'E-PER-000', 'R62'));
  const standards = labeledStandards(standardText);
  const identityRows = rows
    .filter((row) => row.question.module.slug === 'e-per-identidad')
    .sort((left, right) => left.question.order - right.question.order);
  const identityChoices = identityRows.map(optionValue);
  const identitySum = identityChoices.length === 10 && identityChoices.every((value) => value != null)
    ? identityChoices.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;
  const oceanRows = rows
    .filter((row) => row.question.module.slug === 'e-per-personalidad')
    .sort((left, right) => left.question.order - right.question.order);
  const oceanValues = oceanRows.map(optionValue);
  const activities = [...new Set(
    rows
      .filter((row) => row.question.module.slug === 'e-per-ikigai')
      .sort((left, right) => left.question.order - right.question.order)
      .map((row) => activityAnswer(answerText(row)))
      .filter((text): text is string => Boolean(text)),
  )].slice(0, 4);
  return {
    heritage: answerText(cell(rows, 'E-PER-000', 'R12')),
    values,
    standards,
    identity: identityReading(identitySum),
    pattern: difficultyReading(rows),
    vision: answerText(cell(rows, 'E-PER-000', 'R34')) ?? answerText(cell(rows, 'E-PER-000', 'R33')),
    activities,
    seal: answerText(cell(rows, 'E-PER-000', 'R277')),
    ocean: oceanValues.length === 15 && oceanValues.every((value) => value != null) ? oceanValues as number[] : [],
    relation: moduleNumbers(rows, ['f-rad-002-s1', 'f-rad-002-s2', 'f-rad-002-s3', 'f-rad-002-s4']),
    finance: moduleNumbers(rows, ['f-rad-003-s1', 'f-rad-003-s2', 'f-rad-003-s3', 'f-rad-003-s4']),
    partner: partnerOf(rows),
  };
}

@Injectable()
export class JourneyService {
  constructor(
    private readonly prisma: PrismaService,
```

## `apps/api/src/journey/journey.service.ts` (405:650)

```ts
  async savePurpose(userId: string, content: Record<string, string>) {
    const latest = await this.latestPurpose(userId);
    const previous = latest && typeof latest.content === 'object' && latest.content
      ? latest.content as Record<string, unknown>
      : {};
    const merged = { ...previous, ...content };
    if (latest && !latest.confirmedAt) {
      return this.prisma.purposeRevision.update({
        where: { id: latest.id },
        data: { content: asJson(merged) },
      });
    }
    return this.prisma.purposeRevision.create({
      data: {
        userId,
        revision: (latest?.revision ?? 0) + 1,
        content: asJson(merged),
      },
    });
  }

  async contractDraft(userId: string): Promise<{
    name: string | null;
    introTitle: string;
    intro: string;
    lead: string;
    closing: string;
    articles: HdrpArticle[];
    gaps: HdrpGap[];
    ready: boolean;
    confirmed: boolean;
    confirmedAt: string | null;
    revision: number | null;
    text: string | null;
    directionStatus: string | null;
    statement: string | null;
  }> {
    const [purpose, facts] = await Promise.all([
      this.latestPurpose(userId),
      this.hdrpFacts(userId),
    ]);
    const savedName = typeof purpose?.content === 'object' && purpose.content && 'name' in (purpose.content as object)
      ? String((purpose.content as { name?: string }).name ?? '')
      : '';
    const built = buildHdrpContract({ ...facts, name: savedName || null });
    const content = purpose?.content && typeof purpose.content === 'object' ? purpose.content as Record<string, unknown> : {};
    const synthesis = readSynthesis(content);
    const stated = typeof content.statement === 'string' ? content.statement.trim() : '';
    const chosen = stated && !stated.includes('[') ? stated : visiblePurpose(synthesis.purpose);
    const liveArticles = withChosenPurpose(built.articles, chosen);
    const gaps = hdrpGaps(facts, chosen);
    const ratified = content.contractView && typeof content.contractView === 'object'
      ? content.contractView as { introTitle?: string; intro?: string; lead?: string; closing?: string; articles?: HdrpArticle[]; name?: string | null }
      : null;
    const frozen = purpose?.confirmedAt ? String(content.contract ?? '') : '';
    const articles = purpose?.confirmedAt && Array.isArray(ratified?.articles) ? ratified.articles : liveArticles;
    return {
      name: purpose?.confirmedAt && typeof ratified?.name === 'string' ? ratified.name : built.name,
      introTitle: purpose?.confirmedAt && ratified?.introTitle ? ratified.introTitle : built.introTitle,
      intro: purpose?.confirmedAt && ratified?.intro ? ratified.intro : built.intro,
      lead: purpose?.confirmedAt && ratified?.lead ? ratified.lead : built.lead,
      closing: purpose?.confirmedAt && ratified?.closing ? ratified.closing : built.closing,
      articles,
      gaps: purpose?.confirmedAt ? [] : gaps,
      ready: purpose?.confirmedAt ? true : gaps.length === 0,
      confirmed: Boolean(purpose?.confirmedAt),
      confirmedAt: purpose?.confirmedAt ? purpose.confirmedAt.toISOString() : null,
      revision: purpose?.revision ?? null,
      text: frozen || contractText({ ...built, articles: liveArticles }),
      directionStatus: typeof content.directionStatus === 'string' ? content.directionStatus : null,
      statement: typeof content.statement === 'string' ? content.statement : null,
    };
  }

  async confirmPurpose(userId: string) {
    const latest = await this.latestPurpose(userId);
    if (!latest) throw new NotFoundException('No hay una hoja para confirmar.');
    if (latest.confirmedAt) return latest;
    const draft = await this.contractDraft(userId);
    if (!draft.ready) throw new BadRequestException('Faltan partes de la hoja. Complétalas antes de firmar.');
    const previous = typeof latest.content === 'object' && latest.content ? latest.content as Record<string, unknown> : {};
    return this.prisma.purposeRevision.update({
      where: { id: latest.id },
      data: {
        confirmedAt: new Date(),
        content: asJson({
          ...previous,
          contract: draft.text ?? '',
          contractView: {
            name: draft.name,
            introTitle: draft.introTitle,
            intro: draft.intro,
            lead: draft.lead,
            closing: draft.closing,
            articles: draft.articles,
          },
        }),
      },
    });
  }

  /** Sends the person back into one missing piece of the sheet, without opening a new questionnaire. */
  async reopenGap(userId: string, moduleSlug: string) {
    const draft = await this.contractDraft(userId);
    const matching = draft.gaps.filter((gap) => gap.moduleSlug === moduleSlug);
    if (!matching.length || matching.every((gap) => gap.id === 'proposito')) {
      throw new BadRequestException('Esa parte ya está en la hoja.');
    }
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: { userId, version: { definitionRef: FORMULARIO_COMPLETO_REF } },
      orderBy: { lastActivityAt: 'desc' },
    });
    const session = sessions.find((item) => item.status === 'ACTIVE') ?? sessions[0];
    if (!session) throw new NotFoundException('No hay cuestionario.');
    if (session.status !== 'ACTIVE') {
      await this.prisma.diagnosticSession.update({ where: { id: session.id }, data: { status: 'ACTIVE' } });
    }
    const module = await this.prisma.diagnosticModule.findFirst({
      where: { slug: moduleSlug, versionId: session.versionId },
    });
    if (!module) throw new NotFoundException('No está ese módulo.');
    const progress = await this.prisma.userModuleProgress.findMany({
      where: { sessionId: session.id },
      include: { module: { select: { order: true } } },
    });
    const earlierOpen = progress.some((row) => row.module.order < module.order && row.status !== 'COMPLETE');
    if (earlierOpen) throw new BadRequestException('Sigue el cuestionario. Esta parte aparece cuando llegues a ella.');
    await this.prisma.userModuleProgress.upsert({
      where: { sessionId_moduleId: { sessionId: session.id, moduleId: module.id } },
      update: { status: 'IN_PROGRESS', outroSeen: false },
      create: { sessionId: session.id, moduleId: module.id, status: 'IN_PROGRESS' },
    });
    await this.prisma.response.deleteMany({
      where: {
        sessionId: session.id,
        exceptionKind: { in: ['DECLINED', 'UNKNOWN'] },
        question: { moduleId: module.id },
      },
    });
    return { ok: true };
  }

  private async hdrpFacts(userId: string) {
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: { userId },
      include: {
        version: { select: { definitionRef: true } },
        responses: {
          include: {
            question: { include: { module: true } },
            selectedOptions: true,
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
    const session = sessions.find((item) => item.version.definitionRef === 'formulario-completo' && item.status === 'COMPLETED')
      ?? sessions.sort((a, b) => b.responses.length - a.responses.length)[0];
    const byModule = new Map<string, typeof session.responses>();
    for (const response of session?.responses ?? []) {
      const slug = response.question.module.slug;
      const list = byModule.get(slug) ?? [];
      list.push(response);
      byModule.set(slug, list);
    }
    const profile = (byModule.get('e-per-000') ?? []).sort((a, b) => a.question.order - b.question.order);
    const textAt = (order: number) => profile.find((item) => item.question.order === order)?.freeText ?? null;
    const lines = (order: number) => readLines(textAt(order));
    const numbers = (slug: string) =>
      (byModule.get(slug) ?? [])
        .sort((a, b) => a.question.order - b.question.order)
        .filter((item) => item.question.sourceRef !== PARTNER_GATE_REF && (item.question.type === 'SCALE_1_5' || item.question.type === 'SINGLE_CHOICE'))
        .map((item) => {
          const raw = item.selectedOptions[0]?.value;
          const value = raw == null ? null : Number(raw);
          return Number.isFinite(value) ? value : null;
        });
    const nameLines = lines(1);
    const valueLines = lines(4);
    const standardLines = lines(5);
    const lensLines = lines(8);
    const plain = (order: number) => {
      const raw = textAt(order)?.trim();
      if (!raw || raw.startsWith('{')) return null;
      return raw;
    };
    const legacy = {
      heritage: nameLines.herencia || nameLines.significado || null,
      values: [valueLines.v1, valueLines.v2, valueLines.v3].filter(Boolean).length
        ? [valueLines.v1, valueLines.v2, valueLines.v3].filter(Boolean)
        : [plain(4)].filter((item): item is string => Boolean(item)),
      standards: [
        ['Trascendencia', standardLines.trascendencia],
        ['Familia', standardLines.familia],
        ['Amistad', standardLines.amistad],
        ['Trabajo', standardLines.trabajo],
      ].filter((item): item is [string, string] => Boolean(item[1])).map(([label, text]) => ({ label, text }))
        .concat(plain(5) && !standardLines.trascendencia ? [{ label: 'Estándar', text: plain(5) as string }] : []),
      identity: textAt(6),
      pattern: textAt(7),
      vision: textAt(3),
      lenses: lensLines,
      seal: textAt(9),
      ocean: (byModule.get('e-per-000') ?? [])
        .filter((item) => (item.question.contextEs ?? '').startsWith('@ocean:'))
        .sort((a, b) => a.question.order - b.question.order)
        .map((item) => Number(item.selectedOptions[0]?.value))
        .filter((value) => Number.isFinite(value)),
      relation: numbers('f-rad-002'),
      finance: numbers('f-rad-003').slice(0, 12),
    };
    return formularioFacts(session?.responses ?? []) ?? legacy;
  }

  async synthesis(userId: string) {
    const [known, purpose, facts] = await Promise.all([
      this.ikigaiActivities(userId),
      this.latestPurpose(userId),
      this.hdrpFacts(userId),
    ]);
    const saved = readSynthesis(purpose?.content);
    const overlay = new Map(saved.activities.map((activity) => [activity.sourceRef, activity]));
    const activities = known.map((activity) => overlay.get(activity.sourceRef) ?? activity);
    return {
      version: saved.version,
      activities,
      links: saved.links,
      combinations: saved.combinations,
      purpose: saved.purpose,
      catalog: IKIGAI_LISTAS.fields,
      values: facts.values ?? [],
      standards: facts.standards ?? [],
      purposeRevisionId: purpose?.id ?? null,
      revision: purpose?.revision ?? null,
    };
  }

  async saveSynthesis(userId: string, incoming: unknown) {
    const known = await this.ikigaiActivities(userId);
    const latest = await this.latestPurpose(userId);
    const previous = readSynthesis(latest?.content);
    const result = reconcileSynthesis(previous, incoming, known);
    if (!result.ok) throw new BadRequestException(result.message);
    const base = latest && typeof latest.content === 'object' && latest.content && !Array.isArray(latest.content)
      ? latest.content as Record<string, unknown>
      : {};
```

## `apps/web/lib/journey-api.ts` (245:281)

```ts
export type HdrpGap = { id: string; label: string; moduleSlug: string };

export type HdrpContract = {
  name: string | null;
  introTitle?: string;
  intro?: string;
  lead: string;
  closing: string;
  articles: {
    title: string;
    items: { label: string; text: string; category?: string; descriptor?: string; commitment?: string; kind?: 'plan' }[];
  }[];
  gaps?: HdrpGap[];
  ready?: boolean;
  confirmed: boolean;
  confirmedAt?: string | null;
  revision: number | null;
  text: string | null;
  directionStatus: string | null;
  statement: string | null;
};

export const journeyContract = (token: string) => send<HdrpContract>('/api/v1/journey/purpose/contract', token);
export const journeyPurpose = (token: string) => send<PurposeRow>('/api/v1/journey/purpose', token);
export const journeySynthesis = (token: string) => send<SynthesisPayload>('/api/v1/journey/synthesis', token);
export const saveSynthesis = (token: string, body: unknown) =>
  send<SynthesisPayload>('/api/v1/journey/synthesis', token, { method: 'POST', body: JSON.stringify(body) });
export const savePurpose = (token: string, content: Record<string, string>) =>
  send<PurposeRow>('/api/v1/journey/purpose', token, { method: 'POST', body: JSON.stringify({ content }) });
export const saveAlignment = (
  token: string,
  answers: Record<string, { value: number | null; unknown: boolean }>,
) => send('/api/v1/journey/alignment', token, { method: 'POST', body: JSON.stringify({ answers }) });
export const confirmPurpose = (token: string) =>
  send<PurposeRow>('/api/v1/journey/purpose/confirm', token, { method: 'POST', body: '{}' });
export const reopenHdrpGap = (token: string, moduleSlug: string) =>
  send<{ ok: boolean }>('/api/v1/journey/purpose/reopen', token, { method: 'POST', body: JSON.stringify({ moduleSlug }) });
```

## `apps/web/app/globals.css` (16204:16540)

```css
.mk-contract h1 {
  margin: 0 0 0.85rem;
  font-family: var(--font-editorial), Georgia, serif;
  font-size: clamp(1.85rem, 4vw, 2.4rem);
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  color: var(--color-text);
}

.mk-contract section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 1.35rem 0 0;
  padding: 0;
}

.mk-contract__titles {
  text-align: center;
  margin-bottom: 1.5rem;
}

.mk-contract__subtitle {
  margin: 0.4rem 0 0;
  font-family: var(--font-editorial), Georgia, serif;
  font-size: clamp(1.15rem, 2.4vw, 1.45rem);
  line-height: 1.25;
  color: var(--color-text);
}

.mk-sheet-page {
  padding-inline: 16px;
}

.mk-sheet {
  width: min(100%, 860px);
  margin-inline: auto;
  padding: 0.5rem 0 3rem;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.mk-sheet__mast {
  text-align: center;
  margin-bottom: 1.5rem;
}

.mk-sheet__mast h1 {
  font-size: 1.875rem;
}

.mk-sheet__toc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.85rem;
  margin: 0 0 1.5rem;
}

.mk-sheet__toc a {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.mk-sheet__kicker,
.mk-sheet__intro,
.mk-sheet__say,
.mk-sheet section p,
.mk-sheet__relation p,
.mk-sheet__plan p {
  max-width: 68ch;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
}

.mk-sheet__kicker {
  margin: 0 0 0.75rem;
  font-family: var(--font-editorial), Georgia, serif;
}

.mk-sheet__intro {
  margin: 0 0 1.75rem;
  color: var(--color-text-secondary);
}

.mk-sheet__section {
  scroll-margin-top: 4.5rem;
  background: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.15rem;
  margin: 1.75rem 0 0;
}

.mk-sheet__section h2 {
  margin: 0 0 1.15rem;
  font-family: var(--font-editorial), Georgia, serif;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.25;
  color: var(--color-text);
}

.mk-sheet__unit {
  margin: 0 0 1.35rem;
}

.mk-sheet__say {
  margin: 0 0 0.5rem;
}

.mk-sheet__fill,
.mk-sheet__pair {
  margin: 0;
  font-weight: 500;
}

.mk-sheet__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.mk-sheet__list li {
  margin: 0;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-weight: 500;
  line-height: 1.55;
}

.mk-sheet__relation,
.mk-sheet__plan {
  margin: 0 0 1.35rem;
  padding-top: 0.35rem;
}

.mk-sheet__relation h3,
.mk-sheet__plan h3 {
  margin: 0 0 0.35rem;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
}

.mk-sheet__category {
  margin: 0 0 0.45rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.mk-sheet__relation p,
.mk-sheet__plan p {
  margin: 0 0 0.65rem;
}

.mk-sheet__meta {
  margin: 0.35rem 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.mk-sheet__sign {
  width: 100%;
  min-height: 48px;
  margin-top: 1rem;
}

.mk-sheet__unit.is-pending .mk-sheet__fill,
.mk-sheet__unit.is-pending .mk-sheet__pair {
  font-weight: 400;
  color: var(--color-text-secondary);
}

@media (min-width: 768px) {
  .mk-sheet__mast h1 {
    font-size: 2.375rem;
  }

  .mk-sheet__section {
    padding: 1.75rem 2rem;
  }

  .mk-sheet__section h2 {
    font-size: 1.625rem;
  }

  .mk-sheet__sign {
    width: auto;
    min-width: 12rem;
  }
}

.mk-contract section p {
  margin: 0 0 0.9rem;
}

.mk-contract section p.is-pending .mk-contract__fill {
  font-weight: 400;
  color: var(--color-text-secondary);
}

.mk-contract h2 {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.2;
  color: var(--color-text-secondary);
}

.mk-contract dl {
  margin: 0;
}

.mk-contract__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid #2a2a2a;
}

.mk-contract dt {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text-secondary);
}

.mk-contract dd {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--color-text);
}

.mk-contract p {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.45;
  color: var(--color-text);
}

.mk-contract__opening {
  display: block;
  margin: 0 0 1.25rem;
  padding-bottom: 0.35rem;
  font-family: var(--font-editorial), Georgia, serif;
  font-size: 1.2rem;
  line-height: 1.45;
  text-align: left;
  overflow-wrap: anywhere;
}

.mk-contract__close {
  margin-top: 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.45;
  text-align: center;
  color: var(--color-text-secondary);
}

.mk-contract dd.is-pending {
  color: var(--color-text-secondary);
}

@media (min-width: 640px) {
  .mk-contract__row {
    grid-template-columns: 8.5rem minmax(0, 1fr);
    gap: 1rem;
    align-items: baseline;
  }
}

.mk-contract__name {
  display: inline-block;
  width: auto;
  min-width: 8rem;
  max-width: 100%;
  min-height: 1.35em;
  vertical-align: baseline;
  text-align: center;
  margin: 0;
  padding: 0 0 0.15rem;
  border: 0;
  border-bottom: 1px solid var(--color-text);
  border-radius: 0;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-editorial), Georgia, serif;
  font-size: 1.2rem;
  line-height: 1.35;
  resize: none;
  overflow: hidden;
  overflow-wrap: anywhere;
  field-sizing: content;
}

.mk-contract__name:focus {
  outline: none;
  border-bottom-color: var(--color-action);
}

.mk-contract__sign {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  margin-top: 2.25rem;
  padding-top: 0.5rem;
}

.mk-sign {
  width: min(100%, 18rem);
```
