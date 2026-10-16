import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

/** Extracción anterior del Excel 260529 Formularios por paso. Inactiva para sesiones nuevas. El xlsx no se guarda. */
export const FORMULARIOS_X_PASO_REF = 'formularios-x-paso';
export const FORMULARIOS_X_PASO_SOURCE = '260529-FORMULARIOS-X-PASO';

type Opt = { order: number; textEs: string; value: string };
type Q = {
  order: number;
  type: 'SCALE_1_5' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'FREE_TEXT';
  textEs: string;
  contextEs?: string;
  scaleType?: 'BEHAVIORAL' | 'FREQUENCY';
  maxSelections?: number;
  options: Opt[];
};
type Mod = {
  slug: string;
  order: number;
  titleEs: string;
  introEs: string;
  formCode: string;
  questions: Q[];
};

function scale(text: string, low: string, high: string, context?: string): Q {
  return levels(text, [low, '2', '3', '4', high], context);
}

/** Five labels that belong to the question. Middles are not filled in later. */
function levels(text: string, labels: [string, string, string, string, string], context?: string): Q {
  return {
    order: 0,
    type: 'SCALE_1_5',
    scaleType: 'BEHAVIORAL',
    textEs: text,
    contextEs: context,
    options: labels.map((textEs, i) => ({
      order: i + 1,
      textEs,
      value: String(i + 1),
    })),
  };
}

function choice(text: string, options: string[], context?: string): Q {
  return {
    order: 0,
    type: 'SINGLE_CHOICE',
    textEs: text,
    contextEs: context,
    options: options.map((textEs, i) => ({ order: i + 1, textEs, value: textEs })),
  };
}

function text(q: string, context?: string): Q {
  return { order: 0, type: 'FREE_TEXT', textEs: q, contextEs: context, options: [] };
}

function numbered(items: Q[]): Q[] {
  return items.map((q, i) => ({ ...q, order: i + 1 }));
}

const AUDIT: Q[] = numbered([
  scale(
    '¿Mis decisiones diarias reflejan al hombre que digo que quiero llegar a ser?',
    'Casi nunca. La mayoría de mis decisiones contradicen lo que digo querer.',
    'Casi siempre. Mis decisiones reflejan claramente al hombre que quiero ser.',
    'Medir la integridad. Busca que la persona reconozca si vive en una fantasía o si sus acciones respaldan su discurso.',
  ),
  scale(
    'Cuando siento presión o una emoción intensa, ¿puedo reconocer lo que siento y elegir una respuesta coherente con mis principios?',
    'La emoción suele gobernar mis decisiones.',
    'Reconozco la emoción y elijo una respuesta coherente con mis principios.',
    'Evaluar el dominio propio. Identifica si la emoción gobierna las decisiones o si hay madurez para actuar bajo principios. El comentario del libro precisa gobierno emocional, no supresión.',
  ),
  scale(
    '¿Qué tan seguido uso excusas que suenan razonables, pero no lo son?',
    'Uso excusas con frecuencia y las justifico fácilmente.',
    'Rara vez uso excusas. Asumo responsabilidad directa.',
    'Detectar el nivel de autoengaño. Cuánta justificación se usa para proteger la comodidad.',
  ),
  scale(
    '¿Confío en mí mismo para terminar lo que empiezo?',
    'No confío. Suelo abandonar lo que inicio.',
    'Confío plenamente. Soy consistente y confiable conmigo mismo.',
    'Medir la autoconfianza operativa. Sin reputación con uno mismo es difícil sostener un cambio.',
  ),
  scale(
    '¿Qué historia me cuento a mí mismo cuando las cosas se ponen difíciles?',
    'Una historia de víctima o resignación.',
    'Una historia de responsabilidad, crecimiento y dominio personal.',
    'Identificar el locus de control. Si la persona se ve como víctima de las circunstancias o como quien construye su destino.',
  ),
  scale(
    '¿Qué tan seguido realiza entrenamiento físico?',
    'No entreno.',
    '5 o más días a la semana.',
    'Medir el respeto por el cuidado del cuerpo. El ejercicio es el hábito angular.',
  ),
  scale(
    '¿Qué tan constante he sido con la alimentación, no perfecto, sino honesto?',
    'Muy desordenado, sin estructura ni control.',
    'Muy consistente. Alimentación alineada al objetivo.',
    'Evaluar la capacidad de restricción. No se busca perfección, sino la honestidad sobre el placer inmediato.',
  ),
  scale(
    '¿Mi calidad de sueño está apoyando mi progreso o lo está saboteando silenciosamente?',
    'Sabotea claramente mi progreso.',
    'Apoya plenamente mi progreso y rendimiento.',
    'Identificar sabotaje biológico. El rendimiento depende de la recuperación, no solo del esfuerzo.',
  ),
  scale(
    '¿Con qué frecuencia utilizo comida, alcohol, sexo, compras, pantallas o entretenimiento para evitar emociones, conversaciones o responsabilidades que debería enfrentar?',
    'Muy frecuentemente.',
    'Casi nunca. Puedo reconocer lo que evito y enfrentarlo.',
    'Detectar mecanismos de escape. Qué tan presente está la dopamina barata para no mirar la realidad.',
  ),
  scale(
    '¿Sus hábitos le están haciendo avanzar con claridad o drenando su energía?',
    'La mayoría de mis hábitos drenan energía.',
    'Mis hábitos están claramente alineados con avanzar.',
    'Evaluar la consciencia energética. Qué hábitos están robando el futuro.',
  ),
  scale('¿Planifico mi semana o, en su mayoría, solo reacciono a ella?', 'Solo reacciono. No planifico.', 'Planifico con claridad y propósito.'),
  scale(
    '¿Mi entorno está configurado para apoyar la disciplina o la comodidad?',
    'Favorece claramente la comodidad.',
    'Diseñado intencionalmente para la disciplina.',
  ),
  scale(
    '¿Quiénes están a mi alrededor elevan mis estándares o los bajan silenciosamente?',
    'Mi entorno baja claramente mis estándares.',
    'Estoy rodeado de personas que elevan mis estándares.',
  ),
  scale('Cuando me desvío del rumbo, ¿qué tan rápido corrijo el curso?', 'No corrijo. Sigo desviándome.', 'Corrijo casi de inmediato.'),
  scale(
    'Si siguiera viviendo exactamente de esta manera durante un año más, ¿me sentiría orgulloso del lugar al que me lleva?',
    'No. Me decepcionaría profundamente.',
    'Muy orgulloso. Este camino refleja quién quiero ser.',
  ),
  levels(
    'Control de deuda: ¿en qué medida tus deudas actuales están bajo control y no comprometen tu paz mental o estabilidad básica?',
    [
      'Más de 50 por ciento, o con incumplimientos. No cubro cuotas o gastos básicos.',
      'Cerca de 40 a 50 por ciento.',
      'Cerca de 30 a 39 por ciento.',
      'Cerca de 10 a 29 por ciento, con pagos al día.',
      'De 0 a 10 por ciento, o solo deuda productiva al día.',
    ],
  ),
  levels(
    'Capacidad de ahorro o inversión: ¿qué tan constante es tu capacidad de separar una parte de tus ingresos?',
    [
      'Vivo al día. Cero ahorro.',
      'Ahorro ocasional e inestable.',
      'Ahorro inicial, irregular.',
      'Ahorro sistemático y protegido.',
      'Ahorro e inversión consolidados, por encima del 20 por ciento.',
    ],
  ),
  levels(
    'Planificación financiera: ¿cuentas con un presupuesto escrito o un plan estructurado?',
    [
      'Cero planificación.',
      'Conciencia básica, sin sistema.',
      'Presupuesto básico, con seguimiento irregular.',
      'Plan estructurado y seguimiento mensual.',
      'Plan integral y seguimiento sistemático.',
    ],
  ),
  levels(
    'Nivel de ingresos frente al propósito: ¿tus ingresos cubren necesidades, obligaciones y objetivos prioritarios?',
    [
      'Muy insuficientes.',
      'Insuficientes, con alta fragilidad.',
      'Suficientes para el presente, limitados para progresar.',
      'Adecuados y alineados con los objetivos.',
      'Superiores a las necesidades y metas actuales.',
    ],
  ),
  scale(
    'Dinámica de pareja: ¿qué tan sólida, alineada y nutritiva es tu relación de pareja actual, o tu preparación para tener una?',
    'Conflicto constante.',
    'Alineación en valores y apoyo mutuo.',
    undefined,
  ),
  scale(
    'Relación familiar: ¿qué tan sano es el vínculo con tu núcleo familiar y qué tan presente estás?',
    'Distante o conflictivo.',
    'Presencia activa, respeto y armonía.',
  ),
  scale(
    'Círculo de influencia: ¿qué tanto te impulsan tus relaciones sociales hacia la excelencia?',
    'Relaciones que me restan.',
    'Un círculo que me exige y me apoya.',
  ),
  scale(
    'Entorno laboral o social: ¿qué tan respetado y funcional es tu liderazgo?',
    'Invisible o en conflicto.',
    'Referente de orden y liderazgo.',
  ),
]);

const BROOKS: Q[] = numbered([
  scale('Durante las últimas dos semanas, he tenido momentos frecuentes de disfrute en los que estuve presente.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Se trata del disfrute en el que estuviste presente, no de la distracción o el consumo automático.'),
  scale('Las actividades con las que descanso suelen dejarme renovado, no vacío.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Detectar formas de placer que funcionan como anestesia, frente a actividades que restauran.'),
  scale('Puedo reconocer el progreso que ya alcancé, sin sentir que nada es suficiente.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Medir la capacidad de registrar logros y experimentar suficiencia.'),
  scale('Mis deseos de más dinero, estatus o reconocimiento están gobernados por mis valores.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Identificar insatisfacción crónica, comparación y dependencia del logro externo.'),
  scale('Puedo explicar con claridad por qué mi vida y mis esfuerzos cotidianos merecen la pena.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Evaluar el sentido presente, no solo la búsqueda abstracta de propósito.'),
  scale('Sé quiénes o qué causa se benefician concretamente de la vida que estoy construyendo.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Conectar el propósito con servicio y beneficiarios reales.'),
  scale('Mantengo una relación activa con una fe, una filosofía o una verdad que ordena mis decisiones.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Evaluar trascendencia sin exigir una afiliación religiosa. Fe, aquí, es conexión con algo superior a las preocupaciones inmediatas.'),
  scale('Mis vínculos familiares fundamentales reciben tiempo, presencia y cuidado reales.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Medir conducta relacional, no solo la valoración declarada de la familia.'),
  scale('Tengo al menos una amistad basada en confianza, no en utilidad.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Distinguir amistad profunda de relaciones sostenidas por utilidad.'),
  scale('Mi trabajo me permite progresar y beneficiar a otras personas, aunque no sea el ideal.', 'Totalmente falso, o casi nunca.', 'Totalmente verdadero, o casi siempre.', 'Evaluar trabajo con logro y servicio, sin confundirlo con prestigio, salario o el trabajo soñado.'),
]);

const RAD2: Q[] = numbered([
  scale('Mi pareja o núcleo íntimo comprende y apoya mis ambiciones de crecimiento.', 'Nunca ocurre.', 'Ocurre siempre.'),
  scale('Existe un espacio seguro para expresar vulnerabilidad sin perder autoridad.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.'),
  scale('La carga emocional y las responsabilidades diarias se perciben equilibradas.', 'Nunca ocurre.', 'Ocurre siempre.'),
  scale('He establecido límites con mi familia de origen. Sus expectativas no gobiernan mis decisiones.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.'),
  scale('Mis interacciones familiares me aportan paz, no me drenan.', 'Nunca ocurre.', 'Ocurre siempre.'),
  scale('Me siento libre de la obligación de resolver la vida de mi familia a costa de mi progreso.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.'),
  scale('Las personas con las que más interactúo en mi tiempo libre elevan mis estándares.', 'Nunca ocurre.', 'Ocurre siempre.'),
  scale('Puedo ser auténtico con mis amigos, sin una máscara de éxito.', 'Nunca ocurre.', 'Ocurre siempre.'),
  scale('Mi entorno social está libre de queja, chisme o vicios que me desvíen.', 'Nunca ocurre.', 'Ocurre siempre.'),
  scale('Mantengo respeto y colaboración con superiores, pares o subordinados.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.'),
  scale('Cuento con una red profesional que confía en mi criterio.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.'),
  scale('Gestiono los conflictos laborales sin tomarlos como ataques personales.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.'),
]);

const RAD3: Q[] = numbered([
  scale('Los ingresos estables cubren mis costos y me dejan un margen.', 'Nunca.', 'Siempre.'),
  scale('Vivo libre de la sensación de asfixia financiera.', 'Nunca.', 'Siempre.'),
  scale('Mis ingresos provienen de estructuras predecibles, no de ansiedad de supervivencia.', 'Nunca.', 'Siempre.'),
  scale('Ahorro de forma sistemática al menos el 10 por ciento antes de otros gastos.', 'Nunca.', 'Siempre.'),
  scale('Cuento con un fondo de emergencia líquido de varios meses de costos.', 'Sin fondo.', 'Cubre al menos 3 a 6 meses.'),
  scale('Mis compras no son impulsivas ni un analgésico emocional.', 'No controladas.', 'Siempre controladas.'),
  scale('Coloco excedentes en vehículos de inversión para que el dinero trabaje.', 'Nunca.', 'Siempre.'),
  scale('Dedico tiempo mensual a educarme financieramente.', 'Nunca.', 'Siempre.'),
  scale('Mis inversiones están diversificadas.', 'Nunca.', 'Siempre.'),
  scale('Estoy libre de deudas de consumo de alto interés.', 'Nunca.', 'Siempre.'),
  scale('Cobro el valor real de mi trabajo sin bajar el precio por miedo.', 'Nunca.', 'Siempre.'),
  scale('Puedo pensar en crear patrimonio, no solo en el miedo a perderlo.', 'Nunca.', 'Siempre.'),
  text('¿Qué deuda o compromiso financiero necesitas sacar de raíz? Indica el monto aproximado y de dónde viene.'),
  text('Si tuvieras el capital o el tiempo resuelto hoy, ¿hacia dónde dirigirías el crecimiento? Cuéntalo con el detalle que puedas.'),
  text('¿Qué ingreso mensual y qué portafolio querrías tener armados en 24 meses?'),
]);

const RAD1: Q[] = numbered([
  text(
    'Edad, altura y peso.',
    '@medidas:edad:Edad:años:14:100|altura:Altura:cm:120:230|peso:Peso:kg:35:250',
  ),
  choice('¿Tienes alguna enfermedad diagnosticada actualmente?', ['No', 'Sí']),
  text('¿Cuál?', '@sigue:2:Sí'),
  choice('¿Realizas actividad física actualmente?', ['No', 'Sí, ocasional', 'Sí']),
  text('Horas promedio de sueño por noche.', '@horas:0:12'),
  choice('¿Cómo te sientes con tu cuerpo hoy?', ['Excelente', 'Bien', 'Regular', 'Mal']),
  choice('Arquitectura física que representa tu meta.', ['Mantenimiento', 'Atlético', 'Musculado', 'Hipertrofiado']),
]);

const PERFIL: Q[] = numbered([
  text(
    'Tu nombre y lo que quieres hacer con tu linaje.',
    '@lineas:significado:Qué significa tu nombre|quien:Quién lo eligió, y por qué|herencia:Qué quieres conservar o romper',
  ),
  choice('Si tu nombre fuera un arquetipo, ¿cuál se acerca más?', ['El Rey', 'El Guerrero', 'El Mago', 'El Amante'], 'Elige el que más se acerca.'),
  text('Resume tu visión en una frase: si todo fuera posible, ¿cómo te gustaría ser?'),
  text(
    'Nombra tres valores que seguirías defendiendo aunque no te dieran dinero ni reconocimiento, y por qué.',
    '@lineas:v1:Primer valor|v2:Segundo valor|v3:Tercer valor',
  ),
  text(
    'Define un estándar semanal para cada fuente.',
    '@lineas:trascendencia:Trascendencia|familia:Familia|amistad:Amistad|trabajo:Trabajo',
  ),
  text('Describe la distancia entre quien dices ser y lo que haces cuando nadie te observa.'),
  text('¿Qué patrón repites y todavía no quieres mirar? Relaciones, trabajo o dinero.'),
  text(
    'Cuatro actividades, una por lente.',
    '@lineas:vivo:Te hace sentir vivo|bueno:Eres bueno en esto|necesita:El mundo lo necesita|pagan:Podrían pagarte por esto',
  ),
  text('Redacta tu sello en una frase: la huella que quieres dejar.'),
  scale('Disfruto de las ideas abstractas y las teorías complejas.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:apertura'),
  scale('Prefiero la rutina y las actividades familiares sobre lo desconocido.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:apertura:inversa'),
  scale('Tengo una imaginación activa y aprecio el arte o la belleza.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:apertura'),
  scale('Soy una persona organizada y orientada al detalle.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:responsabilidad'),
  scale('Tiendo a postergar mis deberes o a actuar de forma improvisada.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:responsabilidad:inversa'),
  scale('Me esfuerzo por cumplir mis metas con autodisciplina.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:responsabilidad'),
  scale('Me siento con energía cuando interactúo con mucha gente.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:extraversion'),
  scale('Prefiero pasar tiempo a solas o en ambientes tranquilos.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:extraversion:inversa'),
  scale('Suelo tomar la iniciativa en las conversaciones y en los grupos.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:extraversion'),
  scale('Me interesan los sentimientos y las inquietudes de los demás.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:amabilidad'),
  scale('Suelo dudar de las intenciones ajenas o prefiero competir.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:amabilidad:inversa'),
  scale('Busco la armonía y evito los conflictos innecesarios.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:amabilidad'),
  scale('Me estreso o me preocupo con facilidad ante los imprevistos.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:neuroticismo'),
  scale('Mantengo la calma bajo presión casi siempre.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:neuroticismo:inversa'),
  scale('Tengo cambios de humor frecuentes o inseguridad constante.', 'Totalmente en desacuerdo.', 'Totalmente de acuerdo.', '@ocean:neuroticismo'),
]);

function mod(slug: string, order: number, title: string, intro: string, formCode: string, questions: Q[]): Mod {
  return { slug, order, titleEs: title, introEs: intro, formCode, questions };
}

export const FORMULARIOS_X_PASO_MODULES: Mod[] = [
  mod('e-aud-s1', 1, 'Mentalidad e identidad', 'El objetivo aquí es medir la brecha entre el yo ideal y el yo real.', 'E-AUD-001', AUDIT.slice(0, 5)),
  mod('e-aud-s2', 2, 'Hábitos y acciones', 'El objetivo es evaluar la infraestructura biológica y operativa.', 'E-AUD-001', AUDIT.slice(5, 10)),
  mod('e-aud-s3', 3, 'Toma de decisiones y entorno', 'El objetivo es medir el diseño de vida y la capacidad de corrección.', 'E-AUD-001', AUDIT.slice(10, 15)),
  mod('e-aud-s4', 4, 'Soberanía financiera', 'Medir la estabilidad y la capacidad de provisión, base de la seguridad.', 'E-AUD-001', AUDIT.slice(15, 19)),
  mod('e-aud-s5', 5, 'Calidad de relaciones', 'Medir el entorno de apoyo y el liderazgo relacional: esposo, padre, líder.', 'E-AUD-001', AUDIT.slice(19, 23)),
  mod('e-aud-s6', 6, 'Desarrollo y sentido', 'Mira el disfrute, la satisfacción y el sentido de las últimas dos semanas, con el marco de Arthur Brooks. Cada frase va de totalmente falso a totalmente verdadero. Esta sección se lee aparte de la auditoría principal.', 'E-AUD-S6', BROOKS),
  mod('f-rad-001', 7, 'Radiografía física', 'Medidas, salud, movimiento y sueño, en tus propias palabras y números.', 'F-RAD-001', RAD1),
  mod('f-rad-002', 8, 'Radiografía relacional', 'Doce frases sobre pareja, familia, amigos y trabajo.', 'F-RAD-002', RAD2),
  mod('f-rad-003', 9, 'Radiografía financiera', 'Doce frases sobre ingresos, ahorro, inversión y deuda, y tres textos de proyección.', 'F-RAD-003', RAD3),
  mod('e-per-000', 10, 'Perfil del cliente', 'Lo que escribes queda guardado tal como lo dices.', 'E-PER-000', PERFIL),
];

export function formulariosXPasoSha(): string {
  return createHash('sha256').update(JSON.stringify(FORMULARIOS_X_PASO_MODULES)).digest('hex');
}

async function syncFormulariosXPasoTexts(prisma: PrismaClient, versionId: string): Promise<void> {
  for (const mod of FORMULARIOS_X_PASO_MODULES) {
    const dbModule = await prisma.diagnosticModule.findFirst({
      where: { versionId, slug: mod.slug },
    });
    if (!dbModule) continue;
    await prisma.diagnosticModule.update({
      where: { id: dbModule.id },
      data: {
        titleEs: mod.titleEs,
        introEs: mod.introEs,
        outroTemplateEs: 'Así queda esta sección.',
      },
    });
    const questions = await prisma.question.findMany({
      where: { moduleId: dbModule.id },
      orderBy: { order: 'asc' },
      include: { options: true },
    });
    for (const source of mod.questions) {
      let row = questions.find((question) => question.order === source.order);
      if (!row) {
        const created = await prisma.question.create({
          data: {
            moduleId: dbModule.id,
            order: source.order,
            type: source.type,
            textEs: source.textEs,
            contextEs: source.contextEs ?? null,
            scaleType: source.scaleType ?? null,
            maxSelections: source.maxSelections ?? null,
          },
        });
        if (source.options.length) {
          await prisma.answerOption.createMany({
            data: source.options.map((opt) => ({
              questionId: created.id,
              order: opt.order,
              textEs: opt.textEs,
              value: opt.value,
              scoreDeltas: {},
              flags: [],
              tags: [],
            })),
          });
        }
        continue;
      }
      await prisma.question.update({
        where: { id: row.id },
        data: {
          contextEs: source.contextEs ?? null,
          textEs: source.textEs,
          type: source.type,
          scaleType: source.scaleType ?? null,
        },
      });
      for (const opt of source.options) {
        const stored = row.options.find((item) => item.order === opt.order);
        if (!stored) continue;
        await prisma.answerOption.update({
          where: { id: stored.id },
          data: { textEs: opt.textEs, value: opt.value },
        });
      }
    }
  }
}

export async function ensureFormulariosXPaso(prisma: PrismaClient): Promise<void> {
  const sha = formulariosXPasoSha();
  const existing = await prisma.diagnosticVersion.findUnique({ where: { version: 'formularios-x-paso' } });
  if (existing) {
    if (!existing.isActive) {
      await prisma.diagnosticVersion.updateMany({ data: { isActive: false } });
      await prisma.diagnosticVersion.update({ where: { id: existing.id }, data: { isActive: true } });
    }
    if (existing.definitionSha256 !== sha) {
      await syncFormulariosXPasoTexts(prisma, existing.id);
      await prisma.diagnosticVersion.update({
        where: { id: existing.id },
        data: { definitionSha256: sha },
      });
    }
    return;
  }

  await prisma.diagnosticVersion.updateMany({ data: { isActive: false } });
  const version = await prisma.diagnosticVersion.create({
    data: {
      version: 'formularios-x-paso',
      isActive: true,
      publishedAt: new Date(),
      definitionRef: FORMULARIOS_X_PASO_REF,
      definitionSha256: sha,
    },
  });

  for (const mod of FORMULARIOS_X_PASO_MODULES) {
    const dbModule = await prisma.diagnosticModule.create({
      data: {
        versionId: version.id,
        phase: 'FASE1',
        dimensionKey: mod.formCode,
        slug: mod.slug,
        order: mod.order,
        titleEs: mod.titleEs,
        introEs: mod.introEs,
        outroTemplateEs: 'Así queda esta sección.',
        iconKey: 'columns',
        estimatedMinutes: 8,
        isConditional: false,
      },
    });
    for (const q of mod.questions) {
      const dbQuestion = await prisma.question.create({
        data: {
          moduleId: dbModule.id,
          order: q.order,
          type: q.type,
          textEs: q.textEs,
          contextEs: q.contextEs ?? null,
          scaleType: q.scaleType ?? null,
          maxSelections: q.maxSelections ?? null,
        },
      });
      if (q.options.length) {
        await prisma.answerOption.createMany({
          data: q.options.map((opt) => ({
            questionId: dbQuestion.id,
            order: opt.order,
            textEs: opt.textEs,
            value: opt.value,
            scoreDeltas: {},
            flags: [],
            tags: [],
          })),
        });
      }
    }
  }
}
