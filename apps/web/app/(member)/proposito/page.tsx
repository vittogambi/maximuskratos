import type { Metadata } from 'next';
import { DirectionScreen } from '@/components/member/DirectionScreen';

export const metadata: Metadata = { title: 'Tu dirección', robots: { index: false, follow: false } };

export default function PurposePage() {
  return <DirectionScreen />;
}
