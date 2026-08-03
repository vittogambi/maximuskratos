import { isEarlyAccessMode } from '@/lib/product-phase';

export const LANDING_FAQ_ITEMS = [
  {
    id: 'solo-entrenamiento',
    question: '¿MK es solo entrenamiento físico?',
    answer:
      'No. El entrenamiento físico es una base importante, pero MK integra espíritu, mente y cuerpo.',
  },
  {
    id: 'necesito-crisis',
    question: '¿Necesito estar en crisis para entrar?',
    answer:
      'No. MK sirve tanto si necesitas reconstruirte como si ya funcionas y buscas mayor propósito, orden e impacto.',
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
      'MK no parte desde la productividad ni desde la estética. Parte desde la pregunta central: quién estás llamado a construir y qué vida concreta debe sostener esa identidad.',
  },
  {
    id: 'es-app',
    question: '¿MK es una app? ¿Cómo se usa?',
    answer: isEarlyAccessMode()
      ? 'Hoy puedes crear tu cuenta de fundador y explorar el método en el sitio. El diagnóstico, el Perfil Maestro y la Ruta abrirán pronto, junto con la webapp y la app para iOS y Android, bajo la misma cuenta.'
      : 'MK es una plataforma web: creas tu cuenta y desde el navegador haces el diagnóstico, construyes tu Perfil Maestro y avanzas por tu Ruta. La app para iOS y Android está en desarrollo; usará tu misma cuenta y añadirá misiones diarias, métricas de ejecución y notificaciones.',
    link: { href: '/sistema', label: 'Conocer la plataforma' },
  },
  {
    id: 'precio-prueba',
    question: '¿Cuánto cuesta y hay período de prueba?',
    answer:
      'MK incluye un período de prueba gratuito antes de cualquier cobro. Revisa duración, planes y precios vigentes en la página de precios.',
    link: { href: '/precios', label: 'Ver planes y precios' },
  },
  {
    id: 'primer-paso',
    question: '¿Cuál es el primer paso?',
    answer: isEarlyAccessMode()
      ? 'Crear tu cuenta de fundador para reservar tu acceso. Te avisaremos cuando abran el diagnóstico y la plataforma completa.'
      : 'Crear tu cuenta en la plataforma web y completar el diagnóstico inicial para saber desde dónde partes y qué debes ordenar primero.',
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
