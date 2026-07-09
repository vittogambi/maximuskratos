export const LANDING_FAQ_ITEMS = [
  {
    id: 'solo-entrenamiento',
    question: '¿MK es solo entrenamiento físico?',
    answer:
      'No. El entrenamiento físico es una base importante, pero MK integra cuerpo, mente y espíritu.',
  },
  {
    id: 'necesito-crisis',
    question: '¿Necesito estar en crisis para entrar?',
    answer:
      'No. MK sirve tanto para hombres que necesitan reconstruirse como para hombres funcionales que buscan mayor propósito, orden e impacto.',
  },
  {
    id: 'es-religioso',
    question: '¿MK es religioso?',
    answer:
      'MK trabaja con propósito, virtud, responsabilidad, servicio y trascendencia. No exige pertenecer a una iglesia ni adoptar una etiqueta religiosa.',
  },
  {
    id: 'diferencia-habitos',
    question: '¿Qué diferencia a MK de un programa de hábitos o fitness?',
    answer:
      'MK no parte desde la productividad ni desde la estética. Parte desde la pregunta central: qué hombre estás llamado a construir y qué vida concreta debe sostener esa identidad.',
  },
  {
    id: 'primer-paso',
    question: '¿Cuál es el primer paso?',
    answer:
      'Completar el diagnóstico inicial para saber desde dónde partes y qué debes ordenar primero.',
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
