import type { Metadata } from 'next';
import { TerritoryScreen } from '@/components/member/TerritoryScreen';

type Props = { params: Promise<{ territory: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { territory } = await params;
  return { title: `Ámbito ${decodeURIComponent(territory)}`, robots: { index: false, follow: false } };
}

export default async function AmbitoPage({ params }: Props) {
  const { territory } = await params;
  return <TerritoryScreen territory={decodeURIComponent(territory)} />;
}
