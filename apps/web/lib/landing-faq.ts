export const LANDING_FAQ_ITEMS = [
  {
    id: 'coaching-vs-sistema',
    question: '¿Maximus Kratos es coaching o un sistema distinto?',
    answer:
      'Maximus Kratos no es coaching motivacional. Es una metodología de Arquitectura del Sentido que alinea propósito (Espíritu), estructura (Mente) y manifestación física (Cuerpo) en un sistema integral de transformación masculina.',
  },
  {
    id: 'para-quien',
    question: '¿Para quién está pensado Maximus Kratos?',
    answer:
      'Está pensado para hombres que quieren salir de la fragmentación, construir orden, proteger su legado y avanzar con un marco claro. Si buscas disciplina y propósito, no frases vacías, este sistema es para ti.',
  },
  {
    id: 'como-funciona',
    question: '¿Cómo funciona el proceso de Maximus Kratos?',
    answer:
      'El proceso incluye auditoría inicial, estabilización, perfil e identidad, base física, entorno y activación de planes. El marco completo dura 12 meses con seguimiento semanal e hitos a los 40 días, 3, 6 y 12 meses.',
  },
  {
    id: 'primer-paso',
    question: '¿Por dónde empiezo en Maximus Kratos?',
    answer:
      'Empiezas con la auditoría inicial para ver tu realidad sin autoengaño. Es el punto de entrada al sistema y el primer paso para recibir tu radiografía personal.',
  },
  {
    id: 'entregables',
    question: '¿Qué recibo al avanzar en el programa?',
    answer:
      'Recibes radiografía personal, índice de alineación y mapa de brechas. Después obtienes declaración de propósito, Plano de Vida y hoja de ruta a 30, 90 y 365 días.',
  },
  {
    id: 'acompanamiento',
    question: '¿Voy solo o hay acompañamiento en Maximus Kratos?',
    answer:
      'No caminas solo. Maximus Kratos es una fraternidad de constructores con acompañamiento progresivo. Donde la voluntad flaquea, la estructura sostiene.',
  },
] as const;

export type LandingFaqItem = (typeof LANDING_FAQ_ITEMS)[number];

export function landingFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
