import { IkigaiContent } from '@/components/pages/ikigai-content';
import { LANDING_IMAGES } from '@/lib/assets';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'IKIGAI',
  description:
    'El IKIGAI en Maximus Kratos: un eje de dirección entre significado, capacidad, contribución y sostenibilidad, integrado al Marco Central y al Perfil Maestro.',
  path: '/ikigai',
  image: LANDING_IMAGES.ikigaiHero,
});

export default function IkigaiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'IKIGAI', path: '/ikigai' },
            ]),
          ),
        }}
      />
      <IkigaiContent />
    </>
  );
}
