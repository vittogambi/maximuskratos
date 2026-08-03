import { ContactoContent } from '@/components/pages/contacto-content';
import { LANDING_IMAGES } from '@/lib/assets';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Contacto',
  description:
    'Escríbenos con preguntas, feedback o consultas de empresas. Estamos construyendo Maximus Kratos y queremos escucharte.',
  path: '/contacto',
  image: LANDING_IMAGES.contactoHero,
});

export default function ContactoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'Contacto', path: '/contacto' },
            ]),
          ),
        }}
      />
      <ContactoContent />
    </>
  );
}
