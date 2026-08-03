import type { MetadataRoute } from 'next';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/manifiesto',
    '/sistema',
    '/marco-central',
    '/ikigai',
    '/precios',
    '/eventos',
    '/contacto',
    '/privacidad',
    '/terminos',
    '/login',
    '/register',
  ];

  return routes.map((path) => ({
    url: `${baseUrl.replace(/\/$/, '')}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.8,
  }));
}
