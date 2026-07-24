import { isEarlyAccessMode } from '@/lib/product-phase';

export type PreciosFaqItem = {
  id: string;
  question: string;
  answer: string;
};

/** Preguntas de cobro y prueba para /precios. */
export function getPreciosFaqItems(trialDays: number): ReadonlyArray<PreciosFaqItem> {
  return [
    {
      id: 'que-incluye',
      question: '¿Qué incluye el acceso?',
      answer:
        'El mismo acceso en todos los plazos: diagnóstico, Perfil Maestro, Ruta MK y actualizaciones de la plataforma bajo una sola cuenta.',
    },
    {
      id: 'por-que-plazos',
      question: '¿Por qué hay varias frecuencias si es un solo acceso?',
      answer:
        'No son planes distintos. Es el mismo producto: eliges cada cuánto se cobra. Pagar por adelantado baja el precio mensual.',
    },
    {
      id: 'cuando-cobro',
      question: '¿Cuándo empieza la prueba y el cobro?',
      answer: isEarlyAccessMode()
        ? `Hoy reservas tu cuenta de fundador sin tarjeta. La prueba de ${trialDays} días y el cobro se activan cuando abra la plataforma.`
        : `Tras registrarte tienes ${trialDays} días de prueba. Si continúas, se aplica la frecuencia que elegiste.`,
    },
    {
      id: 'cambiar-plazo',
      question: '¿Puedo cambiar de frecuencia después?',
      answer:
        'Sí. Puedes pasar a otro plazo cuando renueve tu ciclo, según las condiciones vigentes en ese momento.',
    },
    {
      id: 'cancelar',
      question: '¿Puedo cancelar?',
      answer: isEarlyAccessMode()
        ? 'Sí. Como aún no hay cobro, puedes dejar de continuar cuando quieras. Al lanzamiento, la cancelación evita el cobro al terminar la prueba.'
        : 'Sí. Puedes cancelar antes de que termine la prueba para evitar el cobro, o al cierre de tu ciclo de facturación.',
    },
    {
      id: 'recomendado',
      question: '¿Por qué recomiendan el semestral?',
      answer:
        'Es el equilibrio entre precio por mes y compromiso. El mensual es más flexible; el anual sale más barato por mes si ya estás seguro.',
    },
  ];
}
