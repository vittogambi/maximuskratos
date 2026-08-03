import { LegalDocumentContent } from '@/components/pages/legal-document-content';
import { siteConfig } from '@/lib/design';
import { termsOfService } from '@/lib/legal-content';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Términos de Servicio',
  description: `Términos de Servicio de ${siteConfig.name}. Condiciones de uso del sitio y la Plataforma.`,
  path: '/terminos',
});

export default function TerminosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'Términos de Servicio', path: '/terminos' },
            ]),
          ),
        }}
      />
      <LegalDocumentContent document={termsOfService} />
    </>
  );
}
