import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import XLSX from 'xlsx';

const root = resolve(import.meta.dirname, '../../..');
const matriz = XLSX.read(readFileSync(resolve(root, 'MATRIZ_MAESTRA_MK_v2_FOCO.xlsx')), { type: 'buffer' });
const forms = XLSX.read(readFileSync(resolve(root, 'docs/philosophy/260529-FORMULARIOS-X-PASO.xlsx')), {
  type: 'buffer',
});

function table(wb, name, headerRow) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: false });
  const headers = rows[headerRow];
  return rows.slice(headerRow + 1).map((row) => {
    const item = {};
    headers.forEach((key, index) => {
      if (key) item[key] = row[index] ?? '';
    });
    return item;
  });
}

function cell(sheet, r, c) {
  const rows = XLSX.utils.sheet_to_json(forms.Sheets[sheet], { header: 1, defval: '', raw: false });
  return String(rows[r]?.[c] ?? '').trim();
}

function firstLine(text) {
  return text.split(/\n/)[0].replace(/\s+/g, ' ').trim();
}

const questions = table(matriz, '01_PREGUNTAS', 3).filter((row) => row.ID_Pregunta);
const migRows = table(matriz, '10_MIGRACION', 3).filter((row) => row.Hoja_origen && row.Problema);

const WHY = {
  MIG01: migRows[0].Resolución_en_matriz,
  MIG02: migRows[1].Resolución_en_matriz,
  MIG04: migRows[3].Resolución_en_matriz,
  MIG06: migRows[5].Resolución_en_matriz,
  MIG07: migRows[6].Resolución_en_matriz,
  MIG09: migRows[8].Resolución_en_matriz,
  MIG10: migRows[9].Resolución_en_matriz,
  MIG11: migRows[10].Resolución_en_matriz,
  MIG12: migRows[11].Resolución_en_matriz,
  MIG13: migRows[12].Resolución_en_matriz,
};

function sourceFormFor(id, excelFuente) {
  if (/^D-REL-/.test(id)) return 'F-RAD-002';
  if (/^D-FIN-/.test(id)) return 'F-RAD-003';
  if (/^AUD-REL-/.test(id) || /^AUD-FIN-/.test(id)) return 'E-AUD-001';
  if (/^AUD-CUE-/.test(id) || /^AUD-MEN-/.test(id)) return 'E-AUD-001';
  if (/^D-MEN-/.test(id)) return 'E-AUD-001 / E-PER-005';
  if (/^P-PRO-07[1-6]$/.test(id)) return 'NUEVA';
  return excelFuente || null;
}

function base(row) {
  const id = row.ID_Pregunta;
  return {
    v2_question_id: id,
    v2_question: row.Pregunta_neutral,
    v2_domain: row.Ámbito,
    v2_dimension: row.Dimensión,
    v2_variable_type: row.Tipo_variable,
    v2_phase: row.Fase,
    v2_instrumento: row.Instrumento,
    source_form: sourceFormFor(id, row.Fuente_original),
    source_section: null,
    source_question_number: null,
    source_question: null,
    source_response_type: null,
    source_alert_logic: null,
    transformation_type: 'UNCLEAR',
    why_changed: 'REQUIRES HUMAN AUTHORING',
    confidence: /^D-MEN-/.test(id) ? 'MEDIUM' : 'UNCLEAR' === 'UNCLEAR' ? 'LOW' : 'LOW',
    review_needed_by_rafa: 'YES',
  };
}

const mappings = questions.map((row) => {
  const item = base(row);
  if (/^D-MEN-/.test(row.ID_Pregunta)) item.confidence = 'MEDIUM';
  else item.confidence = 'LOW';
  return item;
});

function put(id, patch) {
  const item = mappings.find((row) => row.v2_question_id === id);
  if (!item) throw new Error(`missing ${id}`);
  Object.assign(item, patch);
}

const HIGH = {
  'AUD-CUE-02': {
    source_form: 'E-AUD-001',
    source_section: 'SECCIÓN 2: HÁBITOS Y ACCIONES',
    source_question_number: '8',
    source_question: firstLine(cell('E-AUD-001', 17, 1)),
    source_response_type: 'Likert 1 a 5',
    source_alert_logic: firstLine(cell('E-AUD-001', 17, 2)) || null,
    transformation_type: 'REFORMULATED',
    why_changed: `${WHY.MIG06} ${WHY.MIG07}`,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'AUD-CUE-03': {
    source_form: 'E-AUD-001',
    source_section: 'SECCIÓN 2: HÁBITOS Y ACCIONES',
    source_question_number: '7',
    source_question: firstLine(cell('E-AUD-001', 16, 1)),
    source_response_type: 'Likert 1 a 5',
    source_alert_logic: firstLine(cell('E-AUD-001', 16, 2)) || null,
    transformation_type: 'REFORMULATED',
    why_changed: `${WHY.MIG06} ${WHY.MIG07}`,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'AUD-CUE-04': {
    source_form: 'E-AUD-001',
    source_section: 'SECCIÓN 2: HÁBITOS Y ACCIONES',
    source_question_number: '6',
    source_question: firstLine(cell('E-AUD-001', 15, 1)),
    source_response_type: 'Likert 1 a 5',
    source_alert_logic: firstLine(cell('E-AUD-001', 15, 2)) || null,
    transformation_type: 'REFORMULATED',
    why_changed: `${WHY.MIG06} ${WHY.MIG07}`,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'AUD-FIN-03': {
    source_form: 'E-AUD-001',
    source_section: 'SECCIÓN 4: SOBERANÍA FINANCIERA',
    source_question_number: '17',
    source_question: firstLine(cell('E-AUD-001', 37, 1)),
    source_response_type: 'Likert 1 a 5',
    source_alert_logic: null,
    transformation_type: 'REFORMULATED',
    why_changed: `${WHY.MIG06} ${WHY.MIG07}`,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'D-CUE-01': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 2: ANTECEDENTES DE SALUD Y CONDICIONES FÍSICAS',
    source_question_number: '2',
    source_question: firstLine(cell('F-RAD-001', 17, 1)),
    source_response_type: 'Lista / alerta si no es No',
    source_alert_logic: cell('F-RAD-001', 17, 2),
    transformation_type: 'SAFETY_SEPARATED',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'D-CUE-02': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 2: ANTECEDENTES DE SALUD Y CONDICIONES FÍSICAS',
    source_question_number: '3',
    source_question: firstLine(cell('F-RAD-001', 19, 1)),
    source_response_type: 'Lista / alerta si no es No',
    source_alert_logic: cell('F-RAD-001', 19, 2),
    transformation_type: 'SAFETY_SEPARATED',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'D-CUE-03': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 2: ANTECEDENTES DE SALUD Y CONDICIONES FÍSICAS',
    source_question_number: '4',
    source_question: firstLine(cell('F-RAD-001', 21, 1)),
    source_response_type: 'Lista / alerta si no es No',
    source_alert_logic: cell('F-RAD-001', 21, 2),
    transformation_type: 'SAFETY_SEPARATED',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'D-CUE-04': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 2: ANTECEDENTES DE SALUD Y CONDICIONES FÍSICAS',
    source_question_number: '6',
    source_question: firstLine(cell('F-RAD-001', 26, 1)),
    source_response_type: 'Lista / alerta si no es No',
    source_alert_logic: cell('F-RAD-001', 26, 2),
    transformation_type: 'SAFETY_SEPARATED',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'D-CUE-05': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 2: ANTECEDENTES DE SALUD Y CONDICIONES FÍSICAS',
    source_question_number: '5',
    source_question: firstLine(cell('F-RAD-001', 23, 1)),
    source_response_type: 'Lista / alerta si no es No',
    source_alert_logic: cell('F-RAD-001', 23, 2),
    transformation_type: 'SAFETY_SEPARATED',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'D-CUE-06': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 1: CONDICIONES FÍSICAS BÁSICAS (AUTORREPORTE)',
    source_question_number: '1',
    source_question: 'Edad. Sexo. Altura (cm). Peso actual (kg). % de grasa corporal (si lo conoce). Circunferencia cintura (opcional). Cambios recientes de peso (últimos 6–12 meses).',
    source_response_type: 'Dato',
    source_alert_logic: null,
    transformation_type: 'NON_SCOREABLE',
    why_changed: WHY.MIG01,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'D-CUE-07': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 5: SUEÑO, ESTRÉS Y RECUPERACIÓN',
    source_question_number: '19',
    source_question: firstLine(cell('F-RAD-001', 60, 1)),
    source_response_type: 'Rangos de horas',
    source_alert_logic: cell('F-RAD-001', 60, 2),
    transformation_type: 'SCALE_CHANGED',
    why_changed: WHY.MIG09,
    confidence: 'HIGH',
    review_needed_by_rafa: 'YES',
  },
  'P-CUE-01': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 7: OPTIMIZACIÓN FÍSICA Y ESTÉTICA',
    source_question_number: '1',
    source_question: firstLine(cell('F-RAD-001', 85, 1)),
    source_response_type: 'Selección',
    source_alert_logic: null,
    transformation_type: 'NON_SCOREABLE',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'P-CUE-02': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 7: OPTIMIZACIÓN FÍSICA Y ESTÉTICA',
    source_question_number: '2',
    source_question: firstLine(cell('F-RAD-001', 86, 1)),
    source_response_type: 'Selección',
    source_alert_logic: null,
    transformation_type: 'NON_SCOREABLE',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'P-CUE-03': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 7: OPTIMIZACIÓN FÍSICA Y ESTÉTICA',
    source_question_number: '3',
    source_question: firstLine(cell('F-RAD-001', 88, 1)),
    source_response_type: 'Dato',
    source_alert_logic: null,
    transformation_type: 'NON_SCOREABLE',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'P-CUE-04': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 7: OPTIMIZACIÓN FÍSICA Y ESTÉTICA',
    source_question_number: '4',
    source_question: firstLine(cell('F-RAD-001', 89, 1)),
    source_response_type: 'Selección',
    source_alert_logic: null,
    transformation_type: 'NON_SCOREABLE',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
  'P-CUE-05': {
    source_form: 'F-RAD-001',
    source_section: 'SECCIÓN 7: OPTIMIZACIÓN FÍSICA Y ESTÉTICA',
    source_question_number: '5',
    source_question: firstLine(cell('F-RAD-001', 90, 1)),
    source_response_type: 'Selección',
    source_alert_logic: null,
    transformation_type: 'NON_SCOREABLE',
    why_changed: WHY.MIG10,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  },
};

const eper007 = [
  [186, '1'],
  [187, '2'],
  [188, '3'],
  [190, '4'],
  [191, '5'],
  [192, '6'],
  [194, '7'],
  [195, '8'],
  [196, '9'],
  [198, '10'],
  [199, '11'],
  [200, '12'],
  [202, '13'],
  [203, '14'],
  [204, '15'],
];
eper007.forEach(([row, number], index) => {
  const id = `P-PRO-0${36 + index}`;
  HIGH[id] = {
    source_form: 'E-PER-007',
    source_section: 'SECCIÓN 7: FACTORES DE LA PERSONALIDAD  (CÓD.: E-PER-007)',
    source_question_number: number,
    source_question: firstLine(cell('E-PER-000', row, 1)),
    source_response_type: 'Likert 1 a 5',
    source_alert_logic: null,
    transformation_type: 'NON_SCOREABLE',
    why_changed: WHY.MIG11,
    confidence: 'HIGH',
    review_needed_by_rafa: 'NO',
  };
});

for (let n = 71; n <= 76; n += 1) {
  HIGH[`P-PRO-0${n}`] = {
    source_form: 'NUEVA',
    source_section: null,
    source_question_number: null,
    source_question: null,
    source_response_type: null,
    source_alert_logic: null,
    transformation_type: 'NEW_IN_V2',
    why_changed: WHY.MIG12,
    confidence: 'HIGH',
    review_needed_by_rafa: 'YES',
  };
}

for (let n = 26; n <= 35; n += 1) {
  put(`P-PRO-0${n}`, {
    source_form: 'E-PER-006',
    source_section: 'SECCIÓN 6: DIFICULTADES (CÓD.: E-PER-006)',
    source_question_number: null,
    source_question: null,
    source_response_type: 'Likert',
    source_alert_logic: null,
    transformation_type: 'MERGED',
    why_changed: WHY.MIG04 ? WHY.MIG04 : 'Separar INTERFERENCIA (invertida) e INTEGRACIÓN; no usar total único.',
    confidence: 'LOW',
    review_needed_by_rafa: 'YES',
  });
}

for (const [id, patch] of Object.entries(HIGH)) put(id, patch);

const brooks = [
  [55, '24'],
  [56, '25'],
  [58, '26'],
  [59, '27'],
  [61, '28'],
  [62, '29'],
  [64, '30'],
  [65, '31'],
  [66, '32'],
  [67, '33'],
];
for (const [row, number] of brooks) {
  mappings.push({
    v2_question_id: `REMOVED-E-AUD-001-Q${number}`,
    v2_question: '',
    v2_domain: '',
    v2_dimension: '',
    v2_variable_type: '',
    v2_phase: 'AUDITORÍA',
    v2_instrumento: 'E-AUD-001',
    source_form: 'E-AUD-001',
    source_section: 'SECCIÓN 6: DESARROLLO Y SENTIDO',
    source_question_number: number,
    source_question: firstLine(cell('E-AUD-001', row, 1)),
    source_response_type: 'Likert 1 a 5',
    source_alert_logic: null,
    transformation_type: 'REMOVED',
    why_changed: 'REQUIRES HUMAN AUTHORING',
    confidence: 'HIGH',
    review_needed_by_rafa: 'YES',
  });
}

const finFree = [
  [45, '13'],
  [46, '14'],
  [47, '15'],
];
for (const [row, number] of finFree) {
  mappings.push({
    v2_question_id: `REMOVED-F-RAD-003-Q${number}`,
    v2_question: '',
    v2_domain: 'FINANZAS',
    v2_dimension: '',
    v2_variable_type: 'NARRATIVA',
    v2_phase: 'DIAGNÓSTICO PROFUNDO',
    v2_instrumento: 'F-RAD-003',
    source_form: 'F-RAD-003',
    source_section: 'BLOQUE DE CONSTRUCCIÓN Y ANHELO DE PROYECCIÓN',
    source_question_number: number,
    source_question: firstLine(cell('F-RAD-003', row, 1)),
    source_response_type: 'Texto libre',
    source_alert_logic: null,
    transformation_type: 'REMOVED',
    why_changed: 'REQUIRES HUMAN AUTHORING',
    confidence: 'HIGH',
    review_needed_by_rafa: 'YES',
  });
}

mappings.push({
  v2_question_id: 'REMOVED-E-PER-HdRP',
  v2_question: '',
  v2_domain: 'PROPÓSITO',
  v2_dimension: '',
  v2_variable_type: '',
  v2_phase: 'PERFIL Y PROPÓSITO',
  v2_instrumento: 'E-PER-HdRP',
  source_form: 'E-PER-HdRP',
  source_section: null,
  source_question_number: null,
    source_question: firstLine(cell('E-PER-HdRP-v2', 0, 0)),
  source_response_type: 'Contrato / manifiesto',
  source_alert_logic: null,
  transformation_type: 'REMOVED',
  why_changed: `${WHY.MIG02} ${WHY.MIG13}`,
  confidence: 'HIGH',
  review_needed_by_rafa: 'YES',
});

mappings.push({
  v2_question_id: 'REMOVED-F-RAD-001-SEC1',
  v2_question: '',
  v2_domain: 'CUERPO',
  v2_dimension: '',
  v2_variable_type: 'DATO',
  v2_phase: 'DIAGNÓSTICO PROFUNDO',
  v2_instrumento: 'F-RAD-001',
  source_form: 'F-RAD-001',
  source_section: 'SECCIÓN 1: CONDICIONES FÍSICAS BÁSICAS (AUTORREPORTE)',
  source_question_number: null,
    source_question: 'Edad. Sexo. Altura (cm). Peso actual (kg). % de grasa corporal (si lo conoce). Circunferencia cintura (opcional). Cambios recientes de peso (últimos 6–12 meses).',
  source_response_type: 'Dato',
  source_alert_logic: null,
  transformation_type: 'REMOVED',
  why_changed: WHY.MIG01,
  confidence: 'HIGH',
  review_needed_by_rafa: 'YES',
});

const ids = questions.map((row) => row.ID_Pregunta);
const affected = {
  'MIG-01': ['D-CUE-06', 'P-CUE-01', 'P-CUE-02', 'P-CUE-03', 'P-CUE-04', 'P-CUE-05', 'REMOVED-F-RAD-001-SEC1'],
  'MIG-02': ['REMOVED-E-PER-HdRP'],
  'MIG-03': ids.filter((id) => id.startsWith('P-PRO-') && Number(id.slice(6)) >= 21 && Number(id.slice(6)) <= 25),
  'MIG-04': ids.filter((id) => id.startsWith('P-PRO-') && Number(id.slice(6)) >= 26 && Number(id.slice(6)) <= 35),
  'MIG-05': [],
  'MIG-06': ids.filter((id) => id.startsWith('AUD-')),
  'MIG-07': ids.filter((id) => id.startsWith('AUD-')),
  'MIG-08': ids.filter((id) => /^(AUD-|D-)/.test(id) && !id.startsWith('D-CUE-0')),
  'MIG-09': ['D-CUE-07'],
  'MIG-10': ['D-CUE-01', 'D-CUE-02', 'D-CUE-03', 'D-CUE-04', 'D-CUE-05', 'P-CUE-01', 'P-CUE-02', 'P-CUE-03', 'P-CUE-04', 'P-CUE-05'],
  'MIG-11': ids.filter((id) => id.startsWith('P-PRO-') && Number(id.slice(6)) >= 36 && Number(id.slice(6)) <= 50),
  'MIG-12': ['P-PRO-071', 'P-PRO-072', 'P-PRO-073', 'P-PRO-074', 'P-PRO-075', 'P-PRO-076'],
  'MIG-13': ['REMOVED-E-PER-HdRP'],
  'MIG-14': [],
  'MIG-15': [],
};

const ledger = migRows.map((row, index) => ({
  id: `MIG-${String(index + 1).padStart(2, '0')}`,
  source_sheets: row.Hoja_origen,
  problem: row.Problema,
  cause: row.Causa,
  impact: row.Impacto,
  v2_resolution: row.Resolución_en_matriz,
  design_status: row.Estado,
  affected_v2_ids: affected[`MIG-${String(index + 1).padStart(2, '0')}`] ?? [],
}));

const dest = resolve(import.meta.dirname, '../definitions');
writeFileSync(resolve(dest, 'source-mapping-v2.0.json'), `${JSON.stringify({ mappings }, null, 2)}\n`);
writeFileSync(resolve(dest, 'migration-ledger-v2.0.json'), `${JSON.stringify({ decisions: ledger }, null, 2)}\n`);
console.log('mappings', mappings.length, 'decisions', ledger.length);
console.log('AUD-CUE-04', JSON.stringify(mappings.find((row) => row.v2_question_id === 'AUD-CUE-04'), null, 2));
