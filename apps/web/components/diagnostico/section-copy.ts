const NAME = [
  'formulario-v1:E-PER-000!R7',
  'formulario-v1:E-PER-000!R8',
  'formulario-v1:E-PER-000!R9',
  'formulario-v1:E-PER-000!R10',
];

const SURNAME = [
  'formulario-v1:E-PER-000!R12',
  'formulario-v1:E-PER-000!R13',
  'formulario-v1:E-PER-000!R14',
  'formulario-v1:E-PER-000!R15',
];

const LINE = [
  'formulario-v1:E-PER-000!R17',
  'formulario-v1:E-PER-000!R18',
  'formulario-v1:E-PER-000!R19',
  'formulario-v1:E-PER-000!R20',
  'formulario-v1:E-PER-000!R22',
  'formulario-v1:E-PER-000!R23',
];

const ORIGIN_HEADING = new Map<string, string>([
  ...NAME.map((ref) => [ref, 'El nombre: «La primera palabra que nos definió»'] as const),
  ...SURNAME.map((ref) => [ref, 'El apellido: «La sangre que te precede»'] as const),
  ...LINE.map((ref) => [ref, 'Línea de continuidad'] as const),
]);

export function moduleDisplayTitle(slug: string | null | undefined, title: string | null | undefined): string | null {
  if (slug === 'e-per-dificultades') return 'Dificultades';
  return title ?? null;
}

export function shadowHeading(heading: string | null | undefined): { family: string; ambit: string } | null {
  if (!heading) return null;
  const marker = '. Ámbito: ';
  const at = heading.indexOf(marker);
  if (at < 0) return null;
  return { family: heading.slice(0, at), ambit: heading.slice(at + marker.length) };
}

const MODULE_INTRO: Record<string, string[]> = {
  'e-per-vision': [
    'Lo que me gustaría llegar a ser',
    'Tu visión es la imagen de la persona que deseas llegar a ser: el yo ideal. Defina su dirección vital y el tipo de hombre que quiere encarnar en el futuro.',
    'El Timón evoca el sentido de orientación, de cambio de curso.',
  ],
  'e-per-valores': [
    'Los principios que me guían',
    'Los valores son los pilares que guían nuestras decisiones. Identifíquelos para actuar con coherencia frente a su visión.',
    'Los Pilares evocan el sentido de estructura soportante de todo lo que hacemos.',
  ],
  'e-per-estandares': [
    'La identidad se construye sobre la base de los estándares, no de la motivación.',
    'Los estándares son sus reglas personales. Traducen sus valores en acciones concretas y hábitos diarios.',
    'La Corona de Laurel evoca la excelencia en todo lo que hacemos.',
  ],
  'e-per-dificultades': [
    'Lo que niegas, te somete. Lo que aceptas, te transforma (Carl Jung)',
    'Identificar patrones específicos de conducta, pensamiento y emoción que evita reconocer en su vida cotidiana, revelando la forma concreta que adopta su Sombra (autosabotaje, proyección, victimismo, evitación, agresión pasiva, control, dependencia, etc.), con el fin de recuperar energía psíquica y reducir interferencias en la construcción de identidad y hábitos.',
    'La Sombra evoca eso que está oculto dentro de nosotros, y por ende, parte integral de lo que somos.',
  ],
  'e-per-ikigai': [
    'Mi razón de ser',
    'Identificar el eje de su propósito vital, detectando desbalances entre deseo, capacidad, contribución y sustento, para orientar su desarrollo personal, profesional y físico bajo una lógica coherente y sostenible. El Ikigai no se calcula. Solo se revela al cruzar actividades.',
    'El Nudo entrelazado evoca la relación entre diferentes ideas en un total coherente.',
  ],
  'e-per-personalidad': [
    'El objetivo de los cinco grandes factores de la personalidad (Big Five o modelo OCEAN) es obtener una radiografía para alinear su propósito con sus tendencias naturales, potenciar sus fortalezas y anticipar sus autosabotajes.',
    'El Humano evoca la materia prima, la esencia de lo que somos, la base a transformar.',
  ],
  'e-per-identidad': [
    'Diga el débil, fuerte soy (Joel 3:10)',
    'Definir, clarificar y tensionar la identidad actual del cliente versus la identidad aspiracional que declara querer encarnar, identificando las brechas críticas entre discurso, hábitos y estándares personales, con el fin de establecer una base sólida para la transformación personal sostenida en el tiempo.',
    'El Cubo 3D evoca la coherencia entre nuestras dimensiones, lo que pensamos vs lo que hacemos.',
  ],
};

export function questionSectionHeading(sourceRef: string | null | undefined): string | null {
  if (!sourceRef) return null;
  return ORIGIN_HEADING.get(sourceRef) ?? null;
}

export function moduleSectionIntro(slug: string | null | undefined): string[] | null {
  if (!slug) return null;
  return MODULE_INTRO[slug] ?? null;
}
