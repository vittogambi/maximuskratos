import type { Metadata } from 'next';
import { MarcoCentralContent } from '@/components/pages/marco-central-content';
import { faqJsonLd } from '@/lib/faq';
import { MARCO_CENTRAL_FAQ_ITEMS } from '@/lib/marco-central-faq';

export const metadata: Metadata = {
  title: 'Marco Central',
  description:
    'Los nueve componentes del proceso de auditoría y autodescubrimiento de Maximus Kratos, y el marco filosófico que los sostiene: arquetipo, sombra y Hoja de Ruta de Propósito.',
};

export default function MarcoCentralPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(MARCO_CENTRAL_FAQ_ITEMS)) }}
      />
      <MarcoCentralContent />
    </>
  );
}
