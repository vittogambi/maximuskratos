import { isEarlyAccessMode } from '@/lib/product-phase';
import { LANDING_FOUNDER_STATUS } from '@/lib/landing-copy';

export const LANDING_FAQ_ITEMS = [
  {
    id: 'es-app',
    question: '¿Maximus Kratos es una app?',
    answer: isEarlyAccessMode()
      ? 'Maximus Kratos será una app móvil y una plataforma web de desarrollo personal para hombres. El sistema conecta diagnóstico, propósito, prioridades, ejecución y revisión dentro de una misma cuenta. Hoy puedes explorar el método y crear tu cuenta de fundador; el diagnóstico, la webapp y las apps para iOS y Android están en desarrollo.'
      : 'Maximus Kratos es una app móvil y una plataforma web de desarrollo personal para hombres. Desde una misma cuenta conectas diagnóstico, propósito, prioridades, ejecución y revisión. Hoy usas el sistema completo desde la plataforma web; la app para iOS y Android está en desarrollo.',
    link: { href: '/sistema', label: 'Conocer la plataforma' },
  },
  {
    id: 'cuenta-hoy',
    question: '¿Qué puedo hacer dentro de mi cuenta hoy?',
    answer: isEarlyAccessMode()
      ? 'Creas una cuenta real con inicio de sesión. Dentro verás el panel de acceso anticipado y el estado de fundador. El diagnóstico, el Perfil Maestro y la Ruta MK todavía no están activos: se habilitan cuando lancemos la plataforma.'
      : 'Creas tu cuenta, inicias sesión y usas el diagnóstico, el Perfil Maestro y la Ruta MK desde la plataforma web.',
  },
  {
    id: 'estatus-fundador',
    question: '¿Qué significa el estatus de fundador?',
    answer: LANDING_FOUNDER_STATUS,
  },
  {
    id: 'cuando-cobro',
    question: '¿Cuándo comenzarán a cobrarme?',
    answer: isEarlyAccessMode()
      ? 'Registrarte hoy no activa ningún cobro ni suscripción. Antes de suscribirte habrá aviso, plan, precio y confirmación explícita. La prueba de 30 días comienza cuando se active la plataforma.'
      : 'MK incluye un período de prueba gratuito antes de cualquier cobro. Revisa duración, planes y precios vigentes en la página de precios.',
    link: { href: '/precios', label: 'Ver planes y precios' },
  },
  {
    id: 'privacidad-respuestas',
    question: '¿Quién puede ver mis diagnósticos y respuestas?',
    answer:
      'Tus respuestas forman parte de tu proceso personal. Estamos diseñando MK para que controles tu información y para que el acceso de terceros dependa de tu autorización.',
  },
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
    id: 'precio-prueba',
    question: '¿Cuánto cuesta y hay período de prueba?',
    answer: isEarlyAccessMode()
      ? 'Hoy el registro no cobra. Los planes publicados son los previstos al lanzamiento y pueden ajustarse antes de activar cobros. Habrá 30 días de prueba cuando se active la plataforma.'
      : 'MK incluye un período de prueba gratuito antes de cualquier cobro. Revisa duración, planes y precios vigentes en la página de precios.',
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
