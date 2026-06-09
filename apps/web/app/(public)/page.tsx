import type { Metadata } from 'next';
import { AethelgardLanding } from '@/components/landing/aethelgard-landing';
import { landingFaqJsonLd } from '@/lib/landing-faq';

export const metadata: Metadata = {
  title: 'MAXIMUS KRATOS — Elite Performance & Alignment',
  description:
    'Diseña tu Arquitectura de Vida con precisión de ingeniería. Un sistema de alto rendimiento para hombres que exigen soberanía absoluta sobre su destino.',
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingFaqJsonLd()) }}
      />
      <AethelgardLanding />
    </>
  );
}
