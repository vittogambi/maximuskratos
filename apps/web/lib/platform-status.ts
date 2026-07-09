import type { AppIconName } from '@/components/icons/registry';

export type PlatformModuleStatus = 'disponible' | 'proximamente' | 'en-desarrollo';

export type PlatformModule = {
  id: string;
  nombre: string;
  descripcion: string;
  estado: PlatformModuleStatus;
  fase?: string;
};

export type PanelModule = {
  id: string;
  nombre: string;
  descripcion: string;
  estado: PlatformModuleStatus;
  icon: AppIconName;
};

export const PLATFORM_STATUS_LABELS: Record<PlatformModuleStatus, string> = {
  disponible: 'Disponible',
  proximamente: 'Próximamente',
  'en-desarrollo': 'En desarrollo',
};

/** Landing section + shared roadmap source of truth. */
export const PLATFORM_MODULES: readonly PlatformModule[] = [
  {
    id: 'cuenta',
    nombre: 'Cuenta y panel personal',
    descripcion:
      'Registro, login y acceso a tu espacio personal dentro del sistema.',
    estado: 'disponible',
    fase: 'Fase 1',
  },
  {
    id: 'metodologia',
    nombre: 'Metodología MK documentada',
    descripcion:
      'Marco de Espíritu, Mente y Cuerpo con las 8 dimensiones del perfil Maximus.',
    estado: 'disponible',
  },
  {
    id: 'suscripcion',
    nombre: 'Suscripción y período de prueba',
    descripcion:
      'Acceso completo con suscripción mensual y período de prueba incluido.',
    estado: 'proximamente',
    fase: 'Fase 1',
  },
  {
    id: 'diagnostico',
    nombre: 'Diagnóstico digital',
    descripcion:
      'Evaluación estructurada en Espíritu, Mente y Cuerpo con índice de alineación inicial.',
    estado: 'en-desarrollo',
    fase: 'Fase 2',
  },
  {
    id: 'plano-vida',
    nombre: 'Plano de Vida y propósito',
    descripcion:
      'Arquetipo, declaración de propósito y hoja de ruta a 40 días, 3, 6, 9 y 12 meses.',
    estado: 'en-desarrollo',
    fase: 'Fase 2',
  },
  {
    id: 'app',
    nombre: 'App iOS/Android con seguimiento',
    descripcion:
      'Misiones diarias, métricas, notificaciones y sincronización entre dispositivos.',
    estado: 'en-desarrollo',
    fase: 'Fase 2',
  },
] as const;

/** Authenticated user panel — simplified module grid. */
export const PANEL_MODULES: readonly PanelModule[] = [
  {
    id: 'mi-cuenta',
    nombre: 'Mi cuenta',
    descripcion: 'Tu perfil, estatus de fundador y acceso al panel.',
    estado: 'disponible',
    icon: 'user-check',
  },
  {
    id: 'diagnostico',
    nombre: 'Diagnóstico',
    descripcion:
      'Evaluación en Espíritu, Mente y Cuerpo con índice de alineación inicial.',
    estado: 'proximamente',
    icon: 'scan-line',
  },
  {
    id: 'plano-vida',
    nombre: 'Plano de Vida',
    descripcion: 'Propósito, arquetipo y hoja de ruta personalizada.',
    estado: 'en-desarrollo',
    icon: 'map',
  },
  {
    id: 'seguimiento',
    nombre: 'Seguimiento y app',
    descripcion: 'Misiones diarias, métricas y app iOS/Android.',
    estado: 'en-desarrollo',
    icon: 'activity',
  },
] as const;

/** Microstates for El Método phases — flip when modules go live. */
export const METHOD_PHASE_MICROSTATES = {
  diagnostico: 'Metodología definida. Digitalización en curso.',
  arquitectura: 'Metodología definida. Digitalización en curso.',
  ejecucion: 'Metodología definida. Digitalización en curso.',
} as const;

export const FOUNDER_BENEFITS = [
  'Estatus de fundador permanente',
  'Primero en acceder al diagnóstico cuando abra',
] as const;
