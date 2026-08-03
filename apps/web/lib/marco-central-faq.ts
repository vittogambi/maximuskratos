import type { PublicFaqItem } from '@/lib/faq';

/** FAQ de /marco-central: método, matriz, HdRP y lentes. */
export const MARCO_CENTRAL_FAQ_ITEMS: ReadonlyArray<PublicFaqItem> = [
  {
    id: 'que-es-marco',
    question: '¿Qué es el Marco Central de Maximus Kratos?',
    answer:
      'El mapa del método: la matriz de pilares y ámbitos, los nueve componentes, las lentes de arquetipo y sombra, y la Hoja de Ruta de Propósito. Es el método completo, antes de cualquier producto.',
    link: { href: '/sistema', label: 'Ver cómo se ejecuta en la plataforma' },
  },
  {
    id: 'pilares-ambitos',
    question: '¿Qué son los pilares y los ámbitos?',
    answer:
      'Los pilares son capacidades internas: Espíritu, Mente y Cuerpo. Los ámbitos son territorios de la vida: Mentalidad, Relaciones, Finanzas y Salud física. Cada celda muestra cómo una capacidad se manifiesta en un territorio.',
  },
  {
    id: 'nueve-componentes',
    question: '¿Qué son los nueve componentes?',
    answer:
      'Las piezas de auditoría profunda de la Hoja de Ruta, del linaje a la huella: visión, valores, estándares, identidad, dificultades, personalidad, Ikigai y más. Determinan qué construir, no solo dónde mirar.',
  },
  {
    id: 'hdrp',
    question: '¿Qué es la Hoja de Ruta de Propósito?',
    answer:
      'El documento que integra lo descubierto en una referencia estable: dirección, principios, estándares, patrones, prioridades y compromisos. Sirve para decidir qué construir, qué proteger y qué rechazar.',
  },
  {
    id: 'arquetipos',
    question: '¿Para qué sirven los arquetipos y la sombra?',
    answer:
      'Los arquetipos ayudan a ver desde qué capacidades construyes. La sombra muestra qué ocurre cuando esas capacidades pierden equilibrio. No buscan etiquetarte: ayudan a interpretar cómo ejerces tu poder.',
  },
  {
    id: 'ikigai',
    question: '¿Qué es el Ikigai dentro de MK?',
    answer:
      'Uno de los nueve componentes. Explora dónde convergen capacidad, sentido y contribución para construir una dirección con viabilidad, no una etiqueta profesional fija.',
    link: { href: '/ikigai', label: 'Profundizar en el Ikigai' },
  },
];
