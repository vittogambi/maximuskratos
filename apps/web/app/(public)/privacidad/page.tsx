import { LegalDocumentContent } from '@/components/pages/legal-document-content';
import { siteConfig } from '@/lib/design';
import { privacyPolicy } from '@/lib/legal-content';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Política de Privacidad',
  description: `Política de Privacidad de ${siteConfig.name}. Cómo tratamos tus datos personales en Santiago, Chile.`,
  path: '/privacidad',
});

export default function PrivacidadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'Política de Privacidad', path: '/privacidad' },
            ]),
          ),
        }}
      />
      <LegalDocumentContent document={privacyPolicy} />
    </>
  );
}
