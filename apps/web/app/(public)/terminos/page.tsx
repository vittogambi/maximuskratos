import type { Metadata } from 'next';
import { LegalDocumentContent } from '@/components/pages/legal-document-content';
import { termsOfService } from '@/lib/legal-content';
import { siteConfig } from '@/lib/design';

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description: `Términos y condiciones de uso de ${siteConfig.name}.`,
};

export default function TerminosPage() {
  return <LegalDocumentContent document={termsOfService} />;
}
