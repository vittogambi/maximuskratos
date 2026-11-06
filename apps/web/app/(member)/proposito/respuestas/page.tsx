import type { Metadata } from 'next';
import { PurposeAnswersScreen } from '@/components/member/PurposeAnswersScreen';

export const metadata: Metadata = { title: 'Lo que ya respondiste', robots: { index: false, follow: false } };

export default function PurposeAnswersPage() {
  return <PurposeAnswersScreen />;
}
