/** E-PER-000 rows 186 to 213. The middle item of each factor is inverse: 6 minus the answer. */

import { formatPersonalityAverage } from './personality-copy';

type Factor = {
  label: string;
  refs: [string, string, string];
  high: string;
  low: string;
  mid: string;
};

const FACTORS: Factor[] = [
  {
    label: 'A. Apertura a la experiencia (creatividad vs. rutina)',
    refs: ['formulario-v1:E-PER-000!R187', 'formulario-v1:E-PER-000!R188', 'formulario-v1:E-PER-000!R189'],
    high: 'Mentalidad exploradora e ideal para innovación',
    low: 'Prefiere procesos claros y enfoque pragmático',
    mid: 'Equilibrio entre creatividad y sentido práctico',
  },
  {
    label: 'R. Responsabilidad y conciencia (organización vs. espontaneidad)',
    refs: ['formulario-v1:E-PER-000!R191', 'formulario-v1:E-PER-000!R192', 'formulario-v1:E-PER-000!R193'],
    high: 'Ejecutora disciplinada con foco en metas',
    low: 'Espontánea, requiere estructura externa',
    mid: 'Flexible en ejecución, organizada sin rigidez',
  },
  {
    label: 'E. Extraversión (energía social vs. introversión)',
    refs: ['formulario-v1:E-PER-000!R195', 'formulario-v1:E-PER-000!R196', 'formulario-v1:E-PER-000!R197'],
    high: 'Orientada a personas y liderazgo expuesto',
    low: 'Trabajo reflexivo en ambientes independientes',
    mid: 'Ambivalente, disfruta lo social con pausas a solas',
  },
  {
    label: 'M. Amabilidad y empatía (cooperación vs. competitividad)',
    refs: ['formulario-v1:E-PER-000!R199', 'formulario-v1:E-PER-000!R200', 'formulario-v1:E-PER-000!R201'],
    high: 'Vocación de servicio y altamente cooperativo',
    low: 'Analítico, orientado a resultados o competencia',
    mid: 'Empatía selectiva, cuida sus límites personales',
  },
  {
    label: 'N. Neuroticismo y estabilidad emocional (sensibilidad vs. calma)',
    refs: ['formulario-v1:E-PER-000!R203', 'formulario-v1:E-PER-000!R204', 'formulario-v1:E-PER-000!R205'],
    high: 'Alta reactividad emocional y alerta a riesgos',
    low: 'Estable, tolera alta presión laboral',
    mid: 'Sensibilidad moderada, reacciona según el contexto',
  },
];

const FACTOR_CLOSINGS = FACTORS.map((factor) => factor.refs[2]);
const MODULE_CLOSING = FACTOR_CLOSINGS[4];

function average(refs: [string, string, string], scores: Record<string, number | null | undefined>): number | null {
  const present = refs.flatMap((ref, index) => {
    const value = scores[ref];
    if (value == null || !Number.isFinite(value)) return [];
    return [index === 1 ? 6 - value : value];
  });
  if (present.length !== 3) return null;
  return present.reduce((total, value) => total + value, 0) / 3;
}

function read(factor: Factor, score: number | null): string {
  if (score == null) return 'Sin desarrollo';
  if (score >= 4) return factor.high;
  if (score <= 2.4) return factor.low;
  return factor.mid;
}

function detailLine(factor: Factor, scores: Record<string, number | null | undefined>): { label: string; detail: string } {
  const mean = average(factor.refs, scores);
  const band = read(factor, mean);
  const figure = mean == null ? '' : ` Media ${formatPersonalityAverage(mean)} de 5.`;
  return { label: factor.label, detail: `${band}.${figure}`.trim() };
}

/** Tras cada trío (R189, R193…) una fila; al cerrar N3 (R205) las cinco filas. */
export function oceanClosedReading(
  sourceRef: string | null | undefined,
  scores: Record<string, number | null | undefined>,
): { label: string; detail: string }[] {
  if (!sourceRef) return [];
  const factorIndex = FACTOR_CLOSINGS.indexOf(sourceRef);
  if (factorIndex < 0) return [];
  if (sourceRef === MODULE_CLOSING) {
    return FACTORS.map((factor) => detailLine(factor, scores));
  }
  return [detailLine(FACTORS[factorIndex]!, scores)];
}
