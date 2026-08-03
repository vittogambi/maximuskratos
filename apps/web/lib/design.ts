/** Accent colors from /DESIGN.md — use in data viz, not hardcoded hex in components */
export const designColors = {
  action: '#ff0000',
  blood: '#8b0000',
  warm: '#ffb4a8',
} as const;

export const siteConfig = {
  name: 'Maximus Kratos',
  tagline: 'Sistema Integral de Transformación Masculina',
  description:
    'Una metodología de autodescubrimiento y arquitectura personal que alinea Espíritu, Mente y Cuerpo bajo el rigor físico y la rendición de cuentas.',
};

/** Landing section ids — must match `id` attributes on the home page */
export const landingSections = [
  { id: 'perfiles', label: 'Perfiles', shortLabel: 'Perfiles' },
  { id: 'funcionamiento', label: 'Funcionamiento', shortLabel: 'Método' },
  { id: 'beneficios', label: 'Beneficios', shortLabel: 'Beneficios' },
  { id: 'preguntas-frecuentes', label: 'Preguntas Frecuentes', shortLabel: 'FAQ' },
] as const;

export const publicNav = [
  ...landingSections.map((section) => ({
    href: `/#${section.id}` as const,
    label: section.label,
    shortLabel: section.shortLabel,
  })),
  { href: '/manifiesto', label: 'Manifiesto' },
  { href: '/sistema', label: 'El Sistema', shortLabel: 'Sistema' },
  { href: '/precios', label: 'Precios' },
  { href: '/contacto', label: 'Contacto' },
] as const;

export type NavItem = (typeof publicNav)[number];

export const publicNavAuth = {
  login: { href: '/login', label: 'Iniciar sesión' },
  register: { href: '/register', label: 'Comenzar' },
} as const;

export const footerPlatformNav = publicNav.slice(0, 4);

/** Drawer mobile: anclas de la landing */
export const drawerConoceMkNav = footerPlatformNav;

/** Drawer mobile: páginas de producto */
export const drawerPlataformaNav = [
  { href: '/sistema', label: 'El Sistema' },
  { href: '/precios', label: 'Precios' },
] as const;

/** Drawer mobile: resto del sitio (sin duplicar El Sistema / Precios) */
export const drawerSitioNav = [
  { href: '/manifiesto', label: 'Manifiesto' },
  { href: '/marco-central', label: 'Marco Central' },
  { href: '/ikigai', label: 'IKIGAI' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/contacto', label: 'Contacto' },
] as const;

export const footerSiteNav = [
  { href: '/manifiesto', label: 'Manifiesto' },
  { href: '/sistema', label: 'El Sistema' },
  { href: '/marco-central', label: 'Marco Central' },
  { href: '/ikigai', label: 'IKIGAI' },
  { href: '/precios', label: 'Precios' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/contacto', label: 'Contacto' },
] as const;

export const footerLegalNav = [
  { href: '/privacidad', label: 'Política de Privacidad' },
  { href: '/terminos', label: 'Términos de Servicio' },
] as const;

export const socialLinks = [
  { icon: 'instagram' as const, label: 'Instagram', href: 'https://instagram.com/maximuskratos' },
  { icon: 'linkedin' as const, label: 'LinkedIn', href: 'https://linkedin.com/company/maximuskratos' },
  { icon: 'youtube' as const, label: 'YouTube', href: 'https://youtube.com/@maximuskratos' },
  { icon: 'brand-x' as const, label: 'X', href: 'https://x.com/maximuskratos' },
] as const;

/** @deprecated Use footerSiteNav */
export const footerNav = footerSiteNav;

