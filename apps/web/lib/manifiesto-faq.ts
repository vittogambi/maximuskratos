import type { PublicFaqItem } from '@/lib/faq';

/** FAQ de /manifiesto: origen, creencias y posicionamiento. */
export const MANIFIESTO_FAQ_ITEMS: ReadonlyArray<PublicFaqItem> = [
  {
    id: 'que-es',
    question: '¿Qué es Maximus Kratos?',
    answer:
      'Una metodología de autodescubrimiento y arquitectura personal, y la plataforma que la sostiene. Construye sistemas prácticos alineados a tu propósito trascendental, con rigor físico y rendición de cuentas.',
    link: { href: '/sistema', label: 'Ver la plataforma' },
  },
  {
    id: 'para-quien',
    question: '¿Para quién es Maximus Kratos?',
    answer:
      'Para hombres. Desde quien necesita reconstruirse hasta quien ya funciona y busca más dirección, orden e impacto.',
  },
  {
    id: 'vs-coaching',
    question: '¿MK es coaching o desarrollo personal?',
    answer:
      'No es un curso suelto ni una sesión aislada. Cursos, coaching y mentorías pueden ayudar. MK aporta la infraestructura que une diagnóstico, dirección, ejecución y seguimiento en un solo proceso.',
  },
  {
    id: 'por-que-tecnologia',
    question: '¿Por qué Maximus Kratos usa tecnología?',
    answer:
      'Porque un diagnóstico en papel se pierde y una sesión termina. La tecnología conecta lo que descubres, lo conserva, lo mide y lo actualiza con el tiempo.',
  },
  {
    id: 'fundamento',
    question: '¿Qué fundamento clásico sostiene a MK?',
    answer:
      'Recupera ideales como Areté (excelencia aplicada) y Kalos Kagathos (fortaleza exterior y rectitud interior) y los traduce en una arquitectura práctica: Espíritu, Mente y Cuerpo bajo un mismo propósito.',
  },
  {
    id: 'solo-hombres',
    question: '¿Maximus Kratos es solo para hombres?',
    answer:
      'Sí. MK está diseñado como sistema de reconstrucción y alineación masculina: identidad, dominio propio, servicio y legado.',
  },
];
