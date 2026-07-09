import type { Metadata } from 'next';
import { AethelgardLanding } from '@/components/landing/aethelgard-landing';
import { landingFaqJsonLd } from '@/lib/landing-faq';

export const metadata: Metadata = {
  title: 'Maximus Kratos: Descúbrete. Alíneate. Construye.',
  description:
    'Sistema de reconstrucción personal para hombres. Define tu propósito trascendental y conviértelo en una vida coherente, significativa y con impacto. Haz tu diagnóstico inicial.',
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
