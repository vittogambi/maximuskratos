import type { PublicFaqItem } from '@/lib/faq';
import { isEarlyAccessMode } from '@/lib/product-phase';

/** FAQ de /sistema: producto, acceso y recorrido. */
export const SISTEMA_FAQ_ITEMS: ReadonlyArray<PublicFaqItem> = [
  {
    id: 'que-incluye',
    question: '¿Qué incluye El Sistema de Maximus Kratos?',
    answer:
      'La plataforma donde vivirá tu proceso: diagnóstico, Perfil Maestro, Ruta MK y panel de continuidad, bajo una sola cuenta en web y app.',
  },
  {
    id: 'diagnostico',
    question: '¿Ya puedo hacer el diagnóstico?',
    answer: isEarlyAccessMode()
      ? 'Aún no. Hoy puedes crear tu cuenta de fundador y explorar el método. El diagnóstico se activa en el lanzamiento, junto con la webapp y las apps.'
      : 'Sí. Tras crear tu cuenta puedes completar el diagnóstico inicial en la plataforma web.',
    link: isEarlyAccessMode()
      ? { href: '/precios', label: 'Ver acceso y precios' }
      : undefined,
  },
  {
    id: 'fundador',
    question: '¿Qué es la cuenta de fundador?',
    answer:
      'Tu lugar reservado en el acceso anticipado. Es la misma cuenta que seguirá en la webapp y en la app móvil cuando lancemos ambas.',
  },
  {
    id: 'app-movil',
    question: '¿Habrá app para iOS y Android?',
    answer:
      'Sí. Webapp y app móvil se lanzan juntos bajo la misma cuenta. Hoy el sitio y la cuenta de fundador ya están abiertos.',
  },
  {
    id: 'tres-paginas',
    question: '¿Qué diferencia hay entre Manifiesto, Marco Central y El Sistema?',
    answer:
      'El Manifiesto explica por qué existe MK y qué defiende. El Marco Central explica el método y sus piezas. El Sistema muestra qué vas a usar, cómo se ve y cuándo está disponible.',
    link: { href: '/manifiesto', label: 'Leer el Manifiesto' },
  },
  {
    id: 'indice',
    question: '¿Qué mide el Índice de alineación MK?',
    answer:
      'Coherencia, no tu valor. Integra diagnóstico, acciones, planes e indicadores para mostrar dónde hay alineación y dónde hay una brecha que atender.',
  },
];
