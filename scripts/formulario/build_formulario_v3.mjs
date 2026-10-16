/**
 * Adds the sheet rows missing from formulario-completo@2.
 * Does not rewrite @1 or @2.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('packages/database/definitions/formulario-completo@2.json', 'utf8'));

function moduleBySlug(slug) {
  const found = catalog.modules.find((item) => item.slug === slug);
  if (!found) throw new Error(slug);
  return found;
}

function blankFrom(mod, sourceRef, text, extra) {
  const sample = mod.questions[0];
  return {
    ...sample,
    sourceRef,
    sheet: sample.sheet,
    cells: sourceRef.split('!')[1],
    role: 'QUESTION',
    type: 'FREE_TEXT',
    textEs: text,
    contextEs: null,
    options: [],
    maxSelections: null,
    allowedExceptions: ['UNKNOWN', 'DECLINED'],
    formula: null,
    alerts: [],
    ...extra,
  };
}

function linksOf(mod) {
  const byOrder = new Map(mod.questions.map((question) => [question.order, question.sourceRef]));
  return mod.questions.flatMap((question) => {
    const match = /^@sigue:(\d+):(.+)$/.exec(question.contextEs ?? '');
    if (!match) return [];
    const parent = byOrder.get(Number(match[1]));
    if (!parent) throw new Error(`follow without parent ${question.sourceRef}`);
    return [{ ref: question.sourceRef, parent, token: match[2] }];
  });
}

function insertAfter(mod, afterRef, question) {
  const index = mod.questions.findIndex((item) => item.sourceRef === afterRef);
  if (index < 0) throw new Error(afterRef);
  mod.questions.splice(index + 1, 0, question);
}

function renumber(mod, links) {
  mod.questions.forEach((question, index) => {
    question.order = index + 1;
  });
  const orderOf = new Map(mod.questions.map((question) => [question.sourceRef, question.order]));
  for (const link of links) {
    const question = mod.questions.find((item) => item.sourceRef === link.ref);
    const parentOrder = orderOf.get(link.parent);
    if (!question || !parentOrder) throw new Error(`relink ${link.ref}`);
    const follow = `@sigue:${parentOrder}:${link.token}`;
    question.contextEs = link.extra ? `${follow}|${link.extra}` : follow;
  }
}

const body = 'formulario-v1:F-RAD-001!';
const profile = 'formulario-v1:E-PER-000!';

const measures = moduleBySlug('f-rad-001-s1');
let measureLinks = linksOf(measures);
insertAfter(measures, `${body}R10`, blankFrom(measures, `${body}R11`, 'Circunferencia de cintura, si quieres registrarla', {
  contextEs: '@numero:cm:40:200',
  allowedExceptions: ['UNKNOWN', 'NOT_APPLICABLE', 'DECLINED'],
}));
insertAfter(measures, `${body}R11`, blankFrom(measures, `${body}R12`, 'Cambios recientes de peso en los últimos 6 a 12 meses', {
  allowedExceptions: ['UNKNOWN', 'NOT_APPLICABLE', 'DECLINED'],
}));
renumber(measures, measureLinks);

const health = moduleBySlug('f-rad-001-s2');
const healthLinks = linksOf(health);
insertAfter(health, `${body}R25`, blankFrom(health, `${body}R26`, 'Si hay dolor, indica el nivel', {
  role: 'DETAIL',
  allowedExceptions: ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE'],
}));
healthLinks.push({ ref: `${body}R26`, parent: `${body}R24`, token: '!No', extra: '@numero:nivel:0:10' });
renumber(health, healthLinks);

const stress = moduleBySlug('f-rad-001-s5');
const stressLinks = linksOf(stress);
insertAfter(stress, `${body}R65`, blankFrom(stress, `${body}R68`, 'Si indicaste otra fuente de estrés, escríbela', {
  role: 'DETAIL',
  allowedExceptions: ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE'],
}));
stressLinks.push({ ref: `${body}R68`, parent: `${body}R65`, token: 'Otra' });
renumber(stress, stressLinks);

const perception = moduleBySlug('f-rad-001-s6');
const perceptionLinks = linksOf(perception);
insertAfter(perception, `${body}R78`, blankFrom(perception, `${body}R79`, 'Si respondiste más o menos, o no, indica por qué', {
  role: 'DETAIL',
  allowedExceptions: ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE'],
}));
perceptionLinks.push({ ref: `${body}R79`, parent: `${body}R78`, token: '!Sí' });
renumber(perception, perceptionLinks);

const origin = moduleBySlug('e-per-origen');
const originLinks = linksOf(origin);
insertAfter(origin, `${profile}R22`, blankFrom(origin, `${profile}R23`, '¿Qué parte de esa herencia desea conservar, cuál necesita purificar y cuál debe transmitir?', {
  instrument: 'origin',
  allowedExceptions: ['UNKNOWN', 'DECLINED'],
}));
renumber(origin, originLinks);

const personality = moduleBySlug('e-per-personalidad');
const factorTitles = [
  'A. Apertura a la Experiencia (Creatividad vs. Rutina)',
  'R. Responsabilidad / Conciencia (Organización vs. Espontaneidad)',
  'E. Extraversión (Energía Social vs. Introversión)',
  'M. Amabilidad / Empatía (Cooperación vs. Competitividad)',
  'N. Neuroticismo / Estabilidad Emocional (Sensibilidad vs. Calma)',
];
personality.questions.forEach((question, index) => {
  question.contextEs = `@titulo:${factorTitles[Math.floor(index / 3)]}`;
});

const difficultyHeadings = [
  ['PR1', 'PR2', 'PR3', 'A. Patrones repetitivos (la Sombra en acción). Ámbito: Relaciones interpersonales'],
  ['PR4', 'PR5', 'PR6', 'A. Patrones repetitivos (la Sombra en acción). Ámbito: Rendimiento laboral'],
  ['PR7', 'PR8', 'PR9', 'A. Patrones repetitivos (la Sombra en acción). Ámbito: Gestión financiera'],
  ['ER1', 'ER2', 'ER3', 'B. Emociones rechazadas (contenido de la Sombra). Ámbito: Control del entorno'],
  ['ER4', 'ER5', 'ER6', 'B. Emociones rechazadas (contenido de la Sombra). Ámbito: Autoimagen'],
  ['ER7', 'ER8', 'ER9', 'B. Emociones rechazadas (contenido de la Sombra). Ámbito: Vulnerabilidad'],
  ['PY1', 'PY2', 'PY3', 'C. Proyección (la Sombra en otros). Ámbito: Juicios recurrentes'],
  ['PY4', 'PY5', 'PY6', 'C. Proyección (la Sombra en otros). Ámbito: Autoridad y entorno'],
  ['PY7', 'PY8', 'PY9', 'C. Proyección (la Sombra en otros). Ámbito: Idolatría (Sombra dorada)'],
  ['D1', 'D2', 'D3', 'D. Excusas y autoengaño (núcleo de la Sombra). Ámbito: Gestión del tiempo'],
  ['D4', 'D5', 'D6', 'D. Excusas y autoengaño (núcleo de la Sombra). Ámbito: Recursos'],
  ['D7', 'D8', 'D9', 'D. Excusas y autoengaño (núcleo de la Sombra). Ámbito: Factores externos'],
  ['IN1', 'IN2', 'IN3', 'E. Integración (transformación de la Sombra). Ámbito: Límites personales'],
  ['IN4', 'IN5', 'IN6', 'E. Integración (transformación de la Sombra). Ámbito: Poder personal'],
  ['IN7', 'IN8', 'IN9', 'E. Integración (transformación de la Sombra). Ámbito: Compasión y flexibilidad'],
];
const headingByCode = new Map();
for (const [a, b, c, title] of difficultyHeadings) {
  for (const code of [a, b, c]) headingByCode.set(code, title);
}
const difficulties = moduleBySlug('e-per-dificultades');
for (const question of difficulties.questions) {
  const code = question.textEs.split('.', 1)[0];
  const title = headingByCode.get(code);
  if (!title) throw new Error(`sin ámbito para ${question.textEs.slice(0, 40)}`);
  question.contextEs = `@titulo:${title}`;
}

catalog.version = 'formulario-completo@3';
catalog.definitionRef = 'formulario-completo';
const hashed = { ...catalog };
delete hashed.sourceSha256;
delete hashed.definitionSha256;
catalog.definitionSha256 = createHash('sha256').update(JSON.stringify(hashed)).digest('hex');
writeFileSync('packages/database/definitions/formulario-completo@3.json', `${JSON.stringify(catalog, null, 2)}\n`);
const count = catalog.modules.reduce((sum, item) => sum + item.questions.length, 0);
console.log(JSON.stringify({ version: catalog.version, questions: count }));
