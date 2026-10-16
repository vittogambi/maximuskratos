/**
 * Builds formulario-completo@2 from @1 plus the lists in NO BORRAR.
 * Does not rewrite @1. Narrative questions stay free text.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const source = JSON.parse(readFileSync('packages/database/definitions/formulario-completo@1.json', 'utf8'));
const workbook = XLSX.readFile('260529-FORMULARIOS-X-PASO.xlsx');

function column(sheetName, col, from, to) {
  const sheet = workbook.Sheets[sheetName];
  const values = [];
  for (let row = from; row <= to; row += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row - 1, c: col })];
    const text = cell?.v == null ? '' : String(cell.v).replace(/\s+/g, ' ').trim();
    if (text) values.push(text);
  }
  return values;
}

const VALUES = column('NO BORRAR', 4, 3, 32);
const ILLNESS = ['No', 'Cardiovascular', 'Metabólica (diabetes, resistencia a la insulina, etc.)', 'Respiratoria', 'Hormonal', 'Neurológica', 'Otras'];
const YES_NO = ['No', 'Sí'];
const INJURY = ['No', 'Sí', 'Solía'];
const DIET = column('NO BORRAR', 8, 3, 6);
const FREQUENCY = column('NO BORRAR', 0, 23, 32);
const PLACE = column('NO BORRAR', 2, 23, 31);
const LEVEL = column('NO BORRAR', 2, 35, 38);
const GOAL = column('NO BORRAR', 0, 11, 14);
const STEP = column('NO BORRAR', 1, 11, 15);

function options(labels) {
  return labels.map((label, index) => ({ order: index + 1, textEs: label, value: label }));
}

function byRef(catalog) {
  const map = new Map();
  for (const mod of catalog.modules) {
    for (const question of mod.questions) map.set(question.sourceRef, question);
  }
  return map;
}

const catalog = structuredClone(source);
const questions = byRef(catalog);

function setChoice(ref, type, labels, extra = {}) {
  const question = questions.get(ref);
  if (!question) throw new Error(`missing ${ref}`);
  question.type = type;
  question.options = options(labels);
  question.allowedExceptions = extra.exceptions ?? ['UNKNOWN', 'DECLINED'];
  if (extra.max) question.maxSelections = extra.max;
  if (extra.context) question.contextEs = extra.context;
  if (extra.role) question.role = extra.role;
}

function setCapture(ref, context, exceptions) {
  const question = questions.get(ref);
  if (!question) throw new Error(`missing ${ref}`);
  question.type = 'FREE_TEXT';
  question.options = [];
  question.contextEs = context;
  question.allowedExceptions = exceptions;
}

const body = 'formulario-v1:F-RAD-001!';
setCapture(`${body}R6`, '@fecha:nacimiento:1:120', ['UNKNOWN', 'DECLINED']);
questions.get(`${body}R6`).textEs = 'Fecha de nacimiento';
setChoice(`${body}R18`, 'SINGLE_CHOICE', ILLNESS);
setCapture(`${body}R19`, '@sigue:1:Otras', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
questions.get(`${body}R19`).role = 'DETAIL';
setChoice(`${body}R20`, 'SINGLE_CHOICE', INJURY);
setCapture(`${body}R21`, '@sigue:3:!No', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
setChoice(`${body}R22`, 'SINGLE_CHOICE', YES_NO);
setCapture(`${body}R23`, '@sigue:5:!No', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
setChoice(`${body}R24`, 'MULTI_CHOICE', ['No', 'Espalda', 'Articulaciones', 'Cuello', 'Muscular crónico', 'Cabeza', 'Otro'], { max: 6 });
setCapture(`${body}R25`, '@sigue:7:!No', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
setChoice(`${body}R27`, 'SINGLE_CHOICE', YES_NO);
setCapture(`${body}R28`, '@sigue:9:!No', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
setChoice(`${body}R34`, 'SINGLE_CHOICE', DIET.length ? DIET : ['Desordenada', 'Regular', 'Estructurada', 'Plan nutricional']);
setCapture(`${body}R35`, '@numero:comidas:1:10', ['UNKNOWN', 'DECLINED']);
setChoice(`${body}R36`, 'MULTI_CHOICE', ['Ultraprocesados', 'Azúcar', 'Alcohol', 'Otro', 'Ninguno'], { max: 4 });
setCapture(`${body}R37`, '@sigue:3:Otro', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
setChoice(`${body}R38`, 'SINGLE_CHOICE', ['Hambre real', 'Ansiedad', 'Rutina social', 'Otro']);
setCapture(`${body}R39`, '@sigue:5:Otro', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
setChoice(`${body}R40`, 'SINGLE_CHOICE', YES_NO);
setChoice(`${body}R41`, 'SINGLE_CHOICE', YES_NO);
setCapture(`${body}R42`, '@sigue:8:!No', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
setChoice(`${body}R48`, 'SINGLE_CHOICE', YES_NO);
setChoice(`${body}R49`, 'MULTI_CHOICE', ['Gimnasio', 'Cardio', 'Baile', 'Acrobacias', 'Trekking', 'Deporte específico', 'Ninguna'], { max: 6, context: '@sigue:1:!No' });
setCapture(`${body}R50`, '@sigue:1:!No', ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE']);
setChoice(`${body}R52`, 'SINGLE_CHOICE', FREQUENCY, { context: '@sigue:1:!No' });
setCapture(`${body}R53`, '@numero:minutos:10:240', ['UNKNOWN', 'DECLINED']);
questions.get(`${body}R53`).contextEs = '@numero:minutos:10:240';
setChoice(`${body}R54`, 'SINGLE_CHOICE', YES_NO);
setChoice(`${body}R55`, 'SINGLE_CHOICE', ['Sí', 'Más o menos', 'No']);
setCapture(`${body}R61`, '@horas:0:14', ['UNKNOWN', 'DECLINED']);
setChoice(`${body}R62`, 'SINGLE_CHOICE', ['Baja', 'Media', 'Alta']);
setChoice(`${body}R63`, 'SINGLE_CHOICE', ['Sí', 'Usualmente', 'No']);
setChoice(`${body}R64`, 'SINGLE_CHOICE', ['Bajo', 'Medio', 'Alto', 'Muy alto']);
setChoice(`${body}R65`, 'MULTI_CHOICE', ['Trabajo', 'Dinero', 'Salud', 'Relaciones', 'No tengo', 'Otra'], { max: 3 });
setChoice(`${body}R74`, 'SINGLE_CHOICE', ['Bien', 'Regular', 'Mal']);
setChoice(`${body}R75`, 'SINGLE_CHOICE', ['Sí', 'Más o menos', 'No']);
setChoice(`${body}R76`, 'SINGLE_CHOICE', ['Sí', 'Más o menos', 'No']);
setChoice(`${body}R77`, 'SINGLE_CHOICE', ['Orgullo', 'Más o menos', 'Frustración']);
setChoice(`${body}R78`, 'SINGLE_CHOICE', ['Sí', 'Más o menos', 'No']);
setChoice(`${body}R86`, 'SINGLE_CHOICE', GOAL);
setChoice(`${body}R87`, 'SINGLE_CHOICE', STEP);
setChoice(`${body}R89`, 'SINGLE_CHOICE', FREQUENCY);
setChoice(`${body}R90`, 'SINGLE_CHOICE', PLACE);
setChoice(`${body}R91`, 'SINGLE_CHOICE', LEVEL);

const measures = catalog.modules.find((mod) => mod.slug === 'f-rad-001-s1');
const age = measures.questions[0];
measures.questions = [
  age,
  {
    ...age,
    sourceRef: `${body}R7`,
    cells: 'R7',
    textEs: 'Sexo',
    type: 'SINGLE_CHOICE',
    options: options(['Hombre', 'Mujer']),
    contextEs: null,
    allowedExceptions: [],
  },
  {
    ...age,
    sourceRef: `${body}R8`,
    cells: 'R8',
    textEs: 'Altura',
    type: 'FREE_TEXT',
    options: [],
    contextEs: '@numero:cm:120:230',
    allowedExceptions: [],
  },
  {
    ...age,
    sourceRef: `${body}R9`,
    cells: 'R9',
    textEs: 'Peso actual',
    type: 'FREE_TEXT',
    options: [],
    contextEs: '@numero:kg:35:250',
    allowedExceptions: ['UNKNOWN', 'DECLINED'],
  },
  {
    ...age,
    sourceRef: `${body}R10`,
    cells: 'R10',
    textEs: 'Grasa corporal, si la conoces',
    type: 'FREE_TEXT',
    options: [],
    contextEs: '@numero:%:0:100',
    allowedExceptions: ['UNKNOWN', 'DECLINED'],
  },
];
measures.questions.forEach((question, index) => { question.order = index + 1; });

const per = 'formulario-v1:E-PER-000!';
setChoice(`${per}R40`, 'MULTI_CHOICE', VALUES, { max: 10, exceptions: ['UNKNOWN', 'DECLINED'] });
setChoice(`${per}R51`, 'MULTI_CHOICE', VALUES, {
  max: 3,
  context: `@subset:${per}R40`,
  exceptions: ['UNKNOWN', 'DECLINED'],
});

const lenses = {
  Pasión: ['Vocación', 'Misión', 'Profesión'],
  Vocación: ['Pasión', 'Misión', 'Profesión'],
  Misión: ['Pasión', 'Vocación', 'Profesión'],
  Profesión: ['Pasión', 'Vocación', 'Misión'],
};
for (const question of catalog.modules.find((mod) => mod.slug === 'e-per-ikigai').questions) {
  const lens = Object.keys(lenses).find((name) => question.textEs.includes(name) || question.contextEs?.includes(name)) ?? 'Pasión';
  question.contextEs = `@ikigai:${lens}:${lenses[lens].join('|')}`;
  question.allowedExceptions = ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE'];
  question.options = [];
}

for (const mod of catalog.modules) {
  for (const question of mod.questions) {
    question.allowedExceptions ??= question.type === 'FREE_TEXT'
      ? ['UNKNOWN', 'DECLINED']
      : ['UNKNOWN', 'DECLINED'];
  }
}

catalog.version = 'formulario-completo@2';
catalog.definitionRef = 'formulario-completo';
const hashed = { ...catalog };
delete hashed.sourceSha256;
delete hashed.definitionSha256;
catalog.definitionSha256 = createHash('sha256').update(JSON.stringify(hashed)).digest('hex');
catalog.sourceSha256 = createHash('sha256').update(readFileSync('260529-FORMULARIOS-X-PASO.xlsx')).digest('hex');
writeFileSync('packages/database/definitions/formulario-completo@2.json', `${JSON.stringify(catalog, null, 2)}\n`);
const count = catalog.modules.reduce((sum, mod) => sum + mod.questions.length, 0);
console.log(JSON.stringify({ version: catalog.version, modules: catalog.modules.length, questions: count, values: VALUES.length }));
