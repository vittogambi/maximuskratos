import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
};

const ROUTES: ReadonlyArray<SitemapEntry> = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/manifiesto', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/sistema', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/marco-central', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/ikigai', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/precios', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/eventos', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contacto', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/privacidad', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terminos', changeFrequency: 'yearly', priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
