import type { Metadata } from 'next';
import { LegalDocumentContent } from '@/components/pages/legal-document-content';
import { privacyPolicy } from '@/lib/legal-content';
import { siteConfig } from '@/lib/design';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: `Política de privacidad de ${siteConfig.name}. Información sobre el tratamiento de datos personales.`,
};

export default function PrivacidadPage() {
  return <LegalDocumentContent document={privacyPolicy} />;
}
