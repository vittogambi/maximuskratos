import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ENGINE_SEMVER,
  type MatrixDefinition,
  type QuestionDefinition,
  type ResponseInput,
  type ResultSnapshot,
} from '../src/types';
import { runAssessment } from '../src/engine/run-assessment';
import { FULL_POLICY } from '../src/policy/resolve-served';
import { indexTrace } from '../src/engine/trace';

const NOW = '2026-08-24T21:00:00.000Z';
const OUT_DIR = resolve(__dirname, '../test/cases/rafa-casebook');

const CLEAN_RISKS: Record<string, unknown> = {
  'D-CUE-01': 0,
  'D-CUE-02': 0,
  'D-CUE-03': 0,
  'D-CUE-04': 0,
  'D-CUE-05': 0,
  'D-REL-15': { value: 5, qualitativeConfirmed: false },
  'D-FIN-09': { value: 5, qualitativeConfirmed: false },
  'D-CUE-25': { value: 5, qualitativeConfirmed: false },
};

const MEN_SCOREABLE = [
  'AUD-MEN-01',
  'D-MEN-01',
  'D-MEN-02',
  'D-MEN-03',
  'D-MEN-04',
  'D-MEN-05',
  'AUD-MEN-02',
  'D-MEN-06',
  'D-MEN-07',
  'D-MEN-08',
  'D-MEN-09',
  'D-MEN-10',
  'AUD-MEN-03',
  'D-MEN-11',
  'D-MEN-12',
  'D-MEN-13',
  'D-MEN-14',
  'D-MEN-15',
  'AUD-MEN-04',
  'D-MEN-16',
  'D-MEN-17',
  'D-MEN-18',
  'D-MEN-19',
  'D-MEN-20',
] as const;

type CaseSpec = {
  file: string;
  case_id: string;
  domains?: Partial<Record<string, number>>;
  dimensions?: Record<string, number>;
  firstScoreable?: Partial<Record<string, { count: number; value: number }>>;
  mentalidadValues?: number[];
  answers?: Record<string, unknown>;
  risks?: Record<string, unknown>;
  purpose?: Record<string, unknown>;
};

function scoreableOf(definition: MatrixDefinition, domain: string): QuestionDefinition[] {
  return definition.questions.filter(
    (question) => question.domain === domain && question.active && question.scoreable,
  );
}

function applyValue(
  bag: Record<string, unknown>,
  questionId: string,
  value: unknown,
): void {
  bag[questionId] = value;
}

function fillScoreableDomain(
  definition: MatrixDefinition,
  bag: Record<string, unknown>,
  domain: string,
  value: number,
): void {
  for (const question of scoreableOf(definition, domain)) {
    applyValue(bag, question.id, value);
  }
}

function fillScoreableDimension(
  definition: MatrixDefinition,
  bag: Record<string, unknown>,
  dimension: string,
  value: number,
): void {
  for (const question of definition.questions) {
    if (question.dimension === dimension && question.active && question.scoreable) {
      applyValue(bag, question.id, value);
    }
  }
}

function buildResponses(
  definition: MatrixDefinition,
  spec: CaseSpec,
): Record<string, unknown> {
  const bag: Record<string, unknown> = {};

  if (spec.domains) {
    for (const [domain, value] of Object.entries(spec.domains)) {
      if (value != null) fillScoreableDomain(definition, bag, domain, value);
    }
  }
  if (spec.dimensions) {
    for (const [dimension, value] of Object.entries(spec.dimensions)) {
      fillScoreableDimension(definition, bag, dimension, value);
    }
  }
  if (spec.firstScoreable) {
    for (const [domain, rule] of Object.entries(spec.firstScoreable)) {
      if (!rule) continue;
      scoreableOf(definition, domain).forEach((question, index) => {
        if (index < rule.count) applyValue(bag, question.id, rule.value);
      });
    }
  }
  if (spec.mentalidadValues) {
    if (spec.mentalidadValues.length !== MEN_SCOREABLE.length) {
      throw new Error(`${spec.case_id}: mentalidadValues must have 24 entries`);
    }
    MEN_SCOREABLE.forEach((id, index) => {
      applyValue(bag, id, spec.mentalidadValues![index]);
    });
  }
  if (spec.answers) {
    for (const [id, value] of Object.entries(spec.answers)) applyValue(bag, id, value);
  }
  if (spec.purpose) {
    for (const [id, value] of Object.entries(spec.purpose)) applyValue(bag, id, value);
  }

  const risks = spec.risks ?? CLEAN_RISKS;
  for (const [id, value] of Object.entries(risks)) applyValue(bag, id, value);
  return bag;
}

function asInput(questionId: string, value: unknown): ResponseInput {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      questionId,
      status: 'ANSWERED',
      rawValue: (record.value ?? record.rawValue ?? null) as number | string | null,
      qualitativeConfirmed:
        (record.qualitativeConfirmed as boolean | null | undefined) ?? null,
    };
  }
  return { questionId, status: 'ANSWERED', rawValue: value as number | string | null };
}

function headline(snapshot: ResultSnapshot): string {
  const domains = snapshot.domains
    .map((domain) => {
      const score = domain.score_display ?? 'nulo';
      const state = domain.state_final ?? domain.classification;
      return `${domain.key.slice(0, 3)} ${score} ${state}`;
    })
    .join(' | ');
  const plan = snapshot.recommendations.primary?.plan_id ?? 'sin plan';
  const exec = snapshot.recommendations.primary?.executable_recommendation ?? '';
  const alert = snapshot.safety.alerts.filter((item) => item.fired).map((item) => item.question_id);
  return `${domains} || P ${snapshot.priority.domain ?? 'nula'} ${snapshot.priority.tier ?? snapshot.priority.reason} ${plan} ${exec} || alerts ${alert.join(',') || 'ninguna'}`;
}

function menFromBase(base: number, setTo: Array<{ ids: string[]; value: number }>): number[] {
  const values = MEN_SCOREABLE.map(() => base);
  const indexOf = new Map(MEN_SCOREABLE.map((id, index) => [id, index]));
  for (const group of setTo) {
    for (const id of group.ids) {
      const index = indexOf.get(id);
      if (index == null) throw new Error(`unknown men id ${id}`);
      values[index] = group.value;
    }
  }
  return values;
}

const PURPOSE_RICH: Record<string, unknown> = {
  'P-PRO-001':
    'Mi papá trabajó toda la vida y en la casa nunca faltó lo básico. Creo que de ahí me quedó mucho eso de arreglármelas solo y no pedir demasiado.',
  'P-PRO-002': 'Ser constante, sobre todo.',
  'P-PRO-003':
    'En mi familia no se habla un tema hasta que ya se volvió un problema grande.',
  'P-PRO-006':
    'Me gustaría estar trabajando en algo mío, poder llegar más temprano a la casa y no estar todos los meses preocupado de cuánto queda para pagar las cuentas.',
  'P-PRO-008':
    'No quiero terminar viendo poco a mi hijo por quedarme trabajando hasta tarde.',
  'P-PRO-010': 'Mi familia y un par de personas que pueda formar.',
  'P-PRO-011':
    'Decir la verdad, hacerme cargo, hacer bien el trabajo, estar cuando digo y no pasarme.',
  'P-PRO-012': 'Decir la verdad aunque quede mal.',
  'P-PRO-013':
    'Digo que voy a estar con ellos, pero si llega un correo del trabajo igual miro el teléfono.',
  'P-PRO-016':
    'Trato de dormirme antes de las 11 y de tener al menos una conversación de verdad en la semana. En el trabajo no mentir, pagar las cuentas a tiempo, y entrenar un par de veces, aunque a veces se me pasa.',
  'P-PRO-021': 4,
  'P-PRO-022': 4,
  'P-PRO-023': 4,
  'P-PRO-024': 3,
  'P-PRO-025': 4,
  'P-PRO-026': 2,
  'P-PRO-027': 2,
  'P-PRO-028': 2,
  'P-PRO-029': 3,
  'P-PRO-030': 2,
  'P-PRO-031': 4,
  'P-PRO-032': 4,
  'P-PRO-033': 4,
  'P-PRO-034': 4,
  'P-PRO-035': 4,
  'P-PRO-051': 'Enseñar el oficio a alguien nuevo.',
  'P-PRO-056':
    'Se me da bastante bien ordenar equipos chicos y que después funcionen sin que esté encima todo el rato.',
  'P-PRO-061':
    'Gente que tiene equipos a cargo y termina resolviendo todo ellos. Lo veo harto en personas de mi edad.',
  'P-PRO-066': 'Capacitar a jefaturas nuevas.',
  'P-PRO-071': 4,
  'P-PRO-072': 4,
  'P-PRO-073': 4,
  'P-PRO-074': 3,
  'P-PRO-075': 4,
  'P-PRO-076': 4,
  'P-PRO-081':
    'Me gustaría dejar una forma de trabajar donde no haga falta gritar para que las cosas salgan. Y que mi hijo vea que se puede estar a cargo sin desaparecerse de la casa.',
};

const PURPOSE_LIKERT = Object.fromEntries(
  Object.entries(PURPOSE_RICH).filter(([, value]) => typeof value === 'number'),
) as Record<string, number>;

const PURPOSE_FAMILY: Record<string, unknown> = {
  ...PURPOSE_LIKERT,
  'P-PRO-001':
    'En casa siempre se esperaba que uno llegara a fin de mes sin pedir ayuda afuera. Eso me quedó pegado.',
  'P-PRO-002': 'Estar cuando digo que voy a estar.',
  'P-PRO-003': 'Los temas de plata se hablan tarde, cuando ya hay un problema concreto.',
  'P-PRO-006':
    'Quiero llegar más temprano a la casa y que el mes cierre sin esa preocupación de si alcanza.',
  'P-PRO-008': 'No quiero que mis hijos me recuerden como alguien que siempre estaba cansado y apurado.',
  'P-PRO-010': 'Sobre todo mi familia.',
  'P-PRO-011': 'Cumplir lo que prometo en casa, pagar a tiempo y no desaparecerme los fines de semana.',
  'P-PRO-012': 'Decir cuando no puedo, aunque incomode.',
  'P-PRO-013': 'Digo que voy a cenar con ellos y si suena el teléfono del trabajo igual lo miro.',
  'P-PRO-016':
    'Intento acostarme antes de las once, tener una conversación de verdad en la semana y entrenar un par de veces, aunque a veces se me pasa.',
  'P-PRO-051': 'Que en casa se sepa cómo se resuelven las cosas sin pelear.',
  'P-PRO-056': 'Se me da ordenar la semana de la casa para que no se nos vaya todo en apuros.',
  'P-PRO-061': 'Personas de mi edad que trabajan mucho y después no están cuando la familia los necesita.',
  'P-PRO-066': 'Enseñar a alguien de la familia a manejar lo práctico del mes.',
  'P-PRO-081': 'Me gustaría que mis hijos vean que se puede trabajar en serio y todavía llegar a la casa.',
};

function cases(): CaseSpec[] {
  const focoLow = ['AUD-MEN-03', 'D-MEN-11', 'D-MEN-12', 'D-MEN-13', 'D-MEN-14', 'D-MEN-15'];
  const aprLow = ['AUD-MEN-04', 'D-MEN-16', 'D-MEN-17', 'D-MEN-18', 'D-MEN-19'];
  const r07A = menFromBase(3, [
    { ids: [...focoLow, ...aprLow], value: 2 },
  ]);
  const r07B = menFromBase(3, [
    { ids: [...focoLow.filter((id) => id !== 'D-MEN-13'), ...aprLow], value: 2 },
  ]);
  const dirHigh = ['AUD-MEN-01', 'D-MEN-01', 'D-MEN-02', 'D-MEN-03', 'D-MEN-04', 'D-MEN-05'];
  const autPart = ['AUD-MEN-02', 'D-MEN-06', 'D-MEN-07'];
  const r08A = menFromBase(3, [{ ids: [...dirHigh, ...autPart], value: 4 }]);
  const r08B = menFromBase(3, [
    { ids: [...dirHigh, ...autPart, 'D-MEN-11'], value: 4 },
  ]);
  const fiveA = ['AUD-MEN-01', 'D-MEN-01', 'D-MEN-02', 'D-MEN-03'];
  const fiveB = [...fiveA, 'D-MEN-04'];
  const r09A = menFromBase(4, [{ ids: fiveA, value: 5 }]);
  const r09B = menFromBase(4, [{ ids: fiveB, value: 5 }]);
  const menAud = ['AUD-MEN-01', 'AUD-MEN-02', 'AUD-MEN-03', 'AUD-MEN-04'];
  const menDeep = MEN_SCOREABLE.filter((id) => !menAud.includes(id));

  return [
    {
      file: 'R01.json',
      case_id: 'RAFA-R01',
      domains: { MENTALIDAD: 3, RELACIONES: 3, FINANZAS: 3, CUERPO: 3 }    },
    {
      file: 'R02.json',
      case_id: 'RAFA-R02',
      domains: { MENTALIDAD: 2, RELACIONES: 4, FINANZAS: 4, CUERPO: 4 }    },
    {
      file: 'R03.json',
      case_id: 'RAFA-R03',
      domains: { MENTALIDAD: 4, RELACIONES: 4, FINANZAS: 4, CUERPO: 2 },
      answers: { 'D-CUE-07': 5.5 }    },
    {
      file: 'R04.json',
      case_id: 'RAFA-R04',
      domains: { MENTALIDAD: 4, RELACIONES: 4, FINANZAS: 4, CUERPO: 3 },
      answers: {
        'AUD-CUE-01': 1,
        'AUD-CUE-02': 2,
        'D-CUE-08': 3,
        'D-CUE-09': 3,
        'D-CUE-10': 3,
        'D-CUE-11': 3,
      }    },
    {
      file: 'R05.json',
      case_id: 'RAFA-R05',
      domains: { MENTALIDAD: 2, RELACIONES: 4, FINANZAS: 4, CUERPO: 2 }    },
    {
      file: 'R06.json',
      case_id: 'RAFA-R06',
      domains: { MENTALIDAD: 3, RELACIONES: 4, FINANZAS: 4, CUERPO: 3 }    },
    {
      file: 'R07A.json',
      case_id: 'RAFA-R07A',
      domains: { RELACIONES: 4, FINANZAS: 4, CUERPO: 4 },
      mentalidadValues: r07A    },
    {
      file: 'R07B.json',
      case_id: 'RAFA-R07B',
      domains: { RELACIONES: 4, FINANZAS: 4, CUERPO: 4 },
      mentalidadValues: r07B    },
    {
      file: 'R08A.json',
      case_id: 'RAFA-R08A',
      domains: { RELACIONES: 4, FINANZAS: 4, CUERPO: 4 },
      mentalidadValues: r08A    },
    {
      file: 'R08B.json',
      case_id: 'RAFA-R08B',
      domains: { RELACIONES: 4, FINANZAS: 4, CUERPO: 4 },
      mentalidadValues: r08B    },
    {
      file: 'R09A.json',
      case_id: 'RAFA-R09A',
      domains: { RELACIONES: 5, FINANZAS: 5, CUERPO: 5 },
      mentalidadValues: r09A    },
    {
      file: 'R09B.json',
      case_id: 'RAFA-R09B',
      domains: { RELACIONES: 5, FINANZAS: 5, CUERPO: 5 },
      mentalidadValues: r09B    },
    {
      file: 'R10.json',
      case_id: 'RAFA-R10',
      firstScoreable: {
        MENTALIDAD: { count: 10, value: 3 },
        RELACIONES: { count: 10, value: 3 },
        FINANZAS: { count: 10, value: 3 },
        CUERPO: { count: 10, value: 3 },
      },
    },
    {
      file: 'R11.json',
      case_id: 'RAFA-R11',
      domains: { MENTALIDAD: 5, RELACIONES: 5, FINANZAS: 5, CUERPO: 5 },
      risks: { ...CLEAN_RISKS, 'D-CUE-05': 1 }    },
    {
      file: 'R11B.json',
      case_id: 'RAFA-R11B',
      domains: { MENTALIDAD: 5, RELACIONES: 5, FINANZAS: 5 },
      firstScoreable: { CUERPO: { count: 6, value: 4 } },
      risks: { ...CLEAN_RISKS, 'D-CUE-05': 1 },
    },
    {
      file: 'R12.json',
      case_id: 'RAFA-R12',
      domains: { MENTALIDAD: 4, RELACIONES: 4, CUERPO: 4 },
      firstScoreable: { FINANZAS: { count: 9, value: 3 } },
      risks: {
        ...CLEAN_RISKS,
        'D-FIN-09': { value: 1, qualitativeConfirmed: true },
      }    },
    {
      file: 'R12B.json',
      case_id: 'RAFA-R12B',
      domains: { MENTALIDAD: 5, RELACIONES: 5, FINANZAS: 5, CUERPO: 5 },
      risks: {
        ...CLEAN_RISKS,
        'D-FIN-09': { value: 1, qualitativeConfirmed: true },
      },
    },
    {
      file: 'R13A.json',
      case_id: 'RAFA-R13A',
      domains: { MENTALIDAD: 5, RELACIONES: 5, FINANZAS: 5, CUERPO: 5 },
      answers: Object.fromEntries(focoLow.map((id) => [id, 1]))    },
    {
      file: 'R13B.json',
      case_id: 'RAFA-R13B',
      domains: { MENTALIDAD: 4, RELACIONES: 5, FINANZAS: 5, CUERPO: 5 }    },
    {
      file: 'R14.json',
      case_id: 'RAFA-R14',
      domains: { RELACIONES: 4, FINANZAS: 4, CUERPO: 4 },
      answers: {
        ...Object.fromEntries(menAud.map((id) => [id, 4])),
        ...Object.fromEntries(menDeep.map((id) => [id, 2])),
      }    },
    {
      file: 'R15.json',
      case_id: 'RAFA-R15',
      domains: { MENTALIDAD: 3, RELACIONES: 3, FINANZAS: 3, CUERPO: 3 },
      purpose: PURPOSE_RICH,
    },
    {
      file: 'R15B.json',
      case_id: 'RAFA-R15B',
      domains: { MENTALIDAD: 3, RELACIONES: 3, FINANZAS: 3, CUERPO: 3 },
      purpose: PURPOSE_FAMILY,
    },
    {
      file: 'R16.json',
      case_id: 'RAFA-R16',
      domains: { MENTALIDAD: 4, RELACIONES: 2, FINANZAS: 4, CUERPO: 4 },
    },
    {
      file: 'R17.json',
      case_id: 'RAFA-R17',
      domains: { MENTALIDAD: 4, RELACIONES: 4, FINANZAS: 2, CUERPO: 4 },
    },
    {
      file: 'R18.json',
      case_id: 'RAFA-R18',
      domains: { MENTALIDAD: 4, RELACIONES: 4, FINANZAS: 2, CUERPO: 2 },
    },
    {
      file: 'R19.json',
      case_id: 'RAFA-R19',
      domains: { RELACIONES: 4, FINANZAS: 4, CUERPO: 4 },
      answers: {
        ...Object.fromEntries(menAud.map((id) => [id, 2])),
        ...Object.fromEntries(menDeep.map((id) => [id, 4])),
      },
    },
  ];
}

function kOf(values: number[]): number {
  return values.reduce((sum, value) => sum + (value - 1), 0);
}

async function main(): Promise<void> {
  const definition = JSON.parse(
    await readFile(resolve(__dirname, '../definitions/matrix-v2.0.json'), 'utf8'),
  ) as MatrixDefinition;
  await mkdir(OUT_DIR, { recursive: true });

  const rows: string[] = [];
  for (const spec of cases()) {
    if (spec.mentalidadValues) {
      process.stdout.write(
        `${spec.case_id} K=${kOf(spec.mentalidadValues)} values=${spec.mentalidadValues.join('')}\n`,
      );
    }
    const responses = buildResponses(definition, spec);
    const json = {
      case_id: spec.case_id,
      policy_id: 'FULL-v1',
      now: NOW,
      responses,
    };
    const path = resolve(OUT_DIR, spec.file);
    await writeFile(path, `${JSON.stringify(json, null, 2)}\n`, 'utf8');

    const snapshot = runAssessment({
      definition,
      responses: Object.entries(responses).map(([id, value]) => asInput(id, value)),
      policy: FULL_POLICY,
      engineSemver: ENGINE_SEMVER,
      now: NOW,
    });
    const cue = indexTrace(snapshot.trace).get('domain_score:CUERPO');
    const counter =
      cue && typeof cue.output === 'object' && cue.output != null
        ? (cue.output as { counterfactual_item_weighted?: number }).counterfactual_item_weighted
        : null;
    const extra = spec.case_id === 'RAFA-R04' ? ` cf_item=${counter}` : '';
    const line = `${spec.file}  ${headline(snapshot)}${extra}`;
    rows.push(line);
    process.stdout.write(`${line}\n`);
  }
  await writeFile(resolve(OUT_DIR, 'HEADLINES.txt'), `${rows.join('\n')}\n`, 'utf8');
}

void main();
