import { isEarlyAccessMode } from '@/lib/product-phase';

/**
 * Landing FAQ (acceso anticipado). Use `\n\n` between paragraphs for readable open states.
 * Order follows visitor doubt sequence: what → now → when → founder → money → privacy → scope → fit → religion → differentiation.
 */
export const LANDING_FAQ_ITEMS = [
  {
    id: 'es-app',
    question: '¿Maximus Kratos es una app?',
    answer: isEarlyAccessMode()
      ? 'Maximus Kratos está siendo desarrollado como una app móvil y una plataforma web de desarrollo personal para hombres. Conecta diagnóstico, propósito, prioridades, ejecución y revisión dentro de una misma cuenta.\n\nHoy puedes explorar el método y crear tu cuenta de fundador. El diagnóstico, la webapp y la app para iOS y Android todavía están en desarrollo.'
      : 'Maximus Kratos es una app móvil y una plataforma web de desarrollo personal para hombres. Desde una misma cuenta conectas diagnóstico, propósito, prioridades, ejecución y revisión.\n\nHoy usas el sistema desde la plataforma web; la app para iOS y Android está en desarrollo.',
    link: { href: '/sistema', label: 'Conocer la plataforma' },
  },
  {
    id: 'cuenta-hoy',
    question: '¿Qué puedo hacer dentro de mi cuenta hoy?',
    answer: isEarlyAccessMode()
      ? 'Hoy puedes crear una cuenta real, iniciar sesión y acceder a tu panel de fundador. Allí verás el estado del desarrollo y las funciones que se habilitarán con el lanzamiento.\n\nEl diagnóstico, el Perfil Maestro y la Ruta MK todavía no están activos.'
      : 'Creas tu cuenta, inicias sesión y usas el diagnóstico, el Perfil Maestro y la Ruta MK desde la plataforma web.',
  },
  {
    id: 'cuando-disponible',
    question: '¿Cuándo estará disponible la plataforma?',
    answer: isEarlyAccessMode()
      ? 'Todavía no hemos anunciado una fecha de lanzamiento. Las cuentas de fundador recibirán acceso prioritario cuando comiencen las primeras pruebas y cuando se active la plataforma completa.'
      : 'La plataforma web ya está disponible. La app para iOS y Android se sigue desarrollando y se anunciará cuando esté lista para pruebas.',
  },
  {
    id: 'estatus-fundador',
    question: '¿Qué significa tener estatus de fundador?',
    answer:
      'El estatus de fundador queda identificado permanentemente dentro de tu cuenta. También incluye acceso prioritario a las primeras versiones y la posibilidad de participar en pruebas y ciclos de retroalimentación.',
  },
  {
    id: 'costo-cobros',
    question: '¿Cuánto costará y cuándo comenzarán los cobros?',
    answer: isEarlyAccessMode()
      ? 'Crear tu cuenta hoy no activa ningún cobro ni suscripción. Los planes publicados son los precios previstos para el lanzamiento y pueden ajustarse antes de que se habiliten los pagos.\n\nAntes de suscribirte recibirás la información del plan, su precio y una solicitud de confirmación explícita. La prueba de 30 días comenzará cuando se active la plataforma.'
      : 'MK incluye un período de prueba gratuito antes de cualquier cobro. Revisa duración, planes y precios vigentes en la página de precios.',
    link: { href: '/precios', label: 'Ver planes y precios' },
  },
  {
    id: 'privacidad-respuestas',
    question: '¿Quién podrá ver mis diagnósticos y respuestas?',
    answer:
      'Estamos diseñando MK para que tus diagnósticos permanezcan privados y para que cualquier acceso de asesores u otros terceros requiera tu autorización.',
  },
  {
    id: 'solo-entrenamiento',
    question: '¿MK es solo entrenamiento físico?',
    answer:
      'No. MK profundiza en dirección, propósito, coherencia y ejecución. En relaciones, finanzas y salud física, diagnostica y prioriza para que no obstaculicen tu dirección. No es un especialista en dinero, cuerpo ni relaciones: cuando el caso lo requiere, orienta a buscar ayuda profesional.\n\nEl objetivo no es sacar 100 en cada ámbito. Es coherencia entre quién eres, qué diriges, qué sostienes y qué haces.',
  },
  {
    id: 'necesito-crisis',
    question: '¿Necesito estar en crisis para entrar?',
    answer:
      'No. Puedes utilizar MK tanto para reconstruir un área deteriorada como para ordenar una vida que ya funciona, recuperar coherencia o dirigir tu capacidad hacia una obra con mayor impacto.',
  },
  {
    id: 'es-religioso',
    question: '¿MK es religioso?',
    answer:
      'MK trabaja con propósito, virtud, responsabilidad, servicio y trascendencia, pero no exige pertenecer a una iglesia ni adoptar una creencia o etiqueta religiosa.',
  },
  {
    id: 'diferencia-habitos',
    question: '¿Qué diferencia a MK de una app de hábitos o fitness?',
    answer:
      'Una app de hábitos registra conductas. MK comienza con un diagnóstico de tu situación y una dirección de propósito. Desde ahí, convierte tus prioridades en una Ruta MK con planes, acciones, hábitos y revisiones.\n\nAsí, los hábitos no aparecen aislados: responden a una dirección que tú has definido.',
  },
] as const;

export type LandingFaqItem = (typeof LANDING_FAQ_ITEMS)[number];

export const LANDING_FAQ_CLOSE = {
  title: 'Comienza con tu cuenta de fundador',
  lead: 'Crea tu cuenta sin tarjeta ni cobro. Te avisaremos con prioridad cuando se habiliten el diagnóstico y las primeras versiones de la plataforma.',
  /** Mobile-only: title + button already carry the founder ask. */
  leadMobile: 'Sin tarjeta. Te avisamos cuando se active la plataforma.',
  ctaLabel: 'Crear mi cuenta de fundador',
} as const;

export function landingFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.replace(/\n\n/g, ' '),
      },
    })),
  };
}
