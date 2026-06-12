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
      'El proceso comienza con un diagnóstico honesto en Espíritu, Mente y Cuerpo. A partir de ahí se construye tu Plano de Vida y una hoja de ruta a 40 días, 3, 6 y 12 meses con seguimiento semanal.',
  },
  {
    id: 'primer-paso',
    question: '¿Por dónde empiezo en Maximus Kratos?',
    answer:
      'Crea tu cuenta de fundador. Es gratis, te da acceso al panel y te coloca entre los primeros cuando se abra cada módulo del sistema.',
  },
  {
    id: 'que-puedo-hacer-hoy',
    question: '¿Qué puedo hacer hoy con mi cuenta?',
    answer:
      'Accedes a tu panel personal y conservas tu estatus de fundador. El diagnóstico, el Plano de Vida y la app se desbloquean por etapas conforme la plataforma evoluciona.',
  },
  {
    id: 'entregables',
    question: '¿Qué recibo al avanzar en el programa?',
    answer:
      'Recibirás tu diagnóstico personal, índice de alineación y mapa de brechas. Después obtendrás tu Plano de Vida con declaración de propósito y hoja de ruta a 30, 90 y 365 días.',
  },
  {
    id: 'acompanamiento',
    question: '¿Voy solo o hay acompañamiento en Maximus Kratos?',
    answer:
      'El sistema está diseñado para que tú ejecutes con autonomía. La plataforma está diseñada para detectar estancamiento, enviar alertas estructurales y ajustar el ritmo. El acompañamiento lo da el método, no un coach.',
  },
  {
    id: 'cuanto-cuesta',
    question: '¿Cuánto cuesta?',
    answer:
      'Crear tu cuenta de fundador es gratis. La plataforma operará con suscripción y período de prueba; los fundadores conocerán las condiciones antes de cualquier cobro.',
  },
  {
    id: 'cuanto-tiempo',
    question: '¿Cuánto tiempo diario requiere?',
    answer:
      'El sistema se adaptará a tu disponibilidad real. El marco completo es de 12 meses, pero cada fase tendrá un ritmo semanal acotado. El objetivo es que la disciplina se instale como hábito, no como carga.',
  },
  {
    id: 'app-movil',
    question: '¿Está disponible como app móvil?',
    answer:
      'La plataforma web está activa hoy con tu panel de fundador. La app para iOS y Android está en desarrollo y llegará en una etapa posterior del despliegue.',
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
