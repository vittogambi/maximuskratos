import type { AppIconName } from '@/components/icons/registry';

export type ProductStageFocus = 'overview' | 'diagnostico' | 'ruta' | 'perfil' | 'proposito';

/**
 * Las cinco piezas que existen en la plataforma.
 * La landing y el Marco Central leen esta misma lista.
 */
export const PRODUCT_STAGES: ReadonlyArray<{
  num: string;
  id: string;
  focus: ProductStageFocus;
  tag: string;
  icon: AppIconName;
  title: string;
  body: string;
  platform: string;
}> = [
  {
    num: '01',
    id: 'diagnostico',
    focus: 'diagnostico',
    tag: 'Lectura inicial',
    icon: 'scan-line',
    title: 'Diagnóstico',
    body: 'Responde el cuestionario en Espíritu, Mente y Cuerpo y deja una primera lectura de tu estado.',
    platform: 'Diagnóstico',
  },
  {
    num: '02',
    id: 'perfil',
    focus: 'perfil',
    tag: 'Lectura',
    icon: 'fingerprint',
    title: 'Perfil',
    body: 'Ordena tus respuestas, tus índices y las prioridades que salen del cuestionario.',
    platform: 'Perfil',
  },
  {
    num: '03',
    id: 'hdrp',
    focus: 'proposito',
    tag: 'Dirección',
    icon: 'map',
    title: 'Hoja de Ruta de Propósito',
    body: 'Reúne esa lectura en una dirección, principios y criterios para decidir.',
    platform: 'Hoja de Ruta de Propósito',
  },
  {
    num: '04',
    id: 'ruta',
    focus: 'ruta',
    tag: 'Ejecución',
    icon: 'target',
    title: 'Ruta MK',
    body: 'Convierte esa dirección en planes, acciones y revisión de la semana.',
    platform: 'Ruta MK',
  },
  {
    num: '05',
    id: 'panel',
    focus: 'overview',
    tag: 'Revisión',
    icon: 'layout-dashboard',
    title: 'Panel e índices',
    body: 'Muestra tu índice de alineación y el estado del proceso para ajustar la ruta.',
    platform: 'Panel e índices',
  },
];
