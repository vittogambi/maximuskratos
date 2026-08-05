import { SistemaContent } from '@/components/pages/sistema-content';
import { faqJsonLd } from '@/lib/faq';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';
import { SISTEMA_FAQ_ITEMS } from '@/lib/sistema-faq';

export const metadata = buildPageMetadata({
  title: 'Producto',
  description:
    'Maximus Kratos: acceso anticipado abierto. Diagnóstico, Perfil Maestro, Ruta MK y apps se lanzan juntos próximamente.',
  path: '/sistema',
});

export default function SistemaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            faqJsonLd(SISTEMA_FAQ_ITEMS),
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'Producto', path: '/sistema' },
            ]),
          ),
        }}
      />
      <SistemaContent />
    </>
  );
}
