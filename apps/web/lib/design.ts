import { LANDING_SEO_DESCRIPTION } from '@/lib/landing-copy';

/** Accent colors from /DESIGN.md — use in data viz, not hardcoded hex in components */
export const designColors = {
  action: '#ff0000',
  blood: '#8b0000',
  warm: '#ffb4a8',
} as const;

export const siteConfig = {
  name: 'Maximus Kratos',
  tagline: 'App y plataforma web de desarrollo personal para hombres',
  description: LANDING_SEO_DESCRIPTION,
};

/** Landing section ids — must match `id` attributes on the home page */
export const landingSections = [
  { id: 'funcionamiento', label: 'Cómo funciona', shortLabel: 'Funciona' },
  { id: 'perfiles', label: 'Para quién', shortLabel: 'Para quién' },
  { id: 'precios', label: 'Precios', shortLabel: 'Precios' },
] as const;

/** Topbar: anclas a la izquierda del divisor */
export const publicNavLanding = [
  {
    href: '/#funcionamiento' as const,
    label: 'Cómo funciona',
    shortLabel: 'Funciona',
  },
  {
    href: '/#perfiles' as const,
    label: 'Para quién',
    shortLabel: 'Para quién',
  },
] as const;

/** Topbar: producto, método y precios (sin Manifiesto) */
export const publicNavPages = [
  { href: '/sistema' as const, label: 'Producto', shortLabel: 'Producto' },
  { href: '/marco-central' as const, label: 'Método' },
  { href: '/#precios' as const, label: 'Precios', shortLabel: 'Precios' },
] as const;

export const publicNav = [...publicNavLanding, ...publicNavPages] as const;

export type NavItem = (typeof publicNav)[number];

export const publicNavAuth = {
  login: { href: '/login', label: 'Iniciar sesión' },
  register: { href: '/register', label: 'Acceso anticipado' },
} as const;

export const footerPlatformNav = publicNavLanding;

/** Drawer mobile: anclas de la landing */
export const drawerConoceMkNav = landingSections.map((section) => ({
  href: `/#${section.id}` as const,
  label: section.label,
}));

/** Drawer mobile: Producto, Método, Manifiesto */
export const drawerPlataformaNav = [
  { href: '/sistema', label: 'Producto' },
  { href: '/marco-central', label: 'Método' },
  { href: '/manifiesto', label: 'Manifiesto' },
] as const;

/** Drawer mobile: resto del sitio */
export const drawerSitioNav = [
  { href: '/ikigai', label: 'IKIGAI' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/contacto', label: 'Contacto' },
] as const;

export const footerSiteNav = [
  { href: '/sistema', label: 'Producto' },
  { href: '/marco-central', label: 'Método' },
  { href: '/manifiesto', label: 'Manifiesto' },
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
