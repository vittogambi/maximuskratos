import { IkigaiContent } from '@/components/pages/ikigai-content';
import { LANDING_IMAGES } from '@/lib/assets';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'IKIGAI',
  description:
    'Empieza por ordenar las piezas. Explora lo que amas, en lo que eres bueno, lo que el mundo necesita y por lo que te pueden pagar. Versión en revisión.',
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
