import { AethelgardLanding } from '@/components/landing/aethelgard-landing';
import { landingFaqJsonLd } from '@/lib/landing-faq';
import { serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Maximus Kratos: app y plataforma web de desarrollo personal para hombres',
  description:
    'Detecta la distancia entre lo que valoras y cómo vives, define tu propósito trascendental y conviértelo en una Ruta MK que puedas ejecutar, revisar y medir. Sitio disponible hoy; webapp y apps para iOS y Android en desarrollo.',
  path: '/',
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(landingFaqJsonLd()),
        }}
      />
      <AethelgardLanding />
    </>
  );
}
