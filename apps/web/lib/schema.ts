import { siteConfig, socialLinks } from '@/lib/design';
import { legalContact } from '@/lib/legal-content';
import { absoluteUrl, getSiteUrl } from '@/lib/site-url';

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    legalName: legalContact.entity,
    url,
    logo: absoluteUrl('/brand/mk-shield.png'),
    description: siteConfig.description,
    email: legalContact.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Santiago',
      addressCountry: 'CL',
    },
    sameAs: socialLinks.map((link) => link.href),
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url,
    description: siteConfig.description,
    inLanguage: 'es',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url,
    },
  };
}

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function breadcrumbJsonLd(items: ReadonlyArray<BreadcrumbItem>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Serialize one or more JSON-LD graphs for a script tag. */
export function serializeJsonLd(...graphs: ReadonlyArray<object>): string {
  if (graphs.length === 1) return JSON.stringify(graphs[0]);
  return JSON.stringify(graphs);
}
