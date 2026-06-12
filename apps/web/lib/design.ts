/** Accent colors from /DESIGN.md — use in data viz, not hardcoded hex in components */
export const designColors = {
  action: '#ff0000',
  blood: '#8b0000',
  warm: '#ffb4a8',
} as const;

export const siteConfig = {
  name: 'Maximus Kratos',
  tagline: 'Sistema Operativo para la Vida',
  description:
    'Maximus Kratos analiza quién eres, identifica quién puedes llegar a ser y construye un sistema personalizado para llevarte ahí.',
};

/** Landing section ids — must match `id` attributes on the home page */
export const landingSections = [
  { id: 'funcionamiento', label: 'Funcionamiento', shortLabel: 'Funcionamiento' },
  { id: 'marco-central', label: 'Marco Central', shortLabel: 'Marco Central' },
  { id: 'preguntas-frecuentes', label: 'Preguntas Frecuentes', shortLabel: 'FAQ' },
] as const;

export const publicNav = [
  ...landingSections.map((section) => ({
    href: `/#${section.id}` as const,
    label: section.label,
    shortLabel: section.shortLabel,
  })),
  { href: '/quienes-somos', label: 'Nosotros' },
  { href: '/sistema',       label: 'El Sistema' },
  { href: '/contacto',      label: 'Contacto' },
] as const;

export type NavItem = (typeof publicNav)[number];

export const publicNavAuth = {
  login: { href: '/login', label: 'Iniciar sesión' },
  register: { href: '/register', label: 'Comenzar' },
} as const;

export const footerPlatformNav = publicNav.slice(0, 3);

export const footerSiteNav = [
  { href: '/quienes-somos', label: 'Nosotros' },
  { href: '/sistema',       label: 'El Sistema' },
  { href: '/eventos',       label: 'Eventos' },
  { href: '/contacto',      label: 'Contacto' },
] as const;

export const footerAccessNav = [
  { href: '/register', label: 'Crear cuenta' },
  { href: '/login', label: 'Iniciar sesión' },
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

