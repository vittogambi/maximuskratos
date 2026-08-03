import type { Metadata } from 'next';
import { siteConfig } from '@/lib/design';
import { absoluteUrl, getSiteUrl } from '@/lib/site-url';

export const DEFAULT_OG_IMAGE = '/images/landing/statue-aligned.jpg';

type BuildPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Use absolute title (skip root `%s | Maximus Kratos` template). */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  /** Path under /public, e.g. `/images/eventos/hero-council.jpg`. */
  image?: string;
};

export function buildPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  noIndex = false,
  image = DEFAULT_OG_IMAGE,
}: BuildPageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const ogTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'es_CL',
      siteName: siteConfig.name,
      title: ogTitle,
      description,
      url: canonical,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [imageUrl],
    },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : { robots: { index: true, follow: true } }),
  };
}

/** Root-level metadata shared across the app. */
export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const description = siteConfig.description;
  const title = `${siteConfig.name}: ${siteConfig.tagline}`;
  const imageUrl = absoluteUrl(DEFAULT_OG_IMAGE);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: siteConfig.name,
    },
    icons: {
      apple: '/icons/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: 'es_CL',
      siteName: siteConfig.name,
      title,
      description,
      url: siteUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}
