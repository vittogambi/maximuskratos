/** E-PER-000 rows 160 to 181. Sí = 2, Más o menos = 1, No = 0. */

type Band = (score: number) => string;

const absent = (low: string, mid: string, high: string): Band => (score) => {
  if (score <= 1) return low;
  if (score <= 4) return mid;
  return high;
};

type Ambit = { label: string; refs: string[]; read: Band };
type Family = { label: string; read: Band; ambits: Ambit[]; integration?: boolean };

const A: Family = {
  label: 'A. Patrones repetitivos: «Miedo al éxito y la exposición»',
  read: (score) => score <= 3
    ? 'Ausente: comportamiento libre de bloqueos históricos.'
    : score <= 12
      ? 'Sombra latente: existen conductas semiautomáticas de autosabotaje.'
      : 'Dominante: ciclo crítico y activo de boicot financiero o laboral.',
  ambits: [
    {
      label: 'Relaciones interpersonales',
      refs: ['formulario-v1:E-PER-000!R94', 'formulario-v1:E-PER-000!R95', 'formulario-v1:E-PER-000!R96'],
      read: absent(
        'Ausente: vínculos saludables.',
        'Latente: tendencia a ceder terreno para evitar conflictos.',
        'Dominante: patrón crítico de codependencia o aislamiento destructivo.',
      ),
    },
    {
      label: 'Rendimiento laboral',
      refs: ['formulario-v1:E-PER-000!R98', 'formulario-v1:E-PER-000!R99', 'formulario-v1:E-PER-000!R100'],
      read: absent(
        'Ausente: gestión sana de energía.',
        'Latente: procrastinación intermitente o sobreesfuerzo casual.',
        'Dominante: ciclo crítico de burnout o autosabotaje de metas.',
      ),
    },
    {
      label: 'Gestión financiera',
      refs: ['formulario-v1:E-PER-000!R102', 'formulario-v1:E-PER-000!R103', 'formulario-v1:E-PER-000!R104'],
      read: absent(
        'Ausente: relación fluida con el dinero.',
        'Latente: incomodidad sutil al cobrar o valorar el trabajo.',
        'Dominante: techo financiero rígido y mentalidad de escasez extrema.',
      ),
    },
  ],
};

const softFamily = (low: string, mid: string, high: string): Band => (score) => {
  if (score <= 4) return low;
  if (score <= 11) return mid;
  return high;
};

const B: Family = {
  label: 'B. Emociones rechazadas: «Miedo al rechazo y la vulnerabilidad»',
  read: softFamily(
    'Sin sombra aparente en esta área.',
    'Sombra latente: máscara de coraza e hiperindependencia.',
    'Sombra dominante: represión emocional crítica por miedo a la vulnerabilidad.',
  ),
  ambits: [
    {
      label: 'Control del entorno',
      refs: ['formulario-v1:E-PER-000!R107', 'formulario-v1:E-PER-000!R108', 'formulario-v1:E-PER-000!R109'],
      read: absent('Ausente: flexibilidad ante imprevistos.', 'Latente: intolerancia menor a los cambios de planes.', 'Dominante: neurosis de control y rigidez mental absoluta.'),
    },
    {
      label: 'Autoimagen',
      refs: ['formulario-v1:E-PER-000!R111', 'formulario-v1:E-PER-000!R112', 'formulario-v1:E-PER-000!R113'],
      read: absent('Ausente: autoestima sana y estable.', 'Latente: necesidad sutil de validación externa.', 'Dominante: síndrome del impostor o complejo de inferioridad.'),
    },
    {
      label: 'Vulnerabilidad',
      refs: ['formulario-v1:E-PER-000!R115', 'formulario-v1:E-PER-000!R116', 'formulario-v1:E-PER-000!R117'],
      read: absent('Ausente: apertura emocional equilibrada.', 'Latente: dificultad menor para expresar debilidad.', 'Dominante: máscara de invulnerabilidad. Incapacidad de pedir ayuda.'),
    },
  ],
};

const C: Family = {
  label: 'C. Proyección: «Límites reprimidos y control»',
  read: softFamily(
    'Sin sombra aparente en esta área.',
    'Sombra latente: juicio restrictivo hacia el entorno.',
    'Sombra dominante: proyección activa de sus propios límites negados en otros.',
  ),
  ambits: [
    {
      label: 'Juicios recurrentes',
      refs: ['formulario-v1:E-PER-000!R120', 'formulario-v1:E-PER-000!R121', 'formulario-v1:E-PER-000!R122'],
      read: absent('Ausente: alta tolerancia a la diferencia.', 'Latente: crítica pasiva hacia conductas ajenas.', 'Dominante: resentimiento y proyección de sus propios límites en otros.'),
    },
    {
      label: 'Autoridad',
      refs: ['formulario-v1:E-PER-000!R124', 'formulario-v1:E-PER-000!R125', 'formulario-v1:E-PER-000!R126'],
      read: absent('Ausente: relación madura con el liderazgo.', 'Latente: desconfianza inicial ante normativas corporativas.', 'Dominante: conflicto de autoridad crónico y rebelión infantil.'),
    },
    {
      label: 'Idolatría',
      refs: ['formulario-v1:E-PER-000!R128', 'formulario-v1:E-PER-000!R129', 'formulario-v1:E-PER-000!R130'],
      read: absent('Ausente: reconocimiento del propio valor.', 'Latente: tendencia a dudar frente a perfiles con más títulos.', 'Dominante: renuncia total al poder personal. Se esconde tras otros.'),
    },
  ],
};

const D: Family = {
  label: 'D. Excusas y autoengaño: «Evasión y la falta de responsabilidad»',
  read: softFamily(
    'Sin sombra aparente en esta área.',
    'Sombra latente: parálisis por análisis y postergación.',
    'Sombra dominante: evasión absoluta de la responsabilidad del cambio.',
  ),
  ambits: [
    {
      label: 'Gestión del tiempo',
      refs: ['formulario-v1:E-PER-000!R133', 'formulario-v1:E-PER-000!R134', 'formulario-v1:E-PER-000!R135'],
      read: absent('Ausente: enfoque y productividad real.', 'Latente: agenda ajustada usada para posponer lo estratégico.', 'Dominante: procrastinación defensiva, con la agenda llena de tareas inútiles.'),
    },
    {
      label: 'Recursos',
      refs: ['formulario-v1:E-PER-000!R137', 'formulario-v1:E-PER-000!R138', 'formulario-v1:E-PER-000!R139'],
      read: absent('Ausente: mentalidad pragmática de arranque.', 'Latente: idea de que requiere mejores herramientas antes de actuar.', 'Dominante: parálisis por acreditación infinita o perfeccionismo.'),
    },
    {
      label: 'Factores externos',
      refs: ['formulario-v1:E-PER-000!R141', 'formulario-v1:E-PER-000!R142', 'formulario-v1:E-PER-000!R143'],
      read: absent('Ausente: locus de control interno sólido.', 'Latente: queja recurrente sobre la situación del mercado local.', 'Dominante: evasión absoluta. Culpa al entorno de su falta de éxito.'),
    },
  ],
};

const integrate = (low: string, mid: string, high: string): Band => (score) => {
  if (score <= 1) return low;
  if (score <= 4) return mid;
  return high;
};

const E: Family = {
  label: 'E. Recursos de integración',
  integration: true,
  read: (score) => score <= 5
    ? 'Nivel de integración bajo. Faltan recursos conscientes activos.'
    : score <= 12
      ? 'Nivel de integración medio. Reconoce sus recursos, falta consistencia.'
      : 'Nivel de integración alto. Alta autoconsciencia, listo para ejecutar su ikigai.',
  ambits: [
    {
      label: 'Límites personales',
      refs: ['formulario-v1:E-PER-000!R146', 'formulario-v1:E-PER-000!R147', 'formulario-v1:E-PER-000!R148'],
      read: integrate('Baja: cuesta decir que no.', 'Media: pone límites, pero con culpa o timidez.', 'Alta: asertividad sólida y protección consciente de su tiempo.'),
    },
    {
      label: 'Reclamar talentos',
      refs: ['formulario-v1:E-PER-000!R150', 'formulario-v1:E-PER-000!R151', 'formulario-v1:E-PER-000!R152'],
      read: integrate('Baja: desconexión de sus capacidades.', 'Media: reconoce su valor, pero le cuesta cobrarlo.', 'Alta: responsabilidad absoluta de su éxito y ambición sana.'),
    },
    {
      label: 'Gestión del error',
      refs: ['formulario-v1:E-PER-000!R154', 'formulario-v1:E-PER-000!R155', 'formulario-v1:E-PER-000!R156'],
      read: integrate('Baja: autocastigo severo ante la falla.', 'Media: tolera el error en privado, pero le teme en público.', 'Alta: vulnerabilidad constructiva y compasión ante el fallo.'),
    },
  ],
};

export const SHADOW_FAMILIES = [A, B, C, D, E];

const REF_FAMILY = new Map<string, Family>();
for (const family of SHADOW_FAMILIES) {
  for (const ambit of family.ambits) {
    for (const ref of ambit.refs) REF_FAMILY.set(ref, family);
  }
}

export function shadowPoints(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null;
  const text = value.trim().toLowerCase();
  if (text === '2' || text === 'sí' || text === 'si') return 2;
  if (text === '1' || text.includes('más o menos') || text.includes('mas o menos')) return 1;
  if (text === '0' || text === 'no') return 0;
  const amount = Number(text);
  return Number.isFinite(amount) ? amount : null;
}

function sumOf(scores: Record<string, number | null | undefined>, refs: string[]): number | null {
  const present = refs.map((ref) => scores[ref]).filter((score): score is number => score != null);
  if (present.length === 0) return null;
  return present.reduce((total, score) => total + score, 0);
}

function line(label: string, score: number | null, read: Band): { label: string; detail: string } {
  return { label, detail: score == null ? 'sin desarrollo' : read(score) };
}

/** Misma lógica que `shadowOverallMember` en apps/api/src/instrumentos/shadow-diagnostic.ts */
export function shadowOverall(shadow: number | null, integration: number | null): string {
  if (shadow == null && integration == null) return 'Sin desarrollo';
  const density = shadow ?? 0;
  const resources = integration ?? 0;
  if (density + resources === 0) return 'Sin desarrollo';
  if (density + resources <= 12) {
    return 'Perfil libre y enfocado. Operas desde la transparencia y el liderazgo propio, con terreno libre de bloqueos inconscientes para diseñar y ejecutar tu ikigai.';
  }
  if (density >= 13 && resources >= 14) {
    return 'Integración avanzada. Hay focos de sombra activa, y también madurez y herramientas conscientes para usarlos como palanca.';
  }
  if (density >= 36 && resources <= 6) {
    return 'Alerta de autosabotaje. Hay mucha sombra activa y muy pocos recursos de integración. Conviene desactivar esos bloqueos antes del plan.';
  }
  return 'Bloqueo moderado. Hay sombras latentes en áreas concretas, con recursos medios. Conviene un acompañamiento para aclarar el propósito.';
}

/** Resultado de una familia, solo cuando su última pregunta ya fue respondida. */
export function shadowClosedReading(
  sourceRef: string | null | undefined,
  scores: Record<string, number | null | undefined>,
): { label: string; detail: string }[] {
  if (!sourceRef) return [];
  const family = REF_FAMILY.get(sourceRef);
  const closing = family?.ambits.at(-1)?.refs.at(-1);
  if (!family || sourceRef !== closing) return [];
  return shadowSectionReading(sourceRef, scores);
}

export function shadowSectionReading(
  sourceRef: string | null | undefined,
  scores: Record<string, number | null | undefined>,
): { label: string; detail: string }[] {
  if (!sourceRef) return [];
  const family = REF_FAMILY.get(sourceRef);
  if (!family) return [];
  const rows = [
    line(family.label, sumOf(scores, family.ambits.flatMap((ambit) => ambit.refs)), family.read),
    ...family.ambits.map((ambit) => line(ambit.label, sumOf(scores, ambit.refs), ambit.read)),
  ];
  if (sourceRef !== 'formulario-v1:E-PER-000!R156') return rows;
  const shadow = [A, B, C, D].map((item) => sumOf(scores, item.ambits.flatMap((ambit) => ambit.refs)));
  const integration = sumOf(scores, E.ambits.flatMap((ambit) => ambit.refs));
  const shadowTotal = shadow.every((score) => score == null) ? null : shadow.reduce((total, score) => (total ?? 0) + (score ?? 0), 0);
  rows.push({ label: 'Diagnóstico sombra', detail: shadowOverall(shadowTotal, integration) });
  return rows;
}
