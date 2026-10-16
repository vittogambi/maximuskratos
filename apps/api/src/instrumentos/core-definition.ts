import { createHash } from 'node:crypto';
import { GROUP_PILLAR, type IndicatorGroup, type Pillar } from './glossary';

/** Product draft. Not an Excel formula and not a validated instrument. */
export const ALIGNMENT_METHOD = 'ia-mk-cuest@0.1';
export const ALIGNMENT_NAME = 'Índice de alineación MK';

export type CaptureQuality =
  | 'ETIQUETADA'
  | 'OPCIONES_SIN_SIGNIFICADO'
  | 'ETIQUETAS_GENERICAS_CONTRADICTORIAS'
  | 'ANCLAJES_OCULTOS';

export type CoreSignal = {
  id: string;
  group: IndicatorGroup;
  pillar: Pillar;
  sourceRef: string;
  min: number;
  max: number;
  /** Higher stored value means more of the construct. IN7 included. */
  polarity: 'DIRECT';
  window: string;
};

const signal = (
  id: string,
  group: IndicatorGroup,
  sourceRef: string,
  min: number,
  max: number,
  window: string,
): CoreSignal => ({
  id,
  group,
  pillar: GROUP_PILLAR[group],
  sourceRef,
  min,
  max,
  polarity: 'DIRECT',
  window,
});

/** Twenty signals. Sheet and row are inside sourceRef so R63 of audit is not R63 of the body form. */
export const CORE_SIGNALS: readonly CoreSignal[] = [
  signal('E62', 'NUC-E1', 'formulario-v1:E-AUD-001!R62', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('E63', 'NUC-E1', 'formulario-v1:E-AUD-001!R63', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('I73', 'NUC-E2', 'formulario-v1:E-PER-000!R73', 1, 4, 'Identidad declarada, sin ventana.'),
  signal('I74', 'NUC-E2', 'formulario-v1:E-PER-000!R74', 1, 4, 'Identidad declarada, sin ventana.'),
  signal('E60', 'NUC-E3', 'formulario-v1:E-AUD-001!R60', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('I77', 'NUC-E3', 'formulario-v1:E-PER-000!R77', 1, 4, 'Identidad declarada, sin ventana.'),
  signal('E7', 'NUC-M1', 'formulario-v1:E-AUD-001!R7', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('E8', 'NUC-M1', 'formulario-v1:E-AUD-001!R8', 1, 5, 'Frecuencia descendente en el enunciado: 5 es rara vez.'),
  signal('E19', 'NUC-M1', 'formulario-v1:E-AUD-001!R19', 1, 5, 'Frecuencia descendente en el enunciado: 5 es casi nunca.'),
  signal('E26', 'NUC-M2', 'formulario-v1:E-AUD-001!R26', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('E27', 'NUC-M2', 'formulario-v1:E-AUD-001!R27', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('E29', 'NUC-M3', 'formulario-v1:E-AUD-001!R29', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('I80', 'NUC-M3', 'formulario-v1:E-PER-000!R80', 1, 4, 'Identidad declarada, sin ventana.'),
  signal('IN7', 'NUC-M3', 'formulario-v1:E-PER-000!R154', 0, 2, 'Recurso de integración. No es una interferencia.'),
  signal('I76', 'NUC-C1', 'formulario-v1:E-PER-000!R76', 1, 4, 'Hábitos declarados, sin ventana.'),
  signal('I86', 'NUC-C1', 'formulario-v1:E-PER-000!R86', 1, 4, 'Pregunta hipotética sobre 30 días. No es una observación de esos días.'),
  signal('E17', 'NUC-C2', 'formulario-v1:E-AUD-001!R17', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('E20', 'NUC-C2', 'formulario-v1:E-AUD-001!R20', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('E18', 'NUC-C3', 'formulario-v1:E-AUD-001!R18', 1, 5, 'Sin ventana explícita. No es esta semana.'),
  signal('E57', 'NUC-C3', 'formulario-v1:E-AUD-001!R57', 1, 5, 'Sin ventana explícita. No es esta semana.'),
];

export const DEFINITION_SHA = createHash('sha256').update(JSON.stringify(CORE_SIGNALS)).digest('hex');

const IDENTITY = new Set(['I73', 'I74', 'I77', 'I80', 'I76', 'I86']);
const SENSE = new Set(['E62', 'E63', 'E60', 'E57']);
const DESCENDING = new Set(['E8', 'E19']);

export function catalogRevision(version: string | null | undefined): number {
  const match = /@(\d+)$/.exec(version ?? '');
  return match ? Number(match[1]) : 0;
}

/**
 * What the person could see when that catalog was captured.
 * A later player fix does not make an old answer eligible.
 * Revision 6 and later carry the repaired labels.
 */
export function captureQuality(catalogVersion: string, signal: CoreSignal): CaptureQuality {
  if (catalogRevision(catalogVersion) >= 6) return 'ETIQUETADA';
  if (signal.id === 'IN7') return 'ETIQUETADA';
  if (DESCENDING.has(signal.id)) return 'ETIQUETAS_GENERICAS_CONTRADICTORIAS';
  if (SENSE.has(signal.id)) return 'ANCLAJES_OCULTOS';
  if (IDENTITY.has(signal.id)) {
    return catalogRevision(catalogVersion) <= 3 ? 'ETIQUETADA' : 'OPCIONES_SIN_SIGNIFICADO';
  }
  return 'ETIQUETADA';
}

export function signalByRef(sourceRef: string): CoreSignal | undefined {
  return CORE_SIGNALS.find((item) => item.sourceRef === sourceRef);
}
