import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const SENSE = [
  'Totalmente falso / casi nunca.',
  'Más falso que verdadero.',
  'Parcialmente verdadero.',
  'Mayoritariamente verdadero.',
  'Totalmente verdadero / casi siempre.',
];
const AGREE = [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Neutral',
  'De acuerdo',
  'Totalmente de acuerdo',
];
const OFTEN = ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'];
const AUDIT_FINANCE = {
  'formulario-v1:E-AUD-001!R37': [
    'Más de 50% o incumplimientos',
    'Aproximadamente 40 a 50%',
    'Aproximadamente 30 a 39%',
    'Aproximadamente 10 a 29%, con pagos al día',
    '0 a 10%, o únicamente deuda productiva sostenible',
  ],
  'formulario-v1:E-AUD-001!R38': [
    'Vivo al día / cero ahorro',
    'Ahorro ocasional e inestable',
    'Ahorro inicial, pero irregular',
    'Ahorro sistemático y protegido',
    'Ahorro e inversión consolidados',
  ],
  'formulario-v1:E-AUD-001!R39': [
    'Cero planificación',
    'Conciencia básica, sin sistema',
    'Presupuesto básico con seguimiento irregular',
    'Plan financiero estructurado y seguimiento mensual',
    'Plan integral y seguimiento sistemático',
  ],
  'formulario-v1:E-AUD-001!R40': [
    'Muy insuficientes',
    'Insuficientes / alta fragilidad',
    'Suficientes para el presente, limitados para progresar',
    'Adecuados y alineados con mis objetivos',
    'Superiores a las necesidades y metas actuales',
  ],
};
const FINANCE_CUSTOM = {
  'formulario-v1:F-RAD-003!R18': [
    'Sin fondo de emergencia',
    'A veces guardo, pero lo gasto después',
    'Algo tengo, pero cubre menos de un mes',
    'Tengo uno, pero cubre menos de 3 meses',
    'Igual o mayor a 6 meses',
  ],
  'formulario-v1:F-RAD-003!R19': [
    'No controlados',
    'Rara vez controlados',
    'A veces',
    'Frecuentemente',
    'Siempre controlados',
  ],
};
const DESCENDING = {
  'formulario-v1:E-AUD-001!R8': {
    1: 'Uso excusas con frecuencia',
    5: 'Rara vez uso excusas',
  },
  'formulario-v1:E-AUD-001!R19': {
    1: 'Muy frecuentemente',
    5: 'Casi nunca',
  },
};

function identityLabels(context) {
  const text = String(context ?? '').replace(/^@nota:/, '');
  const labels = {};
  for (const part of text.split(/(?=\d+\.\s)/)) {
    const match = /^(\d+)\.\s*(.+)$/s.exec(part.trim());
    if (match) labels[match[1]] = match[2].trim();
  }
  return labels;
}

function applyLabels(question, labels) {
  const list = Array.isArray(labels) ? labels : null;
  for (const option of question.options) {
    const label = list ? list[option.order - 1] : labels[option.value];
    if (label) option.textEs = label;
  }
}

const catalog = JSON.parse(readFileSync('packages/database/definitions/formulario-completo@5.json', 'utf8'));
for (const mod of catalog.modules) {
  for (const question of mod.questions) {
    if (mod.slug === 'e-per-identidad') {
      const labels = identityLabels(question.contextEs);
      if (Object.keys(labels).length !== 4) throw new Error(`identidad sin 4 etiquetas ${question.sourceRef}`);
      applyLabels(question, labels);
    }
    if (mod.slug === 'e-aud-s6') applyLabels(question, SENSE);
    if (AUDIT_FINANCE[question.sourceRef]) applyLabels(question, AUDIT_FINANCE[question.sourceRef]);
    if (mod.slug.startsWith('f-rad-002') && question.type === 'SCALE_1_5') applyLabels(question, AGREE);
    if (mod.slug.startsWith('f-rad-003') && question.type === 'SCALE_1_5') {
      applyLabels(question, FINANCE_CUSTOM[question.sourceRef] ?? OFTEN);
    }
    if (DESCENDING[question.sourceRef]) {
      for (const option of question.options) {
        if (DESCENDING[question.sourceRef][option.value]) option.textEs = DESCENDING[question.sourceRef][option.value];
      }
    }
  }
}
catalog.version = 'formulario-completo@6';
const hashed = { ...catalog };
delete hashed.sourceSha256;
delete hashed.definitionSha256;
catalog.definitionSha256 = createHash('sha256').update(JSON.stringify(hashed)).digest('hex');
writeFileSync('packages/database/definitions/formulario-completo@6.json', `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ version: catalog.version, sha: catalog.definitionSha256.slice(0, 12) }));
