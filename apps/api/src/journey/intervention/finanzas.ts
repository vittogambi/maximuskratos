import { EMPTY_MODIFIERS, type Indicator, type Pack, type SourceRead, type Template } from './engine';

/** Beta product rules for Finanzas. Not investment advice and not reviewed by Rafa. */
export const VERSION = 'intervencion-finanzas@0.1';

const ind = (ref: string, role: Indicator['role'], question: string, kind: Indicator['kind'], extra: Partial<Indicator> = {}): Indicator => ({
  ref, role, question, kind, better: 'NONE', ...extra,
});

const templates: Template[] = [
  {
    id: 'FIN-A1', version: VERSION, group: 'A', goal: 'margen',
    title: 'Ver qué queda en el mes',
    seeks: 'Saber si los ingresos de este período cubren los costos fijos y qué margen queda.',
    action: 'Una vez por semana, anota los ingresos del período, los costos fijos y lo que queda.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 25 },
    minimum: { text: 'Anotar solo los costos fijos, en 10 minutos.', occasionsPerWeek: 1, minutesPerOccasion: 10 },
    doneWhen: 'Quedaron escritos los ingresos, los costos fijos y el margen, aunque el margen sea cero.',
    indicators: [ind('ind-fin-margen@0.1', 'RESULT', '¿Los ingresos de este período cubrieron los costos fijos?', 'YES_NO', { better: 'UP' })],
    horizonWeeks: 3,
    notes: ['No propone un producto ni una inversión. El número lo miras tú.'],
  },
  {
    id: 'FIN-B1', version: VERSION, group: 'B', goal: 'ahorro',
    title: 'Apartar antes de gastar',
    seeks: 'Que el ahorro ocurra antes de los otros gastos, con el monto que tú definas.',
    action: 'En el día que elijas, aparta el monto que definiste antes de otros gastos.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 10 },
    minimum: { text: 'Apartar una sola vez, aunque el monto sea menor.', occasionsPerWeek: 1, minutesPerOccasion: 5 },
    doneWhen: 'El monto quedó apartado, separado del dinero del día a día.',
    indicators: [ind('ind-fin-ahorro@0.1', 'RESULT', '¿Apartaste esta semana el monto que definiste, antes de otros gastos?', 'YES_NO', { better: 'UP' })],
    horizonWeeks: 4,
    focusPrompt: '¿Qué monto quieres apartar y para qué?',
    notes: ['El monto lo defines tú. No hay un porcentaje obligatorio.'],
  },
  {
    id: 'FIN-C1', version: VERSION, group: 'C', goal: 'gastos',
    title: 'Registrar lo que no estaba decidido',
    seeks: 'Ver los gastos que ocurren sin que los hayas decidido antes.',
    action: 'Cuando aparezca un gasto que no estaba previsto, anótalo ese día: qué fue y cuánto.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 5, minutesPerOccasion: 5 },
    minimum: { text: 'Anotar los gastos no previstos de tres días.', occasionsPerWeek: 3, minutesPerOccasion: 5 },
    doneWhen: 'El gasto quedó anotado el mismo día, con el monto.',
    indicators: [ind('ind-fin-gastos@0.1', 'RESULT', '¿Cuántos gastos no previstos anotaste esta semana?', 'COUNT', { min: 0, max: 30, better: 'NONE' })],
    horizonWeeks: 3,
    focusPrompt: '¿Qué tipo de gasto quieres mirar?',
    notes: ['Anotar no es un juicio. La primera semana solo deja ver el número.'],
  },
  {
    id: 'FIN-D1', version: VERSION, group: 'D', goal: 'deudas',
    title: 'El próximo pago, por escrito',
    seeks: 'Tener claras las deudas y saber cuál es el próximo pago.',
    action: 'Anota cada deuda que conozcas, el próximo vencimiento y si el pago está al día.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 30 },
    minimum: { text: 'Anotar solo la deuda del próximo vencimiento, en 15 minutos.', occasionsPerWeek: 1, minutesPerOccasion: 15 },
    doneWhen: 'Quedó escrito qué se paga, cuándo y si está al día.',
    indicators: [ind('ind-fin-deuda@0.1', 'RESULT', '¿Sabes cuál es el próximo pago y de qué deuda es?', 'YES_NO', { better: 'UP' })],
    horizonWeeks: 3,
    notes: ['No dice cuál deuda pagar primero ni recomienda un crédito.'],
  },
  {
    id: 'FIN-E1', version: VERSION, group: 'E', goal: 'plan',
    title: 'Un presupuesto de una página',
    seeks: 'Tener un plan escrito y usarlo al decidir un gasto.',
    action: 'Escribe en una página lo fijo, lo variable y lo que apartas. Revísalo una vez en la semana.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 20 },
    minimum: { text: 'Escribir tres líneas: fijo, variable y apartado.', occasionsPerWeek: 1, minutesPerOccasion: 10 },
    doneWhen: 'La página existe y la miraste antes de un gasto de esta semana.',
    indicators: [ind('ind-fin-presupuesto@0.1', 'RESULT', '¿Usaste ese presupuesto al decidir un gasto esta semana?', 'YES_NO', { better: 'UP' })],
    horizonWeeks: 3,
    notes: [],
  },
];

function modifiers(read: SourceRead) {
  const tight = [read.scales['flujo-cubre'], read.scales['flujo-asfixia']].filter((row) => row?.band === 'CANDIDATE');
  if (!tight.length) return EMPTY_MODIFIERS;
  return {
    suggestMinimum: {
      because: 'Señalaste que el mes está apretado. Puedes empezar con la versión mínima; decides tú.',
      sources: tight.map((row) => row!.source),
    },
    environmentAlternative: null,
  };
}

export const PACK: Pack = {
  territory: 'FINANZAS',
  version: VERSION,
  scope: 'INTERPRETATION_FINANZAS',
  scales: {
    'deuda-control': { instrument: 'E-AUD-001', row: 37, question: '¿En qué medida tus deudas actuales están bajo control y no comprometen tu estabilidad?' },
    'ahorro-constancia': { instrument: 'E-AUD-001', row: 38, question: '¿Qué tan constante es tu capacidad de separar una parte de tus ingresos?' },
    'plan-escrito': { instrument: 'E-AUD-001', row: 39, question: '¿Cuentas con un presupuesto escrito o un plan para tus finanzas?' },
    'ingresos-cubren': { instrument: 'E-AUD-001', row: 40, question: '¿En qué medida tus ingresos cubren tus necesidades, obligaciones y objetivos?' },
    'flujo-cubre': { instrument: 'F-RAD-003', row: 7, question: 'Los ingresos estables que generas, ¿cubren tus costos y te dejan un margen?' },
    'flujo-asfixia': { instrument: 'F-RAD-003', row: 8, question: '¿Vives libre de la sensación de asfixia financiera o de llegar justo a fin de mes?' },
    'flujo-previsible': { instrument: 'F-RAD-003', row: 9, question: '¿Tus ingresos vienen de estructuras predecibles, sin ansiedad constante por la supervivencia?' },
    'ahorro-sistematico': { instrument: 'F-RAD-003', row: 17, question: '¿Ahorras de forma sistemática antes de otros gastos?' },
    'fondo-emergencia': { instrument: 'F-RAD-003', row: 18, question: '¿Tienes un fondo de emergencia líquido de varios meses de costos?' },
    'gasto-impulso': { instrument: 'F-RAD-003', row: 19, question: '¿Tus hábitos de consumo están controlados, sin compras impulsivas ni usar el dinero para calmarte?' },
    'deuda-consumo': { instrument: 'F-RAD-003', row: 35, question: '¿Estás libre de deudas de consumo de alto interés?' },
  },
  difficulties: {},
  choices: {},
  vision: null,
  readings: [
    {
      id: 'margen', group: 'A', goal: 'margen',
      scales: ['ingresos-cubren', 'flujo-cubre', 'flujo-asfixia', 'flujo-previsible'],
      difficulties: [],
      interpretation: 'Puede que el dinero del mes no te esté dejando margen.',
      question: '¿Te representa hoy?',
      plans: ['FIN-A1', 'FIN-B1'],
    },
    {
      id: 'ahorro', group: 'B', goal: 'ahorro',
      scales: ['ahorro-constancia', 'ahorro-sistematico', 'fondo-emergencia'],
      difficulties: [],
      interpretation: 'Puede que el ahorro no esté ocurriendo antes de los otros gastos.',
      question: '¿Te representa hoy?',
      plans: ['FIN-B1', 'FIN-E1'],
    },
    {
      id: 'gastos', group: 'C', goal: 'gastos',
      scales: ['gasto-impulso'],
      difficulties: [],
      interpretation: 'Puede que parte del gasto esté ocurriendo sin que lo hayas decidido.',
      question: '¿Te representa hoy?',
      asksFocus: '¿Qué tipo de gasto quieres mirar?',
      plans: ['FIN-C1', 'FIN-E1'],
    },
    {
      id: 'deudas', group: 'D', goal: 'deudas',
      scales: ['deuda-control', 'deuda-consumo'],
      difficulties: [],
      interpretation: 'Puede que las deudas estén ocupando más de lo que quieres.',
      question: '¿Te representa hoy?',
      plans: ['FIN-D1', 'FIN-A1'],
    },
    {
      id: 'presupuesto', group: 'E', goal: 'plan',
      scales: ['plan-escrito'],
      difficulties: [],
      interpretation: 'Puede que todavía no haya un plan escrito de tus finanzas.',
      question: '¿Te representa hoy?',
      plans: ['FIN-E1', 'FIN-A1'],
    },
  ],
  goals: [
    { id: 'margen', label: 'Que el mes deje margen' },
    { id: 'ahorro', label: 'Apartar antes de gastar' },
    { id: 'gastos', label: 'Ver en qué se va el dinero' },
    { id: 'deudas', label: 'Tener claras las deudas' },
    { id: 'plan', label: 'Escribir un plan simple' },
  ],
  templates,
  modifiers,
};
